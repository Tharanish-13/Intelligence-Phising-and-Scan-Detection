import pytest
import io
import cv2
import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.schemas import Indicator
from app.detection.risk_engine import (
    calculate_composite_score,
    determine_severity,
    deduplicate_indicators,
    generate_recommendations
)
from app.detection.url_analyzer import analyze_url_heuristics, parse_url_safely
from app.detection.text_analyzer import (
    analyze_email_message,
    analyze_sms_message,
    extract_urls
)
from app.detection.qr_analyzer import decode_qr_image, analyze_qr_payload

client = TestClient(app)

def create_synthetic_qr(payload: str) -> bytes:
    """Helper to generate a valid PNG QR code image in-memory for testing."""
    encoder = cv2.QRCodeEncoder_create()
    qrmat = encoder.encode(payload)
    # Resize up to ensure crisp contrast for decoding
    qr_large = cv2.resize(qrmat, (220, 220), interpolation=cv2.INTER_NEAREST)
    # Add white border / quiet zone
    bordered = cv2.copyMakeBorder(qr_large, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    _, buf = cv2.imencode(".png", bordered)
    return buf.tobytes()


class TestRiskEngine:
    def test_severity_thresholds(self):
        assert determine_severity(0) == "Low"
        assert determine_severity(25) == "Low"
        assert determine_severity(29) == "Low"
        assert determine_severity(30) == "Medium"
        assert determine_severity(45) == "Medium"
        assert determine_severity(59) == "Medium"
        assert determine_severity(60) == "High"
        assert determine_severity(85) == "High"
        assert determine_severity(100) == "High"

    def test_deduplication(self):
        indicators = [
            Indicator(code="URGENT", title="Urgent 1", description="desc", weight=25, category="urgency"),
            Indicator(code="URGENT", title="Urgent 2", description="desc", weight=30, category="urgency"),
            Indicator(code="CRED", title="Cred", description="desc", weight=40, category="credentials"),
        ]
        deduped = deduplicate_indicators(indicators)
        assert len(deduped) == 2
        urgent = next(i for i in deduped if i.code == "URGENT")
        assert urgent.weight == 30  # Preserved highest weight

    def test_composite_score_bounds_and_diminishing_returns(self):
        # Empty indicators should be 0
        assert calculate_composite_score([]) == 0

        # Single mild indicator should not trigger High
        mild = [Indicator(code="MILD", title="Mild", description="desc", weight=15, category="general")]
        score = calculate_composite_score(mild)
        assert score < 30
        assert determine_severity(score) == "Low"

        # Multiple severe cross-category indicators
        severe = [
            Indicator(code="IP", title="IP host", description="desc", weight=40, category="structure"),
            Indicator(code="CRED", title="Cred theft", description="desc", weight=45, category="credentials"),
            Indicator(code="URG", title="Urgent", description="desc", weight=26, category="urgency"),
        ]
        high_score = calculate_composite_score(severe)
        assert 60 <= high_score <= 100
        assert determine_severity(high_score) == "High"


class TestURLAnalyzer:
    def test_benign_url(self):
        indicators, meta = analyze_url_heuristics("https://example.com")
        codes = [i.code for i in indicators]
        # example.com is clean and valid HTTPS
        assert "IP_HOST" not in codes
        assert "USERINFO_SPOOFING" not in codes
        assert "BRAND_IMPERSONATION" not in codes
        score = calculate_composite_score(indicators)
        assert score < 30
        assert determine_severity(score) == "Low"

    def test_ip_address_host(self):
        indicators, _ = analyze_url_heuristics("http://192.168.1.1/login")
        codes = [i.code for i in indicators]
        assert "IP_HOST" in codes

    def test_userinfo_at_symbol_spoofing(self):
        indicators, _ = analyze_url_heuristics("http://google.com@evil-site.com/auth")
        codes = [i.code for i in indicators]
        assert "USERINFO_SPOOFING" in codes

    def test_brand_impersonation_and_high_risk_tld(self):
        indicators, _ = analyze_url_heuristics("http://paypal-verification-center.top/webscr")
        codes = [i.code for i in indicators]
        assert "BRAND_IMPERSONATION" in codes
        assert "SUSPICIOUS_TLD" in codes

    def test_known_shortener(self):
        indicators, _ = analyze_url_heuristics("https://bit.ly/secure-account")
        codes = [i.code for i in indicators]
        assert "KNOWN_SHORTENER" in codes

    def test_malformed_url_handling(self):
        indicators, _ = analyze_url_heuristics(":::not-a-valid-url:::")
        assert any(i.category == "structure" for i in indicators)


class TestTextAnalyzer:
    def test_benign_text_message(self):
        benign_msg = "Hey Alex, are we still meeting for lunch at 1pm today? Let me know!"
        res = analyze_sms_message(benign_msg)
        assert res.score < 30
        assert res.severity == "Low"

    def test_sms_delivery_fee_scam(self):
        scam_msg = "USPS: Your package cannot be delivered due to incomplete address. Please pay $1.99 redelivery fee at http://usps-redelivery-portal.top"
        res = analyze_sms_message(scam_msg)
        codes = [i.code for i in res.indicators]
        assert "DELIVERY_FEE_SCAM" in codes
        assert res.score >= 50

    def test_sms_otp_scam(self):
        scam_msg = "Bank Notice: Unusual transaction of $850 detected. Enter your one-time passcode OTP at http://192.168.1.50/verify to block the charge."
        res = analyze_sms_message(scam_msg)
        codes = [i.code for i in res.indicators]
        assert "REQUEST_CREDENTIALS_SMS" in codes
        assert res.severity in ("Medium", "High")

    def test_email_phishing_compound_signature(self):
        subject = "URGENT: Your PayPal Account Has Been Suspended"
        sender = "security-notice@paypal-update-alert.xyz"
        body = (
            "Dear Customer, your account has been suspended due to unauthorized access. "
            "Immediate action required within 24 hours. "
            "Please confirm your password and billing details immediately by visiting "
            "http://paypal-security-account.top/login"
        )
        res = analyze_email_message(subject, sender, body)
        codes = [i.code for i in res.indicators]
        assert "COMPOUND_PHISHING_SIGNATURE" in codes or "CREDENTIAL_HARVESTING" in codes
        assert res.severity == "High"
        assert res.score >= 60

    def test_context_awareness_benign_urgent_email(self):
        # Email having the word "urgent" or "verify" in benign context should not be labeled high risk
        subject = "Project Update"
        body = "Can you please verify the meeting room booking for tomorrow? It is urgent that we confirm the room before 5pm."
        res = analyze_email_message(subject, "colleague@company.com", body)
        # Should NOT trigger high severity because there are no credential demands, fake links, or fraud vectors
        assert res.severity != "High"


class TestQRAnalyzer:
    def test_qr_decode_url_synthetic(self):
        target = "https://example.com/test-qr"
        qr_bytes = create_synthetic_qr(target)
        text, err = decode_qr_image(qr_bytes)
        assert err is None
        assert text == target

        res = analyze_qr_payload(text, "synthetic_qr.png")
        assert res.input_type == "qr"
        assert res.metadata["decoded_type"] == "url"

    def test_invalid_qr_image_bytes(self):
        # Random noise image is not a QR code
        noise = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
        _, buf = cv2.imencode(".png", noise)
        text, err = decode_qr_image(buf.tobytes())
        assert text is None
        assert "No readable QR code" in err


class TestFastAPIEndpoints:
    def test_health_check(self):
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "operational"
        assert "version" in data

    def test_analyze_url_endpoint(self):
        payload = {"url": "https://example.com"}
        response = client.post("/api/analyze/url", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["input_type"] == "url"
        assert data["severity"] == "Low"

    def test_analyze_email_endpoint(self):
        payload = {
            "subject": "Security Alert",
            "sender": "alert@fakebank.top",
            "body": "Account suspended. Enter your password at http://fakebank.top/login within 24 hours."
        }
        response = client.post("/api/analyze/email", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["severity"] == "High"

    def test_analyze_sms_endpoint(self):
        payload = {
            "message": "Congratulations! You won $10,000 cash prize. Click http://prize-claim.xyz to claim."
        }
        response = client.post("/api/analyze/sms", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["input_type"] == "sms"

    def test_analyze_qr_endpoint_with_valid_image(self):
        qr_bytes = create_synthetic_qr("https://example.com/login")
        files = {"file": ("test_qr.png", io.BytesIO(qr_bytes), "image/png")}
        response = client.post("/api/analyze/qr", files=files)
        assert response.status_code == 200
        data = response.json()
        assert data["input_type"] == "qr"

    def test_empty_input_validation(self):
        response = client.post("/api/analyze/url", json={"url": "   "})
        assert response.status_code in (400, 422)

        response = client.post("/api/analyze/email", json={"subject": "", "body": "   "})
        assert response.status_code in (400, 422)

        response = client.post("/api/analyze/sms", json={"message": "   "})
        assert response.status_code in (400, 422)
