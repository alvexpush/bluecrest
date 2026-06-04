import React, { useState, useEffect } from 'react';
import { ToggleLeft, Wrench, RefreshCw, Check, ShieldCheck, DollarSign, Award } from 'lucide-react';

interface SandboxPanelProps {
  user: any;
  onRefreshUser: () => void;
  loans: any[];
  onRefreshLoans?: () => void;
}

export default function SandboxPanel({ user, onRefreshUser, loans = [], onRefreshLoans }: SandboxPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [activeKyc, setActiveKyc] = useState(user.kycStatus || 'Not Submitted');
  const [isSyncing, setIsSyncing] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');
  const [allLoans, setAllLoans] = useState<any[]>(loans);

  const isRestricted = user.transferFlow === 'RESTRICTED' || user.transfer_flow === 'RESTRICTED';

  useEffect(() => {
    setActiveKyc(user.kycStatus || 'Not Submitted');
  }, [user.kycStatus]);

  // Fetch loans specifically inside the panel to show status controls
  useEffect(() => {
    if (isOpen) {
      loadPanelLoans();
    }
  }, [isOpen]);

  const loadPanelLoans = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!user.id) return;
      const response = await fetch(`/api/v1/loans/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const resData = await response.json();
        setAllLoans(resData.data || resData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (params: { balance?: number; kycStatus?: string; loanId?: string; loanStatus?: string; transferLock?: boolean }) => {
    setIsSyncing(true);
    setResponseMsg('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/test/sandbox', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          ...params
        })
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMsg('Success! State updated.');
        onRefreshUser();
        if (onRefreshLoans) onRefreshLoans();
        setTimeout(() => loadPanelLoans(), 300);
      } else {
        setResponseMsg(data.error || 'Failed updating sandbox.');
      }
    } catch (err) {
      setResponseMsg('Sandbox connection offline.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleApplyBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(balanceInput);
    if (isNaN(val) || val < 0) return;
    handleUpdate({ balance: val });
    setBalanceInput('');
  };

  const handleAddTenGrand = () => {
    const current = Number(user.balance) || 0;
    handleUpdate({ balance: current + 25000 });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-full shadow-2xl flex items-center gap-2.5 z-50 text-xs border border-white/10 animate-outline"
        id="sandbox-toggle-btn"
      >
        <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
        Developer Sandbox
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 max-h-[500px] bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border border-white/10 flex flex-col z-50 overflow-hidden font-sans">
      
      {/* Title */}
      <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">Sandbox Preferences</h4>
        </div>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-xs font-bold text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
        >
          Close
        </button>
      </div>

      <div className="p-4 overflow-y-auto space-y-5 text-xs text-slate-300">
        
        {responseMsg && (
          <div className="p-2 bg-slate-800 text-slate-200 text-[10px] font-bold text-center rounded-xl border border-white/10">
            {responseMsg}
          </div>
        )}

        {/* Dummy Balance Segment */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Test Balance Adjusters</p>
          <div className="flex gap-2">
            <button 
              onClick={handleAddTenGrand} 
              disabled={isSyncing}
              className="px-3 py-2 bg-slate-800 rounded-xl text-[11px] font-bold hover:bg-slate-700 hover:text-white text-slate-200 transition-all shrink-0 border border-slate-700"
            >
              + $25,000 Cash
            </button>
            <form onSubmit={handleApplyBalance} className="flex gap-1 w-full">
              <input 
                type="number" 
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                placeholder="Custom Bal"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 text-[11px] text-white focus:outline-none"
              />
              <button 
                type="submit"
                className="px-2 bg-[#003399] rounded-lg font-bold hover:bg-blue-800"
              >
                Set
              </button>
            </form>
          </div>
        </div>

        {/* KYC Verification Selector */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KYC Verification Protocol</p>
          <div className="grid grid-cols-2 gap-1.5 font-bold">
            {['Not Submitted', 'Pending', 'Verified', 'Rejected'].map((status) => (
              <button
                key={status}
                onClick={() => handleUpdate({ kycStatus: status })}
                disabled={isSyncing}
                className={`py-2 rounded-xl border text-[10px] transition-all ${
                  activeKyc === status 
                    ? 'bg-[#003399]/20 text-blue-400 border-blue-500' 
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-850 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Transfer Lock Switch */}
        <div className="space-y-2 border-t border-white/5 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transfer Lock Restriction</span>
            <button
              onClick={() => handleUpdate({ transferLock: !isRestricted })}
              disabled={isSyncing}
              className={`w-12 h-6 rounded-full p-1 transition-all flex items-center ${
                isRestricted ? 'bg-rose-600 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-md" />
            </button>
          </div>
          <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
            When enabled, transfers will trigger the restricted modal instead of the authorization PIN window.
          </p>
        </div>

        {/* Loans Life Cycle Selector */}
        <div className="space-y-2 border-t border-white/5 pt-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Loans Simulator</p>
          {allLoans.length === 0 ? (
            <p className="text-[10px] text-slate-500 italic">No loan requests submitted to test status cycles yet.</p>
          ) : (
            <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1">
              {allLoans.map((l: any) => (
                <div key={l.id} className="bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-2">
                  <div className="flex justify-between font-mono text-[9px] text-slate-400">
                    <span>{l.id}</span>
                    <span className="font-sans font-bold underline text-[#003399]">{l.status}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 font-sans text-[8px] font-bold uppercase">
                    {['PENDING', 'APPROVED', 'AWAITING_DISBURSEMENT_FEE', 'READY', 'DISBURSED', 'REJECTED'].map((st) => {
                      const apiStatus = st === 'READY' ? 'READY_FOR_DISBURSEMENT' : st;
                      return (
                        <button
                          key={st}
                          onClick={() => handleUpdate({ loanId: l.id, loanStatus: apiStatus })}
                          disabled={isSyncing}
                          className={`py-1 text-center rounded border transition-all ${
                            l.status === apiStatus 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-600' 
                              : 'bg-slate-950 border-slate-800 hover:border-slate-600 text-slate-300'
                          }`}
                        >
                          {st.split('_')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset / Database seed tools */}
        <div className="border-t border-white/5 pt-3 pb-1 text-center text-[10px] text-slate-500 font-semibold font-sans">
          Sandbox overrides communicate in real-time.
        </div>

      </div>
    </div>
  );
}
