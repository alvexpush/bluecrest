import { useCallback, useEffect, useState } from 'react';
import { Bell, Mail, RefreshCw, Send, Settings } from 'lucide-react';
import { apiRequest } from '../lib/api';
import AdminSecurity from './AdminSecurity';

export default function AdminCommunications({ users }: { users: any[] }) {
  const [section, setSection] = useState<'email' | 'notifications' | 'security'>('email');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState<any>({ smtp_port: 587, smtp_secure: false });
  const [email, setEmail] = useState({ subject: '', message: '' });
  const [notification, setNotification] = useState({ title: '', message: '', type: 'INFO', action_link: '' });
  const [logs, setLogs] = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [savedSettings, emailLogs] = await Promise.all([
        apiRequest<any>('/api/v1/admin/email/settings'),
        apiRequest<any[]>('/api/v1/admin/email/logs')
      ]);
      setSettings(current => ({ ...current, ...(savedSettings || {}) }));
      setLogs(emailLogs);
    } catch (err: any) {
      setMessage(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const recipientPayload = { send_to_all: sendToAll, user_ids: selectedUsers };
  const toggleUser = (id: number) => setSelectedUsers(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id]);

  const run = async (action: () => Promise<any>, success: string) => {
    setBusy(true); setMessage('');
    try { await action(); setMessage(success); await load(); }
    catch (err: any) { setMessage(err.message); }
    finally { setBusy(false); }
  };

  const saveSettings = () => run(() => apiRequest('/api/v1/admin/email/settings', {
    method: 'PUT', body: JSON.stringify(settings)
  }), 'SMTP settings saved.');

  const sendEmail = async () => {
    setBusy(true); setMessage('');
    try {
      const result = await apiRequest<any>('/api/v1/admin/email/send', {
        method: 'POST',
        body: JSON.stringify({ ...email, html: email.message.replace(/\n/g, '<br>'), ...recipientPayload })
      });
      setMessage(
        result.failed_count
          ? `Email finished: ${result.sent_count} sent, ${result.failed_count} failed. Check delivery history below.`
          : `Email sent successfully to ${result.sent_count} recipient${result.sent_count === 1 ? '' : 's'}.`
      );
      await load();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendNotification = () => run(() => apiRequest('/api/v1/admin/notifications', {
    method: 'POST', body: JSON.stringify({ ...notification, ...recipientPayload })
  }), 'In-app notification sent.');

  return <div className="space-y-6">
    <div className="flex flex-wrap gap-2">
      {[{ id: 'email', label: 'Email management', icon: Mail }, { id: 'notifications', label: 'In-app notifications', icon: Bell }, { id: 'security', label: 'Security', icon: Settings }].map(item =>
        <button key={item.id} onClick={() => setSection(item.id as any)} className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 ${section === item.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}><item.icon className="w-4 h-4" />{item.label}</button>)}
    </div>
    {message && <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 text-[#003399] text-sm font-bold">{message}</div>}

    {section === 'email' && <div className="grid xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 space-y-4">
        <h3 className="font-extrabold flex items-center gap-2"><Settings className="w-5 h-5 text-[#003399]" /> SMTP configuration</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {[['smtp_host','SMTP host'],['smtp_port','Port'],['smtp_username','Username'],['smtp_password','Password'],['sender_email','Sender email'],['sender_name','Sender name']].map(([key,label]) =>
            <div key={key}><label className="form-label">{label}</label><input type={key === 'smtp_password' ? 'password' : key === 'smtp_port' ? 'number' : 'text'} value={settings[key] || ''} onChange={e => setSettings((value: any) => ({ ...value, [key]: e.target.value }))} placeholder={key === 'smtp_password' && settings.has_password ? 'Saved — leave blank to keep' : label} className="field-control" /></div>)}
        </div>
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={!!settings.smtp_secure} onChange={e => setSettings((value: any) => ({ ...value, smtp_secure: e.target.checked }))} /> Use secure TLS connection</label>
        <div className="flex gap-2"><button disabled={busy} onClick={saveSettings} className="flex-1 py-3 bg-[#003399] text-white rounded-xl text-xs font-bold">Save settings</button><button disabled={busy} onClick={() => run(() => apiRequest('/api/v1/admin/email/test', { method: 'POST' }), 'SMTP connection verified.')} className="px-4 py-3 bg-slate-100 rounded-xl text-xs font-bold">Test</button></div>
      </div>
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 space-y-4">
        <h3 className="font-extrabold flex items-center gap-2"><Send className="w-5 h-5 text-[#003399]" /> Compose email</h3>
        <RecipientPicker users={users} selected={selectedUsers} sendToAll={sendToAll} onAll={setSendToAll} onToggle={toggleUser} />
        <input value={email.subject} onChange={e => setEmail(value => ({ ...value, subject: e.target.value }))} className="field-control" placeholder="Email subject" />
        <textarea value={email.message} onChange={e => setEmail(value => ({ ...value, message: e.target.value }))} className="w-full min-h-36 field-control py-3" placeholder="Write your message…" />
        <button disabled={busy} onClick={sendEmail} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold">{busy ? 'Sending…' : 'Send email'}</button>
      </div>
      <div className="xl:col-span-2 bg-white rounded-[2rem] p-6 border border-slate-100">
        <div className="flex justify-between mb-4"><h3 className="font-extrabold">Delivery history</h3><button onClick={load}><RefreshCw className="w-4 h-4 text-slate-400" /></button></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="text-slate-400 uppercase"><th className="py-3">Recipient</th><th>Subject</th><th>Status</th><th>Date</th></tr></thead><tbody>{logs.map(log => <tr key={log.id} className="border-t border-slate-50"><td className="py-3">{log.recipient_email}</td><td>{log.subject}</td><td className={log.status === 'SENT' ? 'text-emerald-600 font-bold' : log.status === 'FAILED' ? 'text-rose-600 font-bold' : ''}>{log.status}</td><td>{new Date(log.created_at).toLocaleString()}</td></tr>)}</tbody></table></div>
      </div>
    </div>}

    {section === 'notifications' && <div className="bg-white rounded-[2rem] p-6 border border-slate-100 max-w-3xl space-y-4">
      <h3 className="font-extrabold flex items-center gap-2"><Bell className="w-5 h-5 text-[#003399]" /> Create notification</h3>
      <RecipientPicker users={users} selected={selectedUsers} sendToAll={sendToAll} onAll={setSendToAll} onToggle={toggleUser} />
      <div className="grid sm:grid-cols-[1fr_180px] gap-3"><input className="field-control" placeholder="Notification title" value={notification.title} onChange={e => setNotification(value => ({ ...value, title: e.target.value }))} /><select className="field-control" value={notification.type} onChange={e => setNotification(value => ({ ...value, type: e.target.value }))}><option>INFO</option><option>SUCCESS</option><option>WARNING</option><option>SECURITY</option></select></div>
      <textarea className="w-full min-h-36 field-control py-3" placeholder="Notification message" value={notification.message} onChange={e => setNotification(value => ({ ...value, message: e.target.value }))} />
      <input className="field-control" placeholder="Optional action link, e.g. /cards" value={notification.action_link} onChange={e => setNotification(value => ({ ...value, action_link: e.target.value }))} />
      <button disabled={busy} onClick={sendNotification} className="w-full py-3 bg-[#003399] text-white rounded-xl text-xs font-bold">{busy ? 'Sending…' : 'Send notification'}</button>
    </div>}

    {section === 'security' && <AdminSecurity users={users} />}
  </div>;
}

function RecipientPicker({ users, selected, sendToAll, onAll, onToggle }: { users: any[]; selected: number[]; sendToAll: boolean; onAll: (value: boolean) => void; onToggle: (id: number) => void }) {
  return <div className="space-y-2"><label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={sendToAll} onChange={e => onAll(e.target.checked)} /> Send to all users</label>
    {!sendToAll && <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 grid sm:grid-cols-2 gap-1">{users.filter(user => user.role !== 'ADMIN').map(user => <label key={user.id} className="p-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-xs"><input type="checkbox" checked={selected.includes(Number(user.id))} onChange={() => onToggle(Number(user.id))} /><span className="truncate">{user.first_name} {user.last_name} · {user.email}</span></label>)}</div>}</div>;
}
