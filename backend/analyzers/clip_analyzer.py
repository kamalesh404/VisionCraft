"""Zero-shot image analysis using OpenAI CLIP via Hugging Face transformers."""

from __future__ import annotations

from typing import Any

import torch
from PIL import Image

DEFAULT_MODEL = "openai/clip-vit-large-patch14"

DEFAULT_CANDIDATE_LABELS: list[str] = [
    "a photo of a person",
    "a photo of an animal",
    "a landscape scene",
    "a cityscape or building",
    "a piece of artwork",
    "a document or text page",
    "food",
    "a vehicle",
]


class CLIPAnalyzer:
    """Classifies images against candidate labels and produces a pseudo-caption
    using CLIP zero-shot image/text similarity."""

    def __init__(self, model_id: str = DEFAULT_MODEL, device: str | None = None) -> None:
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_id = model_id
        self._model: Any = None
        self._processor: Any = None

    def _ensure_loaded(self) -> None:
        if self._model is None:
            from transformers import CLIPModel, CLIPProcessor

            self._model = CLIPModel.from_pretrained(self.model_id).to(self.device).eval()
            self._processor = CLIPProcessor.from_pretrained(self.model_id)

    def classify(
        self,
        image: Image.Image,
        candidate_labels: list[str] | None = None,
        top_k: int = 5,
    ) -> list[dict[str, Any]]:
        """Return the ``top_k`` most likely labels with confidence scores."""
        self._ensure_loaded()
        labels = candidate_labels or DEFAULT_CANDIDATE_LABELS

        with torch.no_grad():
            inputs = self._processor(text=labels, images=image, return_tensors="pt", padding=True)
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            outputs = self._model(**inputs)
            probs = outputs.logits_per_image.softmax(dim=-1).squeeze(0)

        ranked = sorted(zip(labels, probs.tolist(), strict=True), key=lambda pair: pair[1], reverse=True)[:top_k]
        return [{"label": label, "confidence": round(score * 100, 2)} for label, score in ranked]

    def caption(self, image: Image.Image) -> str:
        """Build a lightweight natural-language description from the best match."""
        top = self.classify(image, top_k=1)
        if not top:
            return "an image"
        subject = (
            top[0]["label"]
            .replace("a photo of ", "")
            .replace("a ", "", 1)
        )
        return f"An image that appears to show {subject}."

    def analyze(
        self,
        image: Image.Image,
        candidate_labels: list[str] | None = None,
        top_k: int = 5,
    ) -> dict[str, Any]:
        """Full analysis payload consumed by the frontend Analyze tab."""
        results = self.classify(image, candidate_labels=candidate_labels, top_k=top_k)
        return {
            "predictions": results,
            "caption": self.caption(image),
            "dimensions": {"width": image.width, "height": image.height},
            "mode": image.mode,
            "format": getattr(image, "format", None) or "RGB",
        }
