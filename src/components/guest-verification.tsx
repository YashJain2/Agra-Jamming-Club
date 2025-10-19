"use client";

import { useState, useEffect } from 'react';
import { X, Search, CheckCircle, XCircle, User, Calendar, MapPin } from 'lucide-react';

interface GuestVerificationProps {
  onClose: () => void;
}

interface Ticket {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  isVerified: boolean;
  verifiedAt?: string;
  qrCode?: string;
  user: {
    name: string;
    email: string;
    phone?: string;
  };
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
  };
}

export function GuestVerification({ onClose }: GuestVerificationProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, selectedEvent, verificationFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/verification/tickets', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTickets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTickets = () => {
    let filtered = tickets;

    // Filter by event
    if (selectedEvent) {
      filtered = filtered.filter(ticket => ticket.event.id === selectedEvent);
    }

    // Filter by verification status
    if (verificationFilter === 'verified') {
      filtered = filtered.filter(ticket => ticket.isVerified);
    } else if (verificationFilter === 'unverified') {
      filtered = filtered.filter(ticket => !ticket.isVerified);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.event.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const handleVerifyTicket = async (ticketId: string, action: 'verify' | 'unverify') => {
    try {
      const response = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ ticketId, action }),
      });

      if (response.ok) {
        await fetchTickets(); // Refresh data
        alert(action === 'verify' ? 'Ticket verified successfully' : 'Ticket verification removed');
      } else {
        alert('Failed to verify ticket');
      }
    } catch (error) {
      console.error('Error verifying ticket:', error);
      alert('An error occurred');
    }
  };

  const getUniqueEvents = () => {
    const events = tickets.map(ticket => ticket.event);
    return events.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-center mt-4">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Guest Verification</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Tickets</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Events ({tickets.length} tickets)</option>
                  {getUniqueEvents().map(event => {
                    const eventTicketCount = tickets.filter(t => t.event.id === event.id).length;
                    return (
                      <option key={event.id} value={event.id}>
                        {event.title} ({eventTicketCount} tickets)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Tickets</option>
                  <option value="verified">Verified Only</option>
                  <option value="unverified">Unverified Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={fetchTickets}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(selectedEvent || verificationFilter !== 'all' || searchTerm) && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedEvent && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Event: {getUniqueEvents().find(e => e.id === selectedEvent)?.title}
                    <button
                      onClick={() => setSelectedEvent('')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {verificationFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Status: {verificationFilter === 'verified' ? 'Verified' : 'Unverified'}
                    <button
                      onClick={() => setVerificationFilter('all')}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Search: "{searchTerm}"
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 text-yellow-600 hover:text-yellow-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tickets List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.user.email}
                          </div>
                          {ticket.user.phone && (
                            <div className="text-xs text-gray-400">
                              {ticket.user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.event.title}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(ticket.event.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {ticket.event.venue}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ticket.quantity} ticket(s)
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{ticket.totalPrice}
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
                            className="text-green-600 hover:text-green-900 bg-green-100 px-3 py-1 rounded-md hover:bg-green-200 transition-colors"
                          >
                            Verify
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVerifyTicket(ticket.id, 'unverify')}
                            className="text-red-600 hover:text-red-900 bg-red-100 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Unverify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No tickets found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {filteredTickets.length}
              </div>
              <div className="text-sm text-blue-600">Total Tickets</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {filteredTickets.filter(t => t.isVerified).length}
              </div>
              <div className="text-sm text-green-600">Verified</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredTickets.filter(t => !t.isVerified).length}
              </div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
