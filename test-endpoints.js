/**
 * Simple functional test to verify authentication endpoints
 */
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function testEndpoints() {
  console.log('🧪 Testing Authentication Endpoints...')
  
  try {
    // Start wrangler dev in background
    console.log('🚀 Starting wrangler dev...')
    const devProcess = exec('wrangler dev --port 8787')
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Test 1: Registration endpoint
    console.log('📝 Testing registration endpoint...')
    const registerResponse = await fetch('http://localhost:8787/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!',
        name: 'Test User'
      })
    })
    
    console.log(`Registration Response Status: ${registerResponse.status}`)
    if (registerResponse.status === 201) {
      const data = await registerResponse.json()
      console.log('✅ Registration successful:', data.success)
    } else {
      console.log('❌ Registration failed')
    }
    
    // Test 2: Login endpoint
    console.log('🔐 Testing login endpoint...')
    const loginResponse = await fetch('http://localhost:8787/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
    })
    
    console.log(`Login Response Status: ${loginResponse.status}`)
    if (loginResponse.status === 200) {
      const data = await loginResponse.json()
      console.log('✅ Login successful:', data.success)
    } else {
      console.log('❌ Login failed')
    }
    
    // Test 3: CORS preflight
    console.log('🌐 Testing CORS preflight...')
    const corsResponse = await fetch('http://localhost:8787/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type'
      }
    })
    
    console.log(`CORS Response Status: ${corsResponse.status}`)
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    })
    
    // Test 4: Password reset request
    console.log('🔒 Testing password reset request...')
    const resetResponse = await fetch('http://localhost:8787/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    })
    
    console.log(`Reset Response Status: ${resetResponse.status}`)
    if (resetResponse.status === 200) {
      const data = await resetResponse.json()
      console.log('✅ Password reset request successful:', data.success)
    } else {
      console.log('❌ Password reset request failed')
    }
    
    // Clean up
    devProcess.kill()
    console.log('✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testEndpoints().catch(console.error)
