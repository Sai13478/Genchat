import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
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

// Use an interceptor to automatically handle the auth token
api.interceptors.response.use(response => {
  // If the response has a JWT cookie, save it for subsequent requests
  const cookies = response.headers['set-cookie'];
  const jwtCookie = cookies?.find(c => c.startsWith('jwt='));
  if (jwtCookie) {
    const authToken = jwtCookie.split(';')[0].split('=')[1];
    console.log('🔑 JWT token saved from cookies and applied to future requests');
    // Apply the token to all subsequent requests from this axios instance
    api.defaults.headers.common['Cookie'] = `jwt=${authToken}`;
    // Also common to send as a Bearer token
    api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  }
  return response;
}, error => {
  return Promise.reject(error);
});
// Helper function to handle API errors
function handleApiError(error, context) {
  console.error(`❌ Error ${context}:`, {
    message: error.response?.data?.message || error.message,
    status: error.response?.status,
    data: error.response?.data,
  });
  process.exit(1);
}

// Test user signup
async function testSignup() {
  try {
    console.log('\n🔵 Testing signup...');
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
    console.log('\n🔵 Testing login...');
    const response = await api.post('/auth/login', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
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
    console.log('\n🔵 Testing auth check...');
    
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
    
    // Now try with the main 'api' instance, which should have the token from the interceptor
    const response = await api.get('/auth/check');
    
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
    console.log('\n🔵 Testing profile update...');
    
    // Create a simple base64 encoded image for testing
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // The main 'api' instance will automatically have the auth headers
    const response = await api.put('/auth/update-profile', { profilePic: testImage });
    
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
    console.log('🚀 Starting authentication flow tests...');
    
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
