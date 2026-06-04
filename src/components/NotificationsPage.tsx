import { Bell, Shield, Info, AlertTriangle } from 'lucide-react';

const NOTIFICATIONS = [
  { id: 1, title: 'Security Alert', message: 'A new device logged into your account from Cary, NC.', time: '2 hours ago', type: 'security' },
  { id: 2, title: 'Transfer Received', message: 'You received $5,000.00 from Frank Brockman.', time: '5 hours ago', type: 'info' },
  { id: 3, title: 'Limit Warning', message: 'You have reached 80% of your daily transfer limit.', time: '1 day ago', type: 'warning' },
  { id: 4, title: 'Welcome to Blue Crest', message: 'Thank you for choosing Blue Crest Premium Banking.', time: '2 days ago', type: 'info' },
];

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Notifications</h2>
      <div className="space-y-4">
        {NOTIFICATIONS.map((note) => (
          <div key={note.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              note.type === 'security' ? 'bg-rose-50 text-rose-500' : 
              note.type === 'warning' ? 'bg-amber-50 text-amber-500' :
              'bg-blue-50 text-[#003399]'
            }`}>
              {note.type === 'security' ? <Shield className="w-6 h-6" /> : 
               note.type === 'warning' ? <AlertTriangle className="w-6 h-6" /> :
               <Bell className="w-6 h-6" />}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-900">{note.title}</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{note.time}</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">{note.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
