# 🏡 PropValuer AI — Modern House Price Prediction Frontend

A production-quality React SaaS frontend for predicting house prices across **Andhra Pradesh** and **Telangana**, designed with a **3D Glassmorphism** aesthetic (layered gradients, floating glass panels, subtle 3D tilt, specular glare, and fluid animations).

---

## 🚀 Features

- **Cascading Location Select (`CascadingLocationSelect.jsx`)**:
  - Dependent dropdowns: **State** ➔ **District** ➔ **Locality / Neighborhood**
  - Fully populated with all Andhra Pradesh & Telangana districts and neighborhoods (~630 localities)
  - Automatic child reset upon parent change
  - Seamless support for *"Other / not listed"* with approximate calculation notice
  - Smooth Framer Motion entrance animations

- **Robust Parameter Validation (`PredictionForm.jsx`)**:
  - Validates property types, bed/bath counters, super built-up area (sq ft), furnishing, facing direction, and age
  - Dynamic inline animated error states (no broken UI / prevents invalid API calls)
  - Strict Pydantic Data model compliance with integer coercions
  - Interactive quick-preset chips (Luxury 3BHK, Gated Villa, Compact 2BHK)

- **3D Valuation Card (`ResultCard.jsx`)**:
  - Indian numbering formatting (`₹X.XX Cr` / `₹XX.XX Lakh` / exact INR)
  - 60fps Framer Motion count-up effect
  - Interactive 3D mouse tilt with dynamic specular glare
  - Approximate estimate badge with interactive tooltip if locality is unrecognized
  - One-click valuation summary copying

- **Resilient API Layer (`api.js`)**:
  - Axios client with 10s timeout and base URL configurability
  - Clear error distinction: Network errors, 422 schema validation, 4xx client errors, 5xx server issues
  - Dual response compatibility: supports both structured `{ predicted_price_inr, predicted_price_per_sqft, locality_recognized }` and legacy `{ prediction: "..." }`

---

## 🛠️ Tech Stack

- **React 18** (Vite, pure `.jsx`)
- **Framer Motion** (physics-based spring animations, layout transitions, count-ups)
- **Axios** (HTTP client with timeout and error classification)
- **Vanilla CSS** (Custom 3D glassmorphic system, layered shadows, glowing borders, no Tailwind/UI kits)

---

## ⚙️ Getting Started

### 1. Environment Configuration
Create or edit `.env` inside `frontend/`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```
