#!/usr/bin/env node

/**
 * Test Tickets API
 * This script tests the tickets API to see if it's working
 */

async function testTicketsAPI() {
  try {
    console.log('🎯 Testing Tickets API');
    console.log('======================');
    
    // First, let's check what tickets exist in the database
    console.log('📋 Step 1: Checking tickets in database...');
    
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const tickets = await prisma.$queryRaw`
      SELECT 
        t.id,
        t."userId",
        t."eventId",
        t.quantity,
        t."totalPrice",
        t.status,
        t."createdAt",
        e.title as "eventTitle",
        u.name as "userName",
        u.email as "userEmail"
      FROM "Ticket" t
      LEFT JOIN "Event" e ON t."eventId" = e.id
      LEFT JOIN "User" u ON t."userId" = u.id
      ORDER BY t."createdAt" DESC
      LIMIT 5
    `;
    
    console.log('📋 Found tickets:', tickets.length);
    tickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. ${ticket.eventTitle} - ${ticket.userName} (${ticket.status})`);
    });
    
    // Test the tickets API endpoint
    console.log('\n📋 Step 2: Testing tickets API endpoint...');
    
    // Get a user ID from the tickets
    if (tickets.length > 0) {
      const testUserId = tickets[0].userId;
      console.log('Testing with user ID:', testUserId);
      
      // Test the API endpoint
      const response = await fetch('http://localhost:3000/api/tickets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response Status:', response.status);
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (response.status === 200) {
        console.log('✅ Tickets API is working!');
      } else {
        console.log('❌ Tickets API has issues');
      }
    } else {
      console.log('⚠️ No tickets found to test with');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run the test
testTicketsAPI().catch(console.error);
