"use client";

import { useState } from 'react';
import { Calendar, MapPin, Clock, User, Mail, Phone, Ticket, QrCode } from 'lucide-react';
import PDFDownload from './pdf-download';

interface TicketDisplayProps {
  ticket: {
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
  };
}

export default function TicketDisplay({ ticket }: TicketDisplayProps) {
  const [showQRCode, setShowQRCode] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Agra Jamming Club</h1>
            <p className="text-pink-100">Event Ticket</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-pink-100">Ticket ID</div>
            <div className="font-mono text-sm">{ticket.id}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Event Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-pink-600" />
            Event Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Event Name</h3>
              <p className="text-gray-900">{ticket.event.title}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Date</h3>
              <p className="text-gray-900">{formatDate(ticket.event.date)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Time</h3>
              <p className="text-gray-900">{formatTime(ticket.event.time)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Venue</h3>
              <p className="text-gray-900">{ticket.event.venue}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700">Address</h3>
              <p className="text-gray-900">{ticket.event.address}, {ticket.event.city}, {ticket.event.state}</p>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-pink-600" />
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Name</h3>
              <p className="text-gray-900">{ticket.user.name}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Email</h3>
              <p className="text-gray-900">{ticket.user.email}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Phone</h3>
              <p className="text-gray-900">{ticket.user.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Ticket className="h-5 w-5 mr-2 text-pink-600" />
            Ticket Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Quantity</h3>
              <p className="text-gray-900">{ticket.quantity}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Total Price</h3>
              <p className="text-gray-900">₹{ticket.totalPrice}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Status</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                ticket.status === 'CONFIRMED' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {ticket.status === 'PENDING' ? 'Booked' : ticket.status}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Purchase Date</h3>
              <p className="text-gray-900">{formatDate(ticket.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {ticket.qrCode && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <QrCode className="h-5 w-5 mr-2 text-pink-600" />
              QR Code
            </h2>
            <div className="flex justify-center">
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors"
              >
                {showQRCode ? 'Hide' : 'Show'} QR Code
              </button>
            </div>
            {showQRCode && (
              <div className="mt-4 flex justify-center">
                <img 
                  src={ticket.qrCode} 
                  alt="Ticket QR Code" 
                  className="w-32 h-32 border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        )}

        {/* Download PDF Button */}
        <div className="flex justify-center pt-4">
          <PDFDownload ticketId={ticket.id} />
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">Important Notice</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Please bring this ticket and a valid ID to the event</li>
            <li>• Arrive 15 minutes before the event starts</li>
            <li>• Keep your ticket safe - it cannot be replaced if lost</li>
            <li>• Contact us if you have any questions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
