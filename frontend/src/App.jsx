import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PredictionForm from './components/PredictionForm';
import ResultCard from './components/ResultCard';
import './App.css';

function App() {
  const [predictionResult, setPredictionResult] = useState(null);
  const [requestPayload, setRequestPayload] = useState(null);
  const resultRef = useRef(null);

  const handlePredictSuccess = (result, payload) => {
    setPredictionResult(result);
    setRequestPayload(payload);

    // Smooth scroll down to result card
    setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const handleReset = () => {
    setPredictionResult(null);
    setRequestPayload(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Dynamic Background Mesh Orbs */}
      <div className="bg-glow bg-glow-1" aria-hidden="true" />
      <div className="bg-glow bg-glow-2" aria-hidden="true" />
      <div className="bg-glow bg-glow-3" aria-hidden="true" />
      <div className="bg-grid-pattern" aria-hidden="true" />

      {/* HEADER / NAVIGATION */}
      <header className="navbar-container">
        <div className="navbar-content">
          <div className="brand-logo">
            <div className="logo-3d-box">
              <span className="logo-icon">▲</span>
            </div>
            <div className="brand-text">
              <span className="brand-name">PropValuer<span className="brand-dot">.ai</span></span>
              <span className="brand-sub">AP & Telangana Real Estate Intelligence</span>
            </div>
          </div>

          <div className="nav-badges">
            <div className="status-indicator-pill">
              <span className="online-indicator"></span>
              <span className="indicator-text">API: <code>POST /predict</code></span>
            </div>
            <div className="model-chip">
              <span className="model-name">Linear Regression</span>
              <span className="model-score">R² 0.928</span>
            </div>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="main-content">
        <section className="hero-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-badge-wrapper"
          >
            <span className="hero-pill">
              <span className="hero-pill-sparkle">✨</span>
              Machine Learning Valuation Engine for South India
            </span>
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            Instant House Price Prediction <br />
            <span className="gradient-text">with Deep Spatial Intelligence</span>
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
          >
            Accurate property appraisal calibrated across 61 districts and 630+ localities in
            <strong> Andhra Pradesh</strong> and <strong>Telangana</strong>. Powered by target-encoded
            locality keys and log-transformed regression.
          </motion.p>

          <motion.div
            className="stats-strip"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="stat-item">
              <span className="stat-number">61</span>
              <span className="stat-label">Districts Covered</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">630+</span>
              <span className="stat-label">Localities Indexed</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">92.8%</span>
              <span className="stat-label">Model Accuracy (R²)</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">&lt; 100ms</span>
              <span className="stat-label">Inference Latency</span>
            </div>
          </motion.div>
        </section>

        {/* PREDICTION FORM */}
        <section className="form-workspace-section">
          <PredictionForm
            onPredictSuccess={handlePredictSuccess}
            onPredictStart={() => setPredictionResult(null)}
          />
        </section>

        {/* VALUATION RESULT CARD */}
        <div ref={resultRef} className="result-anchor-wrapper">
          <AnimatePresence mode="wait">
            {predictionResult && (
              <ResultCard
                key="prediction-result"
                predictionResult={predictionResult}
                requestPayload={requestPayload}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </div>

        {/* FEATURE HIGHLIGHTS GRID */}
        <section className="highlights-section">
          <div className="highlight-card">
            <div className="highlight-icon">🎯</div>
            <h3>Compound Locality Keys</h3>
            <p>
              Preempts naming collisions (e.g. "Balaji Nagar" across multiple districts) by synthesizing
              <code>district|neighborhood</code> tokens client-side before target encoding.
            </p>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">📈</div>
            <h3>Log-Normal Price Scaling</h3>
            <p>
              Uses <code>np.log1p</code> and <code>np.expm1</code> transforms on price targets and property
              dimensions, preventing high-end luxury skew from distorting standard residential valuations.
            </p>
          </div>

          <div className="highlight-card">
            <div className="highlight-icon">⚡</div>
            <h3>Fault-Tolerant Fallback</h3>
            <p>
              Unlisted localities smoothly resolve to district-level empirical baselines with
              transparent UI warnings so you never get a blank screen or broken calculation.
            </p>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-left">
            <span className="footer-brand">PropValuer.ai</span> — Production House Price Prediction Platform
          </div>
          <div className="footer-right">
            <span>FastAPI + Vite + Framer Motion</span>
            <span className="footer-dot">•</span>
            <span>Docker Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
