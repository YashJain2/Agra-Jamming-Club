"use client";

import { useState, useEffect } from 'react';
import { Crown, Calendar, Gift, CheckCircle, XCircle, Clock } from 'lucide-react';

interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  canAccessEventsForFree: boolean;
  subscription?: {
    id: string;
    planId: string;
    startDate: string;
    endDate: string;
    status: string;
    plan: {
      id: string;
      name: string;
      price: number;
      duration: number;
      benefits: string[];
    };
  };
  daysRemaining?: number;
  isExpired?: boolean;
  benefits: string[];
}

interface SubscriptionStatusCardProps {
  className?: string;
  showBenefits?: boolean;
}

export function SubscriptionStatusCard({ className = '', showBenefits = true }: SubscriptionStatusCardProps) {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const { hasActiveSubscription, canAccessEventsForFree, subscription, daysRemaining, benefits } = subscriptionStatus;

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Crown className={`h-6 w-6 ${hasActiveSubscription ? 'text-yellow-500' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold text-gray-900">
            {hasActiveSubscription ? 'Active Subscription' : 'No Active Subscription'}
          </h3>
        </div>
        
        {hasActiveSubscription && (
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            canAccessEventsForFree 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {canAccessEventsForFree ? 'Free Access Available' : 'Subscription Expired'}
          </div>
        )}
      </div>

      {/* Subscription Details */}
      {hasActiveSubscription && subscription && (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plan:</span>
            <span className="font-medium text-gray-900">{subscription.plan.name}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Price:</span>
            <span className="font-medium text-gray-900">₹{subscription.plan.price}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Duration:</span>
            <span className="font-medium text-gray-900">{subscription.plan.duration} month(s)</span>
          </div>
          
          {daysRemaining !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Days Remaining:</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className={`font-medium ${
                  daysRemaining > 7 ? 'text-green-600' : 
                  daysRemaining > 3 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {daysRemaining} days
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Free Access Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          {canAccessEventsForFree ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            canAccessEventsForFree ? 'text-green-700' : 'text-red-700'
          }`}>
            {canAccessEventsForFree 
              ? 'You can access events for FREE this month!' 
              : 'Subscribe to get free access to events'
            }
          </span>
        </div>
      </div>

      {/* Benefits */}
      {showBenefits && benefits.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Gift className="h-4 w-4 mr-1" />
            Subscription Benefits
          </h4>
          <ul className="space-y-1">
            {benefits.map((benefit, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Call to Action */}
      {!hasActiveSubscription && (
        <div className="border-t pt-4 mt-4">
          <a
            href="/subscriptions"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-center block"
          >
            Subscribe Now
          </a>
        </div>
      )}
    </div>
  );
}
