## BloodParser – AI‑Powered Medical Report Dashboard

BloodParser is a full‑stack medical analytics dashboard that processes various types of lab reports through an AI‑powered OCR and analysis pipeline. Users can upload PDFs or images of blood test results, and the system automatically extracts, categorizes, and visualizes biomarkers in an interactive interface. The project supports multiple test panels including Complete Blood Count (CBC), Metabolic Panels, Lipid Profiles, Liver/Kidney Function, Thyroid Function, Coagulation Profiles, and more.

The primary processing pipeline uses **GLM‑OCR** (a specialized document OCR model) for text extraction, followed by **Gemini** for structured data extraction. This approach provides better accuracy for complex medical reports with tables and mixed layouts. For broader accessibility, the system also supports a fallback mode using **Gemini Vision** directly, which works on Google's free tier. The OCR mode is passphrase‑protected to manage API usage costs while maintaining open access to the core functionality.

---

## Features

- **Comprehensive Report Support**

  - Parses various medical test types: Complete Blood Count (CBC), Comprehensive Metabolic Panel (CMP), Lipid Profile, Liver Function Tests (LFT), Kidney Function Tests (KFT), Thyroid Profile, Coagulation Profile, Electrolytes, and more.
  - Accepts **PDF** or **image formats** (JPG, PNG) up to 10MB.
  - Dual processing pipelines:
    - **OCR mode** (primary): GLM‑OCR for document parsing → Gemini for extraction (passphrase‑protected to manage API costs, includes retry logic for reliability).
    - **Vision mode** (fallback): Direct Gemini Vision analysis (free tier, works out‑of‑the‑box).
  - Automatically categorizes tests into logical groups (hematology, chemistry, lipids, etc.).

- **Smart Health Insights**

  - Left panel: **animated biomarker cards** grouped by category (CBC, Metabolic Panel, Lipids, Liver/Kidney/Thyroid, Vitamins & Minerals).
  - Right panel: **contextual insights** that update as you hover or click a test, including:
    - Plain‑language definitions
    - Normal range vs. your value (with visual gauges)
    - Possible implications of high/low values
    - Related tests to investigate

- **Health Score Overview**

  - Aggregates all biomarkers into a single **Health Score** (0–100) with a radial gauge and breakdown of normal / borderline / abnormal markers.

- **Context‑Aware AI Assistant**

  - Slide‑up chat interface with full‑screen mode for detailed discussions.
  - Automatically receives full test context (all parsed results + currently selected biomarker).
  - Answers questions about specific tests, correlations between markers, and general health implications.
  - Provides patient‑friendly explanations while recommending professional medical consultation.
  - Maintains conversation history within the session.

- **Modern UI / UX**
  - Dark, deep‑blue "clinical" theme with frosted‑glass panels and animated gradients.
  - Fully responsive layout: split‑pane view on large screens, stacked layout on mobile.
  - Subtle motion and hover effects for enhanced interactivity.

---

## Tech Stack

- **Frontend**

  - [Next.js 16](https://nextjs.org/) (App Router)
  - [React 19](https://react.dev/)
  - [Tailwind CSS 4](https://tailwindcss.com/)
  - [Framer Motion](https://www.framer.com/motion/) for animations
  - [Radix UI](https://www.radix-ui.com/) primitives (dialogs, tooltips, menus)
  - [lucide-react](https://lucide.dev/) for icons
  - [react-markdown](https://github.com/remarkjs/react-markdown) + `remark-gfm` for rich text in chat responses

- **Backend / AI**

  - [Next.js API Routes] – `app/api/*`
  - [@google/generative-ai](https://github.com/google-gemini/generative-ai-js) SDK calling Gemini models for:
    - Structured extraction of lab values (from OCR text or direct vision input)
    - Answering user questions about their results
  - [GLM‑OCR (Z.ai)](https://huggingface.co/zai-org/GLM-OCR) via Z.ai `layout_parsing` API for optional passphrase‑gated OCR pipeline with automatic retry logic

- **Tooling & Deployment**
  - Node.js 22+
  - pnpm for package management
  - [Vercel](https://vercel.com/) for hosting & CI/CD

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/garg-tejas/blood-report-parser.git
cd blood-report-parser
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the project root with the following:

```bash
# Required - Google Gemini API key (works on free tier)
GEMINI_API_KEY=your_google_generative_ai_api_key_here

# Recommended - For OCR mode (primary pipeline)
ZAI_API_KEY=your_zai_api_key_here
OCR_PASSPHRASE="your-secret-phrase"

# Optional - Model configuration (defaults shown)
GEMINI_TEXT_MODEL=gemini-flash-latest
GEMINI_VISION_MODEL=gemini-flash-latest
GEMINI_CHAT_MODEL=gemini-flash-latest
```

**Note**: The app works with just `GEMINI_API_KEY` for quick setup. For better accuracy with complex reports, add `ZAI_API_KEY` and `OCR_PASSPHRASE` to enable the OCR pipeline. The passphrase protects access to the paid OCR API while keeping the free vision mode openly available. Click "Activate secure mode" in the header and enter your passphrase to unlock OCR processing.

### 4. Start the development server

```bash
pnpm dev
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure

```text
.
├─ app/
│  ├─ layout.tsx          # Root layout, theming, metadata
│  ├─ page.tsx            # Main dashboard with upload + results + chat
│  ├─ api/
│  │  ├─ analyze/route.ts # POST /api/analyze – dual OCR pipeline (Gemini Vision or GLM‑OCR)
│  │  ├─ chat/route.ts    # POST /api/chat – context‑aware AI assistant
│  │  └─ verify-ocr/      # POST /api/verify-ocr – passphrase verification with rate limiting
│  └─ globals.css         # Tailwind + custom theme
├─ components/
│  ├─ upload-zone.tsx     # Drag‑and‑drop uploader with processing animation
│  ├─ results-panel.tsx   # Left panel: health score + biomarker cards
│  ├─ insights-panel.tsx  # Right panel: contextual explanations
│  ├─ chat-drawer.tsx     # Slide‑up AI chat interface
│  ├─ ocr-unlock-dialog.tsx  # Secure mode passphrase dialog
│  └─ ui/*                # Shared UI primitives (buttons, inputs, dialogs, etc.)
├─ lib/
│  ├─ glm-ocr.ts          # GLM‑OCR API client with retry logic
│  └─ utils.ts            # Utility functions
├─ sample reports/        # Example blood test images for testing
├─ public/                # Static assets (favicon, icons)
└─ README.md              # You are here
```

---

## Supported Report Types

The system has been tested with the following lab panels (sample reports included in `sample reports/`):

- Complete Blood Count (CBC) with Absolute Count
- CBC with ESR (Erythrocyte Sedimentation Rate)
- Comprehensive Metabolic Panel (CMP)
- Lipid Profile
- Liver Function Tests (LFT)
- Kidney Function Tests (KFT)
- Thyroid Profile (T3, T4, TSH)
- Thyroid Antibodies
- Coagulation Profile
- Electrolytes Panel
- TORCH Profile
- Dengue Fever Panel

The AI extraction is flexible and can handle variations in report layouts and naming conventions.

---

## Architecture Notes

### Dual Processing Pipeline

1. **OCR Mode** (primary, passphrase‑protected):

   - Image → GLM‑OCR (specialized document parsing, handles complex layouts/HTML)
   - OCR markdown → Gemini text model (structured extraction)
   - Includes automatic retry logic (3 attempts with exponential backoff)
   - Superior accuracy for complex medical reports with tables and mixed content
   - Uses paid Z.ai API credits

2. **Vision Mode** (fallback):
   - Direct image → Gemini multimodal model
   - Fast, single API call
   - Works on Google's free tier
   - Good baseline performance for standard reports

### Rate Limiting

- Passphrase verification endpoint (`/api/verify-ocr`) implements per‑IP rate limiting
- 60‑second cooldown after failed attempts
- Countdown timer displayed to users

---

## Future Improvements

- Add user accounts with persistent history of uploaded reports
- Support additional test panels (hormones, tumor markers, genetic tests)
- Trend analysis across multiple uploads (track biomarker changes over time)
- Export reports to PDF with annotations
- Multi‑language support for international lab reports
