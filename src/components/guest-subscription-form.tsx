'use client';

import { useState } from 'react';
import { Calendar, CreditCard, User, Mail, Phone, CheckCircle } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  features: string[];
  isActive: boolean;
}

interface GuestSubscriptionFormProps {
  plan: SubscriptionPlan;
  onSuccess?: (subscription: any) => void;
  onCancel?: () => void;
}

export default function GuestSubscriptionForm({ plan, onSuccess, onCancel }: GuestSubscriptionFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [subscription, setSubscription] = useState<any>(null);
  
  const [guestDetails, setGuestDetails] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscriptionPurchase = async () => {
    if (!guestDetails.name || !guestDetails.email || !guestDetails.phone) {
      alert('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create guest subscription
      console.log('Creating guest subscription...');
      const subscriptionResponse = await fetch('/api/subscriptions/guest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          guestName: guestDetails.name,
          guestEmail: guestDetails.email,
          guestPhone: guestDetails.phone,
        }),
      });

      const subscriptionData = await subscriptionResponse.json();

      if (!subscriptionData.success) {
        alert(subscriptionData.error || 'Failed to create subscription');
        return;
      }

      console.log('✅ Guest subscription created:', subscriptionData.data.subscription.id);

      // Step 2: Create Razorpay order
      console.log('Creating Razorpay order...');
      const orderResponse = await fetch('/api/payment/razorpay/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscriptionData.data.subscription.id,
          guestName: guestDetails.name,
          guestEmail: guestDetails.email,
          guestPhone: guestDetails.phone,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(orderData.error || 'Failed to create payment order');
        return;
      }

      console.log('✅ Razorpay order created:', orderData.data.orderId);

      // Step 3: Load Razorpay script
      const razorpayLoaded = await loadRazorpayScript();
      if (!razorpayLoaded) {
        alert('Failed to load Razorpay script');
        return;
      }

      // Step 4: Configure Razorpay options
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
            console.log('Payment successful, verifying...');
            
            // Step 5: Verify payment
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
              console.log('✅ Payment verification successful');
              setSubscription(verifyData.data);
              setStep('success');
              if (onSuccess) {
                onSuccess(verifyData.data);
              }
              
              // Redirect to success page
              const successUrl = `/success/subscription?` + new URLSearchParams({
                subscriptionId: verifyData.data.subscription.id,
                planName: verifyData.data.subscription.plan.name,
                planDuration: verifyData.data.subscription.plan.duration.toString(),
                price: verifyData.data.subscription.price.toString(),
                startDate: verifyData.data.subscription.startDate,
                endDate: verifyData.data.subscription.endDate,
                guestName: verifyData.data.guestDetails.name,
                guestEmail: verifyData.data.guestDetails.email,
              }).toString();
              
              setTimeout(() => {
                window.location.href = successUrl;
              }, 2000);
            } else {
              alert(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: guestDetails.name,
          email: guestDetails.email,
          contact: guestDetails.phone,
        },
        notes: {
          subscription: plan.name,
          duration: `${plan.duration} months`,
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          },
        },
      };

      // Step 6: Open Razorpay checkout
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Subscription purchase error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
        <p className="text-gray-600 mb-4">
          Your {plan.name} subscription has been successfully activated.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-2">Subscription Details</h3>
          <p className="text-sm text-gray-600">
            <strong>Plan:</strong> {subscription?.subscription?.plan?.name}<br/>
            <strong>Duration:</strong> {subscription?.subscription?.plan?.duration} months<br/>
            <strong>Price:</strong> ₹{subscription?.subscription?.price}<br/>
            <strong>Status:</strong> Active
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 transition-colors"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscribe to {plan.name}</h2>
        <p className="text-gray-600">Fill in your details to purchase the subscription</p>
      </div>

      {/* Plan Summary */}
      <div className="bg-pink-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{plan.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-pink-600">₹{plan.price}</span>
          <span className="text-sm text-gray-500">{plan.duration} months</span>
        </div>
      </div>

      {/* Guest Details Form */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="h-5 w-5 mr-2" />
          Your Details
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            name="name"
            value={guestDetails.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter your full name"
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={guestDetails.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter your email"
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={guestDetails.phone}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter your phone number"
            disabled={isProcessing}
          />
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
        <ul className="space-y-2">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleSubscriptionPurchase}
          disabled={isProcessing}
          className="w-full bg-pink-600 text-white py-3 px-4 rounded-md hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Subscribe Now - ₹{plan.price}
            </>
          )}
        </button>
        
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isProcessing}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        By subscribing, you agree to our terms and conditions. Payment is processed securely via Razorpay.
      </p>
    </div>
  );
}
