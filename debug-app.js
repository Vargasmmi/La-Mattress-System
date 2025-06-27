// Debug script to check console errors
console.log('Testing basic imports...');

try {
  // Test if the main modules can be imported
  console.log('✓ Starting debug...');
  
  // Check if localStorage is accessible
  if (typeof localStorage !== 'undefined') {
    console.log('✓ localStorage is available');
  } else {
    console.log('❌ localStorage not available');
  }
  
  // Check if fetch is available
  if (typeof fetch !== 'undefined') {
    console.log('✓ fetch is available');
  } else {
    console.log('❌ fetch not available');
  }
  
  console.log('Debug complete');
} catch (error) {
  console.error('❌ Debug failed:', error);
}