// Test Orders API endpoint specifically
async function testOrdersAPI() {
  console.log('Testing Orders API endpoint...\n');
  
  try {
    // First login to get token
    console.log('1. Getting authentication token...');
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
    
    if (!loginResponse.ok || !loginData.success) {
      console.error('❌ Login failed:', loginData);
      return;
    }
    
    const token = loginData.token;
    console.log('✅ Login successful!');
    
    // Test orders endpoints
    console.log('\n2. Testing GET /api/orders...');
    const ordersResponse = await fetch('https://backend-mu-three-66.vercel.app/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const ordersData = await ordersResponse.json();
    
    if (ordersResponse.ok && ordersData.success) {
      console.log('✅ Orders endpoint working!');
      console.log(`Found ${ordersData.orders?.length || 0} orders`);
      
      if (ordersData.orders && ordersData.orders.length > 0) {
        console.log('\n📋 Sample order data:');
        console.log(JSON.stringify(ordersData.orders[0], null, 2));
      }
    } else {
      console.error('❌ Orders endpoint failed:', ordersData);
    }
    
    // Test order status update if we have orders
    if (ordersData.orders && ordersData.orders.length > 0) {
      const firstOrder = ordersData.orders[0];
      console.log(`\n3. Testing order status update for order ${firstOrder.id}...`);
      
      const updateResponse = await fetch(`https://backend-mu-three-66.vercel.app/api/orders/${firstOrder.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: firstOrder.status // Keep same status to avoid changing data
        })
      });
      
      const updateData = await updateResponse.json();
      
      if (updateResponse.ok && updateData.success) {
        console.log('✅ Order update endpoint working!');
      } else {
        console.error('❌ Order update failed:', updateData);
      }
    }
    
    // Test creating a new order
    console.log('\n4. Testing order creation...');
    const newOrderData = {
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      total: 99.99,
      status: 'pending',
      payment_status: 'pending',
      items: [
        {
          product_name: 'Test Product',
          quantity: 1,
          price: 99.99
        }
      ]
    };
    
    const createResponse = await fetch('https://backend-mu-three-66.vercel.app/api/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newOrderData)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok && createData.success) {
      console.log('✅ Order creation endpoint working!');
      console.log('Created order:', createData.order?.order_number);
    } else {
      console.log('⚠️ Order creation:', createData.message || 'May not be implemented yet');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOrdersAPI();