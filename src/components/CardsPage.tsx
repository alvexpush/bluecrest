import { Wifi, Plus, Lock, Settings } from 'lucide-react';
import { USER_DATA } from '@/src/constants';

const CARDS = [
  { id: 1, type: 'Visa Platinum', number: '4484 9527 2838 5537', expiry: '03/29', color: 'bg-slate-900', secondary: 'bg-slate-800' },
  { id: 2, type: 'Mastercard Gold', number: '5172 8229 1023 9991', expiry: '11/27', color: 'bg-blue-900', secondary: 'bg-blue-800' },
];

export default function CardsPage({ user }: { user?: any }) {
  const activeUser = user || USER_DATA;
  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Your Cards</h2>
        <button className="w-full sm:w-auto bg-[#003399] text-white px-6 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/10">
          <Plus className="w-4 h-4" /> Add New Card
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CARDS.map((card) => (
          <div key={card.id} className="space-y-6">
            <div className="relative aspect-[1.6/1] bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 border border-amber-500/20 rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl group overflow-hidden transition-all duration-300 hover:shadow-amber-500/5">
              {/* Gold Gradient Glows */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-amber-500/10 to-yellow-600/0 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-gradient-to-br from-slate-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#d4af37_1px,_transparent_1px)] bg-[size:16px_16px]" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-300 bg-clip-text text-transparent">
                      BLUE CREST RESERVE
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {card.type}
                    </span>
                  </div>
                  <Wifi className="w-5 h-5 text-amber-400/40" />
                </div>

                <div className="flex items-center gap-4 my-2">
                  {/* Detailed Luxury Gold Microchip */}
                  <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 p-[1px] shadow-md relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_45%,rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.25)_55%,transparent_55%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_45%,rgba(0,0,0,0.25)_45%,rgba(0,0,0,0.25)_55%,transparent_55%)]" />
                    <div className="w-full h-full rounded-[5px] border border-amber-300/30 bg-gradient-to-br from-yellow-350/50 to-amber-500/50" />
                  </div>
                  {/* Contactless payment icon */}
                  <div className="w-8 h-8 rounded-full border border-white/5 bg-white/5 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400/80" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-lg sm:text-2xl font-mono tracking-[0.2em] font-medium bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">{card.number}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Card Holder</p>
                      <p className="text-sm font-bold uppercase tracking-wider text-slate-200">{activeUser.first_name || activeUser.firstName || ''} {activeUser.last_name || activeUser.lastName || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Expires</p>
                      <p className="text-sm font-bold text-slate-200">{card.expiry}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex gap-4">
                <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#003399] hover:bg-blue-50 transition-all">
                  <Lock className="w-5 h-5" />
                </button>
                <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#003399] hover:bg-blue-50 transition-all">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Active Card</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Manage limits & security</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
