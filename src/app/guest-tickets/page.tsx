"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Ticket, Mail, User, Phone } from 'lucide-react';
import TicketDisplay from '@/components/ticket-display';

interface TicketData {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  qrCode?: string;
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    address: string;
    city: string;
    state: string;
    price: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function GuestTicketLookupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email && !formData.phone) {
      setError('Please provide either email or phone number');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (formData.email) params.append('email', formData.email);
      if (formData.phone) params.append('phone', formData.phone);

      const response = await fetch(`/api/tickets/guest?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to find tickets');
      }
      
      const data = await response.json();
      setTickets(data.tickets || []);
      
      if (data.tickets.length === 0) {
        setError('No tickets found with the provided information');
      }
    } catch (error) {
      console.error('Error fetching guest tickets:', error);
      setError('Failed to find tickets. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <Ticket className="h-16 w-16 text-pink-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Ticket Lookup</h1>
          <p className="text-gray-600">Find your tickets using your email or phone number</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>

            <div className="text-center text-gray-500">OR</div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 text-white py-2 px-4 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Find My Tickets
                </>
              )}
            </button>
          </form>
        </div>

        {searched && tickets.length > 0 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Tickets</h2>
              <p className="text-gray-600">Found {tickets.length} ticket(s)</p>
            </div>

            {tickets.map((ticket) => (
              <TicketDisplay key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">Don't have an account?</p>
          <button
            onClick={() => router.push('/auth/signup')}
            className="text-pink-600 hover:text-pink-700 font-medium"
          >
            Create an account to manage your tickets
          </button>
        </div>
      </div>
    </div>
  );
}
