from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class Indicator(BaseModel):
    code: str = Field(..., description="Unique machine-readable indicator identifier")
    title: str = Field(..., description="Human-readable title of indicator")
    description: str = Field(..., description="Detailed explanation of the indicator and security risk")
    weight: int = Field(..., ge=1, le=100, description="Risk weight contribution (1-100)")
    category: str = Field(..., description="Indicator category: urgency, credentials, structure, impersonation, etc.")

class ReputationResult(BaseModel):
    checked: bool = Field(default=False, description="Whether an external threat intelligence lookup occurred")
    source: Optional[str] = Field(default=None, description="Reputation provider name, if applicable")
    status: str = Field(default="not_configured", description="Reputation status: clean, flagged, not_configured, error")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Detailed reputation attributes")

class ScanResponse(BaseModel):
    id: str = Field(..., description="Unique scan identifier")
    timestamp: str = Field(..., description="ISO 8601 timestamp of analysis")
    score: int = Field(..., ge=0, le=100, description="Composite risk score from 0 (safe/neutral) to 100 (critical risk)")
    severity: Literal["Low", "Medium", "High"] = Field(..., description="Risk tier: Low (0-29), Medium (30-59), High (60-100)")
    input_type: Literal["url", "email", "sms", "qr"] = Field(..., description="Source medium analyzed")
    target_preview: str = Field(..., description="Sanitized preview of analyzed content")
    indicators: List[Indicator] = Field(default_factory=list, description="List of triggered risk indicators")
    recommendations: List[str] = Field(default_factory=list, description="Actionable security advice for users")
    analysis_method: Literal["heuristic", "heuristic_and_reputation"] = Field(default="heuristic")
    reputation: ReputationResult = Field(default_factory=ReputationResult)
    disclaimer: str = Field(
        default="This score is an estimate based on heuristic indicator analysis and does not guarantee whether the content is safe or malicious.",
        description="Legal and security disclaimer"
    )
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional context such as extracted URLs or decoded content")

class URLAnalysisRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048, description="Target URL to inspect")

class EmailAnalysisRequest(BaseModel):
    subject: str = Field(default="", max_length=500, description="Email subject line")
    sender: Optional[str] = Field(default=None, max_length=320, description="Sender email address, if provided")
    body: str = Field(..., min_length=1, max_length=50000, description="Email body content")

class SMSAnalysisRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000, description="SMS message text")

class HealthResponse(BaseModel):
    status: str
    version: str
    reputation_configured: bool
    reputation_provider: Optional[str]
