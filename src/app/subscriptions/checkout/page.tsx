"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Check, Crown, CreditCard, User, Mail, Phone, Calendar, Loader2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  benefits: string[];
  isActive: boolean;
}

export default function SubscriptionCheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchPlans();
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscription-plans?active=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const data = await response.json();
      setPlans(data.data || []);
      
      // Select the first plan by default
      if (data.data && data.data.length > 0) {
        setSelectedPlan(data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    setError('');

    try {
      // Create subscription
      const subscriptionResponse = await fetch('/api/subscriptions/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
        }),
      });

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionData.success) {
        throw new Error(subscriptionData.error || 'Failed to create subscription');
      }

      // Create payment order
      const orderResponse = await fetch('/api/payment/razorpay/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData.data.id,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const options = {
          key: orderData.data.key,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: 'Agra Jamming Club',
          description: `${selectedPlan.name} Subscription`,
          image: '/logo.png',
          order_id: orderData.data.orderId,
          handler: async function (response: any) {
            try {
              const verifyResponse = await fetch('/api/payment/razorpay/subscription/verify', {
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
                router.push('/success/subscription');
              } else {
                throw new Error(verifyData.error || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setError('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: session?.user.name || '',
            email: session?.user.email || '',
            contact: '',
          },
          theme: {
            color: '#ec4899',
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      script.onerror = () => {
        setError('Failed to load payment gateway');
      };
      document.body.appendChild(script);

    } catch (error) {
      console.error('Subscription error:', error);
      setError(error instanceof Error ? error.message : 'Subscription failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md max-w-md">
            {error}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Subscription</h1>
          <p className="text-gray-600">Select a plan that works best for you</p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'ring-2 ring-pink-500 border-pink-500'
                  : 'border border-gray-200 hover:shadow-xl'
              }`}
              onClick={() => setSelectedPlan(plan)}
            >
              <div className="bg-gradient-to-r from-pink-600 to-purple-600 p-6 text-white text-center">
                <div className="flex justify-center mb-4">
                  <Crown className="h-12 w-12" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-pink-100 mb-4">{plan.description}</p>
                <div className="text-4xl font-bold mb-2">₹{plan.price}</div>
                <div className="text-pink-100">
                  {plan.duration === 1 ? 'per month' : `for ${plan.duration} months`}
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-semibold mb-4">What's Included:</h4>
                <ul className="space-y-2">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Summary */}
        {selectedPlan && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">
                  {selectedPlan.duration === 1 ? '1 month' : `${selectedPlan.duration} months`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">₹{selectedPlan.price}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>₹{selectedPlan.price}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <div className="text-center">
          <button
            onClick={handleSubscription}
            disabled={!selectedPlan || isProcessing}
            className="bg-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Subscribe Now
              </>
            )}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            Cancel anytime • Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
