console.log('ADMIN PANEL LOADED');
import React, { useState, useEffect } from 'react';
import {
  Users,
  Send,
  Landmark,
  UserCheck,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Lock,
  Unlock,
  PlusCircle,
  Check,
  X,
  CreditCard,
  Calendar,
  Edit,
  Trash2,
  Eye,
  FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  currentUser: any;
  formatUserCurrency?: (amount: number) => string;
}

const ADMIN_COUNTRY_CURRENCY_LIST = [
  { country: "United States of America", currency: "USD" },
  { country: "United Kingdom", currency: "GBP" },
  { country: "Canada", currency: "CAD" },
  { country: "United Arab Emirates", currency: "AED" },
  { country: "European Union Countries", currency: "EUR" },
  { country: "Australia", currency: "AUD" },
  { country: "Nigeria", currency: "NGN" },
  { country: "Singapore", currency: "SGD" },
  { country: "South Africa", currency: "ZAR" },
  { country: "Switzerland", currency: "CHF" },
  { country: "India", currency: "INR" },
  { country: "Japan", currency: "JPY" }
];

export default function AdminPanel({ currentUser, formatUserCurrency }: AdminPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'transfers' | 'loans' | 'create-txn'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [responseMsg, setResponseMsg] = useState('');

  // Custom states for forms
  const [targetUserId, setTargetUserId] = useState('');
  const [txnType, setTxnType] = useState('CREDIT');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnDesc, setTxnDesc] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);

  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [addFirstName, setAddFirstName] = useState('');
  const [addLastName, setAddLastName] = useState('');
  const [addUsername, setAddUsername] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addCountry, setAddCountry] = useState('United States of America');
  const [addCurrency, setAddCurrency] = useState('USD');
  const [addDob, setAddDob] = useState('');

  // Editing Row State
  const [editingUserId, setEditingUserId] = useState<number | string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editTransferPin, setEditTransferPin] = useState('');

  // KYC inspection modal state
  const [inspectKycUser, setInspectKycUser] = useState<any | null>(null);

  const formatCurrency = formatUserCurrency || ((amt: number) => `$${amt.toLocaleString()}`);
  const token = localStorage.getItem('auth_token');

  const fetchData = async () => {
    setIsLoading(true);
    setResponseMsg('');
    try {
      // 1. Fetch all users
      const usersRes = await fetch('/api/v1/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.data || data);
      }

      // 2. Fetch all transfers
      const transfersRes = await fetch('/api/v1/transfers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (transfersRes.ok) {
        const data = await transfersRes.json();
        setTransfers(data.data || data);
      }

      // 3. Fetch all loans
      const loansRes = await fetch('/api/v1/loans', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (loansRes.ok) {
        const data = await loansRes.json();
        setLoans(data.data || data);
      }

      // 4. Fetch all transactions
      const txnsRes = await fetch('/api/v1/transactions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (txnsRes.ok) {
        const data = await txnsRes.json();
        setTransactions(data.data || data);
      }
    } catch (e) {
      console.error(e);
      setResponseMsg('Failed to fetch admin stats.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update user KYC status
  const handleUpdateKyc = async (userId: string | number, newKyc: string) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/users/kyc/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newKyc }) // backend expects body.status
      });
      if (res.ok) {
        setResponseMsg('KYC status updated successfully!');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to update KYC.');
      }
    } catch (e) {
      setResponseMsg('Server connection offline.');
    }
  };
  // Update user transfer flow status (PENDING, COMPLETED, RESTRICTED)
  const handleUpdateTransferFlow = async (userId: string | number, newFlow: string) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ transfer_flow: newFlow })
      });
      if (res.ok) {
        setResponseMsg('Transfer restriction flow updated successfully!');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to update transfer flow.');
      }
    } catch (e) {
      setResponseMsg('Server connection offline.');
    }
  };
  const handleCreateManualTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponseMsg('');
    if (!targetUserId || !txnAmount) {
      setResponseMsg('Please fill all fields.');
      return;
    }

    try {
      const res = await fetch(`/api/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: targetUserId,
          type: txnType,
          amount: Number(txnAmount),
          status: 'COMPLETED',
          description: txnDesc || 'Manual System Adjustment',
          transaction_date: txnDate
        })
      });

      if (res.ok) {
        setResponseMsg(`Transaction recorded successfully in ledger!`);
        setTxnAmount('');
        setTxnDesc('');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to issue transaction.');
      }
    } catch (e) {
      console.error(e);
      setResponseMsg('Server error.');
    }
  };
  // Register New User
  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponseMsg('');
    try {
      const res = await fetch('/api/v1/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          first_name: addFirstName,
          last_name: addLastName,
          username: addUsername,
          email: addEmail,
          phone: addPhone,
          password: addPassword,
          country: addCountry,
          preferred_currency: addCurrency,
          date_of_birth: addDob,
          transfer_pin: null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setResponseMsg(`Member '${addFirstName} ${addLastName}' registered successfully!`);
        setShowAddUser(false);
        setAddFirstName('');
        setAddLastName('');
        setAddUsername('');
        setAddEmail('');
        setAddPhone('');
        setAddPassword('');
        setAddDob('');
        fetchData();
      } else {
        setResponseMsg(data.error || 'Failed to register member.');
      }
    } catch (e) {
      setResponseMsg('Server connection offline.');
    }
  };

  // Start Editing User Row
  const handleStartEdit = (u: any) => {
    setEditingUserId(u.id);
    setEditFirstName(u.first_name || u.firstName || '');
    setEditLastName(u.last_name || u.lastName || '');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setEditCurrency(u.preferred_currency || u.preferredCurrency || 'USD');
    setEditBalance(u.balance?.toString() || '0');
    setEditDob(u.date_of_birth || u.dateOfBirth || '');
    setEditTransferPin('');
  };

  // Save Edit Row
  const handleSaveEdit = async (userId: string | number) => {
    setResponseMsg('');
    try {
      const payload: any = {
        first_name: editFirstName,
        last_name: editLastName,
        email: editEmail,
        phone: editPhone,
        preferred_currency: editCurrency,
        balance: Number(editBalance),
        date_of_birth: editDob
      };

      // If admin specified a custom Transfer PIN, send it
      if (editTransferPin !== '') {
        payload.transfer_pin = editTransferPin;
      }

      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setResponseMsg('Member profile updated successfully!');
        setEditingUserId(null);
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to update user.');
      }
    } catch (e) {
      setResponseMsg('Server error.');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this user permanently? This action is irreversible.')) {
      return;
    }
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setResponseMsg('User deleted successfully.');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to delete user.');
      }
    } catch (e) {
      setResponseMsg('Server error.');
    }
  };

  // Update loan status
  const handleUpdateLoanStatus = async (loanId: string | number, status: string) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/loans/${loanId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setResponseMsg(`Loan status set to ${status}!`);
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to update loan.');
      }
    } catch (e) {
      setResponseMsg('Server connection offline.');
    }
  };

  // Assign origination fee (uses disbursement_fee)
  const handleAssignLoanFee = async (loanId: string | number, fee: number) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/loans/${loanId}/fee`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ disbursement_fee: fee }) // backend expects disbursement_fee
      });
      if (res.ok) {
        setResponseMsg('Loan escrow origination fee assigned!');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed assigning fee.');
      }
    } catch (e) {
      setResponseMsg('Server error.');
    }
  };

  // Confirm escrow origination fee directly
  const handleConfirmLoanFee = async (loanId: string | number) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/loans/${loanId}/confirm-fee`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setResponseMsg('Escrow origination fee marked as PAID successfully!');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed confirming fee.');
      }
    } catch (e) {
      setResponseMsg('Server error.');
    }
  };

  // Disburse Loan capital
  const handleDisburseLoan = async (loanId: string | number) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/loans/${loanId}/disburse`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setResponseMsg('Loan disbursed successfully!');
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed to disburse loan.');
      }
    } catch (e) {
      setResponseMsg('Connection failed.');
    }
  };

  // Update transfer status
  const handleUpdateTransferStatus = async (transferId: string | number, status: string) => {
    setResponseMsg('');
    try {
      const res = await fetch(`/api/v1/transfers/${transferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setResponseMsg(`Transfer updated to ${status}!`);
        fetchData();
      } else {
        const err = await res.json();
        setResponseMsg(err.error || 'Failed updating status.');
      }
    } catch (e) {
      setResponseMsg('Connection error.');
    }
  };

  // Computations for Admin Statistics Cards
  const totalUsers = users.length;
  const totalBalances = users.reduce((sum, u) => sum + (Number(u.balance) || 0), 0);
  const totalFundedLoans = loans
    .filter(l => l.status === 'DISBURSED')
    .reduce((sum, l) => sum + (Number(l.requested_amount) || 0), 0);
  const pendingAuditsCount = transfers.filter(t => t.status === 'PENDING').length;
  const totalFunded = transactions
    .filter(t => t.type === 'CREDIT' || t.type === 'credit')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans">

      {/* Header Banner */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-white/5">
        <div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold tracking-wider rounded-full uppercase">Admin Backoffice Access</span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-3">Core Banking Control Center</h2>
          <p className="text-slate-400 text-xs mt-1">Manage global balances, KYC review requests, loan audits, and secure transaction lockouts.</p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Reload System Logs
        </button>
      </div>

      {/* STATISTICS CARDS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#003399] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Members</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{totalUsers}</p>
          </div>
        </div>

        {/* Total Wallet Assets */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Deposits</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalBalances)}</p>
          </div>
        </div>

        {/* Disbursed Financing */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Funded Financing</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalFundedLoans)}</p>
          </div>
        </div>

        {/* Total Funded Amount */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Funded</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{formatCurrency(totalFunded)}</p>
          </div>
        </div>

        {/* Pending Transfer Audits */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Audits</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{pendingAuditsCount}</p>
          </div>
        </div>
      </div>

      {responseMsg && (
        <div className="p-4 bg-slate-50 border border-slate-200 text-[#003399] font-bold text-xs rounded-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          {responseMsg}
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-100 pb-3">
        {[
          { id: 'users', label: 'User Ledger', icon: Users },
          { id: 'transfers', label: 'Transfers & Wires', icon: Send },
          { id: 'loans', label: 'Capital Financing', icon: Landmark },
          { id: 'create-txn', label: 'Issue Transaction', icon: PlusCircle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold transition-all",
              activeSubTab === tab.id
                ? "bg-[#003399] text-white shadow-lg shadow-blue-900/10"
                : "text-slate-500 hover:bg-slate-55/40"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-PAGES RENDERING */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Collapse/Expand Add User Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="w-full px-6 py-4 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-all font-bold text-sm text-slate-800"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#003399]" />
                Register & Add New Portal Member
              </span>
              <span className="text-xs text-[#003399]">{showAddUser ? 'Collapse Form' : 'Expand Form'}</span>
            </button>

            {showAddUser && (
              <form onSubmit={handleRegisterUser} className="p-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">First Name</label>
                  <input
                    type="text"
                    value={addFirstName}
                    onChange={e => setAddFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Last Name</label>
                  <input
                    type="text"
                    value={addLastName}
                    onChange={e => setAddLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Username</label>
                  <input
                    type="text"
                    value={addUsername}
                    onChange={e => setAddUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Email Address</label>
                  <input
                    type="email"
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Phone Number</label>
                  <input
                    type="text"
                    value={addPhone}
                    onChange={e => setAddPhone(e.target.value)}
                    placeholder="Phone"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Password</label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={e => setAddPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Country</label>
                  <select
                    value={addCountry}
                    onChange={e => {
                      const selected = e.target.value;
                      setAddCountry(selected);
                      const found = ADMIN_COUNTRY_CURRENCY_LIST.find(c => c.country === selected);
                      if (found) setAddCurrency(found.currency);
                    }}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none"
                  >
                    {ADMIN_COUNTRY_CURRENCY_LIST.map(c => (
                      <option key={c.country} value={c.country}>{c.country}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Preferred Currency</label>
                  <input
                    type="text"
                    value={addCurrency}
                    readOnly
                    className="w-full h-11 bg-slate-100 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Date of Birth</label>
                  <input
                    type="date"
                    value={addDob}
                    onChange={e => setAddDob(e.target.value)}
                    className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-semibold focus:outline-none text-slate-800"
                    required
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3 flex justify-end mt-2">
                  <button
                    type="submit"
                    className="h-11 px-6 bg-[#003399] hover:bg-blue-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all active:scale-[0.98]"
                  >
                    Register Member
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* User List Table */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-50">
            <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#003399]" />
              Registered Members Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-4">
                    <th className="pb-3">Account Number</th>
                    <th className="pb-3">Name / Email</th>
                    <th className="pb-3">KYC Status</th>
                    <th className="pb-3">Restriction Flow</th>
                    <th className="pb-3">Wallet Balance</th>
                    <th className="pb-3 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => {
                    const isEditing = editingUserId === u.id;
                    const hasKycSubmitted = u.government_id_number || u.id_front_image || u.id_back_image;
                    return (
                      <tr key={u.id} className="hover:bg-slate-55/10 transition-colors">
                        <td className="py-4 font-mono text-xs font-bold text-slate-500">#{u.account_number || u.accountNumber}</td>
                        <td className="py-4">
                          {isEditing ? (
                            <div className="grid grid-cols-2 gap-2 max-w-sm">
                              <input
                                type="text"
                                value={editFirstName}
                                onChange={e => setEditFirstName(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                placeholder="First Name"
                              />
                              <input
                                type="text"
                                value={editLastName}
                                onChange={e => setEditLastName(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                placeholder="Last Name"
                              />
                              <input
                                type="email"
                                value={editEmail}
                                onChange={e => setEditEmail(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs col-span-2"
                                placeholder="Email"
                              />
                              <input
                                type="text"
                                value={editPhone}
                                onChange={e => setEditPhone(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                placeholder="Phone"
                              />
                              <input
                                type="date"
                                value={editDob}
                                onChange={e => setEditDob(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                placeholder="DOB"
                              />
                              <input
                                type="text"
                                value={editTransferPin}
                                onChange={e => setEditTransferPin(e.target.value)}
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs col-span-2 font-mono"
                                placeholder="New 4-digit Transfer PIN (optional)"
                                maxLength={4}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{u.first_name || u.firstName} {u.last_name || u.lastName}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{u.email}</span>
                              <div className="flex gap-2 items-center mt-1">
                                {u.date_of_birth && (
                                  <span className="text-[9px] text-slate-400 font-medium">DOB: {u.date_of_birth}</span>
                                )}
                                <span className={cn(
                                  "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide",
                                  u.transfer_pin ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                )}>
                                  {u.transfer_pin ? "PIN Set" : "No PIN"}
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <select
                              value={u.kyc_status || u.kycStatus || 'NOT_SUBMITTED'}
                              onChange={(e) => handleUpdateKyc(u.id, e.target.value)}
                              className="text-[10px] font-bold bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                            >
                              <option value="NOT_SUBMITTED">Not Submitted</option>
                              <option value="PENDING">Pending</option>
                              <option value="VERIFIED">Verified</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                            {hasKycSubmitted && (
                              <button
                                onClick={() => setInspectKycUser(u)}
                                className="text-[9px] text-[#003399] font-bold flex items-center gap-1 hover:underline"
                              >
                                <Eye className="w-3 h-3" /> Inspect Uploads
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-4">
                          <select
                            value={u.transfer_flow || u.transferFlow || 'PENDING'}
                            onChange={(e) => handleUpdateTransferFlow(u.id, e.target.value)}
                            className={cn(
                              "text-[10px] font-bold border rounded-lg p-1.5 focus:outline-none",
                              (u.transfer_flow === 'RESTRICTED' || u.transferFlow === 'RESTRICTED')
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : (u.transfer_flow === 'COMPLETED' || u.transferFlow === 'COMPLETED')
                                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                  : "bg-amber-50 text-amber-600 border-amber-200"
                            )}
                          >
                            <option value="PENDING">PENDING (Audit Required)</option>
                            <option value="COMPLETED">COMPLETED (Auto-Approve)</option>
                            <option value="RESTRICTED">RESTRICTED (Blocked)</option>
                          </select>
                        </td>
                        <td className="py-4">
                          {isEditing ? (
                            <div className="flex flex-col gap-1">
                              <input
                                type="number"
                                value={editBalance}
                                onChange={e => setEditBalance(e.target.value)}
                                className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold"
                                placeholder="Balance"
                              />
                              <select
                                value={editCurrency}
                                onChange={e => setEditCurrency(e.target.value)}
                                className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                              >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                                <option value="CAD">CAD ($)</option>
                                <option value="AED">AED (د.إ)</option>
                                <option value="AUD">AUD ($)</option>
                                <option value="NGN">NGN (₦)</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-extrabold text-slate-800">{formatCurrency(u.balance)}</span>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {isEditing ? (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => handleSaveEdit(u.id)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Save
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-2.5 py-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-end items-center">
                              <button
                                onClick={() => handleStartEdit(u)}
                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Edit Profile Details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                title="Delete User Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'transfers' && (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-50">
          <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-[#003399]" />
            Transaction Ledger & Audits
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-4">
                  <th className="pb-3">Txn ID</th>
                  <th className="pb-3">Sender Email</th>
                  <th className="pb-3">Recipient Account</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Manual Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-55/10 transition-colors">
                    <td className="py-4 font-mono text-xs text-slate-400">#TXN-{t.id}</td>
                    <td className="py-4">
                      <span className="font-bold text-slate-700 text-xs">{t.sender_email || 'System'}</span>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-slate-800">{t.recipient_name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{t.recipient_bank} ({t.recipient_account_number})</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="font-extrabold text-slate-850">{formatCurrency(t.amount)}</span>
                    </td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 bg-slate-50 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.description || 'Transfer'}</span>
                    </td>
                    <td className="py-4">
                      <span className={cn(
                        "px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-widest",
                        t.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : t.status === 'PENDING' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                      )}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {t.status === 'PENDING' && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => handleUpdateTransferStatus(t.id, 'COMPLETED')}
                            className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                            title="Approve & Release Transfer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleUpdateTransferStatus(t.id, 'DECLINED')}
                            className="p-1 bg-rose-500 text-white rounded hover:bg-rose-600"
                            title="Decline & Void Transfer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'loans' && (
        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-slate-50">
          <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#003399]" />
            Financing application portfolio
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-4">
                  <th className="pb-3">Loan ID</th>
                  <th className="pb-3">Applicant Name</th>
                  <th className="pb-3">Capital Requested</th>
                  <th className="pb-3">Escrow Fee Billing</th>
                  <th className="pb-3">State</th>
                  <th className="pb-3 text-right">Loan Clearance Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loans.map((l) => {
                  const applicant = users.find(u => u.id === l.user_id);
                  const applicantName = applicant ? `${applicant.first_name} ${applicant.last_name}` : `User #${l.user_id}`;
                  const applicantEmail = applicant ? applicant.email : '';
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 font-mono text-xs text-slate-400">#LOAN-{l.id}</td>
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-xs">{applicantName}</span>
                          <span className="text-[9px] text-slate-400">{applicantEmail}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-bold text-slate-800">{formatCurrency(l.requested_amount)}</span>
                        <span className="text-[10px] text-slate-400 font-semibold block">{l.repayment_months} Mo repayment</span>
                      </td>
                      <td className="py-4">
                        {l.status === 'APPROVED' ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const val = Number((e.currentTarget.elements.namedItem('fee') as HTMLInputElement).value);
                              if (!isNaN(val)) handleAssignLoanFee(l.id, val);
                            }}
                            className="flex gap-1"
                          >
                            <input
                              type="number"
                              name="fee"
                              placeholder="Origination Fee"
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                            />
                            <button type="submit" className="px-2 py-1 bg-[#003399] text-white rounded-lg text-[10px] font-bold">Assign</button>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-bold text-slate-800">
                              {l.disbursement_fee !== null && l.disbursement_fee !== 0 ? formatCurrency(l.disbursement_fee) : 'No Fee Assigned'}
                            </span>
                            {l.status === 'AWAITING_DISBURSEMENT_FEE' && (
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">
                                Pending Payment
                              </span>
                            )}
                            {l.fee_status === 'PAID' && (
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                                Escrow Paid
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-widest",
                          l.status === 'DISBURSED' ? "bg-emerald-50 text-emerald-600" : l.status === 'PENDING' ? "bg-amber-50 text-amber-600" : l.status === 'REJECTED' ? "bg-rose-50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                        )}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex gap-1 justify-end">
                          {l.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleUpdateLoanStatus(l.id, 'APPROVED')}
                                className="px-3 py-1.5 bg-[#003399] text-white rounded-xl text-[10px] font-bold hover:bg-blue-800"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateLoanStatus(l.id, 'REJECTED')}
                                className="px-3 py-1.5 bg-rose-500 text-white rounded-xl text-[10px] font-bold hover:bg-rose-600"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {l.status === 'AWAITING_DISBURSEMENT_FEE' && (
                            <button
                              onClick={() => handleConfirmLoanFee(l.id)}
                              className="px-3 py-1.5 bg-teal-600 text-white rounded-xl text-[10px] font-bold hover:bg-teal-700 animate-pulse flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Confirm Fee Payment
                            </button>
                          )}
                          {l.status === 'READY_FOR_DISBURSEMENT' && (
                            <button
                              onClick={() => handleDisburseLoan(l.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-700"
                            >
                              Disburse Capital
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'create-txn' && (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 max-w-lg mx-auto">
          <h3 className="font-extrabold text-slate-800 text-lg mb-6 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#003399]" />
            Issue Custom Transaction Ledger
          </h3>

          <form onSubmit={handleCreateManualTxn} className="space-y-4"

          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Select Member Account</label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold focus:outline-none"
                required
              >
                <option value="">-- Choose Member --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.first_name || u.firstName} {u.last_name || u.lastName} (#{u.account_number || u.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transaction Type</label>
                <select
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value)}
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold focus:outline-none"
                >
                  <option value="CREDIT">Direct Credit (Deposit)</option>
                  <option value="DEBIT">Direct Debit (Deduction)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Amount</label>
                <input
                  type="number"
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Transaction Date</label>
              <input
                type="date"
                value={txnDate}
                onChange={(e) => setTxnDate(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold focus:outline-none text-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Description / Note</label>
              <input
                type="text"
                value={txnDesc}
                onChange={(e) => setTxnDesc(e.target.value)}
                placeholder="e.g. System adjustment credit"
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-semibold focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#003399] text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-800 transition-all"
            >
              Issue Transaction Ledger
            </button>
          </form>
        </div>


      )}

      {/* KYC DOCUMENTS INSPECTION MODAL */}
      {inspectKycUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 py-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">KYC Verification Dossier</p>
                <h4 className="text-lg font-extrabold mt-0.5">{inspectKycUser.first_name} {inspectKycUser.last_name}</h4>
              </div>
              <button
                onClick={() => setInspectKycUser(null)}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Government ID Number</span>
                  <span className="text-sm font-extrabold text-slate-800 mt-1 block font-mono">
                    {inspectKycUser.government_id_number || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Current Verification Status</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded mt-1.5 inline-block uppercase",
                    inspectKycUser.kyc_status === 'VERIFIED' ? "bg-emerald-50 text-emerald-600" : inspectKycUser.kyc_status === 'PENDING' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                  )}>
                    {inspectKycUser.kyc_status || 'NOT SUBMITTED'}
                  </span>
                </div>
              </div>

              {/* ID Front Image */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Government ID - Front Image</span>
                {inspectKycUser.id_front_image ? (
                  <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-64 shadow-inner">
                    <img
                      src={inspectKycUser.id_front_image}
                      alt="ID Front"
                      className="object-contain max-h-64 w-full"
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 text-xs font-medium">
                    No Front Image Uploaded
                  </div>
                )}
              </div>

              {/* ID Back Image */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Government ID - Back Image</span>
                {inspectKycUser.id_back_image ? (
                  <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-64 shadow-inner">
                    <img
                      src={inspectKycUser.id_back_image}
                      alt="ID Back"
                      className="object-contain max-h-64 w-full"
                    />
                  </div>
                ) : (
                  <div className="h-24 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex items-center justify-center text-slate-400 text-xs font-medium">
                    No Back Image Uploaded
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => {
                  handleUpdateKyc(inspectKycUser.id, 'REJECTED');
                  setInspectKycUser(null);
                }}
                className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                Reject & Deny KYC
              </button>
              <button
                onClick={() => {
                  handleUpdateKyc(inspectKycUser.id, 'VERIFIED');
                  setInspectKycUser(null);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Verify & Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
