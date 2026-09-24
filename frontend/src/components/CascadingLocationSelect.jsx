import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import locationsData from '../locations.json';

const CascadingLocationSelect = ({ values, onChange, errors = {}, disabled = false }) => {
  const { state = '', district = '', neighborhood = '' } = values;

  // Available states sorted alphabetically
  const stateOptions = useMemo(() => {
    return Object.keys(locationsData).sort();
  }, []);

  // Available districts based on selected state
  const districtOptions = useMemo(() => {
    if (!state || !locationsData[state]) return [];
    return Object.keys(locationsData[state]).sort();
  }, [state]);

  // Available neighborhoods based on selected state and district
  const neighborhoodOptions = useMemo(() => {
    if (!state || !district || !locationsData[state]?.[district]) return [];
    const list = [...locationsData[state][district]].sort();
    // Always append "Other / not listed" as required by specification
    return [...list, 'Other / not listed'];
  }, [state, district]);

  const handleStateChange = (e) => {
    const newState = e.target.value;
    onChange({
      state: newState,
      district: '',
      neighborhood: '',
      locality_key: '',
    });
  };

  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    onChange({
      state,
      district: newDistrict,
      neighborhood: '',
      locality_key: '',
    });
  };

  const handleNeighborhoodChange = (e) => {
    const newNeighborhood = e.target.value;
    const locality_key = newNeighborhood ? `${district}|${newNeighborhood}` : '';
    onChange({
      state,
      district,
      neighborhood: newNeighborhood,
      locality_key,
    });
  };

  const isOtherSelected = neighborhood === 'Other / not listed';

  return (
    <div className="cascading-select-container">
      <div className="location-grid">
        {/* 1. STATE SELECT */}
        <motion.div
          className="form-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label htmlFor="location-state" className="field-label">
            State <span className="required-star">*</span>
          </label>
          <div className={`select-wrapper ${errors.state ? 'has-error' : ''}`}>
            <select
              id="location-state"
              name="state"
              value={state}
              onChange={handleStateChange}
              disabled={disabled}
              className="glass-input glass-select"
            >
              <option value="" disabled>Select State</option>
              {stateOptions.map((st) => (
                <option key={st} value={st}>
                  {st}
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
            {errors.state && (
              <motion.span
                className="field-error-message"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.state}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 2. DISTRICT SELECT */}
        <motion.div
          className="form-group"
          initial={{ opacity: 0.5, y: 10 }}
          animate={{
            opacity: state ? 1 : 0.65,
            y: 0,
            scale: state ? 1 : 0.99,
          }}
          transition={{ duration: 0.3 }}
        >
          <label htmlFor="location-district" className="field-label">
            District <span className="required-star">*</span>
            {!state && <span className="field-hint-inline">(Choose state first)</span>}
          </label>
          <div className={`select-wrapper ${!state ? 'is-disabled' : ''} ${errors.district ? 'has-error' : ''}`}>
            <select
              id="location-district"
              name="district"
              value={district}
              onChange={handleDistrictChange}
              disabled={disabled || !state}
              className="glass-input glass-select"
            >
              <option value="" disabled>
                {state ? 'Select District' : 'Awaiting state...'}
              </option>
              {districtOptions.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
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
            {errors.district && (
              <motion.span
                className="field-error-message"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.district}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 3. NEIGHBORHOOD SELECT */}
        <motion.div
          className="form-group"
          initial={{ opacity: 0.5, y: 10 }}
          animate={{
            opacity: district ? 1 : 0.65,
            y: 0,
            scale: district ? 1 : 0.99,
          }}
          transition={{ duration: 0.3 }}
        >
          <label htmlFor="location-neighborhood" className="field-label">
            Locality / Neighborhood <span className="required-star">*</span>
            {!district && <span className="field-hint-inline">(Choose district first)</span>}
          </label>
          <div className={`select-wrapper ${!district ? 'is-disabled' : ''} ${errors.neighborhood ? 'has-error' : ''}`}>
            <select
              id="location-neighborhood"
              name="neighborhood"
              value={neighborhood}
              onChange={handleNeighborhoodChange}
              disabled={disabled || !district}
              className="glass-input glass-select"
            >
              <option value="" disabled>
                {district ? 'Select Locality' : 'Awaiting district...'}
              </option>
              {neighborhoodOptions.map((nh) => (
                <option key={nh} value={nh}>
                  {nh}
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
            {errors.neighborhood && (
              <motion.span
                className="field-error-message"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {errors.neighborhood}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Note for "Other / not listed" */}
      <AnimatePresence>
        {isOtherSelected && (
          <motion.div
            className="approximate-notice"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="notice-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="notice-text">
              <strong>Locality note:</strong> You selected <em>"Other / not listed"</em>. Valuation will use the <strong>{district}</strong> district median baseline and will be an approximate estimate.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CascadingLocationSelect;
