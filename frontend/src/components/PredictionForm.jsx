import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CascadingLocationSelect from './CascadingLocationSelect';
import { predictPrice } from '../api';

const PROPERTY_TYPES = [
  'Apartment',
  'Independent Builder Floor',
  'Villa',
  'Residential Plot',
  'Independent House',
];

const FURNISHING_OPTIONS = [
  'Unfurnished',
  'Semi-Furnished',
  'Furnished',
  'Not Applicable',
];

const FACING_OPTIONS = [
  'East',
  'North',
  'West',
  'South',
  'North-East',
  'South-East',
];

const INITIAL_FORM_STATE = {
  state: '',
  district: '',
  neighborhood: '',
  locality_key: '',
  property_type: 'Apartment',
  beds: 3,
  baths: 2,
  size_sqft: 1450,
  furnishing: 'Semi-Furnished',
  facing: 'East',
  age_years: 2,
};

const PredictionForm = ({ onPredictSuccess, onPredictStart, onErrorClear }) => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [touched, setTouched] = useState({});

  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'state':
        if (!value || !value.trim()) return 'State is required';
        return null;
      case 'district':
        if (!value || !value.trim()) return 'District is required';
        return null;
      case 'neighborhood':
        if (!value || !value.trim()) return 'Locality / Neighborhood is required';
        return null;
      case 'property_type':
        if (!value) return 'Property type is required';
        return null;
      case 'furnishing':
        if (!value) return 'Furnishing status is required';
        return null;
      case 'facing':
        if (!value) return 'Facing direction is required';
        return null;
      case 'beds': {
        const num = Number(value);
        if (value === '' || isNaN(num)) return 'Beds must be a number';
        if (num <= 0) return 'Beds must be greater than 0';
        if (num > 10) return 'Beds cannot exceed 10';
        if (!Number.isInteger(num)) return 'Beds must be a whole number';
        return null;
      }
      case 'baths': {
        const num = Number(value);
        if (value === '' || isNaN(num)) return 'Baths must be a number';
        if (num <= 0) return 'Baths must be greater than 0';
        if (num > 10) return 'Baths cannot exceed 10';
        if (!Number.isInteger(num)) return 'Baths must be a whole number';
        return null;
      }
      case 'size_sqft': {
        const num = Number(value);
        if (value === '' || isNaN(num)) return 'Size in sq ft is required';
        if (num <= 0) return 'Size must be greater than 0 sq ft';
        if (num > 20000) return 'Size cannot exceed 20,000 sq ft';
        return null;
      }
      case 'age_years': {
        const num = Number(value);
        if (value === '' || isNaN(num)) return 'Property age is required';
        if (num < 0) return 'Age cannot be negative';
        if (num > 100) return 'Age cannot exceed 100 years';
        return null;
      }
      default:
        return null;
    }
  };

  const validateAll = (dataToValidate = formData) => {
    const newErrors = {};
    const fieldsToValidate = [
      'state',
      'district',
      'neighborhood',
      'property_type',
      'furnishing',
      'facing',
      'beds',
      'baths',
      'size_sqft',
      'age_years',
    ];

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, dataToValidate[field], dataToValidate);
      if (err) newErrors[field] = err;
    });

    return newErrors;
  };

  const handleLocationChange = ({ state, district, neighborhood, locality_key }) => {
    const updated = {
      ...formData,
      state,
      district,
      neighborhood,
      locality_key,
    };
    setFormData(updated);

    // Validate location fields and clear errors dynamically
    setErrors((prev) => {
      const copy = { ...prev };
      if (state) delete copy.state;
      if (district) delete copy.district;
      if (neighborhood) delete copy.neighborhood;
      return copy;
    });
    setApiError(null);
    if (onErrorClear) onErrorClear();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    if (touched[name]) {
      const err = validateField(name, value, updated);
      setErrors((prev) => ({
        ...prev,
        [name]: err || undefined,
      }));
    }
    setApiError(null);
    if (onErrorClear) onErrorClear();
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value, formData);
    setErrors((prev) => ({
      ...prev,
      [name]: err || undefined,
    }));
  };

  const isFormValid = () => {
    const currentErrors = validateAll(formData);
    return Object.keys(currentErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    // Mark all as touched
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const validationErrors = validateAll(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Shake or focus
      return;
    }

    // Build critical payload strictly matching backend Pydantic Data model
    const locality_key = formData.locality_key || `${formData.district}|${formData.neighborhood}`;
    const payload = {
      state: String(formData.state),
      district: String(formData.district),
      locality_key: String(locality_key),
      property_type: String(formData.property_type),
      beds: Number(formData.beds),
      baths: Number(formData.baths),
      size_sqft: Number(formData.size_sqft),
      furnishing: String(formData.furnishing),
      facing: String(formData.facing),
      age_years: Number(formData.age_years),
    };

    setIsSubmitting(true);
    if (onPredictStart) onPredictStart();

    try {
      const result = await predictPrice(payload);
      if (onPredictSuccess) {
        onPredictSuccess(result, payload);
      }
    } catch (err) {
      setApiError(err.message || 'Valuation service encountered an unexpected error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset,
    }));
    setErrors({});
    setApiError(null);
  };

  return (
    <div className="glass-panel form-card-3d">
      <div className="form-header-bar">
        <div className="form-header-title">
          <div className="header-icon-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <div>
            <h2 className="form-heading">Property Parameter Matrix</h2>
            <p className="form-subheading">Enter architectural and spatial parameters for machine learning appraisal</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="preset-chips">
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleQuickPreset({ property_type: 'Apartment', beds: 3, baths: 3, size_sqft: 1850, furnishing: 'Semi-Furnished', facing: 'East', age_years: 1 })}
          >
            ✦ Luxury 3BHK
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleQuickPreset({ property_type: 'Villa', beds: 4, baths: 4, size_sqft: 3200, furnishing: 'Furnished', facing: 'North', age_years: 0 })}
          >
            ✦ Gated Villa
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => handleQuickPreset({ property_type: 'Apartment', beds: 2, baths: 2, size_sqft: 1100, furnishing: 'Unfurnished', facing: 'East', age_years: 5 })}
          >
            ✦ Compact 2BHK
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="prediction-form-body">
        {/* SECTION 1: CASCADING LOCATION */}
        <div className="form-section">
          <div className="section-label">
            <span className="section-step">01</span>
            <span className="section-title">Geographic Coordinates</span>
          </div>
          <CascadingLocationSelect
            values={{
              state: formData.state,
              district: formData.district,
              neighborhood: formData.neighborhood,
            }}
            onChange={handleLocationChange}
            errors={{
              state: touched.state ? errors.state : undefined,
              district: touched.district ? errors.district : undefined,
              neighborhood: touched.neighborhood ? errors.neighborhood : undefined,
            }}
            disabled={isSubmitting}
          />
        </div>

        {/* SECTION 2: PROPERTY CONFIGURATION */}
        <div className="form-section">
          <div className="section-label">
            <span className="section-step">02</span>
            <span className="section-title">Spatial & Layout Attributes</span>
          </div>

          <div className="attributes-grid">
            {/* Property Type */}
            <div className="form-group">
              <label htmlFor="property_type" className="field-label">
                Property Type <span className="required-star">*</span>
              </label>
              <div className={`select-wrapper ${touched.property_type && errors.property_type ? 'has-error' : ''}`}>
                <select
                  id="property_type"
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className="glass-input glass-select"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="select-arrow" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {touched.property_type && errors.property_type && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.property_type}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Size (Sq. Ft.) */}
            <div className="form-group">
              <label htmlFor="size_sqft" className="field-label">
                Super Built-up Area <span className="required-star">*</span>
                <span className="field-unit">(sq. ft)</span>
              </label>
              <div className={`input-icon-wrapper ${touched.size_sqft && errors.size_sqft ? 'has-error' : ''}`}>
                <input
                  id="size_sqft"
                  type="number"
                  name="size_sqft"
                  min="1"
                  max="20000"
                  step="1"
                  value={formData.size_sqft}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="e.g. 1500"
                  className="glass-input has-unit"
                />
                <span className="unit-badge">sq ft</span>
              </div>
              <AnimatePresence>
                {touched.size_sqft && errors.size_sqft && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.size_sqft}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Bedrooms */}
            <div className="form-group">
              <label htmlFor="beds" className="field-label">
                Bedrooms (BHK) <span className="required-star">*</span>
              </label>
              <div className={`input-stepper-wrapper ${touched.beds && errors.beds ? 'has-error' : ''}`}>
                <input
                  id="beds"
                  type="number"
                  name="beds"
                  min="1"
                  max="10"
                  value={formData.beds}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="3"
                  className="glass-input"
                />
                <div className="stepper-controls">
                  <button
                    type="button"
                    tabIndex="-1"
                    disabled={isSubmitting || Number(formData.beds) <= 1}
                    onClick={() => {
                      const next = Math.max(1, Number(formData.beds || 1) - 1);
                      setFormData({ ...formData, beds: next });
                    }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    tabIndex="-1"
                    disabled={isSubmitting || Number(formData.beds) >= 10}
                    onClick={() => {
                      const next = Math.min(10, Number(formData.beds || 0) + 1);
                      setFormData({ ...formData, beds: next });
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {touched.beds && errors.beds && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.beds}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Bathrooms */}
            <div className="form-group">
              <label htmlFor="baths" className="field-label">
                Bathrooms <span className="required-star">*</span>
              </label>
              <div className={`input-stepper-wrapper ${touched.baths && errors.baths ? 'has-error' : ''}`}>
                <input
                  id="baths"
                  type="number"
                  name="baths"
                  min="1"
                  max="10"
                  value={formData.baths}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="2"
                  className="glass-input"
                />
                <div className="stepper-controls">
                  <button
                    type="button"
                    tabIndex="-1"
                    disabled={isSubmitting || Number(formData.baths) <= 1}
                    onClick={() => {
                      const next = Math.max(1, Number(formData.baths || 1) - 1);
                      setFormData({ ...formData, baths: next });
                    }}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    tabIndex="-1"
                    disabled={isSubmitting || Number(formData.baths) >= 10}
                    onClick={() => {
                      const next = Math.min(10, Number(formData.baths || 0) + 1);
                      setFormData({ ...formData, baths: next });
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
              <AnimatePresence>
                {touched.baths && errors.baths && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.baths}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Furnishing */}
            <div className="form-group">
              <label htmlFor="furnishing" className="field-label">
                Furnishing <span className="required-star">*</span>
              </label>
              <div className={`select-wrapper ${touched.furnishing && errors.furnishing ? 'has-error' : ''}`}>
                <select
                  id="furnishing"
                  name="furnishing"
                  value={formData.furnishing}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className="glass-input glass-select"
                >
                  {FURNISHING_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <div className="select-arrow" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {touched.furnishing && errors.furnishing && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.furnishing}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Facing Direction */}
            <div className="form-group">
              <label htmlFor="facing" className="field-label">
                Facing Direction <span className="required-star">*</span>
              </label>
              <div className={`select-wrapper ${touched.facing && errors.facing ? 'has-error' : ''}`}>
                <select
                  id="facing"
                  name="facing"
                  value={formData.facing}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className="glass-input glass-select"
                >
                  {FACING_OPTIONS.map((fc) => (
                    <option key={fc} value={fc}>
                      {fc}
                    </option>
                  ))}
                </select>
                <div className="select-arrow" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>
              <AnimatePresence>
                {touched.facing && errors.facing && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.facing}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Age of Property */}
            <div className="form-group">
              <label htmlFor="age_years" className="field-label">
                Property Age <span className="required-star">*</span>
                <span className="field-unit">(years)</span>
              </label>
              <div className={`input-icon-wrapper ${touched.age_years && errors.age_years ? 'has-error' : ''}`}>
                <input
                  id="age_years"
                  type="number"
                  name="age_years"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.age_years}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  placeholder="0 (New) or years"
                  className="glass-input has-unit"
                />
                <span className="unit-badge">yrs</span>
              </div>
              <AnimatePresence>
                {touched.age_years && errors.age_years && (
                  <motion.span
                    className="field-error-message"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -4, height: 0 }}
                  >
                    {errors.age_years}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* API ERROR BANNER */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              className="api-error-card"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <div className="error-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div className="error-content">
                <strong>Prediction Failed</strong>
                <p>{apiError}</p>
              </div>
              <button
                type="button"
                className="error-dismiss"
                onClick={() => setApiError(null)}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM ACTIONS */}
        <div className="form-submit-row">
          <div className="contract-guarantee">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span>Strict Pydantic Schema Compliant (Log-expm1 Regressor)</span>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting || !formData.state || !formData.district || !formData.neighborhood}
            className={`submit-3d-btn ${isSubmitting ? 'is-loading' : ''}`}
            whileHover={!isSubmitting ? { scale: 1.02, translateY: -2 } : {}}
            whileTap={!isSubmitting ? { scale: 0.98, translateY: 1 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {isSubmitting ? (
              <span className="btn-content">
                <span className="spinner-glow" />
                <span className="spinner-ring" />
                Calculating Valuation...
              </span>
            ) : (
              <span className="btn-content">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
                Run AI Valuation Prediction
              </span>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
};

export default PredictionForm;
