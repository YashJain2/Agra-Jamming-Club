import Link from 'next/link'
import { Calendar, Users, Music, MapPin, Ticket, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 text-gray-800 py-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 bg-white/20 z-0">
          <img
            src="/api/placeholder/1920/800"
            alt="Agra Jamming Club Hero"
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Agra Jamming Club
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-gray-600 max-w-3xl mx-auto">
            Join the vibrant musical community in Agra. Experience live music, connect with fellow musicians, and be part of amazing events every month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/events" 
              className="bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors shadow-lg"
            >
              View Upcoming Events
            </Link>
            <Link 
              href="/subscriptions" 
              className="border-2 border-purple-500 text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-purple-500 hover:text-white transition-colors"
            >
              Get Monthly Subscription
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Agra Jamming Club?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience music like never before with our community-driven events and monthly subscriptions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Monthly Events</h3>
              <p className="text-gray-600">
                Join 2 amazing events every month featuring local and visiting artists in intimate venues
              </p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Musical Community</h3>
              <p className="text-gray-600">
                Connect with fellow music lovers, musicians, and build lasting friendships
              </p>
            </div>

            <div className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow bg-white/70 backdrop-blur-sm">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Live Performances</h3>
              <p className="text-gray-600">
                Experience authentic live performances in cozy, intimate settings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Preview */}
      <section className="py-20 bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upcoming Events
            </h2>
            <p className="text-xl text-gray-600">
              Don&apos;t miss out on our next musical gatherings
            </p>
          </div>

          <div className="text-center">
            <Link 
              href="/events"
              className="inline-flex items-center bg-gradient-to-r from-pink-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Calendar className="h-5 w-5 mr-2" />
              View All Events
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="p-6 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-4xl font-bold text-pink-500 mb-2">50+</div>
              <div className="text-gray-600 font-medium">Active Members</div>
            </div>
            <div className="p-6 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-4xl font-bold text-blue-500 mb-2">24</div>
              <div className="text-gray-600 font-medium">Events This Year</div>
            </div>
            <div className="p-6 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-4xl font-bold text-green-500 mb-2">100%</div>
              <div className="text-gray-600 font-medium">Satisfaction Rate</div>
            </div>
            <div className="p-6 bg-white/50 rounded-lg backdrop-blur-sm">
              <div className="text-4xl font-bold text-orange-500 mb-2">5★</div>
              <div className="text-gray-600 font-medium">Community Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-pink-300 to-purple-400 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join the Music Community?
          </h2>
          <p className="text-xl mb-8 text-pink-100 max-w-2xl mx-auto">
            Get your monthly subscription and never miss an event. Join fellow music lovers in Agra today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/subscriptions" 
              className="bg-white text-pink-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Start Your Subscription
            </Link>
            <Link 
              href="/events" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-500 transition-colors"
            >
              View All Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
