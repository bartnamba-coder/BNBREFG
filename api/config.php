<?php
// Referral System Database Configuration
$referral_db_config = [
    'host' => 'localhost',
    'dbname' => 'your_referral_database',  // Your referral database name
    'username' => 'referral_db_user',      // Your referral database username
    'password' => 'referral_db_password',  // Your referral database password
];

// Attestation System Database Configuration
$attestation_db_config = [
    'host' => 'localhost',
    'dbname' => 'your_attestation_database',  // Your attestation database name
    'username' => 'attestation_db_user',      // Your attestation database username
    'password' => 'attestation_db_password',  // Your attestation database password
];

// For backward compatibility with existing code
$db_config = $referral_db_config;

// API Security Configuration
$security_config = [
    // List of allowed origins for CORS (comma-separated)
    'allowed_origins' => ['https://yourdomain.com', 'https://app.yourdomain.com'],
    
    // Rate limiting: requests per minute per IP
    'rate_limit' => 60,
    
    // API key for authentication (use a strong random key in production)
    'api_key' => 'YOUR_SECURE_API_KEY_HERE',
    
    // Webhook secret for transaction event notifications
    'webhook_secret' => 'YOUR_WEBHOOK_SECRET_HERE',
    
    // Enable detailed error logging (set to false in production)
    'debug_mode' => false,
];

// Attestation Service Configuration
$attestation_config = [
    // Private key for signing attestations (KEEP THIS SECURE!)
    // This should be stored in an environment variable in production
    'signer_private_key' => getenv('AGGREGATOR_SIGNER_PK') ?: 'YOUR_PRIVATE_KEY_HERE',
    
    // The corresponding public address (must match what's set in the contract via setAggregatorSigner)
    'signer_address' => '0xYourSignerAddressHere',
    
    // Fee recipient address (must match what's set in the contract via setStampFeeRecipient)
    'fee_recipient' => '0xYourFeeRecipientAddressHere',
    
    // Maximum sync fee in basis points (1 bp = 0.01%, 300 = 3%)
    // This should match or be lower than the contract's maxSyncFeeBps
    'max_sync_fee_bps' => 300,
    
    // Default sync fee in basis points (50 = 0.5%)
    'default_sync_fee_bps' => 50,
];

// Database setup scripts
// For referral database: setup_referral_db.sql
// For attestation database: setup_attestation_db.sql
?>