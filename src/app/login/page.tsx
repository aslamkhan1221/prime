'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Mail, User, Building, ArrowRight, ShieldCheck, Printer } from 'lucide-react';
import { useToast } from '@/components/Toast';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupParam = searchParams.get('setup') === 'true';

  const [isSetup, setIsSetup] = useState(isSetupParam);
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('Prime Sublimation');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { success, error } = useToast();

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/auth/setup');
        const data = await res.json();
        if (data.needsSetup) {
          setIsSetup(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingSetup(false);
      }
    }
    check();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSetup) {
        const res = await fetch('/api/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, companyName }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to complete setup');
        }

        success('Admin account & company workspace created successfully!');
        router.push('/dashboard');
        router.refresh();
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Invalid email or password');
        }

        success(`Welcome back, ${data.user?.name || 'User'}!`);
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      error(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-brand-600/30 border border-brand-500/30 animate-pulse flex items-center justify-center text-brand-400">
          <Printer className="w-5 h-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing logo splash gradients */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-magenta-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center relative w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl mb-4">
            <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-slate-900" />
            <div className="absolute -top-1.5 right-1 w-4 h-4 rounded-full bg-magenta-500 border border-slate-900" />
            <div className="absolute top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-400 border border-slate-900" />
            <Printer className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            PRIME <span className="text-brand-400">SUBLIMATION</span>
          </h1>
          <p className="text-xs font-bold text-magenta-400 uppercase tracking-wider mt-1">
            PRINT EVERYTHING YOU WANT
          </p>
        </div>

        {/* Auth Box */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              {isSetup ? (
                <>
                  <ShieldCheck className="w-5 h-5 text-brand-400" />
                  Initial Workspace Setup
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 text-brand-400" />
                  Sign in to your Account
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isSetup
                ? 'Create your administrator account and set up your studio profile.'
                : 'Enter your credentials to access your studio dashboard.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSetup && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Studio / Company Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Prime Sublimation"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@primesublimation.in"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 via-brand-500 to-magenta-600 hover:from-brand-500 hover:to-magenta-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition transform active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isSetup ? 'Initialize Studio & Access' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070a12]" />}>
      <LoginForm />
    </Suspense>
  );
}
