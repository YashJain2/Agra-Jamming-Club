import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cancellation & Refunds - Agra Jamming Club',
  description: 'Cancellation and Refund Policy for Agra Jamming Club - Information about ticket cancellations and refunds.',
};

export default function CancellationRefundsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cancellation & Refunds Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Event Ticket Cancellations</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Cancellation by Customer</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>More than 48 hours before event:</strong> Full refund minus processing fees (5%)</li>
                  <li><strong>24-48 hours before event:</strong> 50% refund minus processing fees</li>
                  <li><strong>Less than 24 hours before event:</strong> No refund</li>
                  <li><strong>After event has started:</strong> No refund</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Cancellation by Agra Jamming Club</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full refund including processing fees</li>
                  <li>Alternative event options when available</li>
                  <li>Credit for future events</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Subscription Cancellations</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Monthly Subscriptions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancel anytime before next billing cycle</li>
                  <li>Access continues until current period ends</li>
                  <li>No partial refunds for unused time</li>
                  <li>Auto-renewal can be disabled in account settings</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Annual Subscriptions</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Cancel within 30 days for full refund</li>
                  <li>After 30 days: Pro-rated refund based on unused time</li>
                  <li>Processing fee of 10% applies to refunds after 30 days</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Refund Processing</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Processing Time</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Credit/Debit Cards: 5-10 business days</li>
                  <li>Net Banking: 3-5 business days</li>
                  <li>UPI: 1-3 business days</li>
                  <li>Wallet: 1-2 business days</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Refund Method</h3>
                <p>Refunds will be processed to the original payment method used for the transaction.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Special Circumstances</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Force Majeure Events</h3>
                <p>In case of events beyond our control (natural disasters, government restrictions, etc.):</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full refund or rescheduling options</li>
                  <li>Credit for future events</li>
                  <li>No processing fees charged</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Medical Emergencies</h3>
                <p>For medical emergencies with valid documentation:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Full refund regardless of timing</li>
                  <li>Must provide medical certificate</li>
                  <li>Processing within 24 hours</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. How to Request Cancellation/Refund</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-800">Online</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Log into your account</li>
                  <li>Go to "My Tickets" or "My Subscriptions"</li>
                  <li>Click "Cancel" or "Request Refund"</li>
                  <li>Follow the prompts</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-800 mt-6">Contact Support</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p><strong>Email:</strong> support@agrajammingclub.com</p>
                  <p><strong>Phone:</strong> +91-9876543210</p>
                  <p><strong>WhatsApp:</strong> +91-9876543210</p>
                  <p><strong>Hours:</strong> 9 AM - 9 PM (Monday to Sunday)</p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Non-Refundable Items</h2>
              <div className="space-y-4 text-gray-700">
                <ul className="list-disc pl-6 space-y-2">
                  <li>Processing fees (unless event is cancelled by us)</li>
                  <li>Merchandise purchases (unless defective)</li>
                  <li>Food and beverage purchases at events</li>
                  <li>Parking fees</li>
                  <li>Service charges</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Dispute Resolution</h2>
              <div className="space-y-4 text-gray-700">
                <p>If you are not satisfied with our refund decision:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact our customer support team</li>
                  <li>Provide detailed explanation and documentation</li>
                  <li>We will review within 48 hours</li>
                  <li>Final decision will be communicated within 5 business days</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Policy Updates</h2>
              <div className="space-y-4 text-gray-700">
                <p>We reserve the right to update this cancellation and refund policy at any time.</p>
                <p>Changes will be effective immediately upon posting on our website.</p>
                <p>Continued use of our services constitutes acceptance of the updated policy.</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
