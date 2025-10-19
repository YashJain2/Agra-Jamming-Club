"use client";

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Ticket, Crown, Gift } from 'lucide-react';
import RazorpayPayment from './razorpay-payment';

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

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  canAccessEventsForFree: boolean;
  subscription?: {
    plan: {
      name: string;
    };
  };
  daysRemaining?: number;
}

interface EventBookingCardProps {
  event: Event;
  onBookTicket: (eventId: string, quantity: number, isFreeAccess: boolean) => void;
  className?: string;
}

export function EventBookingCard({ event, onBookTicket, className = '' }: EventBookingCardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleBookTicket = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const isFreeAccess = subscriptionStatus?.canAccessEventsForFree || false;
      await onBookTicket(event.id, quantity, isFreeAccess);
    } catch (error) {
      console.error('Error booking ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableTickets = event.maxTickets - event.soldTickets;
  const canAccessForFree = subscriptionStatus?.canAccessEventsForFree || false;
  const displayPrice = canAccessForFree ? 0 : event.price;
  const totalPrice = displayPrice * quantity;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* Event Image */}
      <div className="h-48 bg-gray-200 relative">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(event.title)}`;
          }}
        />
        
        {/* Free Access Badge */}
        {canAccessForFree && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Crown className="h-4 w-4 mr-1" />
            FREE ACCESS
          </div>
        )}
      </div>

      {/* Event Details */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
          <p className="text-gray-600 text-sm line-clamp-2">{event.description}</p>
        </div>

        {/* Event Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {event.time}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            {event.venue}, {event.city}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            {availableTickets} tickets available
          </div>
        </div>

        {/* Subscription Status */}
        {!subscriptionLoading && (
          <div className="mb-4">
            {canAccessForFree ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Gift className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Free access with {subscriptionStatus?.subscription?.plan.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {subscriptionStatus?.daysRemaining} days remaining
                    </p>
                  </div>
                </div>
              </div>
            ) : subscriptionStatus?.hasActiveSubscription ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  Subscription expired. Regular pricing applies.
                </p>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Subscribe to get free access to all events!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Booking Section */}
        <div className="border-t pt-4">
          {canAccessForFree ? (
            // Free access booking
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={loading}
                  >
                    {Array.from({ length: Math.min(10, availableTickets) }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Price</div>
                  <div className="text-2xl font-bold text-green-600">FREE</div>
                  <div className="text-xs text-gray-500 line-through">
                    ₹{event.price * quantity}
                  </div>
                </div>
              </div>

              <button
                onClick={handleBookTicket}
                disabled={loading || availableTickets === 0}
                className="w-full py-3 px-4 rounded-md font-medium transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  'Booking...'
                ) : availableTickets === 0 ? (
                  'Sold Out'
                ) : (
                  <div className="flex items-center justify-center">
                    <Crown className="h-4 w-4 mr-2" />
                    Book Free Ticket
                  </div>
                )}
              </button>
            </div>
          ) : (
            // Paid ticket booking with Razorpay
            <RazorpayPayment
              eventId={event.id}
              eventTitle={event.title}
              price={event.price}
              maxTickets={event.maxTickets}
              soldTickets={event.soldTickets}
              onPaymentSuccess={(ticket) => {
                alert('Payment successful! Your tickets have been booked.');
                // You can add additional success handling here
              }}
              onPaymentError={(error) => {
                alert(`Payment failed: ${error}`);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
