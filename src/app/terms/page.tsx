import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms and Conditions - Agra Jamming Club',
  description: 'Terms and Conditions for Agra Jamming Club - Rules and guidelines for using our services.',
};

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>By accessing and using Agra Jamming Club services, you accept and agree to be bound by the terms and provision of this agreement.</p>
                <p>If you do not agree to abide by the above, please do not use this service.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Use License</h2>
              <div className="space-y-4 text-gray-700">
                <p>Permission is granted to temporarily use Agra Jamming Club services for personal, non-commercial transitory viewing only.</p>
                <p>This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for any commercial purpose or for any public display</li>
                  <li>Attempt to reverse engineer any software contained on the website</li>
                  <li>Remove any copyright or other proprietary notations from the materials</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Event Tickets and Subscriptions</h2>
              <div className="space-y-4 text-gray-700">
                <p>When purchasing tickets or subscriptions:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>All sales are final unless otherwise stated</li>
                  <li>Tickets are non-transferable without prior consent</li>
                  <li>Subscriptions auto-renew unless cancelled</li>
                  <li>Event details may change; we will notify you of any significant changes</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. User Conduct</h2>
              <div className="space-y-4 text-gray-700">
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Use the service for any unlawful purpose</li>
                  <li>Transmit any harmful or malicious code</li>
                  <li>Interfere with the proper functioning of the service</li>
                  <li>Impersonate any person or entity</li>
                  <li>Harass or harm other users</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700">
                <p>In no event shall Agra Jamming Club or its suppliers be liable for any damages arising out of the use or inability to use the materials on our website.</p>
                <p>This includes but is not limited to damages for loss of data or profit, or due to business interruption.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Accuracy of Materials</h2>
              <div className="space-y-4 text-gray-700">
                <p>The materials appearing on our website could include technical, typographical, or photographic errors.</p>
                <p>We do not warrant that any of the materials on its website are accurate, complete, or current.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Modifications</h2>
              <div className="space-y-4 text-gray-700">
                <p>Agra Jamming Club may revise these terms of service at any time without notice.</p>
                <p>By using this website, you are agreeing to be bound by the then current version of these terms.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Governing Law</h2>
              <div className="space-y-4 text-gray-700">
                <p>These terms and conditions are governed by and construed in accordance with the laws of India.</p>
                <p>Any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of Agra, Uttar Pradesh.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>If you have any questions about these Terms and Conditions, please contact us:</p>
                <div className="bg-gray-100 p-4 rounded-lg">
                  <p><strong>Email:</strong> legal@agrajammingclub.com</p>
                  <p><strong>Phone:</strong> +91-9876543210</p>
                  <p><strong>Address:</strong> Agra Jamming Club, Agra, Uttar Pradesh, India</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
