#!/usr/bin/env node

/**
 * Test Direct Ticket Creation and Retrieval
 * This script creates a ticket directly and then tests if it can be retrieved
 */

async function testDirectTicketCreation() {
  try {
    console.log('🎯 Testing Direct Ticket Creation and Retrieval');
    console.log('==============================================');
    
    // Step 1: Create a ticket directly using the test endpoint
    console.log('📋 Step 1: Creating a ticket directly...');
    
    const createResponse = await fetch('http://localhost:3000/api/test-create-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Create Response Status:', createResponse.status);
    const createData = await createResponse.json();
    console.log('Create Response:', JSON.stringify(createData, null, 2));
    
    if (createResponse.status === 200) {
      console.log('✅ Ticket created successfully!');
      console.log('Ticket ID:', createData.ticketId);
      
      // Step 2: Check if the ticket exists in the database
      console.log('\n📋 Step 2: Checking if ticket exists in database...');
      
      const checkResponse = await fetch('http://localhost:3000/api/check-db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const checkData = await checkResponse.json();
      console.log('Database check:', JSON.stringify(checkData, null, 2));
      
      if (checkData.ticketCount > 0) {
        console.log('✅ Ticket found in database!');
        console.log('Total tickets:', checkData.ticketCount);
      } else {
        console.log('❌ Ticket not found in database');
      }
    } else {
      console.log('❌ Ticket creation failed');
    }
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testDirectTicketCreation().catch(console.error);
