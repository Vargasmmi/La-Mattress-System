// Test API connectivity
async function testAPI() {
  console.log('Testing API connectivity...\n');
  
  // Test 1: Health check
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('https://backend-mu-three-66.vercel.app/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
  
  // Test 2: Webhook status (no auth required)
  try {
    console.log('\n2. Testing webhook status...');
    const webhookResponse = await fetch('https://backend-mu-three-66.vercel.app/api/webhooks/status');
    const webhookData = await webhookResponse.json();
    console.log('✅ Webhook status:', webhookData);
  } catch (error) {
    console.error('❌ Webhook status failed:', error.message);
  }
  
  // Test 3: Login with demo credentials
  try {
    console.log('\n3. Testing login...');
    const loginResponse = await fetch('https://backend-mu-three-66.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'lbencomo94@gmail.com',
        password: 'Atec2019chino'
      })
    });
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login successful!');
      console.log('Token:', loginData.token ? loginData.token.substring(0, 50) + '...' : 'No token');
      console.log('User:', loginData.user);
      
      // Test 4: Get user info with token
      if (loginData.token) {
        console.log('\n4. Testing authenticated request...');
        const meResponse = await fetch('https://backend-mu-three-66.vercel.app/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
          }
        });
        const meData = await meResponse.json();
        console.log('✅ User info:', meData);
        
        // Test 5: Get coupons
        console.log('\n5. Testing coupons endpoint...');
        const couponsResponse = await fetch('https://backend-mu-three-66.vercel.app/api/coupons', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
          }
        });
        const couponsData = await couponsResponse.json();
        console.log('✅ Coupons:', couponsData.success ? `Found ${couponsData.coupons?.length || 0} coupons` : 'Failed');
      }
    } else {
      console.error('❌ Login failed:', loginData);
    }
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
  }
}

testAPI();