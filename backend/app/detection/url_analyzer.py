import re
import os
import ipaddress
import urllib.parse
from typing import List, Optional, Tuple, Dict, Any
from app.schemas import Indicator, ReputationResult, ScanResponse
from app.detection.risk_engine import build_scan_response

# Known URL shortener domains commonly used to mask malicious destinations
KNOWN_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "is.gd", "buff.ly", "ow.ly", "cutt.ly",
    "rb.gy", "shorturl.at", "tiny.cc", "goo.gl", "bit.do", "bl.ink"
}

# Suspicious or high-abuse top-level domains frequently observed in phishing kits
HIGH_RISK_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "top", "buzz", "work", "click", "fit", "surf",
    "rest", "live", "quest", "cam", "icu", "country", "stream"
}

# Targeted financial, tech, and retail brands commonly impersonated
POPULAR_TARGET_BRANDS = {
    "paypal": ["paypal.com"],
    "apple": ["apple.com", "icloud.com"],
    "microsoft": ["microsoft.com", "live.com", "office.com"],
    "google": ["google.com", "accounts.google.com"],
    "amazon": ["amazon.com", "amazon.co.uk", "amazon.in"],
    "netflix": ["netflix.com"],
    "chase": ["chase.com"],
    "bankofamerica": ["bankofamerica.com"],
    "wellsfargo": ["wellsfargo.com"],
    "facebook": ["facebook.com", "meta.com"],
    "instagram": ["instagram.com"],
    "binance": ["binance.com"],
    "coinbase": ["coinbase.com"],
    "fedex": ["fedex.com"],
    "dhl": ["dhl.com"],
    "usps": ["usps.com"]
}

# Suspicious sensitive path keywords indicating potential credential harvesting
SENSITIVE_PATH_PATTERNS = [
    r"/(?:login|signin|sign-in|log-in|account|secure|verify|verification|update|billing|wallet|session|webscr|auth|checkout)",
    r"\.(?:exe|scr|bat|vbs|zip|tar|iso|apk|msi)$"
]

def is_ip_address(hostname: str) -> bool:
    """Check if hostname is a valid IPv4 or IPv6 address."""
    clean_host = hostname.strip("[]")
    try:
        ipaddress.ip_address(clean_host)
        return True
    except ValueError:
        return False

def parse_url_safely(raw_url: str) -> Tuple[Optional[urllib.parse.ParseResult], List[Indicator]]:
    """Safely parse a URL, ensuring proper scheme and catching malformed structures."""
    indicators: List[Indicator] = []
    trimmed = raw_url.strip()

    if not trimmed:
        indicators.append(Indicator(
            code="EMPTY_URL",
            title="Empty URL Submitted",
            description="No URL content was provided for analysis.",
            weight=10,
            category="structure"
        ))
        return None, indicators

    # If scheme is omitted, prepend http:// for standard RFC parsing
    url_to_parse = trimmed
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+\-.]*://", trimmed):
        url_to_parse = "http://" + trimmed

    try:
        parsed = urllib.parse.urlparse(url_to_parse)
        if not parsed.netloc and not parsed.path:
            indicators.append(Indicator(
                code="MALFORMED_URL",
                title="Malformed URL Structure",
                description="The URL lacks a recognizable hostname or authority structure.",
                weight=30,
                category="structure"
            ))
            return None, indicators
        return parsed, indicators
    except Exception as ex:
        indicators.append(Indicator(
            code="INVALID_URL_PARSING",
            title="Failed to Parse URL",
            description=f"The URL could not be parsed according to standard RFC specifications: {str(ex)[:100]}",
            weight=35,
            category="structure"
        ))
        return None, indicators

def analyze_url_heuristics(raw_url: str) -> Tuple[List[Indicator], Dict[str, Any]]:
    """Perform purely local, safe heuristic analysis on a submitted URL."""
    indicators: List[Indicator] = []
    metadata: Dict[str, Any] = {"raw_url": raw_url}

    parsed, parse_indicators = parse_url_safely(raw_url)
    indicators.extend(parse_indicators)

    if not parsed:
        return indicators, metadata

    # Extract components
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path
    query = parsed.query

    metadata["scheme"] = scheme
    metadata["netloc"] = netloc
    metadata["path"] = path

    # Split netloc into hostname and port safely
    hostname = ""
    port = None
    try:
        hostname = parsed.hostname or ""
    except ValueError:
        indicators.append(Indicator(
            code="INVALID_HOSTNAME",
            title="Invalid Hostname in URL",
            description="The URL authority contains an invalid or unparseable hostname structure.",
            weight=30,
            category="structure"
        ))
    metadata["hostname"] = hostname

    # 1. IP Address as Hostname
    if hostname and is_ip_address(hostname):
        indicators.append(Indicator(
            code="IP_HOST",
            title="IP Address Used as Hostname",
            description="The destination uses a raw IP address instead of a registered domain name. Phishers frequently host temporary phishing sites on direct IPs.",
            weight=40,
            category="structure"
        ))

    # 2. Userinfo / @ symbol deception (e.g., http://google.com@evil-site.com)
    if "@" in netloc:
        indicators.append(Indicator(
            code="USERINFO_SPOOFING",
            title="Misleading '@' Symbol in URL Authority",
            description="The URL uses the '@' character in the authority section. Browsers disregard everything before '@' as credentials and navigate to the domain after '@'.",
            weight=45,
            category="deception"
        ))

    # 3. Non-standard port
    try:
        port = parsed.port
    except ValueError:
        indicators.append(Indicator(
            code="MALFORMED_PORT",
            title="Malformed Port Specification",
            description="The URL contains non-numeric characters in its port definition.",
            weight=25,
            category="structure"
        ))

    if port and port not in (80, 443, 8080):
        indicators.append(Indicator(
            code="NON_STANDARD_PORT",
            title=f"Non-Standard Port ({port})",
            description=f"The URL connects to an unusual TCP port ({port}). Legitimate consumer websites predominantly operate on standard HTTP(80) or HTTPS(443) ports.",
            weight=20,
            category="structure"
        ))

    # 4. Punycode / Internationalized Domain Name (IDN) Homograph Attack
    if "xn--" in hostname:
        indicators.append(Indicator(
            code="PUNYCODE_IDN",
            title="Punycode / IDN Homograph Risk",
            description="The domain uses Punycode ('xn--'), which can be used in homograph attacks to display lookalike characters mimicking established brand domains.",
            weight=25,
            category="deception"
        ))

    # 5. Known URL Shorteners
    # Check if registered domain matches known shorteners
    if hostname in KNOWN_SHORTENERS or any(hostname.endswith("." + s) for s in KNOWN_SHORTENERS):
        indicators.append(Indicator(
            code="KNOWN_SHORTENER",
            title="URL Shortener Masking Destination",
            description="The link utilizes a known URL shortening service. Shorteners obscure the final landing domain and bypass initial domain-based heuristics.",
            weight=22,
            category="obfuscation"
        ))

    # 6. Excessive Subdomains
    subdomain_parts = [p for p in hostname.split(".") if p]
    if len(subdomain_parts) >= 4 and not is_ip_address(hostname):
        indicators.append(Indicator(
            code="EXCESSIVE_SUBDOMAINS",
            title=f"Excessive Subdomain Depth ({len(subdomain_parts)} parts)",
            description="The hostname contains multiple subdomain tiers. Attackers often chain subdomains (e.g. 'paypal.verification.update.evil.com') to confuse users.",
            weight=25,
            category="deception"
        ))

    # 7. Excessive URL Length
    url_len = len(raw_url)
    if url_len > 140:
        indicators.append(Indicator(
            code="EXCESSIVE_LENGTH",
            title=f"Excessively Long URL ({url_len} characters)",
            description="The URL is unusually long. Phishers use long tokens and nested redirects to conceal malicious query parameters or push warning signals off screen.",
            weight=18,
            category="obfuscation"
        ))
    elif url_len > 85:
        indicators.append(Indicator(
            code="MODERATE_LENGTH",
            title=f"Elevated URL Length ({url_len} characters)",
            description="The URL is longer than typical landing links, potentially containing obfuscated parameters.",
            weight=8,
            category="obfuscation"
        ))

    # 8. High-Risk / Suspicious TLD
    tld = subdomain_parts[-1] if subdomain_parts else ""
    metadata["tld"] = tld
    if tld in HIGH_RISK_TLDS:
        indicators.append(Indicator(
            code="SUSPICIOUS_TLD",
            title=f"High-Risk Top-Level Domain (.{tld})",
            description=f"The domain uses the top-level domain '.{tld}', which is statistically associated with high rates of free or cheap malicious registrations.",
            weight=24,
            category="reputation"
        ))

    # 9. Brand Impersonation in Hostname or Path
    for brand, legit_domains in POPULAR_TARGET_BRANDS.items():
        # Check if brand is in hostname or path
        brand_in_host = brand in hostname
        brand_in_path = brand in path.lower() or brand in query.lower()

        # Check if hostname actually is one of the legitimate domains
        is_legit = any(hostname == d or hostname.endswith("." + d) for d in legit_domains)

        if (brand_in_host or brand_in_path) and not is_legit:
            indicators.append(Indicator(
                code="BRAND_IMPERSONATION",
                title=f"Target Brand Impersonation ({brand.capitalize()})",
                description=f"The URL references the brand '{brand.capitalize()}' in its domain or path, but the host does not match the official domains ({', '.join(legit_domains)}).",
                weight=38,
                category="impersonation"
            ))
            break

    # 10. Sensitive Path Patterns
    path_lower = path.lower()
    for pattern in SENSITIVE_PATH_PATTERNS:
        if re.search(pattern, path_lower):
            indicators.append(Indicator(
                code="SENSITIVE_AUTH_PATH",
                title="Sensitive Authentication or Action Path",
                description=f"The URL path target ('{path}') matches keywords commonly used for credential input, billing updates, or executable downloads.",
                weight=15,
                category="structure"
            ))
            break

    # 11. Multiple embedded protocols / redirect tricks (e.g., http://.../http://...)
    if path_lower.count("http:") + path_lower.count("https:") > 0:
        indicators.append(Indicator(
            code="EMBEDDED_PROTOCOL_REDIRECT",
            title="Open Redirect / Chained Protocol in Path",
            description="The URL contains embedded 'http' / 'https' parameters inside its path or query, typical of open redirect abuse.",
            weight=26,
            category="deception"
        ))

    # 12. Plain HTTP contextual signal
    if scheme == "http":
        indicators.append(Indicator(
            code="UNENCRYPTED_HTTP",
            title="Unencrypted HTTP Connection",
            description="The URL specifies unencrypted HTTP rather than HTTPS. While not definitive proof of phishing, modern legitimate services mandate TLS encryption.",
            weight=8,
            category="context"
        ))

    return indicators, metadata

async def check_external_reputation(raw_url: str) -> ReputationResult:
    """
    Query external threat intelligence provider if API key is configured.
    Falls back gracefully to 'not_configured' without fake telemetry.
    """
    vt_key = os.getenv("VIRUSTOTAL_API_KEY")
    if not vt_key:
        return ReputationResult(
            checked=False,
            source=None,
            status="not_configured",
            details={"message": "External reputation provider not configured. Operating in local heuristic mode."}
        )

    # If key is configured, perform safe lookup via VirusTotal API v3
    try:
        import httpx
        import base64
        url_id = base64.urlsafe_b64encode(raw_url.encode()).decode().strip("=")
        headers = {"x-apikey": vt_key}
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(f"https://www.virustotal.com/api/v3/urls/{url_id}", headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                if malicious > 0 or suspicious > 0:
                    return ReputationResult(
                        checked=True,
                        source="VirusTotal",
                        status="flagged",
                        details={"malicious_engines": malicious, "suspicious_engines": suspicious}
                    )
                return ReputationResult(
                    checked=True,
                    source="VirusTotal",
                    status="clean",
                    details=stats
                )
    except Exception as ex:
        return ReputationResult(
            checked=False,
            source="VirusTotal",
            status="error",
            details={"error": str(ex)[:100]}
        )

    return ReputationResult(checked=False, source=None, status="not_configured")

async def analyze_url(raw_url: str) -> ScanResponse:
    """Analyze a URL completely and return a validated ScanResponse."""
    indicators, metadata = analyze_url_heuristics(raw_url)
    reputation = await check_external_reputation(raw_url)

    # If external reputation flagged, add indicator
    if reputation.status == "flagged" and reputation.details:
        indicators.append(Indicator(
            code="EXTERNAL_REPUTATION_FLAGGED",
            title=f"Flagged by External Intelligence ({reputation.source})",
            description=f"External security scanners reported this URL as malicious ({reputation.details.get('malicious_engines', 1)} vendor flags).",
            weight=50,
            category="reputation"
        ))

    return build_scan_response(
        input_type="url",
        target_preview=raw_url,
        indicators=indicators,
        reputation=reputation,
        metadata=metadata
    )
