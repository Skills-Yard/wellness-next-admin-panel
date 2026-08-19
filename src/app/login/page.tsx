'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Checkbox } from '../../components/ui/checkbox';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

// Standard 4-color Google "G" mark — no icon library in this project ships brand icons.
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await login(email, password);

      if (res.success) {
        // Don't navigate here — the useEffect above already redirects as soon as
        // `isAuthenticated` flips true from setUser() inside login(). Firing a second,
        // independent router.push('/') in the same tick raced that effect's router.replace('/'),
        // which could interrupt/abort the in-flight transition and leave the UI stuck on the
        // login page (or the catalogue page mid-fetch, needing a hard reload) even though the
        // session was actually established. One redirect path only.
        toast.success(res.message || 'Authenticated successfully! Redirecting...');
      } else {
        setErrorMessage(res.message || 'Invalid credentials or connection error.');
      }
    } catch (err: any) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans select-none">

      {/* Left — full-bleed room photo, hidden below lg: (no room to split the screen). */}
      <div className="hidden lg:block lg:w-[46%] xl:w-[45%] flex-shrink-0 relative">
        <img
          src="/images/loginimage.png"
          alt="Spa treatment room"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      {/* Right — the form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[352px] animate-in fade-in zoom-in-95 duration-300">

          <div className="flex flex-col items-center text-center gap-3 mb-9">
            <h1 className="text-2xl font-medium text-black">Welcome Back!</h1>
            <p className="text-sm font-medium text-gray-500">Log in to access the Eezit Admin Panel</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm animate-in fade-in-50 slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="leading-snug font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email + Password */}
            <div className="space-y-8">
              <div className="space-y-3">
                <label htmlFor="email" className="block text-sm font-medium text-[#25180F]">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-3 border border-black/8 rounded-lg text-sm text-gray-900 placeholder:text-black/36 focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-60 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor="password" className="block text-sm font-medium text-[#25180F]">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-3 pr-10 border border-black/8 rounded-lg text-sm text-gray-900 placeholder:text-black/36 focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-60 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between mt-5">
              <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer select-none">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                  className="w-4 h-4 rounded-sm border-gray-500"
                />
                <span className="text-xs font-medium text-gray-500">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info("Password reset isn't set up yet — contact an admin to reset your password.")}
                className="text-xs font-medium text-[#25180F] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Log in / divider / Google */}
            <div className="mt-9 space-y-[22px]">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[42px] flex items-center justify-center gap-2 bg-[#25180F] hover:bg-black text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Log in</span>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-black/14" />
                <span className="absolute bg-white px-3 text-sm font-medium text-gray-500">or</span>
              </div>

              <button
                type="button"
                onClick={() => toast.info("Google sign-in isn't set up yet.")}
                className="w-full h-[42px] flex items-center justify-center gap-2 border border-black/8 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <GoogleIcon className="w-5 h-5" />
                Continue with Google
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
}
