// src/utils/referralManager.js
// Simple address validation function
const isValidAddress = (address) => {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Referral Manager - Handles referral code to address mapping using PHP API
 */

// Import API configuration
import { REFERRAL_API_URL } from '../config/api';

// Storage keys
const CURRENT_REFERRER_KEY = 'sada_current_referrer';
const REFERRAL_CODES_KEY = 'sada_referral_codes'; // Fallback storage

// Check if we're in development mode (API not available)
const isDevelopmentMode = () => {
  return REFERRAL_API_URL.includes('yourdomain.com') || REFERRAL_API_URL.includes('localhost');
};

/**
 * Fallback localStorage functions for development
 */
const getLocalReferralCodes = () => {
  try {
    const codes = localStorage.getItem(REFERRAL_CODES_KEY);
    return codes ? JSON.parse(codes) : {};
  } catch (error) {
    console.warn('Failed to get local referral codes:', error);
    return {};
  }
};

const setLocalReferralCodes = (codes) => {
  try {
    localStorage.setItem(REFERRAL_CODES_KEY, JSON.stringify(codes));
  } catch (error) {
    console.warn('Failed to set local referral codes:', error);
  }
};

const addLocalReferralCode = (code, address) => {
  const codes = getLocalReferralCodes();
  codes[code.toUpperCase()] = address.toLowerCase();
  setLocalReferralCodes(codes);
};

const getLocalReferrerAddress = (code) => {
  const codes = getLocalReferralCodes();
  return codes[code.toUpperCase()] || null;
};

const getLocalReferralCodeForAddress = (address) => {
  const codes = getLocalReferralCodes();
  const normalizedAddress = address.toLowerCase();
  
  for (const [code, addr] of Object.entries(codes)) {
    if (addr === normalizedAddress) {
      return code;
    }
  }
  return null;
};

/**
 * API Helper Functions
 */
const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

/**
 * Initialize the referral manager
 */
export const initializeReferralManager = () => {
  try {
    console.log('Referral manager initialized with API backend');
  } catch (error) {
    console.error('Error initializing referral manager:', error);
  }
};

/**
 * Add a referral code mapping
 * @param {string} code - The referral code
 * @param {string} address - The Ethereum address
 */
export const addReferralCode = async (code, address) => {
  if (!code || !address) {
    throw new Error('Both code and address are required');
  }
  
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  
  // Use localStorage fallback in development mode
  if (isDevelopmentMode()) {
    try {
      addLocalReferralCode(code, address);
      console.log('Referral code added to localStorage:', code, '->', address);
      return { success: true, message: 'Referral code added successfully (localStorage)' };
    } catch (error) {
      console.error('Failed to add referral code to localStorage:', error);
      throw error;
    }
  }
  
  try {
    const response = await apiRequest(REFERRAL_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'add_referral',
        code: code.toUpperCase(),
        address: address.toLowerCase()
      })
    });
    
    console.log('Referral code added successfully:', response);
    return response;
  } catch (error) {
    console.error('Failed to add referral code:', error);
    throw error;
  }
};

/**
 * Get Ethereum address from referral code
 * @param {string} code - The referral code
 * @returns {string|null} - The Ethereum address or null if not found
 */
export const getReferrerAddress = async (code) => {
  if (!code) return null;
  
  // Use localStorage fallback in development mode
  if (isDevelopmentMode()) {
    try {
      const address = getLocalReferrerAddress(code);
      console.log('Got referrer address from localStorage:', code, '->', address);
      return address;
    } catch (error) {
      console.error('Failed to get referrer address from localStorage:', error);
      return null;
    }
  }
  
  try {
    const response = await apiRequest(`${REFERRAL_API_URL}?action=get_referrer&code=${encodeURIComponent(code.toUpperCase())}`);
    return response.address || null;
  } catch (error) {
    console.error('Failed to get referrer address:', error);
    return null;
  }
};

/**
 * Generate a referral code for an address (simple implementation)
 * @param {string} address - The Ethereum address
 * @returns {string} - Generated referral code
 */
export const generateReferralCode = (address) => {
  if (!isValidAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  
  // Simple code generation - in production, use a more sophisticated method
  const hash = address.slice(2, 14).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${hash}${timestamp}`;
};

/**
 * Extract referral code from URL
 * @param {string} url - The URL to parse (optional, defaults to current URL)
 * @returns {string|null} - The referral code or null if not found
 */
export const extractReferralCodeFromURL = (url = window.location.href) => {
  try {
    const urlObj = new URL(url);
    const refCode = urlObj.searchParams.get('ref');
    return refCode ? refCode.trim() : null;
  } catch (error) {
    console.warn('Failed to parse URL for referral code:', error);
    return null;
  }
};

/**
 * Set current referrer address in localStorage
 * @param {string} address - The referrer address
 */
export const setCurrentReferrer = (address) => {
  if (address && !isValidAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  
  if (address) {
    localStorage.setItem(CURRENT_REFERRER_KEY, address.toLowerCase());
  } else {
    localStorage.removeItem(CURRENT_REFERRER_KEY);
  }
};

/**
 * Get current referrer address from localStorage
 * @returns {string|null} - The referrer address or null
 */
export const getCurrentReferrer = () => {
  try {
    const address = localStorage.getItem(CURRENT_REFERRER_KEY);
    return address && isValidAddress(address) ? address : null;
  } catch (error) {
    console.warn('Failed to get current referrer:', error);
    return null;
  }
};

/**
 * Process referral from URL and set current referrer
 * This should be called when the app loads
 */
export const processReferralFromURL = async () => {
  try {
    const refCode = extractReferralCodeFromURL();
    
    if (refCode) {
      const referrerAddress = await getReferrerAddress(refCode);
      
      if (referrerAddress) {
        setCurrentReferrer(referrerAddress);
        console.log(`Referral processed: ${refCode} -> ${referrerAddress}`);
        return referrerAddress;
      } else {
        console.warn(`Unknown referral code: ${refCode}`);
      }
    }
    
    return getCurrentReferrer();
  } catch (error) {
    console.error('Error processing referral from URL:', error);
    return null;
  }
};

/**
 * Get referrer address for purchase (with fallback to zero address)
 * @returns {string} - Referrer address or zero address
 */
export const getReferrerForPurchase = () => {
  const referrer = getCurrentReferrer();
  return referrer || '0x0000000000000000000000000000000000000000';
};

/**
 * Clear current referrer
 */
export const clearCurrentReferrer = () => {
  setCurrentReferrer(null);
};

/**
 * Check if a referral code exists
 * @param {string} code - The referral code to check
 * @returns {boolean} - True if code exists
 */
export const hasReferralCode = async (code) => {
  if (!code) return false;
  
  try {
    const address = await getReferrerAddress(code);
    return address !== null;
  } catch (error) {
    console.error('Failed to check referral code:', error);
    return false;
  }
};

/**
 * Get referral code for a specific address (reverse lookup)
 * @param {string} address - The Ethereum address
 * @returns {string|null} - The referral code or null if not found
 */
export const getReferralCodeForAddress = async (address) => {
  if (!address) return null;
  
  // Use localStorage fallback in development mode
  if (isDevelopmentMode()) {
    try {
      const code = getLocalReferralCodeForAddress(address);
      console.log('Got referral code from localStorage:', address, '->', code);
      return code;
    } catch (error) {
      console.error('Failed to get referral code from localStorage:', error);
      return null;
    }
  }
  
  try {
    const response = await apiRequest(`${REFERRAL_API_URL}?action=get_code_by_address&address=${encodeURIComponent(address.toLowerCase())}`);
    return response.code || null;
  } catch (error) {
    console.error('Failed to get referral code for address:', error);
    return null;
  }
};

/**
 * Generate referral link with code
 * @param {string} code - The referral code
 * @returns {string} - Complete referral URL
 */
export const generateReferralLink = (code) => {
  if (!code) return null;
  
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?ref=${code}`;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

// Initialize when module loads
initializeReferralManager();