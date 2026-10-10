import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Literal
from app.schemas import Indicator, ReputationResult, ScanResponse

SEVERITY_THRESHOLDS = {
    "LOW_MAX": 29,
    "MEDIUM_MAX": 59,
    "HIGH_MIN": 60
}

def determine_severity(score: int) -> Literal["Low", "Medium", "High"]:
    """Map numerical score (0-100) to severity tier."""
    if score <= SEVERITY_THRESHOLDS["LOW_MAX"]:
        return "Low"
    elif score <= SEVERITY_THRESHOLDS["MEDIUM_MAX"]:
        return "Medium"
    return "High"

def deduplicate_indicators(indicators: List[Indicator]) -> List[Indicator]:
    """
    Deduplicate indicators by code, keeping the highest weight instance.
    Prevents repeated regex triggers or multiple matches from artificially inflating score.
    """
    seen: Dict[str, Indicator] = {}
    for ind in indicators:
        if ind.code not in seen or ind.weight > seen[ind.code].weight:
            seen[ind.code] = ind
    return list(seen.values())

def calculate_composite_score(indicators: List[Indicator]) -> int:
    """
    Compute a calibrated risk score (0-100) using a probabilistic diminishing-returns formula.
    Formula: Risk = 1.0 - Product(1.0 - (weight_i / 100))
    
    This ensures:
    - Multiple weak indicators don't easily trigger High severity unless consistent.
    - A single high-confidence indicator (e.g., raw IP address or credential harvest) yields significant weight.
    - Risk score asymptotically approaches 100 rather than clipping naively.
    - Distinct threat categories (synergy) receive a measured contextual boost.
    """
    if not indicators:
        return 0

    unique_indicators = deduplicate_indicators(indicators)
    
    # Probabilistic union of risk events
    prob_safe = 1.0
    categories = set()
    max_single_weight = 0

    for ind in unique_indicators:
        categories.add(ind.category)
        max_single_weight = max(max_single_weight, ind.weight)
        # Normalized weight factor (capped at 0.95 so single indicator doesn't instantly equal 100)
        norm_weight = min(ind.weight / 100.0, 0.95)
        prob_safe *= (1.0 - norm_weight)

    base_score = int(round((1.0 - prob_safe) * 100))

    # Multi-vector synergy: If threat indicators span 3 or more distinct threat categories
    # (e.g. urgency + credential theft + suspicious URL), apply a controlled synergy boost
    category_synergy = 0
    if len(categories) >= 3:
        category_synergy = 8
    elif len(categories) == 2:
        category_synergy = 4

    composite_score = min(100, max(0, base_score + category_synergy))

    # Floor guard: If an indicator is designated critical (weight >= 40), the overall score
    # should reflect at least that severity floor.
    if max_single_weight >= 45 and composite_score < 50:
        composite_score = 50

    return composite_score

def generate_recommendations(
    input_type: str,
    indicators: List[Indicator],
    score: int
) -> List[str]:
    """Generate specific, actionable safety recommendations based on triggered indicators."""
    recommendations: List[str] = []
    indicator_codes = {ind.code for ind in indicators}
    categories = {ind.category for ind in indicators}

    if score >= 60:
        recommendations.append("HIGH RISK: Treat this item with extreme caution. Do NOT click links or download files.")
    elif score >= 30:
        recommendations.append("POTENTIAL RISK: Several warning signs were identified. Verify through an independent channel.")
    else:
        recommendations.append("No critical indicators detected. Remain cautious as zero heuristics cannot guarantee complete safety.")

    # Category-specific guidance
    if "credentials" in categories or "CREDENTIAL_HARVESTING" in indicator_codes or "REQUEST_CREDENTIALS" in indicator_codes:
        recommendations.append("Never enter passwords, PINs, OTP codes, or Social Security numbers on links received via message.")

    if "financial" in categories or "PAYMENT_DEMAND" in indicator_codes or "DELIVERY_FEE_SCAM" in indicator_codes:
        recommendations.append("Verify payment requests directly through the vendor's official app or verified telephone number.")

    if "urgency" in categories or "URGENT_COERCION" in indicator_codes:
        recommendations.append("Recognize artificial urgency (e.g., 'account suspension within 24 hours') as a psychological manipulation tactic.")

    if "spoofed_sender" in categories or "SENDER_DOMAIN_MISMATCH" in indicator_codes:
        recommendations.append("The sender address does not align with the claimed organization. Check the full email headers.")

    if "ip_host" in indicator_codes or "IP_HOST" in indicator_codes:
        recommendations.append("Legitimate organizations do not host customer login portals on raw numerical IP addresses.")

    if "shortener" in indicator_codes or "KNOWN_SHORTENER" in indicator_codes:
        recommendations.append("The link uses a URL shortener that conceals the true target. Use a URL expander to inspect the destination.")

    if "qr" in input_type:
        recommendations.append("QR codes conceal destination URLs from physical inspection. Never scan unverified QR codes in public places.")

    if input_type == "sms":
        recommendations.append("Forward suspicious SMS messages to your carrier's scam reporting number (e.g., 7726 / SPAM).")

    # Deduplicate recommendations preserving order
    seen_recs = set()
    unique_recs = []
    for rec in recommendations:
        if rec not in seen_recs:
            seen_recs.add(rec)
            unique_recs.append(rec)

    return unique_recs

def build_scan_response(
    input_type: Literal["url", "email", "sms", "qr"],
    target_preview: str,
    indicators: List[Indicator],
    reputation: Optional[ReputationResult] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> ScanResponse:
    """Build a standardized ScanResponse object."""
    unique_indicators = deduplicate_indicators(indicators)
    score = calculate_composite_score(unique_indicators)
    severity = determine_severity(score)
    recs = generate_recommendations(input_type, unique_indicators, score)

    rep = reputation or ReputationResult(checked=False, source=None, status="not_configured")
    method = "heuristic_and_reputation" if rep.checked else "heuristic"

    # Truncate target preview safely
    preview_clean = target_preview.strip().replace("\r", " ").replace("\n", " ")
    if len(preview_clean) > 120:
        preview_clean = preview_clean[:117] + "..."

    return ScanResponse(
        id=str(uuid.uuid4()),
        timestamp=datetime.now(timezone.utc).isoformat(),
        score=score,
        severity=severity,
        input_type=input_type,
        target_preview=preview_clean,
        indicators=unique_indicators,
        recommendations=recs,
        analysis_method=method,
        reputation=rep,
        disclaimer="This score is an estimate based on heuristic indicator analysis and does not guarantee whether the content is safe or malicious.",
        metadata=metadata
    )
