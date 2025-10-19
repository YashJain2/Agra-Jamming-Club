import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Policy - Agra Jamming Club',
  description: 'Shipping Policy for Agra Jamming Club - Information about digital delivery and physical merchandise shipping.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Digital Delivery</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Event Tickets</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Instant Delivery:</strong> E-tickets are delivered immediately after payment confirmation</li>
                  <li><strong>Email Confirmation:</strong> Sent to your registered email address</li>
                  <li><strong>Mobile App:</strong> Tickets available in your account dashboard</li>
                  <li><strong>QR Code:</strong> Unique QR code for event entry</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Subscription Access</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Immediate Activation:</strong> Subscription benefits activate instantly</li>
                  <li><strong>Account Dashboard:</strong> Access all subscription features online</li>
                  <li><strong>Email Notification:</strong> Confirmation sent to your email</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Physical Merchandise</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Processing Time</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Standard Items:</strong> 1-2 business days</li>
                  <li><strong>Custom Items:</strong> 3-5 business days</li>
                  <li><strong>Pre-order Items:</strong> As specified on product page</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Shipping Methods</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Standard Shipping:</strong> 3-5 business days</li>
                  <li><strong>Express Shipping:</strong> 1-2 business days</li>
                  <li><strong>Same Day Delivery:</strong> Available in Agra city limits</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Shipping Areas</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Domestic Shipping (India)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Metro Cities:</strong> Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad, Pune</li>
                  <li><strong>Tier 2 Cities:</strong> All major cities across India</li>
                  <li><strong>Remote Areas:</strong> Subject to courier service availability</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">International Shipping</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Currently not available</li>
                  <li>Planned for future expansion</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Shipping Costs</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Free Shipping</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Orders above ₹500 (within Agra)</li>
                  <li>Orders above ₹1000 (pan India)</li>
                  <li>All subscription renewals</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Paid Shipping</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Within Agra:</strong> ₹50</li>
                  <li><strong>Metro Cities:</strong> ₹100</li>
                  <li><strong>Other Cities:</strong> ₹150</li>
                  <li><strong>Express Delivery:</strong> Additional ₹100</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Order Tracking</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Tracking Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Tracking number sent via SMS and email</li>
                  <li>Real-time updates on order status</li>
                  <li>Estimated delivery date provided</li>
                  <li>Delivery confirmation notification</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">How to Track</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use tracking number on courier website</li>
                  <li>Check your account dashboard</li>
                  <li>Contact customer support</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Delivery Issues</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Failed Delivery</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Courier will attempt delivery 3 times</li>
                  <li>Package held at nearest courier office for 7 days</li>
                  <li>Customer can reschedule delivery</li>
                  <li>Return to sender after 7 days</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Damaged Packages</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Report within 24 hours of delivery</li>
                  <li>Provide photos of damage</li>
                  <li>Full refund or replacement offered</li>
                  <li>Return shipping costs covered by us</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Special Delivery Services</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Event Day Delivery</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Physical tickets delivered to event venue</li>
                  <li>Must be requested 24 hours in advance</li>
                  <li>Additional charges may apply</li>
                  <li>Available for select events only</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Gift Delivery</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Gift wrapping available</li>
                  <li>Personalized messages included</li>
                  <li>Delivery to recipient's address</li>
                  <li>Gift receipt included (no pricing)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>For shipping-related queries:</p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p><strong>Email:</strong> shipping@agrajammingclub.com</p>
                  <p><strong>Phone:</strong> +91-9876543210</p>
                  <p><strong>WhatsApp:</strong> +91-9876543210</p>
                  <p><strong>Hours:</strong> 9 AM - 9 PM (Monday to Sunday)</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
