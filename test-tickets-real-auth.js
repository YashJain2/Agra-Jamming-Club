#!/usr/bin/env node

/**
 * Test Tickets API with Real Authentication
 * This script tests the tickets API by signing in and then fetching tickets
 */

async function testTicketsAPIWithRealAuth() {
  try {
    console.log('🎯 Testing Tickets API with Real Authentication');
    console.log('===============================================');
    
    // Step 1: Sign in as admin user
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
    
    // Get the session cookie
    const setCookieHeader = signInResponse.headers.get('set-cookie');
    console.log('Session cookie:', setCookieHeader);
    
    // Step 2: Test tickets API with the session cookie
    console.log('\n📋 Step 2: Testing tickets API...');
    
    const ticketsResponse = await fetch('http://localhost:3000/api/tickets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': setCookieHeader || ''
      },
    });
    
    console.log('Tickets Response Status:', ticketsResponse.status);
    const ticketsData = await ticketsResponse.json();
    console.log('Tickets Response:', JSON.stringify(ticketsData, null, 2));
    
    if (ticketsResponse.status === 200) {
      console.log('✅ Tickets API is working!');
      console.log('Found tickets:', ticketsData.data?.length || 0);
      
      if (ticketsData.data && ticketsData.data.length > 0) {
        ticketsData.data.forEach((ticket, index) => {
          console.log(`  ${index + 1}. ${ticket.event.title} - ${ticket.status} - ₹${ticket.totalPrice}`);
        });
      }
    } else {
      console.log('❌ Tickets API has issues');
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testTicketsAPIWithRealAuth().catch(console.error);
