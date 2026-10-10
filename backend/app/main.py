import os
import logging
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.schemas import (
    URLAnalysisRequest,
    EmailAnalysisRequest,
    SMSAnalysisRequest,
    ScanResponse,
    HealthResponse
)
from app.detection.url_analyzer import analyze_url
from app.detection.text_analyzer import analyze_email_message, analyze_sms_message
from app.detection.qr_analyzer import decode_qr_image, analyze_qr_payload, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("phishguard")

app = FastAPI(
    title="PhishGuard AI Detection Engine",
    description="Intelligent Phishing, Scam, and Malicious URL Detection API",
    version=__version__
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled server exception occurred: %s", str(exc), exc_info=False)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal error occurred during detection processing. Please check your input."}
    )

@app.get("/api/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint providing engine status and integration capabilities."""
    vt_key = os.getenv("VIRUSTOTAL_API_KEY")
    return HealthResponse(
        status="operational",
        version=__version__,
        reputation_configured=bool(vt_key),
        reputation_provider="VirusTotal" if vt_key else None
    )

@app.post("/api/analyze/url", response_model=ScanResponse)
async def scan_url(payload: URLAnalysisRequest):
    """
    Safely inspect a URL for phishing, homograph attacks, suspicious TLDs, and structure heuristics.
    Never visits or fetches content from the submitted URL.
    """
    clean_url = payload.url.strip()
    if not clean_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="URL string cannot be empty."
        )
    logger.info("URL scan requested (length: %d)", len(clean_url))
    return await analyze_url(clean_url)

@app.post("/api/analyze/email", response_model=ScanResponse)
async def scan_email(payload: EmailAnalysisRequest):
    """
    Analyze email content for psychological coercion, credential harvesting, sender mismatches,
    and dangerous embedded hyperlinks.
    """
    if not payload.body.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email body content is required for analysis."
        )
    logger.info("Email scan requested (subject length: %d, body length: %d)", len(payload.subject), len(payload.body))
    return analyze_email_message(payload.subject, payload.sender, payload.body)

@app.post("/api/analyze/sms", response_model=ScanResponse)
async def scan_sms(payload: SMSAnalysisRequest):
    """
    Analyze SMS / text message for smishing, package delivery scams, fake prizes,
    and fraudulent action links.
    """
    if not payload.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SMS message content is required for analysis."
        )
    logger.info("SMS scan requested (length: %d)", len(payload.message))
    return analyze_sms_message(payload.message)

@app.post("/api/analyze/qr", response_model=ScanResponse)
async def scan_qr(file: UploadFile = File(...)):
    """
    Upload and decode a QR code image, then evaluate payload for URL or text threat indicators.
    """
    # Validate content type if supplied
    if file.content_type and file.content_type.lower() not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Please upload PNG, JPEG, WebP, or BMP."
        )

    # Read image bytes with size guard
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )
    if len(image_bytes) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image exceeds maximum size limit of 10 MB."
        )

    decoded_text, err = decode_qr_image(image_bytes)
    if err or not decoded_text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=err or "Unable to detect a readable QR code."
        )

    logger.info("QR scan decoded successfully (payload length: %d)", len(decoded_text))
    return analyze_qr_payload(decoded_text, file.filename or "uploaded_qr.png")

