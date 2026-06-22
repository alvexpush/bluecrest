import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  Bitcoin,
  Building2,
  CreditCard,
  Landmark,
  ShieldCheck,
  Star,
  Trash2,
  WalletCards
} from 'lucide-react';
import { apiRequest } from '../lib/api';

type Method = 'BANK_TRANSFER' | 'CRYPTO_WALLET' | 'PAYPAL' | 'CARD';

type Destination = {
  id: number;
  method: Method;
  label: string;
  details: Record<string, string>;
  is_preferred: number;
};

type Withdrawal = {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  method: Method;
  status: string;
  created_at: string;
};

const methods: {
  id: Method;
  label: string;
  description: string;
  icon: typeof Landmark;
  url?: string;
}[] = [
  {
    id: 'BANK_TRANSFER',
    label: 'Bank account',
    description: 'Connect through the secure bank-linking portal.',
    icon: Landmark,
    url: import.meta.env.VITE_BANK_LINK_URL
  },
  {
    id: 'CARD',
    label: 'Payment card',
    description: 'Link an eligible debit card through the card provider.',
    icon: CreditCard,
    url: import.meta.env.VITE_CARD_LINK_URL
  },
  {
    id: 'PAYPAL',
    label: 'PayPal',
    description: 'Continue to PayPal to authorize your payout account.',
    icon: WalletCards,
    url: import.meta.env.VITE_PAYPAL_LINK_URL
  },
  {
    id: 'CRYPTO_WALLET',
    label: 'Crypto wallet',
    description: 'Connect a supported wallet through the verification portal.',
    icon: Bitcoin,
    url: import.meta.env.VITE_CRYPTO_LINK_URL
  }
];

export default function WithdrawalPage({
  balance,
  formatCurrency
}: {
  balance: number;
  formatCurrency: (amount: number) => string;
}) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [saved, requests] = await Promise.all([
      apiRequest<Destination[]>('/api/v1/withdrawal-destinations'),
      apiRequest<Withdrawal[]>('/api/v1/withdrawals')
    ]);
    setDestinations(saved);
    setWithdrawals(requests);
    const preferredDestination = saved.find(item => item.is_preferred) || saved[0];
    if (preferredDestination) setSelectedId(String(preferredDestination.id));
  }, []);

  useEffect(() => {
    load().catch(error => setMessage(error.message));
  }, [load]);

  const selected = useMemo(
    () => destinations.find(item => String(item.id) === selectedId),
    [destinations, selectedId]
  );

  const startLink = (item: (typeof methods)[number]) => {
    if (!item.url) {
      setMessage(`${item.label} linking is awaiting the security team's provider URL.`);
      return;
    }

    const providerUrl = new URL(item.url, window.location.origin);
    providerUrl.searchParams.set('method', item.id);
    providerUrl.searchParams.set('return_url', `${window.location.origin}/?withdrawal_link=callback`);
    sessionStorage.setItem('pending_withdrawal_method', item.id);
    window.location.assign(providerUrl.toString());
  };

  const submitWithdrawal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await apiRequest('/api/v1/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          destination_id: Number(selectedId),
          amount: Number(amount),
          note
        })
      });
      setAmount('');
      setNote('');
      setMessage('Withdrawal request submitted for administrative review.');
      await load();
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const removeDestination = async (id: number) => {
    try {
      await apiRequest(`/api/v1/withdrawal-destinations/${id}`, { method: 'DELETE' });
      await load();
    } catch (error: any) {
      setMessage(error.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 md:py-8">
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-7 md:p-10 flex flex-col md:flex-row justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300 font-bold">Company payout center</p>
          <h2 className="text-3xl font-extrabold mt-2">Withdraw your funds</h2>
          <p className="text-slate-400 text-sm mt-2">Connect a payout account and submit a trackable request.</p>
        </div>
        <div className="bg-white/10 rounded-2xl px-6 py-4 self-start">
          <p className="text-[10px] uppercase text-slate-400 font-bold">Available balance</p>
          <p className="text-xl font-extrabold mt-1">{formatCurrency(balance)}</p>
        </div>
      </section>

      {message && (
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-[#003399] text-sm font-bold">
          {message}
        </div>
      )}

      <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
        <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
          <div className="mb-5">
            <h3 className="font-extrabold text-slate-900">Link a payout account</h3>
            <p className="text-xs text-slate-400 mt-1">
              Choose a provider. You will return here after it confirms the connection.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {methods.map(item => (
              <button
                type="button"
                key={item.id}
                onClick={() => startLink(item)}
                className="group text-left p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-white text-[#003399] flex items-center justify-center shadow-sm">
                    <item.icon className="w-5 h-5" />
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#003399]" />
                </div>
                <p className="font-extrabold text-sm text-slate-800 mt-4">{item.label}</p>
                <p className="text-[11px] leading-relaxed text-slate-400 mt-1">{item.description}</p>
              </button>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 mt-4 text-xs text-emerald-800">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p>
              Account details are entered with the selected provider. BlueCrest only accepts a verified connection
              result from the future security integration.
            </p>
          </div>

          <h4 className="font-extrabold text-sm text-slate-900 mt-7 mb-3">Connected payout accounts</h4>
          {destinations.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-100 py-10 text-center">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600 mt-3">No accounts connected yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {destinations.map(item => (
                <label
                  key={item.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer ${
                    selectedId === String(item.id) ? 'border-blue-300 bg-blue-50/50' : 'border-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="selected_destination"
                    value={item.id}
                    checked={selectedId === String(item.id)}
                    onChange={event => setSelectedId(event.target.value)}
                  />
                  <Building2 className="w-5 h-5 text-[#003399]" />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      {item.label}
                      {item.is_preferred ? <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> : null}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {item.method.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDestination(item.id)}
                    className="p-2 text-rose-400"
                    aria-label={`Delete ${item.label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </label>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-6">
          <form
            method="post"
            action="/api/v1/withdrawals"
            acceptCharset="UTF-8"
            onSubmit={submitWithdrawal}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-5"
          >
            <h3 className="font-extrabold text-slate-900">New withdrawal request</h3>
            <input type="hidden" name="destination_id" value={selectedId} />

            <div>
              <label className="form-label">Payout account</label>
              <div className="p-4 rounded-2xl bg-slate-50 text-sm font-bold text-slate-700">
                {selected?.label || 'Connect an account first'}
              </div>
            </div>

            <div>
              <label htmlFor="withdrawal-amount" className="form-label">Amount</label>
              <input
                id="withdrawal-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={balance}
                value={amount}
                onChange={event => setAmount(event.target.value)}
                required
                className="field-control"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="withdrawal-note" className="form-label">Payment note</label>
              <textarea
                id="withdrawal-note"
                name="note"
                value={note}
                onChange={event => setNote(event.target.value)}
                rows={3}
                className="field-control"
                placeholder="Optional reference for the payout team"
              />
            </div>

            <button
              disabled={loading || !selectedId}
              className="w-full py-4 rounded-2xl bg-[#003399] disabled:bg-slate-200 text-white font-bold text-sm"
            >
              {loading ? 'Submitting...' : 'Submit withdrawal request'}
            </button>
          </form>

          <section className="bg-white rounded-[2rem] p-6 border border-slate-100">
            <h3 className="font-extrabold text-slate-900 mb-4">Recent requests</h3>
            <div className="space-y-3">
              {withdrawals.length === 0 && (
                <p className="text-xs text-slate-400">No withdrawal requests yet.</p>
              )}
              {withdrawals.slice(0, 6).map(item => (
                <div key={item.id} className="flex justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-500">{item.reference}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold">{item.currency} {Number(item.amount).toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-[#003399] uppercase mt-1">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
