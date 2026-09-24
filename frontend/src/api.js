import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Predicts property price using the FastAPI backend service.
 * @param {Object} payload - Matches Data Pydantic model
 * @returns {Promise<{ predicted_price_inr: number, predicted_price_per_sqft: number, district_recognized: boolean, locality_recognized: boolean, raw_prediction?: string }>}
 */
export const predictPrice = async (payload) => {
  try {
    const response = await apiClient.post('/predict', payload);
    const data = response.data;

    // Normalize response shape in case backend returns either standard JSON or legacy string
    let predicted_price_inr = 0;
    let predicted_price_per_sqft = 0;
    let district_recognized = data?.district_recognized ?? true;
    let locality_recognized = data?.locality_recognized ?? !payload.locality_key.endsWith('|Other / not listed');

    if (typeof data?.predicted_price_inr === 'number') {
      predicted_price_inr = data.predicted_price_inr;
      predicted_price_per_sqft = typeof data?.predicted_price_per_sqft === 'number'
        ? data.predicted_price_per_sqft
        : (payload.size_sqft > 0 ? Math.round(predicted_price_inr / payload.size_sqft) : 0);
    } else if (typeof data?.prediction === 'string') {
      // Parse numeric characters from string like "Predicted price: ₹1,76,29,000"
      const cleaned = data.prediction.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        predicted_price_inr = parsed;
        predicted_price_per_sqft = payload.size_sqft > 0 ? Math.round(parsed / payload.size_sqft) : 0;
      }
    }

    return {
      predicted_price_inr,
      predicted_price_per_sqft,
      district_recognized,
      locality_recognized,
      raw_prediction: data?.prediction,
    };
  } catch (error) {
    let friendlyMessage = 'An unexpected error occurred while predicting house price.';
    let errorType = 'UNKNOWN_ERROR';
    let statusCode = null;

    if (error.response) {
      statusCode = error.response.status;
      if (statusCode === 422) {
        errorType = 'VALIDATION_ERROR';
        const details = Array.isArray(error.response.data?.detail)
          ? error.response.data.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ')
          : 'Please check your inputs. Numerical values must be integers.';
        friendlyMessage = `Validation error: ${details}`;
      } else if (statusCode >= 400 && statusCode < 500) {
        errorType = 'CLIENT_ERROR';
        friendlyMessage = `Client error (${statusCode}): ${error.response.data?.detail || 'Invalid property valuation request.'}`;
      } else if (statusCode >= 500) {
        errorType = 'SERVER_ERROR';
        friendlyMessage = `Server error (${statusCode}): The valuation model service encountered an internal error. Please try again shortly.`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorType = 'TIMEOUT_ERROR';
      friendlyMessage = 'Request timed out after 10 seconds. The prediction server took too long to respond.';
    } else if (error.request) {
      errorType = 'NETWORK_ERROR';
      friendlyMessage = `Server unavailable: Unable to reach the prediction service at ${API_BASE_URL}. Ensure Docker or uvicorn is running.`;
    } else {
      friendlyMessage = error.message || friendlyMessage;
    }

    const customError = new Error(friendlyMessage);
    customError.type = errorType;
    customError.statusCode = statusCode;
    customError.originalError = error;
    throw customError;
  }
};

export default apiClient;
