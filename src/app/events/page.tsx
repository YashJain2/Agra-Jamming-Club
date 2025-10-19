"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, Ticket, ArrowRight, Crown } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Upcoming Events
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Join us for amazing musical experiences. Book your tickets now and be part of our vibrant community.
            </p>
          </div>
        </div>
      </section>

      {/* Subscription Status */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Subscription CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-8 text-white text-center">
            <div className="flex items-center justify-center mb-4">
              <Crown className="h-8 w-8 mr-2" />
              <h2 className="text-3xl font-bold">
                Get FREE Access to All Events!
              </h2>
            </div>
            <p className="text-xl text-purple-100 mb-6 max-w-2xl mx-auto">
              Subscribe to our monthly membership and enjoy unlimited free access to all events, 
              priority booking, member discounts, and exclusive benefits.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/subscriptions"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
              >
                Subscribe Now - ₹999/month
              </Link>
              <Link 
                href="/dashboard"
                className="bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-400 transition-colors inline-block"
              >
                View My Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
