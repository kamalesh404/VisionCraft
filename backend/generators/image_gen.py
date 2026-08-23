"""Stable Diffusion powered image generation and style transfer."""

from __future__ import annotations

import uuid
from typing import Any

import torch
from PIL import Image

STYLE_PRESETS: dict[str, str] = {
    "realistic": "photorealistic, ultra detailed, 8k, sharp focus",
    "anime": "anime style, vibrant colors, studio ghibli inspired, clean linework",
    "digital-art": "digital painting, concept art, trending on artstation",
    "watercolor": "soft watercolor painting, delicate brush strokes, pastel palette",
    "cyberpunk": "cyberpunk aesthetic, neon lights, futuristic city, cinematic lighting",
}

DEFAULT_MODEL = "stabilityai/stable-diffusion-2-1-base"


class ImageGenerator:
    """Wraps a diffusers StableDiffusionPipeline for text-to-image generation
    and a StableDiffusionImg2ImgPipeline for style transfer.

    The pipeline is loaded lazily so the FastAPI app can start quickly and the
    heavy model weights are only pulled on first use.
    """

    def __init__(self, model_id: str = DEFAULT_MODEL, device: str | None = None) -> None:
        self.model_id = model_id
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self._txt2img: Any = None
        self._img2img: Any = None

    def _load_txt2img(self) -> Any:
        if self._txt2img is None:
            from diffusers import StableDiffusionPipeline

            pipe = StableDiffusionPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                safety_checker=None,
            )
            pipe.enable_attention_slicing()
            pipe.to(self.device)
            self._txt2img = pipe
        return self._txt2img

    def _load_img2img(self) -> Any:
        if self._img2img is None:
            from diffusers import StableDiffusionImg2ImgPipeline

            pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                safety_checker=None,
            )
            pipe.enable_attention_slicing()
            pipe.to(self.device)
            self._img2img = pipe
        return self._img2img

    def generate(
        self,
        prompt: str,
        negative_prompt: str = "",
        style: str = "realistic",
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 30,
        guidance_scale: float = 7.5,
        seed: int | None = None,
    ) -> dict[str, Any]:
        """Generate an image from ``prompt`` with an optional style preset applied."""
        suffix = STYLE_PRESETS.get(style)
        styled_prompt = f"{prompt}, {suffix}" if suffix else prompt

        generator = None
        if seed is not None:
            generator = torch.Generator(device=self.device).manual_seed(seed)

        pipe = self._load_txt2img()
        result = pipe(
            prompt=styled_prompt,
            negative_prompt=negative_prompt or None,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        )
        image: Image.Image = result.images[0]
        return {"id": uuid.uuid4().hex[:12], "image": image, "prompt": styled_prompt, "style": style}

    def transfer_style(self, image: Image.Image, strength: float = 0.65, prompt: str | None = None) -> dict[str, Any]:
        """Restyle ``image`` via img2img; higher strength means more deviation."""
        styled_prompt = prompt or "masterpiece, highly detailed, artistic reinterpretation"
        pipe = self._load_img2img()
        result = pipe(prompt=styled_prompt, image=image, strength=strength)
        return {"id": uuid.uuid4().hex[:12], "image": result.images[0], "prompt": styled_prompt}
