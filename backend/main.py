"""FastAPI entrypoint for the VisionCraft multi-modal AI workspace.

Exposes endpoints for image generation, CLIP-based analysis, OCR,
and diffusion-based style transfer.
"""

from __future__ import annotations

import base64
import io
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
from pydantic import BaseModel, Field

from analyzers.clip_analyzer import CLIPAnalyzer
from analyzers.ocr_engine import OCREngine
from generators.image_gen import ImageGenerator

app = FastAPI(
    title="VisionCraft API",
    description="Multi-modal AI workspace: generation, analysis, OCR, style transfer.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GALLERY_DIR = Path("gallery")
GALLERY_DIR.mkdir(exist_ok=True)

image_generator = ImageGenerator()
clip_analyzer = CLIPAnalyzer()
ocr_engine = OCREngine()


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, description="Text prompt describing the image.")
    negative_prompt: str = Field("", description="Concepts to avoid in the output.")
    style: str = Field("realistic", description="Preset style: realistic, anime, digital-art, watercolor, cyberpunk.")
    width: int = Field(512, ge=256, le=1024)
    height: int = Field(512, ge=256, le=1024)
    num_inference_steps: int = Field(30, ge=10, le=100)
    guidance_scale: float = Field(7.5, ge=1.0, le=20.0)


class StyleTransferRequest(BaseModel):
    strength: float = Field(0.65, ge=0.1, le=1.0, description="How strongly to restyle the source image.")


class GalleryItem(BaseModel):
    id: str
    url: str
    prompt: str
    style: str
    created_at: str


def _read_upload_image(file: UploadFile) -> Image.Image:
    """Load an UploadFile into a PIL RGB image."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail=f"Unsupported content type: {file.content_type}")
    try:
        return Image.open(io.BytesIO(file.file.read())).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid image data.") from exc


def _save_and_encode(image: Image.Image, prompt: str = "", style: str = "uploaded") -> str:
    """Persist an image into the gallery dir and return its base64 encoding."""
    item_id = uuid.uuid4().hex[:12]
    filename = f"{item_id}.png"
    destination = GALLERY_DIR / filename
    image.save(destination, format="PNG")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

    metadata = {
        "id": item_id,
        "url": f"/static/{filename}",
        "prompt": prompt,
        "style": style,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    (GALLERY_DIR / f"{item_id}.json").write_text(json.dumps(metadata), encoding="utf-8")
    return encoded


@app.get("/", tags=["health"])
async def root() -> dict:
    return {"service": "VisionCraft API", "status": "ok"}


@app.post("/api/generate/image", response_model=dict, tags=["generation"])
async def generate_image(request: GenerateRequest) -> dict:
    """Generate an image from a text prompt using Stable Diffusion."""
    try:
        result = image_generator.generate(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            style=request.style,
            width=request.width,
            height=request.height,
            num_inference_steps=request.num_inference_steps,
            guidance_scale=request.guidance_scale,
        )
        encoded = _save_and_encode(result["image"], request.prompt, request.style)
        return {
            "id": result["id"],
            "image_base64": encoded,
            "prompt": request.prompt,
            "style": request.style,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc


@app.post("/api/analyze/image", tags=["analysis"])
async def analyze_image(file: UploadFile = File(...)) -> dict:
    """Analyze an uploaded image with CLIP: top labels, confidence scores, caption."""
    image = _read_upload_image(file)
    try:
        return clip_analyzer.analyze(image)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc


@app.post("/api/ocr", tags=["ocr"])
async def extract_text(file: UploadFile = File(...)) -> dict:
    """Extract text from an uploaded image using Tesseract OCR."""
    image = _read_upload_image(file)
    try:
        return ocr_engine.extract_text(image)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"OCR failed: {exc}") from exc


@app.post("/api/style/transfer", tags=["style"])
async def style_transfer(file: UploadFile = File(...), strength: float = 0.65) -> dict:
    """Restyle an uploaded image using the img2img diffusion pipeline."""
    image = _read_upload_image(file)
    try:
        result = image_generator.transfer_style(image=image, strength=strength)
        encoded = _save_and_encode(result["image"], prompt=result["prompt"], style="styled")
        return {
            "id": result["id"],
            "image_base64": encoded,
            "strength": strength,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Style transfer failed: {exc}") from exc


@app.get("/api/gallery", response_model=list[GalleryItem], tags=["gallery"])
async def get_gallery(limit: int = 60) -> list[GalleryItem]:
    """List recently generated/stored images."""
    items: list[GalleryItem] = []
    for meta_path in sorted(GALLERY_DIR.glob("*.json"), reverse=True)[:limit]:
        data = json.loads(meta_path.read_text(encoding="utf-8"))
        items.append(GalleryItem(**data))
    return items
