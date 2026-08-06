'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle, 
  ShieldCheck,
  ArrowRight 
} from 'lucide-react';
import { toast } from 'react-toastify';

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
        toast.success(res.message || 'Authenticated successfully! Redirecting...');
        router.push('/');
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
    <div className="min-h-screen w-full bg-[#FAF9F6] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Soft Decorative Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[#FAF5F0] via-[#F2E5D9]/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tl from-[#D4A373]/10 via-[#FAF5F0]/60 to-transparent blur-3xl pointer-events-none" />

      {/* Subtle Pattern Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#C68A4C_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-[0.12] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Top Branding Section */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1C1512] to-[#3D3028] flex items-center justify-center text-[#D4A373] shadow-lg mb-3.5 border border-[#3D3028]">
            <Sparkles className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Eezit Admin
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 flex items-center gap-1.5 justify-center font-medium">
            <ShieldCheck className="w-4 h-4 text-[#C68A4C]" />
            Secure Portal Authentication
          </p>
        </div>

        {/* Shadcn White Card */}
        <Card className="border border-gray-200/80 bg-white/95 backdrop-blur-sm text-gray-900 shadow-xl shadow-gray-200/60 rounded-3xl overflow-hidden p-1 sm:p-2">
          
          <CardHeader className="space-y-1 pb-3 pt-5 px-6 text-center sm:text-left">
            <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">
              Sign In to Your Account
            </CardTitle>
            <p className="text-xs text-gray-500">
              Enter your credentials to access the admin management console.
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6 pt-2">
            
            {/* Error Message Banner */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-xs sm:text-sm animate-in fade-in-50 slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="leading-snug font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Address Field */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@vellora.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-10 h-11 bg-[#FAF9F6]/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] text-sm rounded-xl"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-10 pr-10 h-11 bg-[#FAF9F6]/80 border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] text-sm rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-0.5 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Login Checkbox */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <div className="flex items-center space-x-2.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="border-gray-300 data-[state=checked]:bg-[#1C1512] data-[state=checked]:border-[#1C1512] data-[state=checked]:text-white rounded-md"
                  />
                  <label
                    htmlFor="remember"
                    className="text-xs text-gray-600 cursor-pointer select-none font-medium"
                  >
                    Remember login session
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-[#1C1512] hover:bg-black text-white font-semibold text-sm rounded-xl shadow-md transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2 mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>

            </form>
          </CardContent>

        </Card>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-gray-400 font-medium">
          <p>&copy; {new Date().getFullYear()} Vellora Wellness Inc. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
