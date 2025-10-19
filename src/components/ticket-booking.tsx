"use client";

import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Minus, Plus, CreditCard } from 'lucide-react';
import Image from 'next/image';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  price: number;
  maxTickets: number;
  availableTickets: number;
  image: string;
}

interface TicketBookingProps {
  event: Event;
}

export function TicketBooking({ event }: TicketBookingProps) {
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const totalPrice = ticketQuantity * event.price;

  const handleQuantityChange = (change: number) => {
    const newQuantity = ticketQuantity + change;
    if (newQuantity >= 1 && newQuantity <= Math.min(10, event.availableTickets)) {
      setTicketQuantity(newQuantity);
    }
  };

  const handleBooking = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      alert('Please fill in all customer details');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Generate order ID
      const orderId = `EVENT_${event.id}_${Date.now()}`;
      
      // Initiate payment
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          amount: totalPrice,
          customerId: customerInfo.email,
          eventId: event.id,
          ticketQuantity,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Redirect to Paytm payment page
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.paytmUrl;
        
        Object.keys(data.paymentRequest).forEach(key => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = data.paymentRequest[key];
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        alert('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Event Image */}
          <div className="md:w-1/2">
            <div className="relative h-64 md:h-full">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Booking Form */}
          <div className="md:w-1/2 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
            
            {/* Event Details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-5 w-5 mr-3" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-3" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-3" />
                <span>{event.venue}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Users className="h-5 w-5 mr-3" />
                <span>{event.availableTickets} tickets available</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">{event.description}</p>

            {/* Customer Information */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Ticket Quantity */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Number of Tickets</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={ticketQuantity <= 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xl font-semibold px-4">{ticketQuantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={ticketQuantity >= Math.min(10, event.availableTickets)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Maximum 10 tickets per person
              </p>
            </div>

            {/* Price Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Price per ticket:</span>
                <span className="font-semibold">₹{event.price}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{ticketQuantity}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-purple-600">₹{totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              onClick={handleBooking}
              disabled={isProcessing || event.availableTickets === 0}
              className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Book Now - ₹{totalPrice}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mt-4 text-center">
              You will be redirected to Paytm for secure payment processing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
