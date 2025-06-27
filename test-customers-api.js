// Test Customers API endpoint specifically
async function testCustomersAPI() {
  console.log('Testing Customers API endpoint...\n');
  
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
    
    // Test customers endpoints
    console.log('\n2. Testing GET /api/customers...');
    const customersResponse = await fetch('https://backend-mu-three-66.vercel.app/api/customers', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    const customersData = await customersResponse.json();
    
    if (customersResponse.ok && customersData.success) {
      console.log('✅ Customers endpoint working!');
      console.log(`Found ${customersData.data?.length || 0} customers`);
      
      if (customersData.data && customersData.data.length > 0) {
        console.log('\n📋 Sample customer data:');
        console.log(JSON.stringify(customersData.data[0], null, 2));
      }
    } else {
      console.error('❌ Customers endpoint failed:', customersData);
    }
    
    // Test customer creation
    console.log('\n3. Testing customer creation...');
    const newCustomerData = {
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test.customer@example.com',
      phone: '+1234567890',
      platform: 'shopify'
    };
    
    const createResponse = await fetch('https://backend-mu-three-66.vercel.app/api/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCustomerData)
    });
    
    const createData = await createResponse.json();
    
    if (createResponse.ok && createData.success) {
      console.log('✅ Customer creation endpoint working!');
      console.log('Created customer:', createData.customer?.first_name, createData.customer?.last_name);
      
      // Test customer update if creation succeeded
      if (createData.customer) {
        console.log('\n4. Testing customer update...');
        const updateResponse = await fetch(`https://backend-mu-three-66.vercel.app/api/customers/${createData.customer.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: 'Updated Test',
            last_name: 'Customer',
            email: createData.customer.email,
            phone: createData.customer.phone,
            platform: createData.customer.platform
          })
        });
        
        const updateData = await updateResponse.json();
        
        if (updateResponse.ok && updateData.success) {
          console.log('✅ Customer update endpoint working!');
        } else {
          console.log('⚠️ Customer update:', updateData.message || 'May not be implemented yet');
        }
        
        // Test customer deletion
        console.log('\n5. Testing customer deletion...');
        const deleteResponse = await fetch(`https://backend-mu-three-66.vercel.app/api/customers/${createData.customer.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        
        const deleteData = await deleteResponse.json();
        
        if (deleteResponse.ok && deleteData.success) {
          console.log('✅ Customer deletion endpoint working!');
        } else {
          console.log('⚠️ Customer deletion:', deleteData.message || 'May not be implemented yet');
        }
      }
    } else {
      console.log('⚠️ Customer creation:', createData.message || 'May not be implemented yet');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCustomersAPI();