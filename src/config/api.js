// src/config/api.js
// API Configuration

// UPDATE THIS WITH YOUR ACTUAL DOMAIN
export const API_CONFIG = {
  BASE_URL: 'https://YOUR_HOSTINGER_DOMAIN.com/api', // Replace with your actual Hostinger domain
  ENDPOINTS: {
    REFERRAL: '/referral.php'
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export the referral API URL for convenience
export const REFERRAL_API_URL = getApiUrl(API_CONFIG.ENDPOINTS.REFERRAL);