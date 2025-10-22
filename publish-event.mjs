// Script to publish the Christmas Fun event
import fetch from 'node-fetch';

const BASE_URL = 'https://agra-jamming-club.vercel.app';
const EVENT_ID = 'cmgxrje3l000541bel0dwuou4'; // Christmas Fun event ID

async function publishEvent() {
  try {
    console.log('🔍 Attempting to publish Christmas Fun event...');
    
    // First, let's try to update the event status to PUBLISHED
    const updateResponse = await fetch(`${BASE_URL}/api/events/${EVENT_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'PUBLISHED'
      })
    });
    
    const updateResult = await updateResponse.text();
    console.log('Update response:', updateResult);
    
    if (updateResponse.ok) {
      console.log('✅ Event published successfully!');
      
      // Verify the status change
      const eventsResponse = await fetch(`${BASE_URL}/api/events`);
      const eventsData = await eventsResponse.json();
      
      const christmasEvent = eventsData.data.find((event) => event.id === EVENT_ID);
      if (christmasEvent) {
        console.log(`📅 Christmas Fun event status: ${christmasEvent.status}`);
        if (christmasEvent.status === 'PUBLISHED') {
          console.log('🎉 SUCCESS: Event is now PUBLISHED and available for booking!');
        }
      }
    } else {
      console.log('❌ Failed to publish event:', updateResult);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

publishEvent();
