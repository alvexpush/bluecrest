import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface CreatePinPageProps {
  userEmail: string;
  onPinCreated: (pin: string) => void;
}

export default function CreatePinPage({ userEmail, onPinCreated }: CreatePinPageProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('The Transfer PIN must be exactly 4 digits.');
      return;
    }

    if (pin !== confirmPin) {
      setError('Confirmation PIN does not match. Please verify.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('/api/v1/users/transfer-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        setError(data.error?.message || data.error || 'Failed to configure Transfer PIN.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onPinCreated(pin);
      }, 1500);
    } catch (err) {
      setLoading(false);
      setError('Could not connect to the security verification service.');
    }
  };

  const handleNumericInput = (val: string, setter: (s: string) => void) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    setter(cleaned);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-slate-50 max-w-md mx-auto text-center" id="create-pin-card">
      <div className="w-16 h-16 bg-blue-50 text-[#003399] rounded-2xl flex items-center justify-center mx-auto mb-6">
        <Shield className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-2">Create Transfer PIN</h2>
      <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-8 leading-relaxed">
        You must create a 4-digit security Transfer PIN before performing transactions.
      </p>

      {success ? (
        <div className="py-6 flex flex-col items-center justify-center gap-3 animate-fade-in" id="pin-success-banner">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
          <p className="text-sm font-bold text-emerald-600">PIN Configured</p>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Continuing Transfer...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-xs font-semibold" id="pin-error-alert">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">New 4-Digit PIN</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => handleNumericInput(e.target.value, setPin)}
                placeholder="••••"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-sm font-semibold tracking-widest focus:bg-white focus:border-blue-200 outline-none transition-all text-center font-mono"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Confirm PIN</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => handleNumericInput(e.target.value, setConfirmPin)}
                placeholder="••••"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-sm font-semibold tracking-widest focus:bg-white focus:border-blue-200 outline-none transition-all text-center font-mono"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#003399] text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-blue-800 transition-all shadow-md shadow-blue-900/10 active:scale-[0.98] disabled:opacity-70 mt-4 text-xs"
            id="btn-create-pin"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Transfer PIN
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
