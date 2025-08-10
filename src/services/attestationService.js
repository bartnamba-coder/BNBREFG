// src/services/attestationService.js
// Service for interacting with the attestation API

// API base URL - should be configured based on environment
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.yourdomain.com';

/**
 * Get attestation for a referrer
 * 
 * @param {string} referrer The referrer address
 * @param {string} buyerPlannedValueWei The planned purchase amount in wei
 * @param {number} chainId The chain ID (1 for ETH mainnet, 56 for BSC mainnet, etc.)
 * @returns {Promise<Object>} The attestation data
 */
export const getAttestation = async (referrer, buyerPlannedValueWei, chainId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/attest.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referrer,
        buyerPlannedValueWei,
        chainId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get attestation');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Attestation request failed');
    }
    
    return {
      referrer: data.referrer,
      attestedGlobalCount: data.attestedGlobalCount,
      deadline: data.deadline,
      syncFee: data.syncFee,
      sig: data.sig,
    };
  } catch (error) {
    console.error('Attestation service error:', error);
    throw error;
  }
};

/**
 * Check if a referrer has a higher global tier than local tier
 * 
 * @param {Object} contract The contract instance
 * @param {string} referrer The referrer address
 * @returns {Promise<boolean>} Whether the referrer has a higher global tier
 */
export const hasHigherGlobalTier = async (contract, referrer) => {
  try {
    // Get local referral info
    const localInfo = await contract.getReferrerInfo(referrer);
    const localCount = localInfo[0]; // totalReferrals is the first item
    
    // Get global referral info
    const globalInfo = await contract.getGlobalReferralInfo(referrer);
    const globalCount = globalInfo[0]; // globalCount is the first item
    
    // Compare counts
    return globalCount > localCount;
  } catch (error) {
    console.error('Error checking global tier:', error);
    return false;
  }
};

/**
 * Format attestation data for contract call
 * 
 * @param {Object} attestation The attestation data
 * @returns {Array} The formatted arguments for the contract call
 */
export const formatAttestationForContract = (attestation) => {
  return [
    attestation.referrer,
    attestation.attestedGlobalCount,
    attestation.deadline,
    attestation.syncFee,
    attestation.sig,
  ];
};