import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Bitcoin, Check, CheckCircle2, Copy, Gift, ImagePlus, Info, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { apiRequest } from '../lib/api';

const FALLBACK_BITCOIN_ADDRESS = 'bc1qdxsym4k0rfne6cd0pn6233llkh5sy4fhj7p44l';
const GIFT_CARD_TYPES = ['Apple', 'Amazon', 'Google Play', 'Steam', 'Visa / Mastercard', 'eBay', 'Walmart', 'Other'];

const readImage = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Could not read the selected image.'));
  reader.readAsDataURL(file);
});

interface DepositPageProps {
  formatCurrency?: (amount: number) => string;
  targetAccountId?: number;
  targetAccountLabel?: string;
  compact?: boolean;
  onSubmitted?: () => void;
}

type DepositMethod = 'BITCOIN' | 'GIFTCARD';

export default function DepositPage({ formatCurrency, targetAccountId, targetAccountLabel, compact = false, onSubmitted }: DepositPageProps) {
  const [method, setMethod] = useState<DepositMethod>('BITCOIN');
  const [amount, setAmount] = useState('');
  const [bitcoinAddress, setBitcoinAddress] = useState(FALLBACK_BITCOIN_ADDRESS);
  const [cardType, setCardType] = useState('');
  const [customCardType, setCustomCardType] = useState('');
  const [copied, setCopied] = useState(false);
  const [images, setImages] = useState<{ name: string; data: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const isGiftCard = method === 'GIFTCARD';
  const methodLabel = isGiftCard ? 'gift card' : 'Bitcoin';

  useEffect(() => {
    apiRequest<{ bitcoin_address: string }>('/api/v1/deposits/config')
      .then(config => {
        if (config.bitcoin_address) setBitcoinAddress(config.bitcoin_address);
      })
      .catch(() => {
        // Keep the known public receiving address if configuration cannot be fetched.
      });
  }, []);

  const showMessage = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const selectMethod = (nextMethod: DepositMethod) => {
    setMethod(nextMethod);
    setImages([]);
    setMessage('');
    setIsError(false);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(bitcoinAddress);
      setCopied(true);
      showMessage('Bitcoin address copied. Complete your BTC payment, then upload the transaction receipt below.');
    } catch {
      showMessage('Could not copy automatically. Press and hold the address to copy it.', true);
    }
  };

  const addImages = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files);
    if (images.length + selected.length > 5) return showMessage('You can attach up to 5 proof images.', true);
    if (selected.some(file => !['image/png', 'image/jpeg', 'image/webp'].includes(file.type))) {
      return showMessage('Only PNG, JPG, or WebP images can be uploaded.', true);
    }
    if (selected.some(file => file.size > 3 * 1024 * 1024)) {
      return showMessage('Each proof image must be smaller than 3 MB.', true);
    }

    try {
      const encoded = await Promise.all(selected.map(async file => ({ name: file.name, data: await readImage(file) })));
      setImages(current => [...current, ...encoded]);
      showMessage(`${encoded.length} proof image${encoded.length === 1 ? '' : 's'} attached.`);
    } catch (error: any) {
      showMessage(error.message || 'Could not read the selected image.', true);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    const selectedCardName = cardType === 'Other' ? customCardType.trim() : cardType;
    if (!numericAmount || numericAmount <= 0) return showMessage('Enter a valid deposit amount.', true);
    if (isGiftCard && !selectedCardName) return showMessage('Select or enter the gift card type.', true);
    if (images.length === 0) return showMessage(`Upload proof of your ${methodLabel} deposit before submitting.`, true);

    try {
      setBusy(true);
      showMessage('');
      await apiRequest('/api/v1/deposits', {
        method: 'POST',
        body: JSON.stringify({
          method,
          amount: numericAmount,
          ...(isGiftCard ? { card_name: selectedCardName } : { bitcoin_address: bitcoinAddress }),
          images,
          ...(targetAccountId ? { account_id: targetAccountId } : {})
        })
      });
      showMessage(`Your ${formatCurrency ? formatCurrency(numericAmount) : numericAmount} ${methodLabel} deposit request${targetAccountLabel ? ` to ${targetAccountLabel}` : ''} was submitted for admin review.`);
      setAmount('');
      setImages([]);
      setCopied(false);
      if (isGiftCard) {
        setCardType('');
        setCustomCardType('');
      }
      onSubmitted?.();
    } catch (error: any) {
      showMessage(error.message || 'Could not submit the deposit.', true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? '' : 'max-w-4xl mx-auto py-4 md:py-8'}>
      {!compact && (
        <div className="mb-7">
          <p className="text-[10px] font-bold text-[#003399] uppercase tracking-[0.2em]">Fund your account</p>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-1">Make a deposit</h2>
          <p className="mt-2 text-sm text-slate-500">Choose Bitcoin or gift card, enter the value, and upload clear proof for admin review.</p>
        </div>
      )}

      {targetAccountLabel && (
        <div className="mb-4 rounded-2xl bg-blue-50 border border-blue-100 p-3 text-xs font-bold text-[#003399]">
          Deposit destination: {targetAccountLabel}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <button type="button" onClick={() => selectMethod('BITCOIN')} className={`rounded-2xl border p-4 text-left transition-colors ${method === 'BITCOIN' ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
          <Bitcoin className={`mb-3 h-6 w-6 ${method === 'BITCOIN' ? 'text-[#003399]' : 'text-slate-400'}`} />
          <span className="block text-sm font-extrabold text-slate-800">Bitcoin</span>
          <span className="mt-1 block text-[10px] leading-4 text-slate-500">Send BTC and attach the transaction receipt.</span>
        </button>
        <button type="button" onClick={() => selectMethod('GIFTCARD')} className={`rounded-2xl border p-4 text-left transition-colors ${method === 'GIFTCARD' ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-100 bg-white hover:border-blue-200'}`}>
          <Gift className={`mb-3 h-6 w-6 ${method === 'GIFTCARD' ? 'text-[#003399]' : 'text-slate-400'}`} />
          <span className="block text-sm font-extrabold text-slate-800">Gift Card</span>
          <span className="mt-1 block text-[10px] leading-4 text-slate-500">Submit clear front and back images of your card.</span>
        </button>
      </div>

      <form onSubmit={submit} className={`overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm ${compact ? '' : 'shadow-slate-200/40'}`}>
        <div className={`${compact ? 'p-4 md:p-5' : 'p-6 md:p-8'} space-y-7`}>
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003399] text-xs font-extrabold text-white">1</span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Enter the deposit value</h3>
                <p className="text-[11px] text-slate-500">This is the amount that will be credited after approval.</p>
              </div>
            </div>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={event => setAmount(event.target.value)} className="field-control text-lg font-extrabold" placeholder="0.00" />
          </section>

          <section className="border-t border-slate-100 pt-7">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003399] text-xs font-extrabold text-white">2</span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{isGiftCard ? 'Tell us which gift card you are sending' : 'Send Bitcoin to the address below'}</h3>
                <p className="text-[11px] text-slate-500">{isGiftCard ? 'Choose the brand so the admin can verify it correctly.' : 'Use only the Bitcoin network for this payment.'}</p>
              </div>
            </div>

            {isGiftCard ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="form-label">Gift card type</span>
                  <select value={cardType} onChange={event => setCardType(event.target.value)} className="field-control">
                    <option value="">Select gift card</option>
                    {GIFT_CARD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                {cardType === 'Other' && (
                  <label>
                    <span className="form-label">Card name</span>
                    <input maxLength={80} value={customCardType} onChange={event => setCustomCardType(event.target.value)} className="field-control" placeholder="Enter gift card brand" />
                  </label>
                )}
                <div className="sm:col-span-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  Make sure the card brand and value are visible. Do not send the same card in more than one request.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-4 md:p-5">
                <div className="mb-3 flex items-center gap-2 text-[#003399]">
                  <Bitcoin className="h-5 w-5" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">Bitcoin network (BTC)</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 select-all break-all rounded-xl bg-white p-4 text-xs font-bold text-slate-700 ring-1 ring-slate-100">{bitcoinAddress}</code>
                  <button type="button" onClick={copyAddress} className={`flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-xs font-bold text-white ${copied ? 'bg-emerald-600' : 'bg-[#003399] hover:bg-blue-800'}`}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Address copied' : 'Copy address'}
                  </button>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] font-semibold leading-5 text-amber-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  Send only Bitcoin (BTC) using the Bitcoin network. Another asset or network may be permanently lost.
                </div>
              </div>
            )}
          </section>

          <section className="border-t border-slate-100 pt-7">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#003399] text-xs font-extrabold text-white">3</span>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{isGiftCard ? 'Upload the gift card images' : 'Upload your transaction receipt'}</h3>
                <p className="text-[11px] text-slate-500">{isGiftCard ? 'Front and back images are recommended for a complete review.' : 'Attach a clear screenshot after completing the payment.'}</p>
              </div>
            </div>
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-slate-500 hover:border-blue-300 hover:bg-blue-50/40">
              <ImagePlus className="mb-2 h-7 w-7 text-[#003399]" />
              <span className="text-xs font-extrabold text-slate-700">{isGiftCard ? 'Upload front, back, or receipt images' : 'Upload Bitcoin transaction receipt'}</span>
              <span className="mt-1 text-[10px]">PNG, JPG, or WebP · maximum 3 MB each · up to 5 images</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={event => { addImages(event.target.files); event.target.value = ''; }} />
            </label>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {images.map((image, index) => (
                  <div key={`${image.name}-${index}`} className="relative aspect-square">
                    <img src={image.data} alt={image.name} className="h-full w-full rounded-xl object-cover ring-1 ring-slate-200" />
                    <button type="button" aria-label={`Remove ${image.name}`} onClick={() => setImages(items => items.filter((_, itemIndex) => itemIndex !== index))} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {message && (
            <div className={`flex items-start gap-2 rounded-xl p-4 text-sm font-semibold ${isError ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
              {isError ? <Info className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
              {message}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-5 md:px-8">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Your account is credited only after an admin reviews and approves the evidence.
          </div>
          <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#003399] font-bold text-white disabled:opacity-60">
            {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {busy ? 'Submitting…' : `Submit ${isGiftCard ? 'gift card' : 'Bitcoin'} deposit for review`}
          </button>
        </div>
      </form>
    </div>
  );
}
