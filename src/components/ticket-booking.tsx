"use client";

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Minus, Plus, CreditCard, Crown } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  maxTickets: number;
  availableTickets: number;
  image: string;
}

interface TicketBookingProps {
  event: Event;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function TicketBooking({ event }: TicketBookingProps) {
  const { data: session } = useSession();
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    hasActiveSubscription: boolean;
    canAccessEventsForFree: boolean;
    subscription?: any;
    daysRemaining?: number;
  } | null>(null);
  const [eventPricing, setEventPricing] = useState<{
    canGetFreeTicket: boolean;
    hasUsedFreeTicket: boolean;
  } | null>(null);

  const isPastEvent = new Date(event.date) < new Date();

  // Check subscription status and event pricing for signed-in users
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (session) {
        try {
          const response = await fetch('/api/subscription/status');
          if (response.ok) {
            const data = await response.json();
            setSubscriptionStatus(data.data);
          }

          // Check event-specific pricing including free ticket availability
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
            }),
          });

          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            setEventPricing(pricingData.data);
          }
        } catch (error) {
          console.error('Error checking subscription status:', error);
        }
      }
    };

    checkSubscriptionStatus();
  }, [session, event.id, event.date, event.price]);

  // Calculate pricing based on subscription status and free ticket availability
  const calculateTotalPrice = () => {
    if (isPastEvent) return 0;
    
    // If user can get free ticket (has subscription AND hasn't used it for this event)
    const canGetFreeTicket = session && subscriptionStatus?.canAccessEventsForFree && eventPricing?.canGetFreeTicket;
    
    if (canGetFreeTicket) {
      if (ticketQuantity === 1) {
        return 0; // Free
      } else {
        return (ticketQuantity - 1) * event.price; // 1 free + rest paid
      }
    }
    
    // Regular pricing (no subscription OR already used free ticket)
    return ticketQuantity * event.price;
  };

  const totalPrice = calculateTotalPrice();
  const hasActiveSubscription = session && subscriptionStatus?.canAccessEventsForFree;
  const canGetFreeTicket = hasActiveSubscription && eventPricing?.canGetFreeTicket;
  const freeTicketsCount = canGetFreeTicket ? Math.min(1, ticketQuantity) : 0;
  const paidTicketsCount = canGetFreeTicket ? Math.max(0, ticketQuantity - 1) : ticketQuantity;

  const handleQuantityChange = (change: number) => {
    const newQuantity = ticketQuantity + change;
    if (newQuantity >= 1 && newQuantity <= Math.min(10, event.availableTickets)) {
      setTicketQuantity(newQuantity);
    }
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBooking = async () => {
    // Prevent booking for past events
    if (isPastEvent) {
      alert('This event has already passed. Booking is no longer available.');
      return;
    }

    // Check if user can book for free (has subscription AND hasn't used free ticket for this event)
    const canBookForFree = session && subscriptionStatus?.canAccessEventsForFree && eventPricing?.canGetFreeTicket;
    
    // Determine if this should be guest checkout
    const shouldUseGuestCheckout = !session || isGuestCheckout;
    
    // Validate guest details if guest checkout
    if (shouldUseGuestCheckout) {
      if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
        alert('Please fill in all customer details (name, email, phone)');
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Validate phone number
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(customerInfo.phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      // If user has subscription and quantity is 1, create ticket directly without payment (free)
      // If quantity > 1, we need to process payment for additional tickets
      if (canBookForFree && ticketQuantity === 1) {
        const response = await fetch('/api/tickets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: event.id,
            quantity: ticketQuantity,
            isFreeBooking: true, // Flag to indicate this is a free booking
          }),
        });

        if (response.ok) {
          const data = await response.json();
          alert('Ticket booked successfully! Your subscription covers this event.');
          window.location.reload();
        } else {
          const errorData = await response.json();
          alert(errorData.error || 'Failed to book tickets');
        }
        setIsProcessing(false);
        return;
      }

      // Load Razorpay script for paid booking
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Failed to load payment gateway');
        return;
      }

      // Create order
      const orderResponse = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event.id,
          quantity: ticketQuantity,
          guestName: shouldUseGuestCheckout ? customerInfo.name : undefined,
          guestEmail: shouldUseGuestCheckout ? customerInfo.email : undefined,
          guestPhone: shouldUseGuestCheckout ? customerInfo.phone : undefined,
        }),
      });

      console.log('Payment order response status:', orderResponse.status);
      console.log('Payment order response headers:', orderResponse.headers);
      
      if (!orderResponse.ok) {
        console.error('Payment order HTTP error:', orderResponse.status, orderResponse.statusText);
        alert(`Payment order failed: ${orderResponse.status} ${orderResponse.statusText}`);
        return;
      }
      
      const orderData = await orderResponse.json();
      console.log('Payment order response data:', orderData);

      if (!orderData.success) {
        console.error('Payment order failed:', orderData);
        alert(orderData.error || 'Failed to create payment order');
        return;
      }

      // Configure Razorpay options
      const options = {
        key: orderData.data.key,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: orderData.data.name,
        description: orderData.data.description,
        image: orderData.data.image,
        order_id: orderData.data.orderId,
        theme: orderData.data.theme,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                orderData: orderData.data.orderData,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              alert('Payment successful! Your tickets have been booked.');
              // You can redirect or show success message here
              window.location.reload();
            } else {
              alert(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: session?.user?.name || customerInfo.name || '',
          email: session?.user?.email || customerInfo.email || '',
          contact: customerInfo.phone || '',
        },
        notes: {
          event: event.title,
          quantity: ticketQuantity.toString(),
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Event Image */}
          <div className="md:w-1/2">
            <div className="relative h-64 md:h-full">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Booking Form */}
          <div className="md:w-1/2 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            
            {/* Event Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-3" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-3" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-3" />
                <span>{event.availableTickets} tickets available</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{event.description}</p>

            {/* Customer Information */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              
              {/* Guest Checkout Toggle */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isGuestCheckout}
                    onChange={(e) => setIsGuestCheckout(e.target.checked)}
                    className="mr-2"
                    disabled={isProcessing}
                  />
                  <span className="text-sm text-gray-700">
                    {session ? 'Use guest checkout instead of account' : 'Checkout as guest'}
                  </span>
                </label>
                {session && (
                  <p className="text-xs text-gray-500 mt-1">
                    You're signed in as {session.user?.email}. Check this box to checkout as guest instead.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter your full name"
                  disabled={isProcessing}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter your email"
                  disabled={isProcessing}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  placeholder="Enter your 10-digit phone number"
                  disabled={isProcessing}
                  required
                  pattern="[0-9]{10}"
                  title="Please enter a 10-digit phone number"
                />
              </div>
            </div>

            {/* Ticket Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Number of Tickets</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={ticketQuantity <= 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xl font-semibold px-4">{ticketQuantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={ticketQuantity >= Math.min(10, event.availableTickets)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Maximum 10 tickets per person
              </p>
            </div>

            {/* Past Event Status */}
            {isPastEvent && (
              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Event Has Passed</h3>
                      <p className="text-red-700">
                        This event has already occurred. Booking is no longer available.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Status */}
            {session && subscriptionStatus && !isPastEvent && (
              <div className="mb-6">
                {canGetFreeTicket ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <h3 className="text-lg font-semibold text-green-800">1 Free Ticket Available!</h3>
                        <p className="text-green-700">
                          Your {subscriptionStatus.subscription?.plan?.name} subscription includes 1 free ticket for this event.
                          {subscriptionStatus.daysRemaining && subscriptionStatus.daysRemaining > 0 && (
                            <span className="block text-sm">
                              {subscriptionStatus.daysRemaining} days remaining in your subscription.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : eventPricing?.hasUsedFreeTicket ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800">Free Ticket Already Used</h3>
                        <p className="text-yellow-700">
                          You&apos;ve already used your free ticket for this event. All tickets will be charged at regular price.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : subscriptionStatus.hasActiveSubscription ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <h3 className="text-lg font-semibold text-yellow-800">Subscription Expired</h3>
                        <p className="text-yellow-700">
                          Your subscription has expired. Please renew to access free events.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Crown className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800">Get Free Access!</h3>
                        <p className="text-blue-700">
                          Subscribe to get free access to all events. <a href="/subscriptions" className="underline">View plans</a>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              {canGetFreeTicket && ticketQuantity > 1 && (
                <div className="mb-3 pb-3 border-b">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">Free ticket (subscription):</span>
                    <span className="text-sm font-semibold text-green-600">1 × FREE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Additional tickets:</span>
                    <span className="text-sm font-semibold">{paidTicketsCount} × ₹{event.price}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per ticket:</span>
                <span className="font-semibold">
                  {isPastEvent ? (
                    <span className="text-gray-400">N/A</span>
                  ) : canGetFreeTicket && ticketQuantity === 1 ? (
                    <span className="text-green-600">FREE</span>
                  ) : canGetFreeTicket && ticketQuantity > 1 ? (
                    <span className="text-gray-500">
                      1 × <span className="text-green-600">FREE</span> + {paidTicketsCount} × ₹{event.price}
                    </span>
                  ) : (
                    `₹${event.price}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{ticketQuantity}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold">
                    {isPastEvent ? (
                      <span className="text-gray-400">N/A</span>
                  ) : canGetFreeTicket && totalPrice === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : canGetFreeTicket && totalPrice > 0 ? (
                      <span>
                        <span className="text-green-600 line-through text-sm mr-2">₹{ticketQuantity * event.price}</span>
                        <span>₹{totalPrice}</span>
                      </span>
                    ) : (
                      `₹${totalPrice}`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              onClick={handleBooking}
              disabled={isProcessing || event.availableTickets === 0 || isPastEvent}
              className="w-full bg-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isPastEvent ? (
                <>
                  <Calendar className="h-5 w-5 mr-2" />
                  Event Has Passed
                </>
              ) : isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {canGetFreeTicket && totalPrice === 0 ? (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Book Free with Subscription
                    </>
                  ) : canGetFreeTicket && totalPrice > 0 ? (
                    <>
                      <Crown className="h-5 w-5 mr-2" />
                      Book {freeTicketsCount} Free + {paidTicketsCount} Paid - ₹{totalPrice}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Book Now - ₹{totalPrice}
                    </>
                  )}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
