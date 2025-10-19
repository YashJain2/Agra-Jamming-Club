#!/usr/bin/env node

/**
 * Test Tickets API with Authentication
 * This script tests the tickets API by simulating a user session
 */

async function testTicketsAPIWithAuth() {
  try {
    console.log('🎯 Testing Tickets API with Authentication');
    console.log('==========================================');
    
    // Step 1: Sign in as admin to get a session
    console.log('📋 Step 1: Signing in as admin...');
    
    const signInResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@agrajammingclub.com',
        password: 'admin123'
      }),
    });
    
    console.log('Sign-in Response Status:', signInResponse.status);
    
    if (signInResponse.status !== 200) {
      const signInData = await signInResponse.json();
      console.log('Sign-in failed:', signInData.error);
      return;
    }
    
    const signInData = await signInResponse.json();
    console.log('✅ Signed in successfully');
    
    // Step 2: Test tickets API
    console.log('\n📋 Step 2: Testing tickets API...');
    
    const ticketsResponse = await fetch('http://localhost:3000/api/tickets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': signInResponse.headers.get('set-cookie') || ''
      },
    });
    
    console.log('Tickets Response Status:', ticketsResponse.status);
    const ticketsData = await ticketsResponse.json();
    console.log('Tickets Response:', JSON.stringify(ticketsData, null, 2));
    
    if (ticketsResponse.status === 200) {
      console.log('✅ Tickets API is working!');
      console.log('Found tickets:', ticketsData.data?.length || 0);
    } else {
      console.log('❌ Tickets API has issues');
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testTicketsAPIWithAuth().catch(console.error);
