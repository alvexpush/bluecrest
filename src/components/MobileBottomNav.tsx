import { ChartNoAxesCombined, CreditCard, House, Send, UserRound } from 'lucide-react';
import { cn } from '../lib/utils';

type MobileBottomNavProps = {
  activeTab: string;
  onNavigate: (tab: string) => void;
};

const items = [
  { id: 'history', label: 'Activity', icon: ChartNoAxesCombined },
  { id: 'local-transfer', label: 'Transfer', icon: Send },
  { id: 'dashboard', label: 'Home', icon: House, primary: true },
  { id: 'atm', label: 'Cards', icon: CreditCard },
  { id: 'details', label: 'Profile', icon: UserRound },
];

export default function MobileBottomNav({ activeTab, onNavigate }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-[70] rounded-[1.75rem] border border-white/80 bg-white/95 p-2 shadow-[0_16px_45px_rgba(15,23,42,0.20)] backdrop-blur-xl lg:hidden" aria-label="Primary mobile navigation">
      <div className="grid grid-cols-5 items-end gap-1">
        {items.map(item => {
          const selected = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-bold transition-all active:scale-95',
                selected ? 'text-white' : 'text-slate-500 hover:bg-slate-50',
                item.primary && selected && '-mt-5 min-h-16 shadow-[0_0_28px_rgba(37,99,235,0.65)]',
              )}
            >
              {selected && <span className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg shadow-blue-500/30" />}
              <Icon className={cn('h-5 w-5', item.primary && selected && 'h-6 w-6')} strokeWidth={selected ? 2.5 : 2} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
