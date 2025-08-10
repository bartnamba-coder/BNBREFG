// src/services/mockAttestationService.js
// Mock attestation service for local testing using browser localStorage

import { ethers } from 'ethers';

// Mock private key for testing (DO NOT USE IN PRODUCTION)
const MOCK_PRIVATE_KEY = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const mockWallet = new ethers.Wallet(MOCK_PRIVATE_KEY);

/**
 * Initialize the mock storage
 */
export const initMockStorage = () => {
  if (!localStorage.getItem('mockReferralCounts')) {
    localStorage.setItem('mockReferralCounts', JSON.stringify({}));
  }
  
  if (!localStorage.getItem('mockReferralPurchases')) {
    localStorage.setItem('mockReferralPurchases', JSON.stringify([]));
  }
  
  console.log('Mock attestation storage initialized');
};

/**
 * Get the global referral count for a referrer
 * 
 * @param {string} referrer The referrer address
 * @returns {number} The global referral count
 */
export const getGlobalReferralCount = (referrer) => {
  const counts = JSON.parse(localStorage.getItem('mockReferralCounts') || '{}');
  return counts[referrer.toLowerCase()] || 0;
};

/**
 * Increment the global referral count for a referrer
 * 
 * @param {string} referrer The referrer address
 * @returns {number} The new count
 */
export const incrementGlobalReferralCount = (referrer) => {
  const counts = JSON.parse(localStorage.getItem('mockReferralCounts') || '{}');
  const lowerRef = referrer.toLowerCase();
  
  const newCount = (counts[lowerRef] || 0) + 1;
  counts[lowerRef] = newCount;
  
  localStorage.setItem('mockReferralCounts', JSON.stringify(counts));
  return newCount;
};

/**
 * Record a mock purchase
 * 
 * @param {string} referrer The referrer address
 * @param {string} buyer The buyer address
 * @param {string} chainId The chain ID
 * @param {string} amount The purchase amount
 */
export const recordMockPurchase = (referrer, buyer, chainId, amount) => {
  const purchases = JSON.parse(localStorage.getItem('mockReferralPurchases') || '[]');
  
  purchases.push({
    referrer: referrer.toLowerCase(),
    buyer: buyer.toLowerCase(),
    chainId,
    amount,
    timestamp: Date.now()
  });
  
  localStorage.setItem('mockReferralPurchases', JSON.stringify(purchases));
  incrementGlobalReferralCount(referrer);
};

/**
 * Get attestation for a referrer (mock implementation)
 * 
 * @param {string} referrer The referrer address
 * @param {string} buyerPlannedValueWei The planned purchase amount in wei
 * @param {number} chainId The chain ID
 * @returns {Promise<Object>} The attestation data
 */
export const getMockAttestation = async (referrer, buyerPlannedValueWei, chainId) => {
  try {
    // Get the global referral count
    const attestedGlobalCount = getGlobalReferralCount(referrer);
    
    // Set deadline (15 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + (15 * 60);
    
    // Calculate a small sync fee (0.5% of transaction value)
    const valueWei = BigInt(buyerPlannedValueWei);
    const syncFee = (valueWei * BigInt(50)) / BigInt(10000); // 0.5%
    
    // Create the message to sign
    // keccak256(abi.encode(keccak256("BNBRF-REFERRAL-v1"), referrer, attestedGlobalCount, deadline, syncFee))
    const projectId = ethers.keccak256(ethers.toUtf8Bytes("BNBRF-REFERRAL-v1"));
    
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes32', 'address', 'uint256', 'uint256', 'uint256'],
      [projectId, referrer, attestedGlobalCount, deadline, syncFee.toString()]
    );
    
    const messageHash = ethers.keccak256(encodedData);
    
    // Sign the message
    const sig = await mockWallet.signMessage(ethers.getBytes(messageHash));
    
    console.log('Generated mock attestation for', referrer, 'with count', attestedGlobalCount);
    
    return {
      referrer,
      attestedGlobalCount,
      deadline,
      syncFee: syncFee.toString(),
      sig
    };
  } catch (error) {
    console.error('Mock attestation error:', error);
    throw error;
  }
};

/**
 * Get the tier level based on referral count
 * 
 * @param {number} count The referral count
 * @returns {number} The tier level (1-8)
 */
export const getTierLevel = (count) => {
  // Tier thresholds matching the contract
  const tiers = [930, 430, 180, 80, 40, 15, 5, 0];
  
  for (let i = 0; i < tiers.length; i++) {
    if (count >= tiers[i]) {
      return tiers.length - i; // 8..1
    }
  }
  
  return 1; // Default to tier 1
};

/**
 * Get the bonus percentage based on referral count
 * 
 * @param {number} count The referral count
 * @returns {number} The bonus percentage
 */
export const getBonusPercentage = (count) => {
  // Bonus percentages matching the contract
  const bonuses = [70, 50, 40, 30, 25, 20, 15, 10];
  const tiers = [930, 430, 180, 80, 40, 15, 5, 0];
  
  for (let i = 0; i < tiers.length; i++) {
    if (count >= tiers[i]) {
      return bonuses[i];
    }
  }
  
  return 10; // Default to 10%
};

/**
 * Get all referral data for the admin panel
 * 
 * @returns {Object} The referral data
 */
export const getMockReferralData = () => {
  const counts = JSON.parse(localStorage.getItem('mockReferralCounts') || '{}');
  const purchases = JSON.parse(localStorage.getItem('mockReferralPurchases') || '[]');
  
  return {
    counts,
    purchases,
    totalReferrers: Object.keys(counts).length,
    totalPurchases: purchases.length
  };
};

/**
 * Reset all mock data (for testing)
 */
export const resetMockData = () => {
  localStorage.setItem('mockReferralCounts', JSON.stringify({}));
  localStorage.setItem('mockReferralPurchases', JSON.stringify([]));
  console.log('Mock attestation data reset');
};

// Initialize storage when this module is loaded
if (typeof window !== 'undefined') {
  initMockStorage();
}