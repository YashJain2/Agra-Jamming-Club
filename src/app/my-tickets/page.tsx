"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Ticket, Calendar, MapPin, Clock, User, Mail, Phone, Download } from 'lucide-react';
import TicketDisplay from '@/components/ticket-display';
import PDFDownload from '@/components/pdf-download';

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

export default function MyTicketsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchTickets();
  }, [session, status, router]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tickets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tickets...</p>
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
            onClick={fetchTickets}
            className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Ticket className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Tickets Found</h1>
            <p className="text-gray-600 mb-6">You haven't purchased any tickets yet.</p>
            <button
              onClick={() => router.push('/events')}
              className="bg-pink-600 text-white px-6 py-3 rounded-md hover:bg-pink-700 transition-colors"
            >
              Browse Events
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tickets</h1>
          <p className="text-gray-600">Manage and download your event tickets</p>
        </div>

        <div className="space-y-6">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{ticket.event.title}</h2>
                    <p className="text-gray-600">{new Date(ticket.event.date).toLocaleDateString('en-IN')} at {ticket.event.time}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                      ticket.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">₹{ticket.totalPrice}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {ticket.event.venue}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {ticket.quantity} ticket(s)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {new Date(ticket.createdAt).toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div className="flex justify-end">
                  <PDFDownload ticketId={ticket.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
