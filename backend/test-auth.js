import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = `testuser_${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// This variable will hold the cookie string from the login response
let authTokenCookie = '';

// Helper function to handle API errors
function handleApiError(error, context) {
  console.error(`❌ Error ${context}:`, {
    message: error.response?.data?.message || error.message,
    status: error.response?.status,
    data: error.response?.data,
  });
  process.exit(1);
}

function logStep(message) {
  console.log(`\n🔵 ${message}`);
}

// Test user signup
async function testSignup() {
  try {
    logStep('Testing signup...');
    const response = await api.post('/auth/signup', {
      fullName: 'Test User',
      username: `testuser_${Date.now()}`,
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
    });

    console.log('✅ Signup successful:', {
      userId: response.data.user._id,
      email: response.data.user.email,
    });

    return response.data.user;
  } catch (error) {
    handleApiError(error, 'during signup');
  }
}

// Test login
async function testLogin() {
  try {
    logStep('Testing login...');
    const response = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    // Explicitly check for the JWT cookie in the response headers
    const cookies = response.headers['set-cookie'];
    const jwtCookie = cookies?.find(c => c.startsWith('jwt='));

    if (!jwtCookie) {
      console.error('❌ Login succeeded but no JWT cookie was returned from the server.');
      process.exit(1);
    }

    authTokenCookie = jwtCookie.split(';')[0]; // e.g., "jwt=ey..."
    console.log(`🔑 Received JWT cookie: ${authTokenCookie}`);

    console.log('✅ Login successful:', {
      userId: response.data.user._id,
      email: response.data.user.email,
    });
    return response.data.user;
  } catch (error) {
    handleApiError(error, 'during login');
  }
}

// Test authentication check
async function testAuthCheck() {
  try {
    logStep('Testing auth check...');

    // Create a new instance without interceptors for the unauthenticated check
    const unauthenticatedApi = axios.create({ baseURL: API_URL });

    // First try without auth token (should fail)
    try {
      // Use the unauthenticated instance
      await unauthenticatedApi.get('/auth/check');
      console.error('❌ Auth check should fail without token');
      process.exit(1);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthenticated check passed (as expected)');
      } else {
        throw error;
      }
    }

    // Now try with an authenticated request by manually adding the cookie
    const response = await api.get('/auth/check', {
      headers: { Cookie: authTokenCookie },
    });

    console.log('✅ Authenticated check passed:', {
      userId: response.data._id,
      email: response.data.email,
    });

    return response.data;
  } catch (error) {
    handleApiError(error, 'during auth check');
  }
}

// Test profile update
async function testProfileUpdate() {
  try {
    logStep('Testing profile update...');

    // Create a simple base64 encoded image for testing
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    // Send the request with the auth cookie
    const response = await api.put('/auth/update-profile', { profilePic: testImage }, {
      headers: { Cookie: authTokenCookie },
    });

    console.log('✅ Profile update successful:', {
      profilePic: response.data.user.profilePic,
    });

    return response.data.user;
  } catch (error) {
    handleApiError(error, 'during profile update');
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('🚀 Starting backend authentication flow tests...');

    // Test signup
    await testSignup();

    // Test login
    await testLogin();

    // Test auth check
    await testAuthCheck();

    // Test profile update
    await testProfileUpdate();

    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
