'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery, useMutation, gql, useSubscription } from '@apollo/client';
import { useRouter, useSearchParams } from 'next/navigation';
import api, { authApi, medicalApi } from '@/lib/api';

// ==========================================
// 1. API DEFINITIONS
// ==========================================

const adminApi = {
  getUsers: () => api.get('/users'),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  updateRole: (id: string, role: string) => api.patch(`/users/${id}/role`, { role })
};

const userApi = {
    getProfile: (id: string) => api.get(`/users/${id}`),
    updateProfile: (id: string, data: any) => api.put(`/users/${id}`, data)
};

const reminderApi = {
    getAll: (userId: string) => api.get(`/reminders?userId=${userId}`),
    create: (data: any) => api.post('/reminders', data),
    delete: (id: string) => api.delete(`/reminders/${id}`)
};

// [BARU] API untuk Toko/Shop
const storeApi = {
    getProducts: () => api.get('/store/products'),
    createOrder: (data: any) => api.post('/store/orders', data),
    getMyOrders: (userId: string) => api.get(`/store/orders?userId=${userId}`)
};

const Icons = {
  Heart: '❤️', Water: '💧', Sleep: '🌙', Mood: '😊', Activity: '🏃', 
  Medical: '🏥', Dashboard: '📊', Logout: '🚪', User: '👤', Admin: '🛡️', 
  Trash: '🗑️', Edit: '✏️', Check: '✅', Profile: '⚙️', Mail: '✉️', 
  Bell: '🔔', Clock: '⏰', Shop: '🛒', Bag: '🛍️'
};

// ==========================================
// 2. GRAPHQL QUERIES
// ==========================================
const GET_LOGS = gql`query GetLogs { logs { id category metric value unit notes createdAt } }`;

const CREATE_LOG = gql`
  mutation CreateLog($category: LogCategory!, $metric: String!, $value: String!, $unit: String, $notes: String) {
    createLog(category: $category, metric: $metric, value: $value, unit: $unit, notes: $notes) { id }
  }
`;

const LOG_ADDED = gql`subscription OnLogAdded { logAdded { id metric value category createdAt } }`;

// ==========================================
// 3. AUTH COMPONENT
// ==========================================
function Auth({ onLogin }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (e: any) => {
    e.preventDefault();
    try {
      if (!isLogin) await authApi.register({ name: 'User', email, password });
      const res = await authApi.login({ email, password });
      onLogin(res.data.token);
    } catch (err) { alert('Authentication failed.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-teal-600 p-12 text-white flex flex-col justify-center relative">
           <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-teal-800 opacity-50"></div>
           <div className="relative z-10">
               <h1 className="text-4xl font-bold mb-4">VitalTrack Pro</h1>
               <p className="text-lg opacity-90">Integrated Health Management System.</p>
           </div>
        </div>
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{isLogin ? 'Welcome Back' : 'Join Us'}</h2>
          <form onSubmit={submit} className="space-y-4">
            <input className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
            <input className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
            <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-lg">{isLogin ? 'Sign In' : 'Register'}</button>
          </form>
          <p onClick={() => setIsLogin(!isLogin)} className="text-center mt-6 text-teal-600 cursor-pointer text-sm hover:underline">{isLogin ? 'Create Account' : 'Back to Login'}</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. WIDGET COMPONENTS
// ==========================================

function WelcomeCard({ user }: any) {
    return (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex items-center gap-6 md:col-span-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <div className="h-20 w-20 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-3xl font-bold border-2 border-white/20 shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="relative z-10">
                <h2 className="text-2xl font-bold">Hello, {user.name}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm opacity-90">
                     <span className={`px-3 py-1 rounded-full uppercase font-bold text-xs tracking-wider ${user.role === 'admin' ? 'bg-purple-500 text-white' : 'bg-teal-500 text-white'}`}>
                        {user.role}
                     </span>
                     <span className="flex items-center gap-1"><span className="text-white/60">{Icons.Mail}</span> {user.email}</span>
                </div>
            </div>
        </div>
    )
}

function HealthScore({ logs }: { logs: any[] }) { 
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase">Health Score</p>
                <h3 className="text-4xl font-extrabold text-green-500 mt-1">{Math.min(100, 50 + logs.length * 5)}</h3>
            </div>
            <div className="text-4xl">🏆</div>
        </div>
    ); 
}

function HydrationCard({ onLog }: any) { 
    const [cups, setCups] = useState(0); 
    return (
        <div className="bg-blue-500 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <h3 className="font-bold flex gap-2">{Icons.Water} Hydration</h3>
            <div className="flex justify-between items-end mt-4">
                <div><span className="text-4xl font-bold">{cups}</span><span className="text-sm opacity-80"> cups</span></div>
                <button 
                    onClick={()=>{
                        setCups(c=>c+1);
                        onLog({variables:{category:'NUTRITION',metric:'Water',value:'250',unit:'ml',notes:'Hydration'}});
                    }} 
                    className="bg-white text-blue-500 w-10 h-10 rounded-full font-bold shadow hover:scale-110 transition"
                >
                    +
                </button>
            </div>
        </div>
    ); 
}

function BMICard() {
  const [h, setH] = useState(''); 
  const [w, setW] = useState(''); 
  const [bmi, setBmi] = useState<number|null>(null);
  
  return (
      <div className="bg-indigo-600 text-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold mb-3 flex gap-2">⚖️ BMI</h3>
          <div className="flex gap-2 mb-3">
              <input placeholder="H(cm)" value={h} onChange={e=>setH(e.target.value)} className="w-1/2 bg-white/20 rounded p-2 outline-none text-slate-800" />
              <input placeholder="W(kg)" value={w} onChange={e=>setW(e.target.value)} className="w-1/2 bg-white/20 rounded p-2 outline-none text-slate-800" />
          </div>
          <button 
            onClick={()=>{if(h&&w) setBmi(parseFloat((parseFloat(w)/Math.pow(parseFloat(h)/100,2)).toFixed(1)))}} 
            className="w-full bg-white text-indigo-600 font-bold py-2 rounded"
          >
            Calc
          </button>
          {bmi&&<div className="mt-2 text-2xl font-bold">{bmi}</div>}
      </div>
  );
}

function SleepTracker({ onLog }: any) {
  const [hours, setHours] = useState(7);
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">{Icons.Sleep} Sleep Tracker</h3>
      <div className="flex items-center gap-4 mb-4">
        <input type="range" min="0" max="12" step="0.5" value={hours} onChange={e => setHours(parseFloat(e.target.value))} className="w-full accent-indigo-500 h-2 bg-slate-200 rounded-lg cursor-pointer" />
        <span className="text-2xl font-bold text-indigo-600 w-16 text-right">{hours}h</span>
      </div>
      <button 
        onClick={() => { 
            onLog({ variables: { category: 'ACTIVITY', metric: 'Sleep', value: hours.toString(), unit: 'hours', notes: 'Night Rest' } }); 
            alert('Sleep saved 🌙'); 
        }} 
        className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100"
      >
        Log Sleep
      </button>
    </div>
  );
}

function QuickVitals({ onLog }: any) {
  const saveVital = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    onLog({ variables: { category: 'VITAL', metric: fd.get('metric') as string, value: fd.get('val') as string, unit: fd.get('unit') as string, notes: '' } });
    e.target.reset();
  };
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">{Icons.Heart} Quick Vitals</h3>
      <form onSubmit={saveVital} className="flex gap-2">
        <select name="metric" className="bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm">
            <option value="Heart Rate">❤️ HR</option>
            <option value="BP">🩸 BP</option>
            <option value="Temp">🌡️ Temp</option>
            <option value="Weight">⚖️ Weight</option>
        </select>
        <input name="val" placeholder="Val" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm" required />
        <input name="unit" placeholder="Unit" className="w-12 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm" />
        <button className="bg-teal-500 text-white rounded-lg px-3 hover:bg-teal-600 font-bold">+</button>
      </form>
    </div>
  );
}

// ==========================================
// 5. TAB COMPONENTS (FEATURES)
// ==========================================

// [BARU] TAB SHOP
function ShopPanel({ userId }: { userId: string }) {
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [userId]);

    const loadData = async () => {
        try {
            const p = await storeApi.getProducts();
            setProducts(p.data);
            const o = await storeApi.getMyOrders(userId);
            setOrders(o.data);
        } catch(e) { console.error("Shop Error", e); }
    };

    const buy = async (prod: any) => {
        if(!confirm(`Buy ${prod.name} for Rp${prod.price}?`)) return;
        try {
            await storeApi.createOrder({ userId, productId: prod.id, quantity: 1 });
            alert("Payment successful! Check Reminders for confirmation.");
            loadData();
        } catch(e: any) { alert(e.response?.data?.message || "Failed"); }
    };

    return (
        <div className="space-y-8">
            {/* Catalog */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded uppercase">{p.category}</span>
                                <span className="text-slate-400 text-xs font-bold">Stock: {p.stock}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{p.name}</h3>
                            <h4 className="text-2xl font-bold text-teal-600 mt-2">Rp {p.price.toLocaleString()}</h4>
                        </div>
                        <button 
                            onClick={() => buy(p)} 
                            disabled={p.stock < 1} 
                            className="w-full mt-4 bg-slate-800 text-white font-bold py-2 rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:hover:bg-slate-800 transition"
                        >
                            {p.stock > 0 ? 'Buy Now' : 'Out of Stock'}
                        </button>
                    </div>
                ))}
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100"><h2 className="font-bold text-lg flex items-center gap-2">{Icons.Bag} Order History</h2></div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase"><tr><th className="px-6 py-3">Item</th><th className="px-6 py-3">Total</th><th className="px-6 py-3">Date</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.map(o => (
                            <tr key={o.id}>
                                <td className="px-6 py-4 font-bold">{o.productName} <span className="text-slate-400 font-normal">x{o.qty}</span></td>
                                <td className="px-6 py-4">Rp {o.total.toLocaleString()}</td>
                                <td className="px-6 py-4 text-slate-500">{new Date(o.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {orders.length === 0 && <tr><td colSpan={3} className="px-6 py-4 text-center text-slate-400">No orders yet.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// TAB REMINDERS
function ReminderPanel({ userId }: { userId: string }) {
    const [reminders, setReminders] = useState<any[]>([]);
    const [form, setForm] = useState({ title: '', time: '', type: 'general' });

    const loadReminders = async () => { try { const res = await reminderApi.getAll(userId); setReminders(res.data); } catch (e) { console.error(e); } };

    useEffect(() => { if(userId) loadReminders(); }, [userId]);

    const handleAdd = async (e: any) => { 
        e.preventDefault(); 
        if(!form.title || !form.time) return alert("Fill all fields"); 
        try { 
            await reminderApi.create({ ...form, userId }); 
            setForm({ title: '', time: '', type: 'general' }); 
            loadReminders(); 
            alert("Reminder set!"); 
        } catch(e) { alert("Failed"); } 
    };

    const handleDelete = async (id: string) => { try { await reminderApi.delete(id); loadReminders(); } catch(e) {} };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">{Icons.Clock} Set New Reminder</h2>
                <form onSubmit={handleAdd} className="flex gap-4 items-end flex-wrap">
                    <div className="flex-1 min-w-[200px]"><label className="block text-xs font-bold text-slate-500 mb-1">TITLE</label><input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} placeholder="e.g. Take Vitamins" className="w-full border border-slate-200 rounded-xl px-4 py-2" required /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">TIME</label><input type="time" value={form.time} onChange={e=>setForm({...form, time: e.target.value})} className="border border-slate-200 rounded-xl px-4 py-2" required /></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1">TYPE</label><select value={form.type} onChange={e=>setForm({...form, type: e.target.value})} className="border border-slate-200 rounded-xl px-4 py-2 bg-white"><option value="general">General</option><option value="medication">Medication</option><option value="water">Hydration</option></select></div>
                    <button className="bg-teal-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-teal-700">Add</button>
                </form>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reminders.map(r => (
                    <div key={r.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center relative overflow-hidden group">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${r.type === 'medication' ? 'bg-red-400' : r.type === 'water' ? 'bg-blue-400' : 'bg-slate-400'}`}></div>
                        <div><p className="text-2xl font-bold text-slate-800">{r.time}</p><p className="font-medium text-slate-600">{r.title}</p><span className="text-xs uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-1 inline-block">{r.type}</span></div>
                        <button onClick={() => handleDelete(r.id)} className="text-red-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition">{Icons.Trash}</button>
                    </div>
                ))}
                {reminders.length === 0 && <div className="col-span-full text-center py-10 text-slate-400">No active reminders.</div>}
            </div>
        </div>
    )
}

// TAB PROFILE
function ProfileSettings({ userId, onUpdate }: { userId: string, onUpdate: () => void }) {
    const [profile, setProfile] = useState({ name: '', email: '' }); 
    const [password, setPassword] = useState(''); 
    const [loading, setLoading] = useState(false);
    
    useEffect(() => { if(userId) userApi.getProfile(userId).then(res => setProfile({ name: res.data.name, email: res.data.email })).catch(console.error); }, [userId]);
    
    const handleUpdate = async (e: any) => { 
        e.preventDefault(); 
        setLoading(true); 
        try { 
            await userApi.updateProfile(userId, { name: profile.name, email: profile.email, password: password || undefined }); 
            alert('Updated!'); 
            setPassword(''); 
            onUpdate(); 
        } catch (e) { alert('Failed.'); } finally { setLoading(false); } 
    };
    
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center text-3xl">{Icons.User}</div>
                <div><h2 className="text-2xl font-bold text-slate-800">Edit Profile</h2><p className="text-slate-500">Update your personal information</p></div>
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Name</label><input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-3" required /></div>
                <div><label className="block text-sm font-bold text-slate-700 mb-2">Email</label><input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-slate-50 border rounded-xl px-4 py-3" required /></div>
                <div className="pt-4 border-t"><label className="block text-sm font-bold text-slate-700 mb-2">Password (Opt)</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-50 border rounded-xl px-4 py-3" /></div>
                <button disabled={loading} className="bg-slate-800 text-white font-bold py-3 px-8 rounded-xl">{loading ? 'Saving...' : 'Save'}</button>
            </form>
        </div>
    );
}

// TAB ADMIN
function AdminPanel() {
    const [users, setUsers] = useState<any[]>([]); 
    const { data: logsData, refetch: refetchLogs } = useQuery(GET_LOGS); 
    useSubscription(LOG_ADDED, { onData: () => refetchLogs() });
    
    useEffect(() => { loadUsers(); }, []); 
    
    const loadUsers = async () => { try { const res = await adminApi.getUsers(); setUsers(res.data); } catch (e) {} };
    
    const handleRole = async (u: any) => { const newRole = u.role === 'admin' ? 'user' : 'admin'; if(confirm(`Change role to ${newRole}?`)) { try { await adminApi.updateRole(u.id, newRole); loadUsers(); } catch(e) {} } };
    
    const handleDelete = async (id: string) => { if(confirm('Delete user?')) { try { await adminApi.deleteUser(id); loadUsers(); } catch(e) {} } };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase">Users</p><h3 className="text-3xl font-extrabold text-slate-800">{users.length}</h3></div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase">Logs</p><h3 className="text-3xl font-extrabold text-teal-600">{logsData?.logs?.length || 0}</h3></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between"><h2 className="font-bold text-lg">User Management</h2><button onClick={loadUsers} className="text-teal-600 font-bold text-sm">Refresh</button></div>
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase"><tr><th className="px-6 py-4">User</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">{users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold">{u.name}<div className="text-xs text-slate-400 font-normal">{u.email}</div></td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role==='admin'?'bg-purple-100 text-purple-600':'bg-teal-100 text-teal-600'}`}>{u.role?.toUpperCase()}</span></td>
                            <td className="px-6 py-4 text-right">{u.email !== 'admin@vitaltrack.com' && <><button onClick={()=>handleRole(u)} className="mr-2">🔄</button><button onClick={()=>handleDelete(u.id)} className="text-red-500">🗑️</button></>}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
}

// ==========================================
// 6. MAIN LAYOUT
// ==========================================
function DashboardLayout({ onLogout, userData, onRefreshProfile }: any) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';

    const [history, setHistory] = useState<any[]>([]);
    const { data, refetch } = useQuery(GET_LOGS);
    const [createLog] = useMutation(CREATE_LOG);
    useSubscription(LOG_ADDED, { onData: () => refetch() });

    useEffect(() => { loadHistory(); }, []);
    const loadHistory = async () => { try { const res = await medicalApi.getHistory(); setHistory(res.data); } catch(e) {} };
    const addHistory = async (e: any) => { e.preventDefault(); const fd = new FormData(e.target); try{ await medicalApi.addHistory({condition:fd.get('cond'),diagnosedDate:fd.get('date')}); e.target.reset(); loadHistory(); }catch(e){} };
    
    const handleTabChange = (tabName: string) => { router.push(`?tab=${tabName}`, { scroll: false }); };

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
            {/* SIDEBAR */}
            <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 fixed h-full z-20 flex flex-col justify-between">
                <div>
                    <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-slate-50"><span className="text-2xl mr-2">🩺</span><span className="font-bold text-xl hidden lg:block">VitalTrack</span></div>
                    <nav className="p-4 space-y-2">
                        <button onClick={()=>handleTabChange('overview')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab==='overview'?'bg-teal-50 text-teal-700 font-bold':'hover:bg-slate-50 text-slate-500'}`}><span className="text-xl">{Icons.Dashboard}</span><span className="ml-3 hidden lg:block">Overview</span></button>
                        
                        {/* TAB BARU: SHOP */}
                        <button onClick={()=>handleTabChange('shop')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab==='shop'?'bg-teal-50 text-teal-700 font-bold':'hover:bg-slate-50 text-slate-500'}`}><span className="text-xl">{Icons.Shop}</span><span className="ml-3 hidden lg:block">Shop</span></button>
                        
                        <button onClick={()=>handleTabChange('reminders')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab==='reminders'?'bg-teal-50 text-teal-700 font-bold':'hover:bg-slate-50 text-slate-500'}`}><span className="text-xl">{Icons.Bell}</span><span className="ml-3 hidden lg:block">Reminders</span></button>
                        <button onClick={()=>handleTabChange('history')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab==='history'?'bg-teal-50 text-teal-700 font-bold':'hover:bg-slate-50 text-slate-500'}`}><span className="text-xl">{Icons.Medical}</span><span className="ml-3 hidden lg:block">History</span></button>
                        <button onClick={()=>handleTabChange('profile')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab==='profile'?'bg-teal-50 text-teal-700 font-bold':'hover:bg-slate-50 text-slate-500'}`}><span className="text-xl">{Icons.Profile}</span><span className="ml-3 hidden lg:block">Profile</span></button>
                        {userData.role === 'admin' && <><div className="my-4 border-t hidden lg:block"></div><button onClick={()=>handleTabChange('admin')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab==='admin'?'bg-indigo-50 text-indigo-700 font-bold':'hover:bg-slate-50 text-slate-500'}`}><span className="text-xl">{Icons.Admin}</span><span className="ml-3 hidden lg:block">Admin</span></button></>}
                    </nav>
                </div>
                <div className="p-4"><button onClick={onLogout} className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 rounded-xl"><span className="text-xl">{Icons.Logout}</span><span className="ml-3 hidden lg:block">Logout</span></button></div>
            </aside>

            {/* CONTENT AREA */}
            <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 capitalize">{activeTab}</h1>
                        <p className="text-slate-500 text-sm">Welcome back, <span className="font-bold text-teal-700">{userData.name}</span></p>
                    </div>
                    <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">{userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}</div>
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <WelcomeCard user={userData} />
                            <HealthScore logs={data?.logs||[]} /><HydrationCard onLog={createLog} />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                             <div className="space-y-6">
                                <SleepTracker onLog={createLog} />
                                <QuickVitals onLog={createLog} />
                                <BMICard />
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                                    <h3 className="font-bold mb-4">Quick Mood</h3><div className="flex gap-4">{['😄','😐','😔'].map(m=><button key={m} onClick={()=>createLog({variables:{category:'MOOD',metric:'Mood',value:m,unit:'',notes:''}})} className="text-3xl hover:scale-125 transition">{m}</button>)}</div>
                                </div>
                             </div>
                             <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-bold text-slate-800 mb-4">Recent Activity</h3>
                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                    {data?.logs.map((log: any) => (
                                        <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shadow-sm ${log.category === 'NUTRITION' ? 'bg-blue-100 text-blue-500' : log.category === 'VITAL' ? 'bg-red-100 text-red-500' : 'bg-white text-slate-500'}`}>{log.category === 'NUTRITION' ? Icons.Water : log.category === 'VITAL' ? Icons.Heart : log.category === 'MOOD' ? Icons.Mood : Icons.Activity}</div><div><p className="font-bold text-sm text-slate-700">{log.metric}</p><p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleTimeString()}</p></div></div><span className="font-bold text-slate-600 text-sm">{log.value} {log.unit}</span>
                                        </div>
                                    ))}
                                    {(!data?.logs || data.logs.length === 0) && <p className="text-center text-slate-400 text-sm">No activity yet.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB SHOP (BARU) */}
                {activeTab === 'shop' && <ShopPanel userId={userData.id} />}

                {activeTab === 'reminders' && <ReminderPanel userId={userData.id} />}

                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <form onSubmit={addHistory} className="flex gap-4 mb-8 bg-slate-50 p-4 rounded-xl"><input name="cond" placeholder="Condition" className="flex-1 border rounded px-4 py-2" required /><input name="date" type="date" className="border rounded px-4 py-2" required /><button className="bg-slate-800 text-white font-bold px-6 rounded hover:bg-black">Add</button></form>
                        <table className="w-full text-left"><thead className="border-b"><tr className="text-slate-400 text-sm"><th className="py-3">Condition</th><th>Date</th><th className="text-right">Action</th></tr></thead>
                        <tbody className="divide-y">{history.map((h:any)=><tr key={h.id}><td className="py-4 font-bold">{h.condition}</td><td className="py-4 text-slate-500">{h.diagnosedDate}</td><td className="py-4 text-right"><button onClick={async()=>{await medicalApi.deleteHistory(h.id);loadHistory()}} className="text-red-500 font-bold">Delete</button></td></tr>)}</tbody></table>
                    </div>
                )}

                {activeTab === 'profile' && <ProfileSettings userId={userData.id} onUpdate={onRefreshProfile} />}
                {activeTab === 'admin' && userData.role === 'admin' && <AdminPanel />}
            </main>
        </div>
    );
}

// ==========================================
// 7. ENTRY POINT
// ==========================================
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [userData, setUserData] = useState({ role: 'user', id: '', name: '', email: '' });

  const fetchFreshProfile = async (id: string) => {
      try {
          const res = await userApi.getProfile(id);
          setUserData(prev => ({ ...prev, name: res.data.name, email: res.data.email }));
      } catch (e) { console.error("Failed to fetch fresh profile", e); }
  };

  useEffect(() => {
      const t = localStorage.getItem('token');
      if (t) {
          setToken(t);
          try { 
              const payload = JSON.parse(atob(t.split('.')[1]));
              setUserData({ role: payload.role || 'user', id: payload.id, name: payload.name || 'User', email: payload.email || '' });
              if (payload.id) fetchFreshProfile(payload.id);
          } catch (e) { localStorage.removeItem('token'); }
      }
  }, [token]);

  const handleLogin = (t: string) => { localStorage.setItem('token', t); setToken(t); };
  const handleLogout = () => { localStorage.removeItem('token'); setToken(null); setUserData({ role: 'user', id: '', name: '', email: '' }); };

  if (!token) return <Auth onLogin={handleLogin} />;
  
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
        <DashboardLayout onLogout={handleLogout} userData={userData} onRefreshProfile={() => fetchFreshProfile(userData.id)} />
    </Suspense>
  );
}