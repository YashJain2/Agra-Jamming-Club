'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface RazorpayPaymentProps {
  eventId: string;
  eventTitle: string;
  price: number;
  maxTickets: number;
  soldTickets: number;
  onPaymentSuccess?: (ticket: any) => void;
  onPaymentError?: (error: string) => void;
}

interface OrderData {
  eventId: string;
  quantity: number;
  totalAmount: number;
  specialRequests?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  userId: string | null;
  isGuestCheckout: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayPayment({
  eventId,
  eventTitle,
  price,
  maxTickets,
  soldTickets,
  onPaymentSuccess,
  onPaymentError,
}: RazorpayPaymentProps) {
  const { data: session } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const availableTickets = maxTickets - soldTickets;
  const totalAmount = price * quantity;

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

  const handlePayment = async () => {
    try {
      setIsLoading(true);

      // Validate guest details if guest checkout
      if (isGuestCheckout) {
        if (!guestDetails.name || !guestDetails.email || !guestDetails.phone) {
          onPaymentError?.('Please fill in all guest details');
          return;
        }
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        onPaymentError?.('Failed to load payment gateway');
        return;
      }

      // Create order
      const orderResponse = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          quantity,
          specialRequests: specialRequests || undefined,
          guestName: isGuestCheckout ? guestDetails.name : undefined,
          guestEmail: isGuestCheckout ? guestDetails.email : undefined,
          guestPhone: isGuestCheckout ? guestDetails.phone : undefined,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        onPaymentError?.(orderData.error || 'Failed to create payment order');
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
              onPaymentSuccess?.(verifyData.data);
              
              // Redirect to success page for guest checkout
              if (isGuestCheckout) {
                const successUrl = `/success/ticket?` + new URLSearchParams({
                  ticketId: verifyData.data.id,
                  eventTitle: eventTitle,
                  eventDate: verifyData.data.event?.date || '',
                  eventTime: verifyData.data.event?.time || '',
                  eventVenue: verifyData.data.event?.venue || '',
                  quantity: verifyData.data.quantity.toString(),
                  totalPrice: verifyData.data.totalPrice.toString(),
                  guestName: guestDetails.name,
                  guestEmail: guestDetails.email,
                }).toString();
                
                setTimeout(() => {
                  window.location.href = successUrl;
                }, 2000);
              }
            } else {
              onPaymentError?.(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            onPaymentError?.('Payment verification failed');
          }
        },
        prefill: {
          name: session?.user?.name || guestDetails.name || '',
          email: session?.user?.email || guestDetails.email || '',
          contact: guestDetails.phone || '',
        },
        notes: {
          event: eventTitle,
          quantity: quantity.toString(),
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError?.('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Book Tickets</h3>
      
      {/* Quantity Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Tickets
        </label>
        <select
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          disabled={isLoading}
        >
          {Array.from({ length: Math.min(10, availableTickets) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1} ticket{i + 1 > 1 ? 's' : ''}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">
          {availableTickets} tickets available
        </p>
      </div>

      {/* Special Requests */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          placeholder="Any special requirements or requests..."
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Guest Checkout Toggle */}
      {!session && (
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={isGuestCheckout}
              onChange={(e) => setIsGuestCheckout(e.target.checked)}
              className="mr-2"
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Checkout as guest</span>
          </label>
        </div>
      )}

      {/* Guest Details */}
      {isGuestCheckout && (
        <div className="mb-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={guestDetails.name}
              onChange={(e) => setGuestDetails({ ...guestDetails, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={guestDetails.email}
              onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={guestDetails.phone}
              onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {quantity} ticket{quantity > 1 ? 's' : ''} × ₹{price}
          </span>
          <span className="font-semibold text-lg">₹{totalAmount}</span>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={isLoading || availableTickets < quantity}
        className="w-full bg-pink-500 text-white py-3 px-4 rounded-md font-medium hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : `Pay ₹${totalAmount}`}
      </button>

      {availableTickets < quantity && (
        <p className="text-red-500 text-sm mt-2">
          Not enough tickets available
        </p>
      )}
    </div>
  );
}
