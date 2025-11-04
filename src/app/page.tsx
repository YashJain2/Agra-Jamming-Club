import Link from 'next/link'
import { Calendar, Users, Music, Heart, Sparkles, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/home-banner.jpg"
            alt="Agra Jamming Club"
            className="textured-banner w-full h-full object-cover"
          />
          {/* Dark overlay mixed with image for text readability */}
          <div className="absolute inset-0 bg-black/60 z-1"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/60 z-2"></div>
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 sm:mb-10 leading-tight drop-shadow-2xl">
            What is Agra Jamming Club
          </h1>
          <div className="space-y-5 sm:space-y-6 text-base sm:text-lg md:text-xl text-white leading-relaxed drop-shadow-lg">
            <p className="font-medium text-white drop-shadow-md leading-relaxed">
              In a city known for its monuments, a new kind of heritage is being built — one of music, connection, and community.
            </p>
            <p className="text-white drop-shadow-md leading-relaxed">
              Agra Jamming Club is a space where music lovers, dreamers, and everyday people come together to sing, unwind, and simply be.
            </p>
            <p className="italic text-white/95 drop-shadow-md leading-relaxed">
              It&apos;s not a stage or a competition — it&apos;s a shared heartbeat.
            </p>
            <p className="text-white drop-shadow-md leading-relaxed">
              Here, strangers turn into friends, and voices blend into something far bigger than any one song.
            </p>
            <p className="text-white drop-shadow-md leading-relaxed">
              No spotlight. No judgment. Just pure, honest music — and the joy of belonging.
            </p>
            <div className="pt-6 sm:pt-8 flex items-center justify-center">
              <span className="text-2xl sm:text-3xl mr-2">✨</span>
              <p className="text-xl sm:text-2xl font-semibold text-pink-200 drop-shadow-lg">
                Where music finds its people.
              </p>
            </div>
          </div>
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/events" 
              className="bg-pink-500 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-colors shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              View Upcoming Events
            </Link>
            <Link 
              href="/subscriptions" 
              className="border-2 border-white text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Join the Tribe
            </Link>
          </div>
        </div>
      </section>

      {/* What Happens in Every Meet Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              What Happens in Every Meet
            </h2>
            <p className="text-xl text-gray-600 italic mb-4">
              Every jam is a little different — but the rhythm stays the same:
            </p>
            <p className="text-2xl font-semibold text-pink-600">
              Good music, good people, good energy.
            </p>
          </div>

          <div className="space-y-8 text-lg text-gray-700 leading-relaxed">
            <p>
              Each session follows a simple flow:
            </p>
            <div className="space-y-6 pl-6 border-l-4 border-pink-300">
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  We start with a collective sing-along,
                </p>
                <p className="text-gray-600">
                  where everyone joins in — no mics, no stage, just harmony.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  We explore a curated theme each time
                </p>
                <p className="text-gray-600">
                  — from Bollywood Nostalgia Nights to Young Love Jams — with live instruments and open participation.
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  And as the evening unfolds,
                </p>
                <p className="text-gray-600">
                  we open the floor for anyone who wishes to share — a song, a poem, a thought, or a feeling.
                </p>
              </div>
            </div>
            <p className="pt-6 text-center text-xl font-medium text-gray-800">
              Every meet ends the same way it begins — with laughter, connection, and an ecstatic sense of calm that music quietly leaves behind.
            </p>
          </div>
        </div>
      </section>

      {/* Founder's Note Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3">💛</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Founder&apos;s Note — by Riya Agarwal
              </h2>
            </div>
            
            {/* Founder Photo */}
            <div className="mb-6 sm:mb-8 flex justify-center">
              <div className="founder-image-wrapper relative founder-image-container rounded-full overflow-hidden border-4 border-pink-200 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <img
                  src="/founder-riya.jpg"
                  alt="Riya Agarwal - Founder, Agra Jamming Club"
                  className="textured-founder w-full h-full object-cover"
                />
              </div>
            </div>
            
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                When I dreamt of starting Agra Jamming Club, it wasn&apos;t about music alone.
              </p>
              <p>
                It was about people — the kind who hum softly to themselves on a bad day, who find pieces of home in a chorus, who miss being around others that simply get it.
              </p>
              <p>
                We live in times where it&apos;s easy to feel alone, even in a crowd.
              </p>
              <p className="font-semibold text-gray-900">
                I wanted to create a space that makes you feel seen — not because you&apos;re performing, but because you&apos;re present.
              </p>
              <p>
                Music, I believe, is the purest form of connection.
              </p>
              <p className="italic text-gray-600">
                It doesn&apos;t care who you are, what you do, or how you sound — it only asks you to feel.
              </p>
              <p>
                Agra Jamming Club is my love letter to that feeling.
              </p>
              <p>
                A place where music becomes a bridge, where strangers turn into friends, and where, for a few hours, the world outside just… fades.
              </p>
              <div className="pt-6 border-t-2 border-pink-200">
                <p className="font-semibold text-lg text-gray-900 mb-2">
                  So come as you are.
                </p>
                <p className="text-lg">
                  Bring your voice, your vibe, your stories — and let&apos;s make Agra sing, together.
                </p>
              </div>
              <div className="pt-6 text-right">
                <p className="font-semibold text-gray-900 text-lg">
                  — Riya Agarwal
                </p>
                <p className="text-gray-600">
                  Founder, Agra Jamming Club
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-pink-400 to-purple-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Music className="h-16 w-16 mx-auto mb-6 text-white/80" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Join the Music Community?
          </h2>
          <p className="text-xl mb-8 text-pink-100 max-w-2xl mx-auto">
            Come as you are. Bring your voice, your vibe, your stories — and let&apos;s make Agra sing, together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/subscriptions" 
              className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg inline-flex items-center justify-center"
            >
              Join the Tribe
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <Link 
              href="/events" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors inline-flex items-center justify-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              View Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
