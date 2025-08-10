<?php
// api/attest.php - Referral Attestation Service
// This service signs attestations for the global referral tier system

// Start session for CSRF protection
session_start();

// Set secure headers
header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
header('Content-Security-Policy: default-src \'self\'');

// Include security and database helpers
require_once 'security.php';
require_once 'database.php';
require_once 'referral_tiers.php'; // We'll create this file for tier tracking

// Handle CORS with restricted origins
handleCORS();

// Apply rate limiting
checkRateLimit();

// Only allow POST requests for attestation
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed'
    ]);
    logApiAccess('attest_method_not_allowed', false, "Method: {$_SERVER['REQUEST_METHOD']}");
    exit;
}

// Get and validate input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON input'
    ]);
    logApiAccess('attest_invalid_input', false, 'Invalid JSON format');
    exit;
}

// Validate required parameters
$referrer = validateInput($input['referrer'] ?? '', 'eth_address');
$buyerPlannedValueWei = validateInput($input['buyerPlannedValueWei'] ?? '', 'uint256');
$chainId = validateInput($input['chainId'] ?? '', 'uint256');

if (!$referrer || !$buyerPlannedValueWei || !$chainId) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Missing or invalid parameters. Required: referrer, buyerPlannedValueWei, chainId'
    ]);
    logApiAccess('attest_invalid_params', false, 'Missing or invalid parameters');
    exit;
}

try {
    // Get the global referral count for this referrer
    $globalCount = getGlobalReferralCount($referrer);
    
    // Set deadline (15 minutes from now)
    $deadline = time() + (15 * 60);
    
    // Calculate a small sync fee (0.5% of transaction value, capped by contract)
    // The contract will enforce the maxSyncFeeBps limit
    $syncFee = calculateSyncFee($buyerPlannedValueWei);
    
    // Generate the attestation signature
    $signature = generateAttestation($referrer, $globalCount, $deadline, $syncFee);
    
    if (!$signature) {
        throw new Exception("Failed to generate attestation signature");
    }
    
    // Return the attestation data
    echo json_encode([
        'success' => true,
        'referrer' => $referrer,
        'attestedGlobalCount' => $globalCount,
        'deadline' => $deadline,
        'syncFee' => $syncFee,
        'sig' => $signature
    ]);
    
    logApiAccess('attest_success', true, "Referrer: $referrer, Count: $globalCount");
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Attestation failed',
        'message' => $e->getMessage()
    ]);
    logApiAccess('attest_error', false, $e->getMessage());
}

/**
 * Calculate a reasonable sync fee based on transaction value
 * 
 * @param string $valueWei The transaction value in wei
 * @return string The sync fee in wei
 */
function calculateSyncFee($valueWei) {
    // Convert to a number for calculation
    $value = gmp_init($valueWei);
    
    // Calculate 0.5% of the transaction value (50 basis points)
    // This is well below the contract's default 3% cap (300 basis points)
    $feePercent = 50; // 0.5% = 50 basis points
    $fee = gmp_div(gmp_mul($value, $feePercent), 10000);
    
    // Ensure minimum fee of 0.0001 ETH/BNB (or equivalent)
    $minFee = gmp_init('100000000000000'); // 0.0001 ETH/BNB in wei
    
    if (gmp_cmp($fee, $minFee) < 0) {
        $fee = $minFee;
    }
    
    // Return as string
    return gmp_strval($fee);
}

/**
 * Generate attestation signature using the private key
 * 
 * @param string $referrer The referrer address
 * @param int $attestedGlobalCount The global referral count
 * @param int $deadline The expiration timestamp
 * @param string $syncFee The sync fee in wei
 * @return string|false The signature or false on failure
 */
function generateAttestation($referrer, $attestedGlobalCount, $deadline, $syncFee) {
    global $attestation_config;
    
    // Get the private key from environment or config
    $privateKey = $attestation_config['signer_private_key'];
    
    if (empty($privateKey)) {
        error_log("Attestation error: Missing signer private key");
        return false;
    }
    
    // Load the Web3 PHP library
    require_once __DIR__ . '/vendor/autoload.php';
    
    try {
        // Create Web3 instance
        $web3 = new Web3\Web3();
        $eth = $web3->eth;
        
        // Prepare the message to sign
        // keccak256(abi.encode(keccak256("BNBRF-REFERRAL-v1"), referrer, attestedGlobalCount, deadline, syncFee))
        $projectId = Web3\Utils::sha3('BNBRF-REFERRAL-v1');
        
        // ABI encode the parameters
        $encoder = new Web3\Contracts\Ethabi();
        $types = ['bytes32', 'address', 'uint256', 'uint256', 'uint256'];
        $values = [$projectId, $referrer, $attestedGlobalCount, $deadline, $syncFee];
        
        $encodedData = $encoder->encodeParameters($types, $values);
        $messageHash = Web3\Utils::sha3($encodedData);
        
        // Sign the message hash using personal_sign format
        $personalMessage = "\x19Ethereum Signed Message:\n32" . $messageHash;
        $personalMessageHash = Web3\Utils::sha3($personalMessage);
        
        // Sign with private key
        $signature = Web3\Account::sign($personalMessageHash, $privateKey);
        
        return $signature;
        
    } catch (Exception $e) {
        error_log("Attestation signing error: " . $e->getMessage());
        return false;
    }
}
?>