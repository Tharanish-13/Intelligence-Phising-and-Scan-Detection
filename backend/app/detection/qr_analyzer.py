import re
import cv2
import numpy as np
from typing import Tuple, Optional
from fastapi import HTTPException
from app.schemas import Indicator, ScanResponse
from app.detection.risk_engine import build_scan_response
from app.detection.url_analyzer import analyze_url_heuristics
from app.detection.text_analyzer import analyze_sms_message

MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB limit
ALLOWED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp", "image/bmp"}

def decode_qr_image(image_bytes: bytes) -> Tuple[Optional[str], Optional[str]]:
    """
    Safely decode QR code from image bytes using OpenCV.
    Returns (decoded_text, error_message).
    """
    if len(image_bytes) > MAX_IMAGE_SIZE:
        return None, "Image exceeds maximum allowed size of 10 MB."

    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return None, "Uploaded file could not be parsed as a valid image."

    detector = cv2.QRCodeDetector()

    # Pass 1: Standard detection on original image
    val, pts, _ = detector.detectAndDecode(image)
    if val:
        return val.strip(), None

    # Pass 2: Grayscale and contrast stretching
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    val, pts, _ = detector.detectAndDecode(gray)
    if val:
        return val.strip(), None

    # Pass 3: Otsu's thresholding for low-contrast/noisy images
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    val, pts, _ = detector.detectAndDecode(thresh)
    if val:
        return val.strip(), None

    return None, "No readable QR code found in the image. Ensure the QR code is clearly focused and uncropped."

def is_url(text: str) -> bool:
    """Check if decoded text is a URL."""
    trimmed = text.strip()
    if re.match(r"^(?:https?|ftp)://", trimmed, re.IGNORECASE):
        return True
    if re.match(r"^(?:www\.)[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", trimmed, re.IGNORECASE):
        return True
    if re.match(r"^[a-zA-Z0-9.\-]+\.(?:com|org|net|xyz|top|io|cc|co|info|app)(?:/.*)?$", trimmed, re.IGNORECASE):
        return True
    return False

def analyze_qr_payload(decoded_text: str, filename: str) -> ScanResponse:
    """
    Process decoded QR payload. Dispatches to URL analyzer if URL, or text analyzer if message.
    Adds QR-specific risk context (quishing risk).
    """
    indicators = []
    
    # QR codes inherently hide destinations from physical human inspection
    indicators.append(Indicator(
        code="QR_CONCEALED_PAYLOAD",
        title="QR Code Concealed Payload",
        description="QR codes hide their payload from visual inspection prior to scanning, making them a favored channel for quishing (QR phishing).",
        weight=12,
        category="medium"
    ))

    if is_url(decoded_text):
        url_inds, url_meta = analyze_url_heuristics(decoded_text)
        indicators.extend(url_inds)

        # Build response with input_type='qr'
        res = build_scan_response(
            input_type="qr",
            target_preview=decoded_text,
            indicators=indicators,
            metadata={
                "decoded_type": "url",
                "decoded_content": decoded_text,
                "filename": filename,
                "url_analysis": url_meta
            }
        )
        return res
    else:
        # Plain text payload
        text_scan = analyze_sms_message(decoded_text)
        indicators.extend(text_scan.indicators)

        res = build_scan_response(
            input_type="qr",
            target_preview=decoded_text,
            indicators=indicators,
            metadata={
                "decoded_type": "text",
                "decoded_content": decoded_text,
                "filename": filename
            }
        )
        return res

