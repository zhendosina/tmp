## BloodParser – AI‑Powered Blood Test Dashboard

BloodParser is a full‑stack medical analytics dashboard built with modern web technologies. It lets users upload lab reports (PDFs or images), automatically extracts key biomarkers using Google's **Gemini** vision models, and visualizes them in an interactive, glassmorphic UI – making complex blood work both understandable and visually engaging.

This project was created as a graduate‑level portfolio piece to explore the intersection of **ML APIs**, **data visualization**, and **modern frontend engineering**.

---

## Features

- **Intelligent Report Parsing**

  - Upload **PDF** or **image (JPG/PNG)** blood test reports.
  - Backend `/api/analyze` endpoint calls **Gemini** to perform OCR and extract biomarkers (e.g. WBC, RBC, Hemoglobin, Creatinine, Glucose, Lipid profile, etc.).

- **Smart Health Insights**

  - Left panel: **animated biomarker cards** grouped by category (CBC, Metabolic Panel, Lipids, Liver/Kidney/Thyroid, Vitamins & Minerals).
  - Right panel: **contextual insights** that update as you hover or click a test, including:
    - Plain‑language definitions
    - Normal range vs. your value (with visual gauges)
    - Possible implications of high/low values
    - Related tests to investigate

- **Health Score Overview**

  - Aggregates all biomarkers into a single **Health Score** (0–100) with a radial gauge and breakdown of normal / borderline / abnormal markers.

- **AI‑Powered Chatbot**

  - A bottom **AI assistant drawer** that:
    - Opens as a slide‑up chat panel (with full‑screen mode).
    - Automatically receives context about the current test + all parsed results.
    - Lets users ask questions like “Should I be worried about my cholesterol?” or “What lifestyle changes can help?”.

- **Modern UI / UX**
  - Dark, **deep‑blue “clinical” theme**, with:
    - Frosted‑glass panels
    - Animated background gradients
    - Subtle motion and hover effects
  - Fully responsive layout: works well on desktops and laptops, with a split‑pane view on large screens and a stacked layout on smaller devices.

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
    - OCR + structured extraction of lab values
    - Answering user questions about their results

- **Tooling & Deployment**
  - Node.js 22+
  - npm (with `package-lock.json`)
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
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root

Then add your **Google Gemini API key**:

```bash
GEMINI_API_KEY=your_google_generative_ai_api_key_here
```

### 4. Start the development server

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

---

## Project Structure

```text
.
├─ app/
│  ├─ layout.tsx          # Root layout, theming, metadata, favicon links
│  ├─ page.tsx            # Main dashboard (hero + left/right panels + chat)
│  ├─ api/
│  │  ├─ analyze/route.ts # POST /api/analyze – calls Gemini for lab extraction
│  │  └─ chat/route.ts    # POST /api/chat – AI assistant with context
├─ components/
│  ├─ upload-zone.tsx     # Drag‑and‑drop uploader with animated scanning
│  ├─ results-panel.tsx   # Left panel with health score & biomarker cards
│  ├─ insights-panel.tsx  # Right panel with explanations & related tests
│  ├─ chat-drawer.tsx     # Slide‑up AI chat assistant tied to current test
│  ├─ ui/*                # Shared UI primitives (buttons, inputs, dialogs, etc.)
├─ public/
│  ├─ favicon.svg         # Activity icon with blue gradient (matches header)
│  ├─ apple-icon.svg      # App icon for mobile devices
│  └─ sample reports/     # Example blood report images/PDFs
├─ app/globals.css        # Tailwind + custom theme (cool blue clinical look)
├─ package.json           # Dependencies & scripts
└─ README.md              # You are here
```

---

## Roadmap / Ideas

- Add user accounts & persistent history of uploaded reports.
- Support more lab panels (e.g., hormones, cancer markers, genetic tests).
- Fine‑tune or chain multiple AI models for better explanations.
- Add localization (e.g., support for different languages).
