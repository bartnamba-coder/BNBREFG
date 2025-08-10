// src/utils/attestedReferralBuy.js
// Enhanced referral purchase with attestation support

import { getAttestation } from '../services/attestationService';
import { getMockAttestation } from '../services/mockAttestationService';

// Flag to use mock service for testing
const USE_MOCK_SERVICE = true;

/**
 * Prepare the contract call for buying tokens with attestation
 * 
 * @param {Object} configModule The chain configuration module
 * @param {string} referrerAddress The referrer address
 * @param {string} paymentAmount The payment amount in ETH/BNB
 * @param {number} chainId The current chain ID
 * @returns {Promise<Object>} The contract call configuration
 */
export const prepareAttestedBuyTokenCall = async (configModule, referrerAddress, paymentAmount, chainId) => {
  try {
    // Skip attestation if no referrer or zero address
    if (!referrerAddress || referrerAddress === '0x0000000000000000000000000000000000000000') {
      return {
        ...configModule.buyTokenCall,
        args: [],
        value: paymentAmount,
      };
    }

    // Get attestation from the backend or mock service
    const attestation = USE_MOCK_SERVICE 
      ? await getMockAttestation(referrerAddress, paymentAmount.toString(), chainId)
      : await getAttestation(referrerAddress, paymentAmount.toString(), chainId);

    console.log('Attestation received:', attestation);

    // Calculate the total value (purchase amount + sync fee)
    const totalValue = BigInt(paymentAmount) + BigInt(attestation.syncFee);

    // Return the contract call with attestation
    return {
      ...configModule.buyTokenWithAttestationCall,
      args: [
        attestation.referrer,
        attestation.attestedGlobalCount,
        attestation.deadline,
        attestation.syncFee,
        attestation.sig
      ],
      value: totalValue,
    };
  } catch (error) {
    console.error('Error preparing attested buy call:', error);
    
    // Fallback to regular referral purchase without attestation
    console.log('Falling back to regular referral purchase without attestation');
    return {
      ...configModule.buyTokenWithReferrerCall,
      args: [referrerAddress],
      value: paymentAmount,
    };
  }
};