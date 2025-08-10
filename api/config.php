<?php
// Database configuration - Store in a file outside web root in production
$db_config = [
    'host' => 'localhost',
    'dbname' => 'your_database_name',  // Replace with your actual database name
    'username' => 'your_db_username',  // Replace with your actual database username
    'password' => 'your_db_password',  // Replace with your actual database password
];

// API Security Configuration
$security_config = [
    // List of allowed origins for CORS (comma-separated)
    'allowed_origins' => ['https://yourdomain.com', 'https://app.yourdomain.com'],
    
    // Rate limiting: requests per minute per IP
    'rate_limit' => 60,
    
    // API key for authentication (use a strong random key in production)
    'api_key' => 'YOUR_SECURE_API_KEY_HERE',
    
    // Enable detailed error logging (set to false in production)
    'debug_mode' => false,
];
?>