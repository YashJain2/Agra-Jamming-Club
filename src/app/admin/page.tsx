"use client";

import { useState, useEffect } from 'react'
import { Calendar, Users, DollarSign, Ticket, Plus, Eye, Edit, CheckCircle, XCircle, Settings, BarChart3, Shield, QrCode } from 'lucide-react'
import Image from 'next/image'
import { CreateEventForm } from '@/components/create-event-form'
import { GuestVerification } from '@/components/guest-verification'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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
  status: string;
  category: string;
  imageUrl: string;
  gallery: string[];
  tags: string[];
  requirements: string;
  cancellationPolicy: string;
  refundPolicy: string;
  organizer: {
    name: string;
    email: string;
  };
}

interface Subscription {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  price: number;
  user: {
    name: string;
    email: string;
  };
  plan: {
    name: string;
    duration: number;
  };
}

interface Ticket {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  isVerified: boolean;
  verifiedAt?: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  event: {
    title: string;
    date: string;
    venue: string;
  };
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [events, setEvents] = useState<Event[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [showGuestVerification, setShowGuestVerification] = useState(false)
  const [showEventDetails, setShowEventDetails] = useState(false)
  const [showEditEvent, setShowEditEvent] = useState(false)
  const [showGuestList, setShowGuestList] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventGuests, setEventGuests] = useState<any[]>([])

  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'unauthenticated' || (status === 'authenticated' && !isAdmin)) {
      router.push('/auth/signin')
    }
  }, [status, isAdmin, router])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Don't render if not authenticated or not admin
  if (!session || !isAdmin) {
    return null
  }

  // Calculate stats - ensure we only count ACTIVE and non-expired subscriptions
  const activeSubscriptions = subscriptions.filter(s => {
    if (s.status !== 'ACTIVE') return false;
    const endDate = new Date(s.endDate);
    const now = new Date();
    return endDate > now; // Only count if not expired
  });

  // Calculate revenue only from ACTIVE subscriptions and tickets sold
  const activeSubscriptionRevenue = activeSubscriptions.reduce((sum, s) => sum + s.price, 0);
  const ticketsRevenue = tickets.reduce((sum, t) => sum + t.totalPrice, 0);

  const stats = {
    totalEvents: events.length,
    activeSubscriptions: activeSubscriptions.length,
    totalRevenue: activeSubscriptionRevenue + ticketsRevenue,
    ticketsSold: tickets.reduce((sum, t) => sum + t.quantity, 0)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [eventsRes, subscriptionsRes, ticketsRes] = await Promise.all([
        fetch('/api/events', { credentials: 'include' }),
        fetch('/api/subscriptions?limit=1000', { credentials: 'include' }), // Fetch all subscriptions for admin
        fetch('/api/verification/tickets', { credentials: 'include' })
      ])

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.data || [])
      }

      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json()
        setSubscriptions(subscriptionsData.data || [])
      }

      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        setTickets(ticketsData.data || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyTicket = async (ticketId: string, action: 'verify' | 'unverify') => {
    try {
      const response = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ticketId, action }),
      })

      if (response.ok) {
        await fetchData() // Refresh data
        alert(action === 'verify' ? 'Ticket verified successfully' : 'Ticket verification removed')
      } else {
        alert('Failed to verify ticket')
      }
    } catch (error) {
      console.error('Error verifying ticket:', error)
      alert('An error occurred')
    }
  }

  const handleViewEventDetails = (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetails(true)
  }

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event)
    setShowEditEvent(true)
  }

  const handleChangeEventStatus = async (eventId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchData() // Refresh data
        alert('Event status updated successfully')
      } else {
        alert('Failed to update event status')
      }
    } catch (error) {
      console.error('Error updating event status:', error)
      alert('An error occurred')
    }
  }

  const handleViewGuestList = async (event: Event) => {
    try {
      setSelectedEvent(event)
      const response = await fetch(`/api/events/${event.id}/guests`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setEventGuests(data.data.guestList || [])
        setShowGuestList(true)
      } else {
        alert('Failed to fetch guest list')
      }
    } catch (error) {
      console.error('Error fetching guest list:', error)
      alert('An error occurred')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Enterprise-level event and subscription management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowCreateEvent(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Event
              </button>
              <button 
                onClick={() => setShowGuestVerification(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Guest Verification
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'subscriptions', label: 'Subscriptions', icon: Users },
              { id: 'verification', label: 'Guest Verification', icon: CheckCircle },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                    <Ticket className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.ticketsSold}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* All Events */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Events</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets Sold</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.soldTickets}/{event.maxTickets}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                            event.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewEventDetails(event)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Event Management</h2>
              <button 
                onClick={() => setShowCreateEvent(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="relative h-48">
                    <Image
                      src={event.imageUrl || (event.title?.includes('Raahein') ? '/raahein-event.jpg' : 'https://via.placeholder.com/400x300/6366f1/ffffff?text=No+Image')}
                      alt={event.title}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x300/6366f1/ffffff?text=No+Image';
                      }}
                    />
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${
                      event.status === 'PUBLISHED' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                    }`}>
                      {event.status}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-4">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-500">{event.soldTickets} tickets sold</span>
                      <span className="text-lg font-bold text-purple-600">₹{event.price}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewEventDetails(event)}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleViewGuestList(event)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Guest List
                      </button>
                      <button 
                        onClick={() => handleEditEvent(event)}
                        className="flex-1 bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Active Subscriptions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeSubscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No active subscriptions found
                        </td>
                      </tr>
                    ) : (
                      activeSubscriptions.map((subscription) => {
                        const daysLeft = Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;
                        const isExpired = daysLeft <= 0;
                        
                        return (
                          <tr key={subscription.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{subscription.user.name}</div>
                                <div className="text-sm text-gray-500">{subscription.user.email}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscription.plan.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                subscription.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                                subscription.status === 'CANCELLED' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {subscription.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(subscription.startDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(subscription.endDate).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                isExpired ? 'text-red-600' : 
                                isExpiringSoon ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {isExpired ? 'Expired' : `${daysLeft} days`}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{subscription.price}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Simple Subscription Summary */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Subscription Summary</h3>
                  <p className="text-sm text-gray-500">Active subscriptions: {activeSubscriptions.length}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {activeSubscriptions.length}
                  </div>
                  <div className="text-sm text-gray-500">Active</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guest Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Guest Verification</h2>
              <div className="flex space-x-4">
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-blue-600">Total Tickets: </span>
                  <span className="font-semibold text-blue-800">{tickets.length}</span>
                </div>
                <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-yellow-600">Pending: </span>
                  <span className="font-semibold text-yellow-800">{tickets.filter(t => !t.isVerified).length}</span>
                </div>
                <div className="bg-green-50 px-4 py-2 rounded-lg">
                  <span className="text-sm text-green-600">Verified: </span>
                  <span className="font-semibold text-green-800">{tickets.filter(t => t.isVerified).length}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Tickets</h3>
                <p className="text-sm text-gray-500">Manage ticket verification for all events</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <Ticket className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-lg font-medium">No tickets found</p>
                            <p className="text-sm">Tickets will appear here once users purchase them</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <Users className="h-5 w-5 text-purple-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {ticket.user?.name || 'Guest User'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ticket.user?.email || 'No email'}
                                </div>
                                {ticket.user?.phone && (
                                  <div className="text-xs text-gray-400">
                                    {ticket.user.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.event?.title || 'Unknown Event'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ticket.event?.date ? new Date(ticket.event.date).toLocaleDateString() : 'No date'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ticket.event?.venue || 'No venue'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ticket.quantity} ticket(s)
                            </div>
                            <div className="text-sm text-gray-500">
                              ₹{ticket.totalPrice || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {ticket.isVerified ? (
                                <div className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">Verified</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-yellow-600">
                                  <XCircle className="h-4 w-4 mr-1" />
                                  <span className="text-sm">Pending</span>
                                </div>
                              )}
                            </div>
                            {ticket.verifiedAt && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(ticket.verifiedAt).toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {!ticket.isVerified ? (
                                <button
                                  onClick={() => handleVerifyTicket(ticket.id, 'verify')}
                                  className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md hover:bg-green-200 transition-colors flex items-center"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyTicket(ticket.id, 'unverify')}
                                  className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md hover:bg-red-200 transition-colors flex items-center"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Unverify
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEvent && (
          <CreateEventForm
            onClose={() => setShowCreateEvent(false)}
            onSuccess={() => {
              fetchData();
              setShowCreateEvent(false);
            }}
          />
        )}

        {/* Guest Verification Modal */}
        {showGuestVerification && (
          <GuestVerification
            onClose={() => setShowGuestVerification(false)}
          />
        )}

        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
                <button
                  onClick={() => setShowEventDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Event Image */}
                <div className="relative h-64 rounded-lg overflow-hidden">
                  <Image
                    src={selectedEvent.imageUrl || (selectedEvent.title?.includes('Raahein') ? '/raahein-event.jpg' : 'https://via.placeholder.com/400x300/6366f1/ffffff?text=No+Image')}
                    alt={selectedEvent.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x300/6366f1/ffffff?text=No+Image';
                    }}
                  />
                </div>

                {/* Event Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedEvent.title}</h3>
                    <p className="text-gray-600 mb-4">{selectedEvent.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time:</span>
                        <span className="font-medium">{selectedEvent.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Venue:</span>
                        <span className="font-medium">{selectedEvent.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-medium">₹{selectedEvent.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tickets:</span>
                        <span className="font-medium">{selectedEvent.soldTickets}/{selectedEvent.maxTickets}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <span className="text-gray-500">Status:</span>
                      <div className="mt-2">
                        <select
                          value={selectedEvent.status}
                          onChange={(e) => handleChangeEventStatus(selectedEvent.id, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-4">
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-2 font-medium">{selectedEvent.category}</span>
                    </div>

                    {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                      <div className="mb-4">
                        <span className="text-gray-500">Tags:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedEvent.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEvent.requirements && (
                      <div className="mb-4">
                        <span className="text-gray-500">Requirements:</span>
                        <p className="mt-1 text-sm text-gray-700">{selectedEvent.requirements}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    onClick={() => {
                      setShowEventDetails(false)
                      setShowEditEvent(true)
                    }}
                    className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    Edit Event
                  </button>
                  <button
                    onClick={() => setShowEventDetails(false)}
                    className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditEvent && selectedEvent && (
          <CreateEventForm
            editEvent={selectedEvent}
            onClose={() => setShowEditEvent(false)}
            onSuccess={() => {
              fetchData();
              setShowEditEvent(false);
            }}
          />
        )}

        {/* Guest List Modal */}
        {showGuestList && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Guest List</h2>
                  <p className="text-gray-600">{selectedEvent.title}</p>
                </div>
                <button
                  onClick={() => setShowGuestList(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Guest List Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{eventGuests.length}</div>
                  <div className="text-sm text-blue-800">Total Guests</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {eventGuests.filter(g => g.isVerified).length}
                  </div>
                  <div className="text-sm text-green-800">Verified</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {eventGuests.filter(g => !g.isVerified).length}
                  </div>
                  <div className="text-sm text-yellow-800">Pending</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {eventGuests.reduce((sum, g) => sum + g.quantity, 0)}
                  </div>
                  <div className="text-sm text-purple-800">Total Tickets</div>
                </div>
              </div>

              {/* Guest List Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {eventGuests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No guests registered for this event yet
                        </td>
                      </tr>
                    ) : (
                      eventGuests.map((guest) => (
                        <tr key={guest.ticketId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{guest.userName}</div>
                              <div className="text-sm text-gray-500">{guest.userEmail}</div>
                              <div className="text-xs text-gray-400">{guest.userPhone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              guest.isGuestTicket ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {guest.isGuestTicket ? 'Guest' : 'Member'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {guest.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              guest.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                              guest.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {guest.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              guest.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {guest.isVerified ? 'Verified' : 'Not Verified'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {!guest.isVerified ? (
                                <button
                                  onClick={() => handleVerifyTicket(guest.ticketId, 'verify')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerifyTicket(guest.ticketId, 'unverify')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Close Button */}
              <div className="flex justify-end mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowGuestList(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}