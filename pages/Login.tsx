
import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const user = await api.login(email);
      onLogin(user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fa] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl mb-4 shadow-xl shadow-blue-200">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">StepSecure</h1>
          <p className="text-slate-500 mt-2">Enterprise Gait Recognition Dashboard</p>
        </div>

        <div className="bg-white border border-[#d0d7de] rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  required
                  disabled={isLoggingIn}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@stepsecure.com"
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <a href="#" className="text-xs text-blue-600 font-medium hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  required
                  disabled={isLoggingIn}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f6f8fa] border border-[#d0d7de] rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying Credentials...' : 'Sign In'}
              {!isLoggingIn && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
             <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Enterprise Single Sign-On</div>
             <button disabled className="w-full border border-[#d0d7de] text-slate-400 text-sm font-semibold py-2 rounded-md transition-colors flex items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                Google Workspace
             </button>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col items-center gap-1">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
            Biometric Security Protocol v2.4.1 Active
          </p>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-60">
            Developed by Farox
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
