"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, Ticket, ArrowRight, AlertCircle } from 'lucide-react';
import { EventBookingCard } from '@/components/event-booking-card';
import { SubscriptionStatusCard } from '@/components/subscription-status-card';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  city: string;
  state: string;
  country: string;
  price: number;
  maxTickets: number;
  soldTickets: number;
  imageUrl: string;
  category: string;
  status: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookTicket = async (eventId: string, quantity: number, isFreeAccess: boolean) => {
    try {
      // For free access (subscribers), use the direct ticket creation
      if (isFreeAccess) {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventId,
            quantity,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          alert(data.message || 'Free ticket booked successfully!');
          fetchEvents();
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to book free ticket');
        }
        return;
      }

      // For paid tickets, redirect to Razorpay payment flow
      // This will be handled by the RazorpayPayment component
      alert('Please use the "Book Now" button to proceed with payment');
    } catch (error) {
      console.error('Error booking ticket:', error);
      alert('An error occurred while booking the ticket');
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
              Upcoming Events
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-purple-100 max-w-2xl mx-auto">
              Join us for amazing musical experiences. Book your tickets now and be part of our vibrant community.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Status */}
      <section className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SubscriptionStatusCard />
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="h-48 bg-gray-200 animate-pulse"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Available</h3>
              <p className="text-gray-600">Check back later for upcoming events!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {events.map((event) => (
                <EventBookingCard
                  key={event.id}
                  event={event}
                  onBookTicket={handleBookTicket}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Terms & Conditions Section */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-6 w-6 text-purple-600 mr-2" />
              Terms & Conditions
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>• No refunds or adjustments once tickets are booked.</p>
              <p>• No alcohol, smoking, or substances allowed.</p>
              <p>• Kids are welcome, but parents must ensure they don&apos;t cause disturbance.</p>
              <p>• This is a No Judgement Zone — sing freely; perfection isn&apos;t the goal.</p>
              <p>• No Vulgar Songs or Language — keep lyrics and behavior respectful.</p>
              <p>• No Food Allowed during the session.</p>
              <p>• Pre-Approval Required for original compositions — all content must align with AJC&apos;s values.</p>
              <p>• Inclusive Vibes Only — everyone deserves to feel safe and accepted.</p>
              <p>• Cheer & Encourage — we rise together.</p>
              <p>• Be On Time and respect the schedule.</p>
              <p>• Seating will be on first come first serve basis.</p>
              <p className="font-semibold text-gray-900 mt-2">
                • Every individual who will attend the event should fill the form separately for verification. Anyone who fails to do so will be denied entry in the session.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
