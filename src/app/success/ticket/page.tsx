'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, MapPin, Clock, Ticket, Crown, Mail, Phone } from 'lucide-react';
import Link from 'next/link';

export default function TicketSuccessPage() {
  const searchParams = useSearchParams();
  const [ticketData, setTicketData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get ticket data from URL parameters or localStorage
    const ticketId = searchParams.get('ticketId');
    const eventTitle = searchParams.get('eventTitle');
    const eventDate = searchParams.get('eventDate');
    const eventTime = searchParams.get('eventTime');
    const eventVenue = searchParams.get('eventVenue');
    const quantity = searchParams.get('quantity');
    const totalPrice = searchParams.get('totalPrice');
    const guestName = searchParams.get('guestName');
    const guestEmail = searchParams.get('guestEmail');

    if (ticketId) {
      setTicketData({
        ticketId,
        eventTitle,
        eventDate,
        eventTime,
        eventVenue,
        quantity: parseInt(quantity || '1'),
        totalPrice: parseFloat(totalPrice || '0'),
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

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Ticket Not Found</h1>
          <Link href="/" className="text-purple-600 hover:text-purple-700">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 Tickets Booked Successfully!
          </h1>
          <p className="text-lg text-gray-600">
            Your tickets for <strong>{ticketData.eventTitle}</strong> have been confirmed
          </p>
        </div>

        {/* Ticket Details Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Ticket className="h-6 w-6 mr-2" />
              Ticket Details
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">{ticketData.eventTitle}</p>
                      <p className="text-sm text-gray-600">{new Date(ticketData.eventDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-purple-600 mr-3" />
                    <p className="text-gray-700">{ticketData.eventTime}</p>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                    <p className="text-gray-700">{ticketData.eventVenue}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tickets:</span>
                    <span className="font-medium">{ticketData.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Paid:</span>
                    <span className="font-bold text-lg text-green-600">₹{ticketData.totalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ticket ID:</span>
                    <span className="font-mono text-sm">{ticketData.ticketId}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        {ticketData.guestName && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <Mail className="h-6 w-6 mr-2" />
                Guest Information
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-medium text-gray-900">{ticketData.guestName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{ticketData.guestEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Important Information */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">📱 Important Information</h3>
          <ul className="space-y-2 text-yellow-700">
            <li>• Please arrive 15 minutes before the event starts</li>
            <li>• Bring a valid ID for verification</li>
            <li>• Show this confirmation or your ticket QR code at the entrance</li>
            <li>• Check your email for the detailed ticket confirmation</li>
            <li>• Contact us if you have any questions</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              Browse More Events
            </Link>
            
            {ticketData.guestEmail && (
              <Link
                href={`/auth/signup?email=${encodeURIComponent(ticketData.guestEmail)}&name=${encodeURIComponent(ticketData.guestName || '')}`}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
          
          <p className="text-sm text-gray-500">
            Want to manage your tickets easily? Create an account to access your ticket history and get updates.
          </p>
        </div>
      </div>
    </div>
  );
}
