import axios from 'axios';

/**
 * Test script ?? xác minh tài kho?n admin ho?t ??ng
 * 
 * S? d?ng:
 * - V?i Node.js/TypeScript
 * - Ho?c ??n gi?n ch?y l?nh curl
 */

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Test credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@ev.com',
  password: 'admin'
};

/**
 * Test 1: Login with admin credentials
 */
async function testAdminLogin() {
  try {
    console.log('?? Testing Admin Login...\n');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/Login`, {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password
    });

    console.log('? Login Successful!\n');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('? Login Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

/**
 * Test 2: Verify admin token
 */
async function testGetCurrentUser(token) {
  try {
    console.log('\n?? Testing Get Current User (using token)...\n');
    
    const response = await axios.get(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('? Get Current User Successful!\n');
    console.log('Response Data:', JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('? Get Current User Failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

/**
 * Test 3: Verify admin user details
 */
function verifyAdminDetails(userData) {
  console.log('\n?? Verifying Admin User Details...\n');
  
  const checks = [
    { field: 'Email', expected: 'admin@ev.com', actual: userData?.email, passed: userData?.email === 'admin@ev.com' },
    { field: 'Role', expected: 'Admin', actual: userData?.userRole, passed: userData?.userRole === 'Admin' },
    { field: 'IsActive', expected: true, actual: userData?.isActive, passed: userData?.isActive === true },
    { field: 'FirstName', expected: 'Admin', actual: userData?.firstName, passed: userData?.firstName === 'Admin' },
    { field: 'LastName', expected: 'User', actual: userData?.lastName, passed: userData?.lastName === 'User' },
    { field: 'UserId', expected: '00000000-0000-0000-0000-000000000001', actual: userData?.id, passed: userData?.id === '00000000-0000-0000-0000-000000000001' }
  ];

  checks.forEach(check => {
    const status = check.passed ? '?' : '?';
    console.log(`${status} ${check.field}: ${check.actual} (Expected: ${check.expected})`);
  });

  const allPassed = checks.every(c => c.passed);
  return allPassed;
}

/**
 * Main test runner
 */
async function runTests() {
  try {
    console.log('='.repeat(50));
    console.log('?? Admin Account Test Suite\n');
    console.log(`API Base URL: ${API_BASE_URL}`);
    console.log(`Admin Email: ${ADMIN_CREDENTIALS.email}`);
    console.log('='.repeat(50) + '\n');

    // Test 1: Login
    const loginResponse = await testAdminLogin();
    const accessToken = loginResponse?.data?.token;

    if (!accessToken) {
      throw new Error('No access token received from login response');
    }

    // Test 2: Get current user
    if (accessToken) {
      const userData = await testGetCurrentUser(accessToken);
      const userDetails = userData?.data || userData;

      // Test 3: Verify details
      const allDetailsValid = verifyAdminDetails(userDetails);

      console.log('\n' + '='.repeat(50));
      if (allDetailsValid) {
        console.log('?? All Tests Passed! Admin account is properly configured.\n');
      } else {
        console.log('??  Some checks failed. Please review the details above.\n');
      }
      console.log('='.repeat(50));
    }

  } catch (error) {
    console.error('\n? Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { testAdminLogin, testGetCurrentUser, verifyAdminDetails };

