"use client";

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Ticket, Crown, Gift, AlertCircle, XCircle } from 'lucide-react';
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

interface EventPricing {
  isFree: boolean;
  displayPrice: number;
  isPastEvent: boolean;
  subscriptionValid: boolean;
  subscriptionEndDate?: Date;
  reason: string;
  hasUsedFreeTicket?: boolean;
  canGetFreeTicket?: boolean;
}

interface EventBookingCardProps {
  event: Event;
  onBookTicket: (eventId: string, quantity: number, isFreeAccess: boolean) => void;
  className?: string;
}

export function EventBookingCard({ event, onBookTicket, className = '' }: EventBookingCardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [eventPricing, setEventPricing] = useState<EventPricing | null>(null);
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
        
        // Calculate event-specific pricing including free ticket availability
        const pricingResponse = await fetch('/api/events/pricing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            eventDate: event.date,
            eventPrice: event.price,
            eventId: event.id,
          })
        });
        
        if (pricingResponse.ok) {
          const pricingData = await pricingResponse.json();
          setEventPricing(pricingData.data);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleBookTicket = async () => {
    if (loading || eventPricing?.isPastEvent) return;
    
    setLoading(true);
    try {
      const isFreeAccess = eventPricing?.isFree || false;
      await onBookTicket(event.id, quantity, isFreeAccess);
    } catch (error) {
      console.error('Error booking ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableTickets = event.maxTickets - event.soldTickets;
  const isPastEvent = eventPricing?.isPastEvent || false;
  const hasActiveSubscription = subscriptionStatus?.canAccessEventsForFree || false;
  // Check if user can get free ticket (has subscription AND hasn't used it for this event)
  const canGetFreeTicket = hasActiveSubscription && (eventPricing?.canGetFreeTicket || false);
  // For subscription: 1 ticket is free, rest are paid (only if free ticket is available)
  const isFree = canGetFreeTicket && quantity === 1;
  const displayPrice = eventPricing?.displayPrice || event.price;
  
  // Calculate total price: for subscribers with free ticket available, 1 free + rest paid
  const calculateTotalPrice = () => {
    if (isPastEvent) return 0;
    if (canGetFreeTicket && quantity === 1) return 0; // Free
    if (canGetFreeTicket && quantity > 1) return (quantity - 1) * event.price; // 1 free + rest paid
    return quantity * event.price; // Regular pricing (no subscription OR already used free ticket)
  };
  
  const totalPrice = calculateTotalPrice();

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
          src={event.imageUrl || '/raahein-event.jpg'}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = `https://via.placeholder.com/400x300/6366f1/ffffff?text=${encodeURIComponent(event.title)}`;
          }}
        />
        
        {/* Status Badge */}
        {isPastEvent ? (
          <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <XCircle className="h-4 w-4 mr-1" />
            PAST EVENT
          </div>
        ) : isFree ? (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Crown className="h-4 w-4 mr-1" />
            FREE ACCESS
          </div>
        ) : (
          <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Ticket className="h-4 w-4 mr-1" />
            ₹{event.price}
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
        </div>

        {/* Attractive Ticket Counter */}
        {!isPastEvent && (
          <div className="mb-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Ticket className="h-5 w-5 text-pink-600 mr-2" />
                <span className="text-sm font-semibold text-gray-700">Tickets Remaining</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold text-pink-600">{availableTickets}</span>
                <span className="text-sm text-gray-500 ml-1">/ {event.maxTickets}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  event.maxTickets > 0 && availableTickets / event.maxTickets > 0.5
                    ? 'bg-green-500'
                    : event.maxTickets > 0 && availableTickets / event.maxTickets > 0.2
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${event.maxTickets > 0 ? (availableTickets / event.maxTickets) * 100 : 0}%` }}
              ></div>
            </div>

            {/* Urgency Message */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                {event.maxTickets - availableTickets} tickets sold
              </span>
              {availableTickets <= 20 && availableTickets > 0 && (
                <span className="text-red-600 font-semibold animate-pulse">
                  ⚠️ Only {availableTickets} left!
                </span>
              )}
              {availableTickets === 0 && (
                <span className="text-red-600 font-semibold">Sold Out</span>
              )}
              {availableTickets > 20 && (
                <span className="text-green-600 font-medium">✨ Book now!</span>
              )}
            </div>
          </div>
        )}

        {/* Subscription Status */}
        {!subscriptionLoading && eventPricing && (
          <div className="mb-4">
            {isPastEvent ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      This event has already passed
                    </p>
                    <p className="text-xs text-red-600">
                      Booking is no longer available
                    </p>
                  </div>
                </div>
              </div>
            ) : isFree ? (
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
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {eventPricing.reason}
                    </p>
                    {eventPricing.subscriptionEndDate && (
                      <p className="text-xs text-yellow-600">
                        Subscription expires: {new Date(eventPricing.subscriptionEndDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
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
          {isPastEvent ? (
            // Past event - disabled booking
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <select
                    value={quantity}
                    disabled={true}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  >
                    <option value={1}>1</option>
                  </select>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Price</div>
                  <div className="text-2xl font-bold text-gray-400">N/A</div>
                  <div className="text-xs text-gray-500">
                    Event has passed
                  </div>
                </div>
              </div>

              <button
                disabled={true}
                className="w-full py-3 px-4 rounded-md font-medium bg-gray-400 text-white cursor-not-allowed"
              >
                <div className="flex items-center justify-center">
                  <XCircle className="h-4 w-4 mr-2" />
                  Event Has Passed
                </div>
              </button>
            </div>
          ) : isFree ? (
            // Free access booking (quantity = 1, subscription active)
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
                  {quantity === 1 ? (
                    <>
                      <div className="text-2xl font-bold text-green-600">FREE</div>
                      <div className="text-xs text-gray-500 line-through">
                        ₹{event.price}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold">₹{totalPrice}</div>
                      <div className="text-xs text-gray-500">
                        1 free + {quantity - 1} × ₹{event.price}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {quantity === 1 ? (
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
              ) : (
                // For quantity > 1, use Razorpay payment
                <RazorpayPayment
                  eventId={event.id}
                  eventTitle={event.title}
                  price={event.price}
                  maxTickets={event.maxTickets}
                  soldTickets={event.soldTickets}
                  onPaymentSuccess={(ticket) => {
                    alert('Payment successful! Your tickets have been booked.');
                  }}
                  onPaymentError={(error) => {
                    alert(`Payment failed: ${error}`);
                  }}
                />
              )}
            </div>
          ) : availableTickets === 0 ? (
            // Sold out - show disabled booking
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                <div className="flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600 mr-2" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-red-800">SOLD OUT</h3>
                    <p className="text-sm text-red-600 mt-1">
                      All tickets for this event have been sold
                    </p>
                  </div>
                </div>
              </div>
              <button
                disabled={true}
                className="w-full py-3 px-4 rounded-md font-medium bg-red-500 text-white cursor-not-allowed"
              >
                SOLD OUT
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
