import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, RefreshCw, CheckCircle } from 'lucide-react';
import { getTranslation, LanguageCode } from '../lib/translations';

interface SecurityPageProps {
  user: any;
  onPinUpdated: (newPin: string) => void;
  lang?: LanguageCode;
}

export default function SecurityPage({ user, onPinUpdated, lang = 'en' }: SecurityPageProps) {
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const t = (key: string, fallback: string = "") => getTranslation(lang, key, fallback);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPin.length < 4) {
      setErrorMsg('Your Transfer PIN must be at least 4 digits long.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('PINs do not match. Please verify the characters entered.');
      return;
    }

    setIsLoading(true);

    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('/api/v1/users/transfer-pin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          pin: newPin
        })
      });

      setIsLoading(false);
      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to update Transfer PIN.');
        return;
      }

      setSuccessMsg(`Your Transfer PIN has been updated successfully from '${user.transferPin || "****"}' to '${newPin}'!`);
      onPinUpdated(newPin);
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Could not establish secure encryption connection.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-50 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-[#003399] rounded-2xl flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t('securityPin', 'Security PIN')}</h2>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Phase 3 — Transfer PIN Authorization</p>
          </div>
        </div>

        {/* Informative Warning Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
          <div className="font-semibold text-xs leading-relaxed">
            <p className="text-slate-800 mb-1">Authorization Layer Active</p>
            <p className="text-slate-500 leading-normal font-medium">
              Your Transfer PIN is distinct from your portal login password. This code is required on every outgoing wire transfer, secure deposit execution, or stock trade to verify user intent.
            </p>
          </div>
        </div>

        {/* Success/Error displays */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-700 text-xs font-bold p-4 rounded-2xl border border-emerald-100 text-center flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-2xl border border-rose-100 text-center">
            {errorMsg}
          </div>
        )}

        {/* Current status display values */}
        <div className="grid grid-cols-2 gap-4 border-y border-slate-100 py-6 my-2">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans mb-1">
              Active PIN Code
            </span>
            <span className="text-sm font-bold font-mono text-[#003399]">
              {user.transferPin ? `•••• [${user.transferPin}]` : 'Not Configured (Default "1234")'}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans mb-1">
              Validation Protocol
            </span>
            <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
              SHA-256 SECURED
            </span>
          </div>
        </div>

        {/* Set PIN form */}
        <form onSubmit={handleUpdatePin} className="space-y-5">
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
              Create New Transfer PIN
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password"
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 to 8 digit numeric PIN code"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-sm font-semibold focus:bg-white focus:border-blue-200 outline-none transition-all font-mono tracking-widest"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-sans">
              Confirm New PIN
            </label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password"
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="Retype chosen PIN code"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-sm font-semibold focus:bg-white focus:border-blue-200 outline-none transition-all font-mono tracking-widest"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-[#003399] text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-blue-800 transition-all active:scale-[0.98] disabled:opacity-70 shadow-md shadow-blue-900/5 mt-4"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              'Save & Authorize PIN'
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
