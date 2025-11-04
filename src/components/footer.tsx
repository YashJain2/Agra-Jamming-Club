import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">Agra Jamming Club</h3>
            <p className="text-gray-300 mb-4">
              Join the vibrant musical community in Agra. Attend events, subscribe monthly, and connect with fellow musicians.
            </p>
            <div className="text-gray-300">
              <p>📧 info@agrajammingclub.com</p>
              <p>📞 7983301442 - whatsapp only</p>
              <p>📍 Agra, Uttar Pradesh, India</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-300 hover:text-pink-400 transition-colors">Home</Link></li>
              <li><Link href="/events" className="text-gray-300 hover:text-pink-400 transition-colors">Events</Link></li>
              <li><Link href="/subscriptions" className="text-gray-300 hover:text-pink-400 transition-colors">Subscriptions</Link></li>
              <li><Link href="/contact" className="text-gray-300 hover:text-pink-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-300 hover:text-pink-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-300 hover:text-pink-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/cancellation-refunds" className="text-gray-300 hover:text-pink-400 transition-colors">Cancellation & Refunds</Link></li>
              <li><Link href="/shipping" className="text-gray-300 hover:text-pink-400 transition-colors">Shipping Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Agra Jamming Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
