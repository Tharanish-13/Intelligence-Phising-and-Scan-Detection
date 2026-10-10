import re
from typing import List, Dict, Any, Optional, Tuple
from app.schemas import Indicator, ScanResponse
from app.detection.risk_engine import build_scan_response
from app.detection.url_analyzer import analyze_url_heuristics, parse_url_safely

# URL extraction regex that matches standard URLs and domain-like hyperlinks safely
URL_REGEX = re.compile(
    r'(?:https?://[^\s<>"\')]+|www\.[^\s<>"\')]+|[a-zA-Z0-9.\-]+\.(?:com|org|net|xyz|top|info|live|ru|tk|ml|ga|cf|gq|co|cc)[^\s<>"\')]*)',
    re.IGNORECASE
)

# Common free email domains
FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "mail.com", "proton.me", "protonmail.com"
}

# Known corporate brands frequently spoofed
BRAND_KEYWORDS = [
    "paypal", "apple", "netflix", "amazon", "microsoft", "google", "chase",
    "bank of america", "wells fargo", "usps", "fedex", "dhl", "irs", "hmrc"
]

# Urgency and coercion patterns
URGENCY_PATTERNS = [
    (r"(?:within\s+(?:24|12|48)\s*hours|immediate(?:ly)?\s+action\s+required|urgent\s+action\s+required)", "Immediate Time Limit Imposed", 26),
    (r"(?:account\s+(?:will\s+be|has\s+been)\s+(?:suspended|terminated|closed|locked|disabled|restricted))", "Threat of Account Suspension or Termination", 28),
    (r"(?:security\s+alert|unauthorized\s+(?:login|activity|transaction|access)|unusual\s+sign-in)", "Security Alert Coercion", 22),
    (r"(?:final\s+(?:warning|notice)|last\s+chance)", "Final Notice Pressure Tactic", 20)
]

# Credential and sensitive data harvesting patterns
CREDENTIAL_PATTERNS = [
    (r"(?:enter|confirm|verify|update|provide)\s+your\s+(?:password|pin|passcode|secret)", "Direct Request for Password or PIN", 45),
    (r"(?:one-time\s+passcode|otp|verification\s+code|6-digit\s+code|security\s+code)", "Request for OTP or Security Code", 40),
    (r"(?:social\s+security\s+(?:number|no)|ssn|tax\s+id)", "Request for Social Security / Tax ID", 45),
    (r"(?:credit\s+card\s+(?:details|number|cvv)|bank\s+account\s+(?:number|details))", "Request for Payment Card or Banking Details", 42),
    (r"(?:click\s+here\s+to\s+verify|verify\s+your\s+identity\s+now|validate\s+your\s+account)", "Call-to-Action Account Verification Link", 25)
]

# Financial / Reward / Lottery scam patterns
FINANCIAL_SCAM_PATTERNS = [
    (r"(?:congratulations|you\s+have\s+been\s+selected|winner|won\s+(?:\$|£|€)?\s*[\d,]+|lottery\s+prize)", "Fake Prize or Lottery Win Claim", 36),
    (r"(?:tax\s+refund|overpayment\s+refund|pending\s+payout|claim\s+your\s+(?:cash|reward))", "Unsolicited Refund or Payout Claim", 32),
    (r"(?:guaranteed\s+return|crypto\s+investment|bitcoin\s+doubler|earn\s+\$?\d+\s+daily)", "High-Yield Investment / Crypto Scam Signal", 38),
    (r"(?:wire\s+transfer|gift\s+card|crypto\s+payment|western\s+union)", "Irreversible Payment Method Requested", 34)
]

# Delivery fee scam patterns (very common in SMS smishing)
DELIVERY_SCAM_PATTERNS = [
    (r"(?:package|parcel|shipment|delivery)\s+(?:cannot\s+be\s+delivered|held|pending|failed)", "Held or Failed Parcel Notification", 28),
    (r"(?:pay\s+(?:\$|£|€)?\s*[\d.]+\s*(?:delivery|handling|customs|redelivery)\s*fee)", "Bogus Redelivery Fee Request", 38),
    (r"(?:update\s+(?:your\s+)?(?:address|postal\s+details|shipping\s+address))", "Request to Update Shipping Details", 20)
]

# Dangerous file attachments mentioned
DANGEROUS_ATTACHMENT_PATTERNS = [
    (r"\b\w+\.(?:exe|scr|vbs|bat|iso|apk|msi)\b", "Dangerous Executable Attachment Referenced", 42),
    (r"\b(?:invoice|receipt|statement|remittance|proof)\.(?:zip|rar|7z|html|pdf\.exe)\b", "Disguised Archive or Dual-Extension Attachment", 38)
]

def extract_urls(text: str) -> List[str]:
    """Safely extract all candidate URLs from text without duplicates."""
    raw_matches = URL_REGEX.findall(text)
    clean_urls = []
    seen = set()
    for m in raw_matches:
        cleaned = m.strip('.,;:?!"\'()[]{}<>')
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            clean_urls.append(cleaned)
    return clean_urls

def analyze_sender(sender: Optional[str], text_content: str) -> List[Indicator]:
    """Inspect sender address format and mismatch against claimed brand."""
    indicators: List[Indicator] = []
    if not sender or not sender.strip():
        return indicators

    clean_sender = sender.strip().lower()

    # Basic email format check
    match = re.search(r"^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)$", clean_sender)
    if not match:
        indicators.append(Indicator(
            code="MALFORMED_SENDER_EMAIL",
            title="Malformed Sender Email Address",
            description=f"The sender address '{sender}' is not a valid RFC-compliant email address.",
            weight=20,
            category="spoofed_sender"
        ))
        return indicators

    sender_domain = match.group(1).lower()

    # Check brand mismatch
    text_lower = text_content.lower()
    for brand in BRAND_KEYWORDS:
        if brand in text_lower:
            # Check if official domain for brand matches
            # E.g. Netflix claims but sender is not netflix.com
            expected_core = brand.replace(" ", "")
            if expected_core not in sender_domain:
                if sender_domain in FREE_EMAIL_DOMAINS:
                    indicators.append(Indicator(
                        code="FREEMAIL_ORGANIZATION_IMPERSONATION",
                        title=f"Corporate Impersonation via Public Email Provider",
                        description=f"The message references '{brand.capitalize()}', but the sender is using a free public email service (@{sender_domain}). Official organizations send notifications from their corporate domain.",
                        weight=38,
                        category="spoofed_sender"
                    ))
                    break
                else:
                    indicators.append(Indicator(
                        code="SENDER_DOMAIN_MISMATCH",
                        title=f"Sender Domain Mismatch with Claimed Brand ({brand.capitalize()})",
                        description=f"The message references '{brand.capitalize()}', but the email originates from '@{sender_domain}'. Phishers register lookalike domains to impersonate trusted companies.",
                        weight=32,
                        category="spoofed_sender"
                    ))
                    break

    return indicators

def analyze_embedded_urls(urls: List[str]) -> Tuple[List[Indicator], Dict[str, Any]]:
    """Analyze all extracted URLs from the message body and surface the most severe indicators."""
    indicators: List[Indicator] = []
    url_details = []
    highest_url_weight = 0

    for u in urls[:5]:  # Bound analysis to first 5 URLs to prevent algorithmic explosion
        url_inds, u_meta = analyze_url_heuristics(u)
        url_details.append({"url": u, "indicators_count": len(url_inds), "metadata": u_meta})
        for ind in url_inds:
            if ind.weight > highest_url_weight:
                highest_url_weight = ind.weight
            indicators.append(ind)

    if urls:
        if highest_url_weight >= 35:
            indicators.append(Indicator(
                code="EMBEDDED_MALICIOUS_LINK",
                title="Suspicious or High-Risk Embedded Hyperlink",
                description=f"The message contains one or more embedded URLs displaying severe risk indicators (e.g. brand impersonation or raw IP hosting).",
                weight=36,
                category="suspicious_link"
            ))
        elif highest_url_weight >= 20:
            indicators.append(Indicator(
                code="EMBEDDED_UNCERTAIN_LINK",
                title="Concealed or Obfuscated Embedded Link",
                description="The message includes links utilizing URL shorteners or non-standard structures.",
                weight=18,
                category="suspicious_link"
            ))

    return indicators, {"extracted_urls": urls, "inspected_count": len(url_details)}

def analyze_email_message(subject: str, sender: Optional[str], body: str) -> ScanResponse:
    """Analyze email phishing indicators across subject, sender, body, and extracted links."""
    indicators: List[Indicator] = []
    full_text = f"{subject}\n{body}"
    target_preview = f"Subject: {subject[:60]} | Body: {body[:60]}" if subject else body[:100]

    # 1. Sender analysis
    indicators.extend(analyze_sender(sender, full_text))

    # 2. Urgency and coercion patterns
    for pattern, title, weight in URGENCY_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            indicators.append(Indicator(
                code="URGENT_COERCION",
                title=title,
                description=f"The email employs psychological coercion through artificial urgency or threats to compel immediate compliance.",
                weight=weight,
                category="urgency"
            ))
            break

    # 3. Credential harvesting patterns
    for pattern, title, weight in CREDENTIAL_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            indicators.append(Indicator(
                code="CREDENTIAL_HARVESTING",
                title=title,
                description=f"The email explicitly prompts the recipient to disclose sensitive credentials, passwords, or authentication keys.",
                weight=weight,
                category="credentials"
            ))
            break

    # 4. Financial & lottery scam patterns
    for pattern, title, weight in FINANCIAL_SCAM_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            indicators.append(Indicator(
                code="FINANCIAL_SCAM_SCHEME",
                title=title,
                description="The email promises unsolicited funds, prizes, or returns characteristic of advance-fee or fraud schemes.",
                weight=weight,
                category="financial"
            ))
            break

    # 5. Dangerous attachment references
    for pattern, title, weight in DANGEROUS_ATTACHMENT_PATTERNS:
        if re.search(pattern, full_text, re.IGNORECASE):
            indicators.append(Indicator(
                code="SUSPICIOUS_ATTACHMENT_REFERENCE",
                title=title,
                description="The email references or urges opening executable code or archive attachments frequently used to distribute infostealers or ransomware.",
                weight=weight,
                category="malware"
            ))
            break

    # 6. Generic greeting with security threat
    if re.search(r"\b(?:dear\s+(?:customer|user|client|member|account\s+holder|valued\s+customer))\b", full_text, re.IGNORECASE):
        # Only mark as suspicious if combined with an urgency or credential trigger
        if any(ind.category in ("urgency", "credentials") for ind in indicators):
            indicators.append(Indicator(
                code="GENERIC_GREETING_SECURITY_CLAIM",
                title="Generic Non-Personalized Salutation on Account Alert",
                description="The email uses a generic greeting ('Dear Customer') while discussing critical account security. Legitimate institutions personalize security notices.",
                weight=14,
                category="deception"
            ))

    # 7. Extract and analyze embedded links
    extracted_urls = extract_urls(full_text)
    url_indicators, url_meta = analyze_embedded_urls(extracted_urls)
    indicators.extend(url_indicators)

    # 8. Compound phishing correlation rule
    # High confidence: urgency + credentials + embedded link
    has_urgency = any(ind.category == "urgency" for ind in indicators)
    has_credentials = any(ind.category == "credentials" for ind in indicators)
    has_link = len(extracted_urls) > 0

    if has_urgency and has_credentials and has_link:
        indicators.append(Indicator(
            code="COMPOUND_PHISHING_SIGNATURE",
            title="Classic Phishing Vector Combination",
            description="The message exhibits the canonical phishing triad: artificial urgency, credential solicitations, and an external link.",
            weight=40,
            category="compound"
        ))

    metadata = {
        "subject_length": len(subject),
        "body_length": len(body),
        "sender": sender,
        "urls_detected": extracted_urls
    }

    return build_scan_response(
        input_type="email",
        target_preview=target_preview,
        indicators=indicators,
        metadata=metadata
    )

def analyze_sms_message(message: str) -> ScanResponse:
    """Analyze SMS / smishing scam indicators across text and shortened links."""
    indicators: List[Indicator] = []
    target_preview = message[:100]
    text_lower = message.lower()

    # 1. Delivery fee smishing
    for pattern, title, weight in DELIVERY_SCAM_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            indicators.append(Indicator(
                code="DELIVERY_FEE_SCAM",
                title=title,
                description="The SMS mimics postal carriers (USPS, FedEx, DHL, Royal Mail) claiming an undelivered parcel to harvest credit card redelivery fees.",
                weight=weight,
                category="financial"
            ))
            break

    # 2. Fake prize / lottery / windfall
    for pattern, title, weight in FINANCIAL_SCAM_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            indicators.append(Indicator(
                code="PRIZE_OR_REFUND_SMISHING",
                title=title,
                description="The SMS presents an unsolicited financial prize or government payout designed to solicit sensitive bank information.",
                weight=weight,
                category="financial"
            ))
            break

    # 3. Urgency / account lock alerts
    for pattern, title, weight in URGENCY_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            indicators.append(Indicator(
                code="URGENT_ACCOUNT_SMISHING",
                title=title,
                description="The SMS generates synthetic panic claiming card freezing or unauthorized withdrawals to push the victim into clicking quickly.",
                weight=weight,
                category="urgency"
            ))
            break

    # 4. OTP / PIN / Credential solicitation
    for pattern, title, weight in CREDENTIAL_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE):
            indicators.append(Indicator(
                code="REQUEST_CREDENTIALS_SMS",
                title=title,
                description="The SMS demands a 2FA code, password, or PIN. Fraudsters trick users into relaying OTPs to bypass multi-factor authentication.",
                weight=weight,
                category="credentials"
            ))
            break

    # 5. Extract and analyze embedded links
    extracted_urls = extract_urls(message)
    url_indicators, url_meta = analyze_embedded_urls(extracted_urls)
    indicators.extend(url_indicators)

    # 6. Smishing link presence correlation
    # SMS with shortener/link + urgent alert is classic smishing
    if extracted_urls and any(ind.category in ("urgency", "financial", "credentials") for ind in indicators):
        indicators.append(Indicator(
            code="SMISHING_ACTION_LINK",
            title="Smishing Call-to-Action Link Detected",
            description="The text message couples an urgent or financial alert with an unsolicited hyperlink, the standard signature of smishing.",
            weight=30,
            category="compound"
        ))

    metadata = {
        "message_length": len(message),
        "urls_detected": extracted_urls
    }

    return build_scan_response(
        input_type="sms",
        target_preview=target_preview,
        indicators=indicators,
        metadata=metadata
    )

