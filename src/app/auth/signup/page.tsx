"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Music, Eye, EyeOff, Loader2, Gift, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';

function SignUpContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [guestPurchases, setGuestPurchases] = useState<any>(null);
  const [checkingGuestPurchases, setCheckingGuestPurchases] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for guest purchases when email changes
  useEffect(() => {
    const checkGuestPurchases = async () => {
      if (formData.email && formData.email.includes('@')) {
        setCheckingGuestPurchases(true);
        try {
          const response = await fetch(`/api/auth/link-guest-account?email=${encodeURIComponent(formData.email)}`);
          const data = await response.json();
          
          if (data.success && data.hasGuestPurchases) {
            setGuestPurchases(data);
            // Pre-fill name if available
            if (data.guestUser.name && !formData.name) {
              setFormData(prev => ({ ...prev, name: data.guestUser.name }));
            }
          } else {
            setGuestPurchases(null);
          }
        } catch (error) {
          console.error('Error checking guest purchases:', error);
          setGuestPurchases(null);
        } finally {
          setCheckingGuestPurchases(false);
        }
      } else {
        setGuestPurchases(null);
      }
    };

    const timeoutId = setTimeout(checkGuestPurchases, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Pre-fill form from URL parameters
  useEffect(() => {
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }
    if (name) {
      setFormData(prev => ({ ...prev, name }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    console.log('Attempting sign up with:', { 
      name: formData.name, 
      email: formData.email, 
      phone: formData.phone 
    });

    try {
      let response;
      
      if (guestPurchases) {
        // Link guest account
        console.log('Linking guest account with purchases...');
        response = await fetch('/api/auth/link-guest-account', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            name: formData.name,
            password: formData.password,
          }),
        });
      } else {
        // Regular signup
        console.log('Creating new account...');
        response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
          }),
        });
      }

      const data = await response.json();
      
      if (response.ok) {
        console.log('Account creation successful:', data);
        const message = guestPurchases 
          ? 'Account created and linked to your previous purchases! Please sign in.'
          : 'Account created successfully. Please sign in.';
        router.push(`/?message=${encodeURIComponent(message)}`);
      } else {
        console.error('Account creation failed:', data);
        setError(data.error || 'Account creation failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Music className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Join Agra Jamming Club
          </h2>
          <p className="mt-2 text-sm text-purple-100">
            Create your account to access events and subscriptions
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
              {checkingGuestPurchases && (
                <div className="mt-2 text-sm text-blue-600 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking for previous purchases...
                </div>
              )}
              {guestPurchases && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-start">
                    <Gift className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-800 mb-2">
                        🎉 Great news! We found your previous purchases
                      </h3>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>• {guestPurchases.purchases.tickets} event ticket(s)</p>
                        <p>• {guestPurchases.purchases.subscriptions} subscription(s)</p>
                      </div>
                      <p className="text-xs text-green-600 mt-2">
                        Creating an account will link all your previous purchases to this new account.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : guestPurchases ? (
                  'Create Account & Link Purchases'
                ) : (
                  'Create Account'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <a href="/auth/signin" className="text-purple-600 hover:text-purple-500 font-medium">
                  Sign in here
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="text-purple-100 hover:text-white text-sm font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignUpContent />
    </Suspense>
  );
}
