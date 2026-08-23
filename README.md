<div align="center">

![VisionCraft](https://capsule-render.vercel.app/api?type=waving&color=0:10b981,50:14b8a6,100:06b6d4&height=200&section=header&text=VisionCraft&fontSize=60&fontColor=ffffff&animation=fadeIn&desc=Multi-Modal%20AI%20Workspace&descSize=20&descColor=ffffff)

# VisionCraft

**A unified multi-modal AI workspace — generate, analyze, and transform images with state-of-the-art models.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Stable Diffusion](https://img.shields.io/badge/Stable%20Diffusion-XL-8A2BE2?style=for-the-badge&logo=huggingface&logoColor=white)](https://huggingface.co/docs/diffusers)
[![CLIP](https://img.shields.io/badge/CLIP-ViT--L%2F14-FF6F00?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/research/clip)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](LICENSE)

</div>

---

## Overview

VisionCraft brings together cutting-edge AI vision models behind a single, elegant workspace:

| Capability | Model / Engine |
|---|---|
| **Text-to-Image Generation** | Stable Diffusion (diffusers) |
| **Image Analysis & Classification** | OpenAI CLIP |
| **OCR Text Extraction** | Tesseract + pytesseract |
| **Style Transfer** | Diffusion-based image-to-image |

## Features

- **Image Generation** — Turn natural-language prompts into high-quality images with configurable styles, steps, guidance scale, and negative prompts.
- **Image Analysis** — Upload any image and get zero-shot classification against candidate labels plus confidence scores powered by CLIP.
- **OCR Engine** — Extract text from screenshots, documents, and photos with pre-processing for better accuracy.
- **Style Transfer** — Restyle images using diffusion img2img pipelines with strength control.
- **Gallery** — Browse every generated asset in a responsive masonry grid.
- **Modern UI** — React 18 + Vite + Tailwind CSS with drag-and-drop uploads and animated confidence bars.
- **Production Ready** — Dockerized backend, typed Python (pydantic), TypeScript frontend, CI pipeline included.

## Architecture

```
+-------------------------------------------------------------+
|                    VisionCraft Workspace                     |
+---------------------------+---------------------------------+
|     Frontend (React)      |         Backend (FastAPI)       |
|  +--------------------+   |   +--------------------------+  |
|  | Generate Tab       |---+-->| POST /api/generate/image |  |
|  | Analyze Tab        |---+-->| POST /api/analyze/image  |  |
|  | OCR Tab            |---+-->| POST /api/ocr            |  |
|  | Gallery Tab        |---+-->| GET  /api/gallery        |  |
|  +--------------------+   |   | POST /api/style/transfer |  |
|                           |   +------------+-------------+  |
|    Vite + TailwindCSS     |                |                |
+---------------------------+----------------+----------------+
                                            |
              +-----------------+-----------+------+
              v                 v                  v
     +--------------+  +---------------+  +---------------+
     | ImageGen     |  | CLIPAnalyzer  |  | OCREngine     |
     | diffusers SD |  | transformers  |  | pytesseract   |
     +--------------+  +---------------+  +---------------+
```

## Project Structure

```
VisionCraft/
├── backend/
│   ├── main.py                  # FastAPI application & API routes
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── generators/
│   │   └── image_gen.py         # Stable Diffusion image generator
│   └── analyzers/
│       ├── clip_analyzer.py     # CLIP zero-shot classifier
│       └── ocr_engine.py        # Tesseract OCR engine
├── frontend/
│   ├── package.json
│   └── src/
│       ├── App.tsx              # Tab navigation shell
│       ├── components/
│       │   ├── ImageGenerator.tsx
│       │   ├── ImageAnalyzer.tsx
│       │   ├── OCREngine.tsx
│       │   └── Gallery.tsx
│       └── types/
│           └── index.ts
└── .github/workflows/ci.yml
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed and on your `PATH`
- (Optional) CUDA-capable GPU for faster generation

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Interactive API docs: <http://localhost:8000/docs>

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Docker

```bash
cd backend
docker build -t visioncraft-backend .
docker run -p 8000:8000 -v visioncraft-models:/app/models visioncraft-backend
```

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generate/image` | Generate an image from a text prompt |
| `POST` | `/api/analyze/image` | Analyze an uploaded image with CLIP |
| `POST` | `/api/ocr` | Extract text from an uploaded image |
| `POST` | `/api/style/transfer` | Apply style transfer to an image |
| `GET` | `/api/gallery` | List all generated images |

## Roadmap

- [ ] Video generation support
- [ ] Multi-user auth & shared workspaces
- [ ] Vector search over gallery embeddings
- [ ] Real-time collaborative canvas

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.
