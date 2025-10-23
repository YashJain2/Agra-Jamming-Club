"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Check, Star, Calendar, Users, Music, Gift, Crown, Clock, CheckCircle, XCircle, User } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  plan: {
    name: string;
    duration: number;
    benefits: string[];
  };
}

export default function SubscriptionsPage() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (session && !isAdmin) {
      fetchSubscriptions();
    }
  }, [session, isAdmin]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/subscriptions', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE');
  const daysLeft = activeSubscription ? getDaysLeft(activeSubscription.endDate) : 0;
  const features = [
    "Access to all monthly events",
    "Priority booking for tickets",
    "Member-only discounts",
    "Exclusive member events",
    "Free guest passes (2 per month)",
    "Early access to event announcements"
  ]

  const benefits = [
    {
      icon: <Calendar className="h-6 w-6 text-purple-600" />,
      title: "Monthly Events",
      description: "Attend 2 amazing events every month"
    },
    {
      icon: <Users className="h-6 w-6 text-blue-600" />,
      title: "Community Access",
      description: "Join our exclusive member community"
    },
    {
      icon: <Music className="h-6 w-6 text-green-600" />,
      title: "Live Performances",
      description: "Experience intimate live music sessions"
    },
    {
      icon: <Gift className="h-6 w-6 text-orange-600" />,
      title: "Member Benefits",
      description: "Special discounts and exclusive perks"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Subscription Status for Signed-in Users (Non-Admin) */}
      {session && !isAdmin && (
        <section className="bg-white py-8 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : activeSubscription ? (
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Active Subscription</h2>
                    <p className="text-green-100 mt-1">{activeSubscription.plan.name}</p>
                    <div className="mt-2">
                      <span className="text-lg font-medium">
                        {daysLeft <= 0 ? 'Expired' : `${daysLeft} days remaining`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">₹{activeSubscription.price}</div>
                    <div className="text-green-100 text-sm">
                      Expires: {new Date(activeSubscription.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {daysLeft <= 7 && daysLeft > 0 && (
                  <div className="mt-4 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-300 rounded-md">
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-yellow-200 mr-2" />
                      <p className="text-yellow-100">
                        Your subscription expires in {daysLeft} days. Consider renewing to continue enjoying our services.
                      </p>
                    </div>
                  </div>
                )}

                {daysLeft <= 0 && (
                  <div className="mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-md">
                    <div className="flex items-center">
                      <XCircle className="h-5 w-5 text-red-200 mr-2" />
                      <p className="text-red-100">
                        Your subscription has expired. Renew now to continue accessing premium features.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">No Active Subscription</h2>
                    <p className="text-purple-100 mt-1">Get access to premium events and exclusive benefits</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold">₹1</span>
                    <div className="text-purple-100 text-sm">per month</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Header */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Monthly Subscription
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Join our musical community and never miss an event. Get exclusive access to all our monthly gatherings.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white text-center">
              <div className="flex justify-center mb-4">
                <Crown className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Monthly Membership</h2>
              <p className="text-purple-100 mb-6">Perfect for music lovers who want to be part of our community</p>
              <div className="text-5xl font-bold mb-2">₹1</div>
              <div className="text-purple-100">per month</div>
            </div>

            <div className="p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">What&apos;s Included:</h3>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="text-center">
                {isAdmin ? (
                  <div className="space-y-4">
                    <div className="bg-blue-100 text-blue-800 px-6 py-3 rounded-lg font-semibold">
                      👑 Admin Access - Full Platform Control
                    </div>
                    <p className="text-sm text-gray-500">
                      As an admin, you have full access to all features
                    </p>
                  </div>
                ) : activeSubscription ? (
                  <div className="space-y-4">
                    <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-semibold">
                      ✓ You have an active subscription
                    </div>
                    <Link 
                      href="/dashboard"
                      className="bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors inline-block"
                    >
                      View Dashboard
                    </Link>
                  </div>
                ) : session ? (
                  <div className="space-y-4">
                    <Link 
                      href="/subscriptions/checkout"
                      className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-block"
                    >
                      Subscribe Now
                    </Link>
                    <p className="text-sm text-gray-500">
                      Cancel anytime • No long-term commitment
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link 
                      href="/auth/signin"
                      className="bg-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors inline-block"
                    >
                      Sign In to Subscribe
                    </Link>
                    <p className="text-sm text-gray-500">
                      Create an account to access subscriptions
                    </p>
                    <div className="text-center">
                      <Link 
                        href="/auth/signup"
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Don't have an account? Sign up
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Subscribe?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join our community and enjoy exclusive benefits designed for music lovers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Members Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                &quot;The monthly subscription has been amazing! I&apos;ve met so many fellow musicians and the events are always incredible.&quot;
              </p>
              <div className="font-semibold">- Priya Sharma</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                &quot;Best investment for any music lover in Agra. The community is welcoming and the events are top-notch.&quot;
              </p>
              <div className="font-semibold">- Rajesh Kumar</div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                &quot;The priority booking alone makes it worth it. Never have to worry about missing out on tickets!&quot;
              </p>
              <div className="font-semibold">- Anjali Singh</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Can I cancel my subscription anytime?</h3>
              <p className="text-gray-600">Yes, you can cancel your subscription at any time. There are no long-term commitments or cancellation fees.</p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">What if I miss an event?</h3>
              <p className="text-gray-600">While we can&apos;t refund for missed events, subscribers get priority booking for future events and exclusive member-only sessions.</p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">Are guest passes included?</h3>
              <p className="text-gray-600">Yes! Each monthly subscription includes 2 free guest passes that you can use to bring friends to events.</p>
            </div>

            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">How do I book tickets with my subscription?</h3>
              <p className="text-gray-600">Simply log in to your account and visit the events page. You&apos;ll see a &quot;Book with Subscription&quot; option for all events.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join Our Musical Community?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Start your subscription today and become part of Agra&apos;s most vibrant musical community.
          </p>
          {session ? (
            <Link 
              href="/subscriptions/checkout"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Start Your Subscription
            </Link>
          ) : (
            <Link 
              href="/auth/signin"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Sign In to Subscribe
            </Link>
          )}
        </div>
      </section>

    </div>
  )
}
