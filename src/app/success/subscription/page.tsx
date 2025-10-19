'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Crown, Calendar, Gift, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

function SubscriptionSuccessContent() {
  const searchParams = useSearchParams();
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get subscription data from URL parameters or localStorage
    const subscriptionId = searchParams.get('subscriptionId');
    const planName = searchParams.get('planName');
    const planDuration = searchParams.get('planDuration');
    const price = searchParams.get('price');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const guestName = searchParams.get('guestName');
    const guestEmail = searchParams.get('guestEmail');

    if (subscriptionId) {
      setSubscriptionData({
        subscriptionId,
        planName,
        planDuration: parseInt(planDuration || '1'),
        price: parseFloat(price || '0'),
        startDate,
        endDate,
        guestName,
        guestEmail,
      });
    }
    setLoading(false);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscription Not Found</h1>
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const getDaysLeft = (endDate: string) => {
    const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const daysLeft = getDaysLeft(subscriptionData.endDate);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Welcome to Agra Jamming Club!
          </h1>
          <p className="text-lg text-gray-600">
            Your <strong>{subscriptionData.planName}</strong> subscription is now active
          </p>
        </div>

        {/* Subscription Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Crown className="h-6 w-6 mr-2" />
              Subscription Details
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Crown className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{subscriptionData.planName}</p>
                      <p className="text-sm text-gray-600">{subscriptionData.planDuration} month(s)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Active until</p>
                      <p className="font-medium text-gray-900">{new Date(subscriptionData.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-bold text-lg text-green-600">₹{subscriptionData.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription ID:</span>
                    <span className="font-mono text-sm">{subscriptionData.subscriptionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Remaining:</span>
                    <span className="font-medium text-blue-600">{daysLeft} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Gift className="h-6 w-6 mr-2" />
              What's Included
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Access to all monthly events</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Priority booking for tickets</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Member-only discounts</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Exclusive member events</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Free guest passes (2 per month)</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <span className="text-gray-700">Early access to event announcements</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        {subscriptionData.guestName && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Mail className="h-6 w-6 mr-2" />
                Member Information
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{subscriptionData.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{subscriptionData.guestEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">🎁 Next Steps</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• Check your email for the detailed subscription confirmation</li>
            <li>• Browse upcoming events - many are free for members!</li>
            <li>• Use your member benefits for discounts on additional tickets</li>
            <li>• Invite friends with your free guest passes</li>
            <li>• Contact us if you have any questions about your membership</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Link
              href="/events"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Browse Events
            </Link>
            
            {subscriptionData.guestEmail && (
              <Link
                href={`/auth/signup?email=${encodeURIComponent(subscriptionData.guestEmail)}&name=${encodeURIComponent(subscriptionData.guestName || '')}`}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            Want to manage your subscription easily? Create an account to access your membership details and get updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    }>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
