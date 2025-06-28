#!/usr/bin/env node

/**
 * Backend Connection Test Script
 * Tests the connection to the backend API and reports status
 */

const API_BASE_URL = process.env.VITE_API_URL || 'https://backend-mu-three-66.vercel.app/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

async function testEndpoint(endpoint, description) {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      log.success(`${description} - ${response.status} (${responseTime}ms)`);
      return true;
    } else {
      log.warning(`${description} - ${response.status} ${response.statusText} (${responseTime}ms)`);
      return false;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    log.error(`${description} - Connection failed: ${error.message} (${responseTime}ms)`);
    return false;
  }
}

async function testAuthentication() {
  const url = `${API_BASE_URL}/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    if (response.status === 401 || response.status === 400) {
      log.success(`Auth endpoint accessible - ${response.status} (expected for invalid credentials)`);
      return true;
    } else if (response.status === 404) {
      log.warning(`Auth endpoint not found - ${response.status}`);
      return false;
    } else {
      log.info(`Auth endpoint - ${response.status} ${response.statusText}`);
      return true;
    }
  } catch (error) {
    log.error(`Auth endpoint - Connection failed: ${error.message}`);
    return false;
  }
}

async function testCORS() {
  const url = `${API_BASE_URL}/health`;
  
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      log.success(`CORS configured - Origin: ${corsHeaders['Access-Control-Allow-Origin']}`);
      return true;
    } else {
      log.warning('CORS headers not found - may cause browser issues');
      return false;
    }
  } catch (error) {
    log.warning(`CORS test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bold}${colors.blue}Backend Connection Test${colors.reset}`);
  console.log(`Target URL: ${API_BASE_URL}\n`);
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test basic connectivity
  log.header('Basic Connectivity Tests');
  const tests = [
    ['/health', 'Health check endpoint'],
    ['/auth/login', 'Authentication endpoint'],
    ['/products', 'Products endpoint'],
    ['/customers', 'Customers endpoint'],
    ['/orders', 'Orders endpoint'],
    ['/coupons', 'Coupons endpoint']
  ];
  
  for (const [endpoint, description] of tests) {
    totalTests++;
    if (await testEndpoint(endpoint, description)) {
      passedTests++;
    }
  }
  
  // Test authentication
  log.header('Authentication Tests');
  totalTests++;
  if (await testAuthentication()) {
    passedTests++;
  }
  
  // Test CORS
  log.header('CORS Tests');
  totalTests++;
  if (await testCORS()) {
    passedTests++;
  }
  
  // Summary
  log.header('Test Summary');
  console.log(`Total tests: ${totalTests}`);
  console.log(`Passed: ${colors.green}${passedTests}${colors.reset}`);
  console.log(`Failed: ${colors.red}${totalTests - passedTests}${colors.reset}`);
  
  if (passedTests === totalTests) {
    log.success('All tests passed! Backend connection is healthy.');
    process.exit(0);
  } else {
    log.error(`${totalTests - passedTests} test(s) failed. Check backend configuration.`);
    process.exit(1);
  }
}

// Check if running in Node.js environment
if (typeof window === 'undefined') {
  // Import fetch for Node.js
  global.fetch = global.fetch || require('node-fetch');
  main().catch(error => {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  });
}