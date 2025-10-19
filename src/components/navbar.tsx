"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Music, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { data: session, status } = useSession();

  const user = session?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isManager = user?.role === 'MODERATOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering interactive elements until mounted
  if (!isMounted) {
    return (
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Music className="h-8 w-8 text-pink-500" />
                <span className="text-xl font-bold text-gray-900">Agra Jamming Club</span>
              </Link>
            </div>

            {/* Desktop Navigation - Static version without auth */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/events" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Events
              </Link>
              <Link href="/subscriptions" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Subscriptions
              </Link>
              <div className="flex items-center space-x-3">
                <Link href="/auth/signup" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Up
                </Link>
                <Link href="/auth/signin" className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600 transition-colors">
                  Sign In
                </Link>
              </div>
            </div>

            {/* Mobile menu button - static version */}
            <div className="md:hidden flex items-center">
              <button className="text-gray-700 hover:text-pink-500 focus:outline-none focus:text-pink-500">
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-pink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Music className="h-8 w-8 text-pink-500" />
              <span className="text-xl font-bold text-gray-900">Agra Jamming Club</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Home
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Events
            </Link>
            <Link href="/subscriptions" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Subscriptions
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Admin
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                {!isAdmin && (
                  <Link href="/dashboard" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                )}
                <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/signup" className="text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign Up
                </Link>
                <Link href="/auth/signin" className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600 transition-colors">
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-pink-500 focus:outline-none focus:text-pink-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link href="/" className="text-gray-700 hover:text-pink-500 block px-3 py-2 rounded-md text-base font-medium">
                Home
              </Link>
              <Link href="/events" className="text-gray-700 hover:text-pink-500 block px-3 py-2 rounded-md text-base font-medium">
                Events
              </Link>
              <Link href="/subscriptions" className="text-gray-700 hover:text-pink-500 block px-3 py-2 rounded-md text-base font-medium">
                Subscriptions
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-gray-700 hover:text-pink-500 block px-3 py-2 rounded-md text-base font-medium">
                  Admin
                </Link>
              )}
              {user ? (
                <div className="space-y-2">
                  {!isAdmin && (
                    <Link href="/dashboard" className="w-full text-left text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-base font-medium transition-colors">
                      Dashboard
                    </Link>
                  )}
                  <div className="px-3 py-2 text-sm text-gray-600">
                    Welcome, {user.name}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left bg-gray-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-gray-600 transition-colors flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/auth/signup" className="w-full text-left text-gray-700 hover:text-pink-500 px-3 py-2 rounded-md text-base font-medium transition-colors">
                    Sign Up
                  </Link>
                  <Link href="/auth/signin" className="w-full text-left bg-pink-500 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-pink-600 transition-colors">
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}