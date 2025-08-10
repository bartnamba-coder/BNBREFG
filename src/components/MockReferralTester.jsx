import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  getMockReferralData, 
  getGlobalReferralCount, 
  incrementGlobalReferralCount,
  recordMockPurchase,
  resetMockData,
  getTierLevel,
  getBonusPercentage
} from '../services/mockAttestationService';

const MockReferralTester = () => {
  const { address, isConnected } = useAccount();
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [tierLevel, setTierLevel] = useState(1);
  const [bonusPercent, setBonusPercent] = useState(10);
  const [testBuyerAddress, setTestBuyerAddress] = useState('');
  const [testAmount, setTestAmount] = useState('0.1');
  const [referralData, setReferralData] = useState(null);
  const [showData, setShowData] = useState(false);

  // Update referral data when address changes
  useEffect(() => {
    if (isConnected && address) {
      updateReferralData();
    }
  }, [address, isConnected]);

  // Generate referral link
  const generateReferralLink = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    const baseUrl = window.location.origin;
    const newLink = `${baseUrl}/?ref=${address}`;
    setReferralLink(newLink);
    
    // Copy to clipboard
    navigator.clipboard.writeText(newLink)
      .then(() => alert('Referral link copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  // Update referral data
  const updateReferralData = () => {
    if (isConnected && address) {
      const count = getGlobalReferralCount(address);
      setReferralCount(count);
      setTierLevel(getTierLevel(count));
      setBonusPercent(getBonusPercentage(count));
      setReferralData(getMockReferralData());
    }
  };

  // Simulate a purchase with referral
  const simulatePurchase = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!testBuyerAddress || !testBuyerAddress.startsWith('0x')) {
      alert('Please enter a valid buyer address');
      return;
    }

    const amount = parseFloat(testAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    // Record the purchase
    recordMockPurchase(
      address,
      testBuyerAddress,
      1, // ETH chain ID
      testAmount
    );

    // Update the UI
    updateReferralData();
    alert('Purchase simulated successfully!');
  };

  // Manually increment referral count (for testing)
  const incrementCount = () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    incrementGlobalReferralCount(address);
    updateReferralData();
  };

  // Reset all mock data
  const handleReset = () => {
    resetMockData();
    updateReferralData();
    alert('All mock referral data has been reset');
  };

  // Toggle showing all data
  const toggleShowData = () => {
    setShowData(!showData);
    updateReferralData();
  };

  return (
    <div style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Mock Referral Testing Tool</h3>
      
      {isConnected ? (
        <>
          <div style={{ marginBottom: '15px' }}>
            <p><strong>Your Address:</strong> {address}</p>
            <p><strong>Referral Count:</strong> {referralCount}</p>
            <p><strong>Tier Level:</strong> {tierLevel}</p>
            <p><strong>Bonus Percentage:</strong> {bonusPercent}%</p>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <button 
              onClick={generateReferralLink}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Generate Referral Link
            </button>
            
            {referralLink && (
              <input 
                type="text" 
                value={referralLink} 
                readOnly 
                style={{ 
                  padding: '8px', 
                  width: '300px',
                  marginTop: '10px'
                }} 
              />
            )}
          </div>

          <div style={{ 
            marginBottom: '15px', 
            padding: '15px', 
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#fff'
          }}>
            <h4>Simulate Purchase</h4>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Buyer Address:
              </label>
              <input 
                type="text" 
                value={testBuyerAddress} 
                onChange={(e) => setTestBuyerAddress(e.target.value)}
                placeholder="0x..."
                style={{ padding: '8px', width: '300px' }}
              />
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Amount (ETH/BNB):
              </label>
              <input 
                type="text" 
                value={testAmount} 
                onChange={(e) => setTestAmount(e.target.value)}
                style={{ padding: '8px', width: '100px' }}
              />
            </div>
            
            <button 
              onClick={simulatePurchase}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Simulate Purchase
            </button>
            
            <button 
              onClick={incrementCount}
              style={{
                padding: '8px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Increment Count
            </button>
          </div>

          <div>
            <button 
              onClick={toggleShowData}
              style={{
                padding: '8px 16px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {showData ? 'Hide Data' : 'Show All Data'}
            </button>
            
            <button 
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                backgroundColor: '#F44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reset All Data
            </button>
          </div>

          {showData && referralData && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#fff',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <h4>All Referral Data</h4>
              <p><strong>Total Referrers:</strong> {referralData.totalReferrers}</p>
              <p><strong>Total Purchases:</strong> {referralData.totalPurchases}</p>
              
              <h5>Referral Counts:</h5>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                overflowX: 'auto'
              }}>
                {JSON.stringify(referralData.counts, null, 2)}
              </pre>
              
              <h5>Recent Purchases:</h5>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '10px', 
                borderRadius: '4px',
                overflowX: 'auto'
              }}>
                {JSON.stringify(referralData.purchases.slice(-5).reverse(), null, 2)}
              </pre>
            </div>
          )}
        </>
      ) : (
        <p>Please connect your wallet to use the referral testing tool.</p>
      )}
    </div>
  );
};

export default MockReferralTester;