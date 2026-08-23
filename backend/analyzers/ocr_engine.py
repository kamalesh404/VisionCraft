"""OCR text extraction using Tesseract via pytesseract."""

from __future__ import annotations

from typing import Any

from PIL import Image, ImageEnhance, ImageFilter

try:
    import pytesseract
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("pytesseract is required. Install it and the Tesseract binary.") from exc


class OCREngine:
    """Extracts text from images with optional grayscale/contrast pre-processing
    to boost recognition accuracy."""

    def __init__(self, language: str = "eng", tesseract_cmd: str | None = None) -> None:
        self.language = language
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    @staticmethod
    def _preprocess(image: Image.Image) -> Image.Image:
        """Grayscale, upscale and sharpen small images for better OCR."""
        gray = image.convert("L")
        if min(gray.size) < 1000:
            scale = 2
            gray = gray.resize((gray.width * scale, gray.height * scale), Image.LANCZOS)
        gray = ImageEnhance.Contrast(gray).enhance(1.6)
        return gray.filter(ImageFilter.SHARPEN)

    def extract_text(
        self,
        image: Image.Image,
        language: str | None = None,
        preprocess: bool = True,
        psm: int = 3,
    ) -> dict[str, Any]:
        """Return extracted text plus confidence metadata.

        ``psm`` follows Tesseract page segmentation modes (3 = fully automatic).
        """
        lang = language or self.language
        working = self._preprocess(image) if preprocess else image

        text = pytesseract.image_to_string(working, lang=lang, config=f"--psm {psm}")
        data = pytesseract.image_to_data(working, lang=lang, output_type=pytesseract.Output.DICT)

        confidences = [int(c) for c, word in zip(data["conf"], data["text"], strict=True) if int(c) >= 0 and word.strip()]
        average_confidence = round(sum(confidences) / len(confidences), 2) if confidences else 0.0
        words = [w for w in data["text"] if w.strip()]

        return {
            "text": text.strip(),
            "word_count": len(words),
            "character_count": len(text.strip()),
            "average_confidence": average_confidence,
            "language": lang,
            "lines": [line for line in (l.strip() for l in text.splitlines()) if line],
        }
