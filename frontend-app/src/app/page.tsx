'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, gql, useSubscription } from '@apollo/client';
import { authApi, medicalApi } from '@/lib/api';

// --- 1. GraphQL Operations ---
const GET_LOGS = gql`query GetLogs { logs { id category metric value unit notes createdAt } }`;
const CREATE_LOG = gql`mutation CreateLog($category: LogCategory!, $metric: String!, $value: String!, $unit: String, $notes: String) { createLog(category: $category, metric: $metric, value: $value, unit: $unit, notes: $notes) { id } }`;
const LOG_ADDED = gql`subscription OnLogAdded { logAdded { id metric value category createdAt } }`;

// --- 2. Utility: Icons ---
const Icons = {
  Heart: '❤️', Water: '💧', Sleep: '🌙', Mood: '😊', Activity: '🏃', Medical: '🏥', Dashboard: '📊', Logout: '🚪'
};

// --- 3. Component: Auth Screen ---
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
    } catch (err) {
      alert('Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row">
        <div className="md:w-1/2 bg-teal-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500 to-teal-800 opacity-50"></div>
          <h1 className="text-4xl font-bold relative z-10 mb-4">VitalTrack Pro</h1>
          <p className="relative z-10 opacity-90 text-lg">Your complete health ecosystem. Track vitals, mood, hydration, and medical history in one secure place.</p>
        </div>
        <div className="md:w-1/2 p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{isLogin ? 'Welcome Back' : 'Join VitalTrack'}</h2>
          <form onSubmit={submit} className="space-y-4">
            <input className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Email" onChange={e => setEmail(e.target.value)} required />
            <input className="w-full bg-slate-100 border-0 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required />
            <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-teal-200">
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          <p onClick={() => setIsLogin(!isLogin)} className="text-center mt-6 text-teal-600 cursor-pointer font-medium hover:underline text-sm">
            {isLogin ? 'Create new account' : 'I have an account'}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- 4. Dashboard Widgets ---

function HealthScore({ logs }: { logs: any[] }) {
  const score = Math.min(100, 50 + (logs.length * 5));
  const color = score > 80 ? 'text-green-500' : score > 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Health Score</p>
        <h3 className={`text-4xl font-extrabold ${color} mt-1`}>{score}</h3>
        <p className="text-xs text-slate-400 mt-1">Based on activity logs</p>
      </div>
      <div className="h-16 w-16 rounded-full border-4 border-slate-100 flex items-center justify-center text-2xl">
        🏆
      </div>
    </div>
  );
}

function BMICard() {
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);

  const calc = () => {
    if (h && w) {
      const heightM = parseFloat(h) / 100;
      setBmi(parseFloat((parseFloat(w) / (heightM * heightM)).toFixed(1)));
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
      <div className="relative z-10">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">⚖️ BMI Calculator</h3>
        <div className="flex gap-2 mb-3">
          <input type="number" placeholder="Height (cm)" value={h} onChange={e => setH(e.target.value)} className="w-1/2 bg-white/20 placeholder-white/60 border-0 rounded-lg p-2 text-white focus:outline-none focus:bg-white/30 transition" />
          <input type="number" placeholder="Weight (kg)" value={w} onChange={e => setW(e.target.value)} className="w-1/2 bg-white/20 placeholder-white/60 border-0 rounded-lg p-2 text-white focus:outline-none focus:bg-white/30 transition" />
        </div>
        <button onClick={calc} className="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-opacity-90 transition">Check BMI</button>
        {bmi && (
          <div className="mt-4 p-3 bg-white/20 backdrop-blur rounded-lg">
            <div className="flex justify-between items-end">
              <span className="text-3xl font-bold">{bmi}</span>
              <span className="text-sm font-medium opacity-90">{bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : 'Overweight'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HydrationCard({ onLog }: any) {
  const [cups, setCups] = useState(0);
  const handleAdd = () => {
    const newCups = cups + 1;
    setCups(newCups);
    onLog({ variables: { category: 'NUTRITION', metric: 'Water', value: '250', unit: 'ml', notes: 'Hydration' } });
  };

  return (
    <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">{Icons.Water} Hydration</h3>
        <p className="opacity-80 text-sm">Target: 8 cups (2L)</p>
      </div>
      <div className="flex items-end justify-between mt-4">
        <div>
          <span className="text-4xl font-bold">{cups}</span>
          <span className="text-sm opacity-80"> cups today</span>
        </div>
        <button onClick={handleAdd} className="bg-white text-cyan-600 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold shadow hover:scale-110 transition">+</button>
      </div>
      <div className="w-full bg-black/20 h-1.5 mt-4 rounded-full overflow-hidden">
        <div className="bg-white h-full transition-all duration-500" style={{ width: `${Math.min((cups / 8) * 100, 100)}%` }}></div>
      </div>
    </div>
  );
}

function SleepTracker({ onLog }: any) {
  const [hours, setHours] = useState(7);
  const saveSleep = () => {
    onLog({ variables: { category: 'ACTIVITY', metric: 'Sleep Duration', value: hours.toString(), unit: 'hours', notes: 'Night Rest' } });
    alert('Sleep recorded! 🌙');
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">{Icons.Sleep} Sleep Tracker</h3>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="range" min="0" max="12" step="0.5"
          value={hours} onChange={e => setHours(parseFloat(e.target.value))}
          className="w-full accent-indigo-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-2xl font-bold text-indigo-600 w-16 text-right">{hours}h</span>
      </div>
      <button onClick={saveSleep} className="w-full py-2 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition">Log Sleep</button>
    </div>
  );
}

function QuickVitals({ onLog }: any) {
  const saveVital = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement); // FIX: Type Assertion
    onLog({ variables: { category: 'VITAL', metric: fd.get('metric') as string, value: fd.get('val') as string, unit: fd.get('unit') as string, notes: '' } });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">{Icons.Heart} Quick Vitals</h3>
      <form onSubmit={saveVital} className="flex gap-2">
        <select name="metric" className="bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm focus:outline-teal-500">
          <option value="Heart Rate">❤️ HR</option>
          <option value="Blood Pressure">🩸 BP</option>
          <option value="Temp">🌡️ Temp</option>
          <option value="Weight">⚖️ Weight</option>
        </select>
        <input name="val" placeholder="Val" className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm focus:outline-teal-500" required />
        <input name="unit" placeholder="Unit" className="w-12 bg-slate-50 border border-slate-200 rounded-lg px-2 text-sm focus:outline-teal-500" />
        <button className="bg-teal-500 text-white rounded-lg px-3 hover:bg-teal-600 font-bold">+</button>
      </form>
    </div>
  );
}

// --- 5. Main Dashboard Layout ---

function Dashboard({ onLogout }: any) {
  const [activeTab, setActiveTab] = useState('overview');
  const [history, setHistory] = useState<any[]>([]);

  // GraphQL
  const { data, refetch } = useQuery(GET_LOGS);
  const [createLog] = useMutation(CREATE_LOG);
  useSubscription(LOG_ADDED, { onData: () => refetch() });

  // REST API: Load
  const loadRest = async () => {
    try {
      const res = await medicalApi.getHistory();
      setHistory(res.data);
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  useEffect(() => { loadRest(); }, []);

  // REST API: Add (PERBAIKAN TYPE ERROR DISINI)
  const addRest = async (e: any) => {
    e.preventDefault();
    // FIX: Menggunakan 'as HTMLFormElement' dan 'as string' untuk menghindari error TypeScript
    const fd = new FormData(e.target as HTMLFormElement);
    const conditionValue = fd.get('cond') as string;
    const dateValue = fd.get('date') as string;

    if (!conditionValue || !dateValue) {
      alert("Please fill in both fields");
      return;
    }

    try {
      await medicalApi.addHistory({
        condition: conditionValue,
        diagnosedDate: dateValue
      });
      (e.target as HTMLFormElement).reset();
      loadRest();
      alert("Record added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add record. Check backend connection.");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex-shrink-0 fixed h-full z-20 flex flex-col justify-between">
        <div>
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
            <div className="bg-teal-600 text-white p-1.5 rounded-lg mr-0 lg:mr-3">
              <span className="text-xl">🩺</span>
            </div>
            <span className="font-bold text-xl hidden lg:block tracking-tight text-slate-800">VitalTrack</span>
          </div>
          <nav className="p-4 space-y-2">
            <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab === 'overview' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-xl">{Icons.Dashboard}</span>
              <span className="ml-3 font-medium hidden lg:block">Overview</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`w-full flex items-center p-3 rounded-xl transition ${activeTab === 'history' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <span className="text-xl">{Icons.Medical}</span>
              <span className="ml-3 font-medium hidden lg:block">Medical History</span>
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100">
          <button onClick={onLogout} className="w-full flex items-center p-3 text-red-500 hover:bg-red-50 rounded-xl transition">
            <span className="text-xl">{Icons.Logout}</span>
            <span className="ml-3 font-medium hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-8 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Health Dashboard</h1>
            <p className="text-slate-500 text-sm">Monitor your body metrics in real-time</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
               <p className="text-sm font-bold text-slate-900">Dr. User</p>
               <p className="text-xs text-slate-400">Premium Member</p>
             </div>
             <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm">U</div>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <div className="space-y-6">
            
            {/* TOP STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <HealthScore logs={data?.logs || []} />
              <HydrationCard onLog={createLog} />
              <BMICard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COL */}
              <div className="space-y-6">
                <SleepTracker onLog={createLog} />
                <QuickVitals onLog={createLog} />
                
                {/* Mood Logger */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-700 mb-4">Mood Check</h3>
                  <div className="flex justify-between">
                    {['😄', '😐', '😔', '😫'].map(m => (
                      <button key={m} onClick={() => createLog({ variables: { category: 'MOOD', metric: 'Mood', value: m, unit: 'Emoji', notes: '' } })} className="text-3xl hover:scale-125 transition grayscale hover:grayscale-0">{m}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT COL: Activity Stream */}
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[500px]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="font-bold text-slate-800 text-lg">Activity Stream</h3>
                   <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Live Updates</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {data?.logs.length === 0 && <div className="text-center py-10 text-slate-400">No activities recorded today.</div>}
                  {data?.logs.map((log: any) => (
                    <div key={log.id} className="flex items-center p-3 hover:bg-slate-50 rounded-xl transition group">
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0 ${
                        log.category === 'NUTRITION' ? 'bg-blue-100 text-blue-500' :
                        log.category === 'VITAL' ? 'bg-red-100 text-red-500' :
                        log.category === 'MOOD' ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-500'
                      }`}>
                         {log.category === 'NUTRITION' ? Icons.Water : log.category === 'VITAL' ? Icons.Heart : log.category === 'MOOD' ? Icons.Mood : Icons.Activity}
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold text-slate-800">{log.metric}</h4>
                          <span className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {log.value} <span className="text-slate-400 text-xs">{log.unit}</span>
                          {log.notes && <span className="ml-2 text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{log.notes}</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* HISTORY TAB */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Medical Record</h2>
              <button onClick={loadRest} className="text-teal-600 text-sm font-bold hover:underline">Refresh Data</button>
            </div>
            
            <form onSubmit={addRest} className="bg-slate-50 p-4 rounded-xl mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input name="cond" placeholder="Condition name (e.g. Asthma)" className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
              <input name="date" type="date" className="bg-white border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
              <button className="bg-slate-800 text-white font-bold rounded-lg py-2 hover:bg-black transition">Add Record</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-sm border-b border-slate-100">
                    <th className="py-3 px-4 font-medium">Condition</th>
                    <th className="py-3 px-4 font-medium">Diagnosed Date</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any) => (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-700">{h.condition}</td>
                      <td className="py-3 px-4 text-slate-500">{h.diagnosedDate}</td>
                      <td className="py-3 px-4 text-right">
                         <button onClick={async () => { await medicalApi.deleteHistory(h.id); loadRest(); }} className="text-red-400 hover:text-red-600 font-bold px-2">Delete</button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-slate-400">No medical records found.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// --- 6. App Entry Point ---
export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => { setToken(localStorage.getItem('token')); }, []);
  return token ? <Dashboard onLogout={() => { localStorage.removeItem('token'); setToken(null); }} /> : <Auth onLogin={(t: string) => { localStorage.setItem('token', t); setToken(t); }} />;
}