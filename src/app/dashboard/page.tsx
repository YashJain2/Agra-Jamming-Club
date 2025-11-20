"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

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

interface Ticket {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  isVerified: boolean;
  event: {
    title: string;
    date: string;
    venue: string;
    imageUrl?: string;
  };
}

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Redirect admin users to admin panel
  useEffect(() => {
    if (status === 'authenticated' && isAdmin) {
      router.push('/admin');
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (session) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [subscriptionsRes, ticketsRes] = await Promise.all([
        fetch('/api/subscriptions', { credentials: 'include' }),
        fetch('/api/tickets', { credentials: 'include' })
      ]);

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json();
        setSubscriptions(subscriptionsData.data || []);
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json();
        setTickets(ticketsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const daysLeft = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const getStatusColor = (daysLeft: number, status: string) => {
    if (status !== 'ACTIVE') return 'text-gray-600';
    if (daysLeft <= 0) return 'text-red-600';
    if (daysLeft <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard for admin users (they'll be redirected)
  if (isAdmin) {
    return null;
  }

  const activeSubscription = subscriptions.find(s => s.status === 'ACTIVE');
  const daysLeft = activeSubscription ? getDaysLeft(activeSubscription.endDate) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {session.user.name}!</h1>
          <p className="text-gray-600 mt-2">Here's your account overview</p>
        </div>

        {/* Subscription Status */}
        {activeSubscription ? (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                <p className="text-gray-600">{activeSubscription.plan.name}</p>
                <div className="mt-2">
                  <span className={`text-lg font-medium ${getStatusColor(daysLeft, activeSubscription.status)}`}>
                    {daysLeft <= 0 ? 'Expired' : `${daysLeft} days remaining`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">₹{activeSubscription.price}</div>
                <div className="text-sm text-gray-500">
                  Expires: {new Date(activeSubscription.endDate).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            {daysLeft <= 7 && daysLeft > 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-yellow-800">
                    Your subscription expires in {daysLeft} days. Consider renewing to continue enjoying our services.
                  </p>
                </div>
              </div>
            )}

            {daysLeft <= 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-red-800">
                    Your subscription has expired. Renew now to continue accessing premium features.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">No Active Subscription</h2>
                <p className="text-purple-100 mt-1">Get access to premium events and exclusive benefits</p>
              </div>
              <div className="text-right">
                <a 
                  href="/subscriptions" 
                  className="bg-white text-purple-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  View Plans
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Ticket className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Tickets</p>
                <p className="text-2xl font-semibold text-gray-900">{tickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Tickets</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tickets.filter(t => t.isVerified).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Tickets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">My Tickets</h3>
          </div>
          <div className="p-6">
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No tickets yet</p>
                <p className="text-gray-400">Book your first event ticket to get started!</p>
                <a href="/events" className="mt-4 inline-block bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 transition-colors">
                  Browse Events
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden">
                        <Image
                          src={ticket.event.imageUrl || '/api/placeholder/100/100'}
                          alt={ticket.event.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="ml-4">
                        <h4 className="font-medium text-gray-900">{ticket.event.title}</h4>
                        <p className="text-sm text-gray-600">{ticket.event.venue}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(ticket.event.date).toLocaleDateString()} • {ticket.quantity} ticket(s)
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">₹{ticket.totalPrice}</div>
                      <div className="flex items-center">
                        {ticket.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <Clock className="h-4 w-4 text-yellow-600 mr-1" />
                        )}
                        <span className={`text-sm ${
                          ticket.isVerified ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {ticket.isVerified ? 'Verified' : 'Booked'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
