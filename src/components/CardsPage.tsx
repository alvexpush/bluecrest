import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Wifi
} from 'lucide-react';

type CardApplication = {
  id: number;
  card_type: string;
  card_number?: string | null;
  expiry_date?: string | null;
  cardholder_name: string;
  delivery_address: string;
  issuance_fee: number;
  payment_status: string;
  status: string;
  created_at: string;
};

export default function CardsPage({
  user,
  formatCurrency = (amount: number) => `$${amount.toLocaleString()}`
}: {
  user?: any;
  formatCurrency?: (amount: number) => string;
}) {
  const [cards, setCards] = useState<CardApplication[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchCards = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/cards/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Could not load card application');
      setCards(Array.isArray(payload.data) ? payload.data : []);
    } catch (requestError: any) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const applyForCard = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/v1/cards/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ delivery_address: deliveryAddress })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || 'Card application failed');
      setMessage('Debit card application submitted for admin review.');
      await fetchCards();
    } catch (requestError: any) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeApplication = cards.find(card => card.status !== 'REJECTED');
  const releasedCard = cards.find(card => card.status === 'RELEASED');
  const formattedNumber = releasedCard?.card_number
    ? releasedCard.card_number.replace(/(\d{4})(?=\d)/g, '$1 ')
    : '';

  const statusCopy: Record<string, { title: string; detail: string }> = {
    PENDING: {
      title: 'Application under review',
      detail: 'An administrator will review and approve your debit card request.'
    },
    AWAITING_PAYMENT: {
      title: 'Card approved — issuance payment required',
      detail: `Your card fee is ${formatCurrency(Number(activeApplication?.issuance_fee || 0))}. Contact support after making the arranged payment. No payment is collected on this page.`
    },
    PAYMENT_CONFIRMED: {
      title: 'Payment confirmed',
      detail: 'Your payment has been confirmed. The administrator can now release your card.'
    },
    RELEASED: {
      title: 'Card released',
      detail: 'Your Blue Crest debit card is active in the portal.'
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4 md:py-8 space-y-8">
      <section className="rounded-[2.5rem] bg-gradient-to-br from-[#003399] via-blue-800 to-indigo-950 p-8 md:p-10 text-white overflow-hidden relative">
        <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-cyan-300/10 blur-2xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Blue Crest Debit
          </span>
          <h2 className="mt-5 text-3xl md:text-4xl font-extrabold tracking-tight">A card created only when you’re ready.</h2>
          <p className="mt-3 text-sm text-blue-100/80 leading-relaxed">
            Apply for your debit card, wait for approval, complete the arranged issuance payment, and receive the card after an administrator confirms and releases it.
          </p>
        </div>
      </section>

      {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">{message}</div>}
      {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-xs font-bold text-rose-700">{error}</div>}

      {loading ? (
        <div className="py-20 text-center text-sm font-semibold text-slate-400">Loading card services…</div>
      ) : releasedCard ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="relative aspect-[1.6/1] rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 p-7 md:p-9 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#d4af37_1px,_transparent_1px)] bg-[size:16px_16px]" />
            <div className="relative h-full flex flex-col justify-between">
              <div className="flex justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-[0.25em] text-amber-300">BLUE CREST RESERVE</p>
                  <p className="mt-1 text-[8px] font-bold tracking-widest text-slate-400">PREMIUM DEBIT</p>
                </div>
                <p className="italic text-xl font-black">VISA</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-9 w-12 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600" />
                <Wifi className="w-6 h-6 rotate-90 text-white/50" />
              </div>
              <div>
                <p className="font-mono text-lg md:text-2xl tracking-[0.18em]">{formattedNumber}</p>
                <div className="mt-5 flex justify-between">
                  <div>
                    <p className="text-[8px] font-bold tracking-widest text-slate-400">CARD HOLDER</p>
                    <p className="mt-1 text-xs md:text-sm font-bold">{releasedCard.cardholder_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold tracking-widest text-slate-400">EXPIRES</p>
                    <p className="mt-1 text-xs md:text-sm font-bold">{releasedCard.expiry_date}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="w-7 h-7" />
            </div>
            <h3 className="mt-5 text-xl font-extrabold text-slate-900">Your debit card is released</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">The card was generated after administrative approval and payment confirmation.</p>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-bold text-slate-700">Delivery address</p>
              <p className="mt-1">{releasedCard.delivery_address}</p>
            </div>
          </div>
        </div>
      ) : activeApplication ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Application', done: true, icon: CreditCard },
            { label: 'Payment confirmation', done: ['PAYMENT_CONFIRMED', 'RELEASED'].includes(activeApplication.status), icon: ShieldCheck },
            { label: 'Card release', done: activeApplication.status === 'RELEASED', icon: PackageCheck }
          ].map(step => (
            <div key={step.label} className={`rounded-3xl border p-6 ${step.done ? 'border-emerald-100 bg-emerald-50/60' : 'border-slate-100 bg-white'}`}>
              <step.icon className={`w-6 h-6 ${step.done ? 'text-emerald-600' : 'text-slate-300'}`} />
              <p className="mt-4 text-sm font-bold text-slate-800">{step.label}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{step.done ? 'Complete' : 'Waiting'}</p>
            </div>
          ))}
          <div className="md:col-span-3 rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
            <div className="flex items-start gap-4">
              <Clock3 className="w-6 h-6 text-[#003399] shrink-0" />
              <div>
                <h3 className="font-extrabold text-slate-900">{statusCopy[activeApplication.status]?.title || activeApplication.status}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{statusCopy[activeApplication.status]?.detail}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#003399] flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">Apply for a debit card</h3>
                <p className="text-xs text-slate-400">One active application per account</p>
              </div>
            </div>
            <form onSubmit={applyForCard} className="mt-7 space-y-4">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Name on card</label>
              <input
                value={`${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim()}
                readOnly
                className="w-full h-12 rounded-xl border border-slate-100 bg-slate-50 px-4 text-sm font-semibold text-slate-600"
              />
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                <textarea
                  value={deliveryAddress}
                  onChange={event => setDeliveryAddress(event.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-200 focus:bg-white"
                  placeholder="Enter the address where the card should be delivered"
                />
              </div>
              <button
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-[#003399] text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Submit Card Application'}
              </button>
            </form>
          </div>
          <div className="lg:col-span-2 rounded-[2.5rem] bg-slate-900 p-8 text-white">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <h3 className="mt-5 text-xl font-extrabold">How issuance works</h3>
            <div className="mt-6 space-y-5 text-sm text-slate-300">
              <p>1. Submit your delivery details.</p>
              <p>2. Admin approves the request and assigns an issuance fee.</p>
              <p>3. Payment is arranged outside this demo page.</p>
              <p>4. Admin confirms payment and releases the portal card.</p>
            </div>
          </div>
        </div>
      )}

      {cards.some(card => card.status === 'REJECTED') && !activeApplication && (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-xs font-semibold text-slate-500">
          <CheckCircle2 className="w-4 h-4" />
          A previous application was rejected. You may submit a new request.
        </div>
      )}
    </div>
  );
}
