import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import {
  Users, Rocket, CheckSquare, LogOut, Download, Upload,
  Plus, Trash2, Edit2, Play, CheckCircle, XCircle, QrCode,
  ArrowRight, Wifi, Database, FileText, AlertCircle, UserCheck, Fingerprint
} from 'lucide-react';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border-l-8 border-red-500">
            <h1 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2"><AlertCircle className="text-red-500" /> Render Error</h1>
            <p className="text-slate-600 mb-4 font-medium">Please refresh the page. Details:</p>
            <pre className="bg-slate-900 text-red-400 p-4 rounded-xl overflow-x-auto text-sm font-mono whitespace-pre-wrap">{this.state.error.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main Application Wrapper ---
export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [initialRoom, setInitialRoom] = useState('');
  const [authError, setAuthError] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    // Check URL params for QR scanning
    try {
      const params = new URLSearchParams(window.location.search);
      const roomFromUrl = params.get('room');
      if (roomFromUrl) {
        setInitialRoom(roomFromUrl);
        setRole('student');
      }
    } catch (e) { }

    // Init Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) setAuthError(error.message);
      else if (session) setUser(session.user);
      setLoadingContext(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loadingContext) return <SplashScreen message="Establishing Secure Connection..." />;
  if (authError) return <SplashScreen message={`Connection Error: ${authError}`} isError={true} />;

  if (!role) return <RolePicker setRole={setRole} user={user} />;

  return role === 'teacher' ? (
    <TeacherPortal setRole={setRole} user={user} />
  ) : (
    <StudentPortal setRole={setRole} initialRoom={initialRoom} />
  );
}

// --- UI Components ---
function SplashScreen({ message, isError }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      {!isError && <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>}
      {isError && <AlertCircle className="w-16 h-16 text-red-500 mb-6" />}
      <p className={`${isError ? 'text-red-400 max-w-md' : 'text-blue-200'} font-medium tracking-wide`}>{message}</p>
    </div>
  );
}

function RolePicker({ setRole, user }) {
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTeacherAccess = async (e) => {
    if (e) e.preventDefault();

    // If they are already authenticated securely
    if (user) {
      setRole('teacher');
      return;
    }

    // If they haven't opened the auth form yet
    if (!showTeacherAuth) {
      setShowTeacherAuth(true);
      return;
    }

    // Process authentication
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Sign Up Error: " + error.message);
      else {
        alert("Account created! You can now log in.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Login Error: " + error.message);
      else setRole('teacher');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-slate-100">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
          <Database size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 text-center mb-2">Assess<span className="text-blue-600">Me</span></h1>
        <p className="text-slate-400 text-center mb-10 font-bold text-xs uppercase tracking-widest">Cloud Assessments</p>

        {!user && showTeacherAuth ? (
          <form onSubmit={handleTeacherAccess} className="space-y-4 mb-4">
            <div>
              <input
                type="email"
                placeholder="Teacher Email"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In Securely')}
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
              >
                {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleTeacherAccess}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-3 active:scale-95"
            >
              <CheckSquare size={24} /> {user ? 'Enter Teacher Dashboard' : 'Teacher Login'}
            </button>
            <button
              onClick={() => setRole('student')}
              className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-3 active:scale-95"
            >
              <Users size={24} /> Student Login (No Acct Required)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
//               TEACHER PORTAL
// ==========================================
function TeacherPortal({ setRole, user }) {
  if (!user) {
    setRole(null);
    return null;
  }

  const [activeTab, setActiveTab] = useState('launch');
  const [quizzes, setQuizzes] = useState([]);
  const [reports, setReports] = useState([]);
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Keep a stable room code for the browser
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('AssessMe_RoomCode') || '');

  // Fetch Quizzes and Reports
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      const [resQuizzes, resReports] = await Promise.all([
        supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*').order('ts', { ascending: false })
      ]);
      if (resQuizzes.data) setQuizzes(resQuizzes.data);
      if (resReports.data) setReports(resReports.data);
      setLoadingData(false);
    };
    fetchData();
  }, [user.id]);

  // Listen to Active Room & Responses on Realtime Postgres Changes
  useEffect(() => {
    if (!roomCode) return;

    // Check if room exists first
    supabase.from('rooms').select('*').eq('id', roomCode).single().then(res => {
      if (res.data) {
        setSession(res.data);
        // Fetch existing responses just in case a reconnect happened
        supabase.from('responses').select('*').eq('room_code', roomCode).then(r => {
          if (r.data) setResponses(r.data);
        });
      }
    });

    const roomSub = supabase.channel(`room-chan-${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomCode}` }, p => {
        if (p.eventType === 'DELETE') setSession(null);
        else setSession(p.new);
      }).subscribe();

    const respSub = supabase.channel(`resp-chan-${roomCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses', filter: `room_code=eq.${roomCode}` }, payload => {
        if (payload.eventType === 'DELETE') {
          setResponses(prev => prev.filter(r => r.id !== payload.old.id));
        } else {
          setResponses(prev => {
            const idx = prev.findIndex(r => r.id === payload.new.id);
            if (idx > -1) {
              const updated = [...prev];
              updated[idx] = payload.new;
              return updated;
            }
            return [...prev, payload.new];
          });
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(roomSub);
      supabase.removeChannel(respSub);
    };
  }, [roomCode]);

  const onLaunch = async (quiz, type) => {
    const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    setRoomCode(newCode);
    localStorage.setItem('AssessMe_RoomCode', newCode);
    setResponses([]); // clear prior

    const data = { id: newCode, user_id: user.id, type, quiz, is_active: true, ts: Date.now() };
    const { error } = await supabase.from('rooms').insert(data);
    if (error) alert("Error creating room: " + error.message);
    else setActiveTab('results');
  };

  const onEnd = async () => {
    if (!session) return;
    const repId = Date.now().toString();

    const newReport = {
      id: repId,
      user_id: user.id,
      title: session.quiz.title,
      type: session.type,
      ts: Date.now(),
      responses: responses,
      questions: session.quiz.questions
    };

    // 1. Save to Reports in DB
    await supabase.from('reports').insert(newReport);
    setReports(prev => [newReport, ...prev]);

    // 2. Clear PUBLIC network buffer
    try {
      await supabase.from('rooms').delete().eq('id', roomCode);
      // Responses cascade delete automatically due to ON DELETE CASCADE
    } catch (e) { console.error("Cleanup error", e); }

    setSession(null);
    setRoomCode('');
    localStorage.removeItem('AssessMe_RoomCode');
    setActiveTab('reports');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  if (loadingData) return <SplashScreen message="Syncing with Cloud Database..." />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-black text-blue-600 flex items-center gap-2 tracking-tighter">
            <Database size={20} /> AssessMe <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full tracking-widest uppercase text-blue-800">Cloud Sync</span>
          </h1>
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1">
            {['Launch', 'Quizzes', 'Results', 'Reports'].map(t => (
              <button
                key={t} onClick={() => setActiveTab(t.toLowerCase())}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === t.toLowerCase() ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {roomCode && (
            <div className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2">
              <Wifi size={14} className={session ? 'text-green-400 animate-pulse' : 'text-slate-500'} />
              <span className="hidden sm:inline">ROOM:</span> {roomCode}
            </div>
          )}
          <button onClick={handleSignOut} className="bg-slate-100 hover:bg-red-50 p-2 text-slate-500 hover:text-red-500 rounded-full transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* MOBILE Navigation */}
      <nav className="md:hidden flex overflow-x-auto p-3 border-b bg-white gap-2 shadow-sm sticky top-16 z-40 no-scrollbar w-full">
        {['Launch', 'Quizzes', 'Results', 'Reports'].map(t => (
          <button
            key={t} onClick={() => setActiveTab(t.toLowerCase())}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === t.toLowerCase() ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}
          >
            {t}
          </button>
        ))}
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 pt-6 md:pt-10">
        {activeTab === 'launch' && <LaunchTab quizzes={quizzes} onLaunch={onLaunch} session={session} roomCode={roomCode} setActiveTab={setActiveTab} />}
        {activeTab === 'quizzes' && <QuizzesTab quizzes={quizzes} setQuizzes={setQuizzes} user={user} />}
        {activeTab === 'results' && <ResultsTab session={session} responses={responses} onEnd={onEnd} roomCode={roomCode} />}
        {activeTab === 'reports' && <ReportsTab reports={reports} />}
      </main>
    </div>
  );
}

// --- Teacher Sections ---

function LaunchTab({ quizzes, onLaunch, session, roomCode, setActiveTab }) {
  const [selected, setSelected] = useState('');
  const [type, setType] = useState(null);

  if (session) return (
    <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-blue-100">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <Wifi size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Room {session.quiz.title} is LIVE</h2>
      <p className="text-slate-400 font-medium mb-8">Room Code: {roomCode}</p>
      <button onClick={() => setActiveTab('results')} className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100">Go to Results Tab</button>
    </div>
  );

  const start = () => {
    const q = quizzes.find(x => x.id === selected);
    if (q) onLaunch(q, type);
    setType(null);
  };

  if (type) return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
      <h2 className="text-2xl font-black mb-6 text-slate-800">Choose a Quiz</h2>
      <div className="space-y-3 mb-10 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
        {quizzes.map(q => (
          <button
            key={q.id} onClick={() => setSelected(q.id)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${selected === q.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
          >
            <div className="font-black text-slate-800">{q.title}</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{(q.questions || []).length} Questions</div>
          </button>
        ))}
        {quizzes.length === 0 && <p className="text-slate-400 italic text-center py-6">Your library is empty. Go to Quizzes to create one.</p>}
      </div>
      <div className="flex gap-3">
        <button onClick={() => setType(null)} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl">Cancel</button>
        <button onClick={start} disabled={!selected} className="flex-1 py-4 font-black text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50">Launch</button>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        { id: 'quiz', name: 'Quiz', icon: <CheckSquare size={48} />, color: 'bg-blue-600' },
        { id: 'race', name: 'Space Race', icon: <Rocket size={48} />, color: 'bg-purple-600' },
        { id: 'exit', name: 'Exit Ticket', icon: <LogOut size={48} />, color: 'bg-orange-500' }
      ].map(c => (
        <button
          key={c.id} onClick={() => setType(c.id)}
          className={`${c.color} text-white p-12 rounded-[3rem] shadow-xl flex flex-col items-center gap-6 transition-transform hover:scale-[1.03] active:scale-95`}
        >
          <div className="p-4 bg-white/10 rounded-2xl">{c.icon}</div>
          <span className="text-3xl font-black">{c.name}</span>
        </button>
      ))}
    </div>
  );
}

function QuizzesTab({ quizzes, setQuizzes, user }) {
  const [edit, setEdit] = useState(null);

  const save = async (data) => {
    let saved;
    if (data.id) {
      const { data: ret, error } = await supabase.from('quizzes').update({ title: data.title, questions: data.questions }).eq('id', data.id).select().single();
      if (error) alert("Save error: " + error.message);
      else saved = ret;
    } else {
      const { data: ret, error } = await supabase.from('quizzes').insert({ user_id: user.id, title: data.title, questions: data.questions }).select().single();
      if (error) alert("Save error: " + error.message);
      else saved = ret;
    }

    if (saved) {
      if (data.id) setQuizzes(quizzes.map(q => q.id === saved.id ? saved : q));
      else setQuizzes([saved, ...quizzes]);
      setEdit(null);
    }
  };

  const del = async (id) => {
    if (window.confirm("Delete this cloud quiz?")) {
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) alert("Delete Error: " + error.message);
      else setQuizzes(quizzes.filter(q => q.id !== id));
    }
  };

  if (edit) return <QuizEditor quiz={edit} onSave={save} onCancel={() => setEdit(null)} />;

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Cloud Quiz Library</h2>
        <button onClick={() => setEdit({ title: '', questions: [] })} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all">
          <Plus size={18} /> New Remote Quiz
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {quizzes.map(q => (
          <div key={q.id} className="p-8 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div>
              <h3 className="text-lg font-black text-slate-800">{q.title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{(q.questions || []).length} Items</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEdit(q)} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={20} /></button>
              <button onClick={() => del(q.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No quizzes saved in your cloud library.</div>}
      </div>
    </div>
  );
}

function QuizEditor({ quiz, onSave, onCancel }) {
  const [title, setTitle] = useState(quiz.title || '');
  const [qs, setQs] = useState(quiz.questions || []);
  const [err, setErr] = useState('');

  const submit = () => {
    if (!title.trim()) { setErr('Quiz Name is Mandatory'); return; }
    onSave({ ...quiz, title, questions: qs });
  };

  const add = (type) => setQs([...qs, { id: Date.now(), type, text: '', options: type === 'mc' ? ['', '', '', ''] : (type === 'tf' ? ['True', 'False'] : []), correct: 0 }]);

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in duration-300">
      <div className="p-8 bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1">
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1.5">
            Quiz Name <span className="text-red-500 font-black">* MANDATORY</span>
          </label>
          <input
            className={`bg-transparent text-3xl font-black text-slate-800 w-full focus:outline-none border-b-4 transition-all pb-2 ${err ? 'border-red-500' : 'border-transparent focus:border-blue-600'}`}
            placeholder="Type Name..." value={title}
            onChange={e => { setTitle(e.target.value); if (e.target.value) setErr(''); }}
          />
          {err && <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1 animate-pulse"><AlertCircle size={14} /> {err}</p>}
        </div>
        <div className="flex gap-4 shrink-0">
          <button onClick={onCancel} className="px-6 py-2.5 font-black text-slate-400">Discard</button>
          <button onClick={submit} className="px-8 py-2.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100">Save to Cloud</button>
        </div>
      </div>
      <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar bg-slate-50/20">
        {qs.map((q, idx) => (
          <div key={q.id || idx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100">
            <button onClick={() => setQs(qs.filter((_, i) => i !== idx))} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
            <div className="text-[10px] font-black text-slate-300 mb-4 uppercase tracking-[0.2em]">Item {idx + 1} • {q.type}</div>
            <textarea
              className="w-full bg-transparent p-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 border-2 border-slate-100 mb-6 font-bold text-slate-700"
              placeholder="Question Content..." value={q.text}
              onChange={e => { const n = [...qs]; n[idx].text = e.target.value; setQs(n); }}
            />
            {q.type === 'mc' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${q.correct === oIdx ? 'border-blue-600 bg-blue-50 shadow-inner' : 'border-slate-100 bg-white'}`}>
                    <input type="radio" className="w-5 h-5 accent-blue-600" checked={q.correct === oIdx} onChange={() => { const n = [...qs]; n[idx].correct = oIdx; setQs(n); }} />
                    <input className="bg-transparent w-full font-bold text-slate-600 focus:outline-none" value={opt} onChange={e => { const n = [...qs]; n[idx].options[oIdx] = e.target.value; setQs(n); }} placeholder="Choice..." />
                  </div>
                ))}
              </div>
            )}
            {q.type === 'tf' && (
              <div className="flex gap-4">
                {['True', 'False'].map((v, oIdx) => (
                  <button key={v} onClick={() => { const n = [...qs]; n[idx].correct = oIdx; setQs(n); }} className={`flex-1 py-5 rounded-2xl border-2 font-black transition-all ${q.correct === oIdx ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white border-slate-100 text-slate-300'}`}>{v}</button>
                ))}
              </div>
            )}
            {q.type === 'sa' && (
              <input
                className="w-full bg-white p-4 rounded-xl focus:outline-none border-2 border-slate-100 font-bold text-slate-700"
                placeholder="Optional Exact Correct Answer for Auto-grading..." value={q.correct || ''}
                onChange={e => { const n = [...qs]; n[idx].correct = e.target.value; setQs(n); }}
              />
            )}
          </div>
        ))}
        <div className="flex justify-center gap-4 py-10 border-t border-dashed border-slate-200">
          <button onClick={() => add('mc')} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">Multi Choice</button>
          <button onClick={() => add('tf')} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">True/False</button>
          <button onClick={() => add('sa')} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">Short Answer</button>
        </div>
      </div>
    </div>
  );
}

function ResultsTab({ session, responses, onEnd, roomCode }) {
  const [showQR, setShowQR] = useState(true);
  const joinUrl = `${window.location.href.split('?')[0]}?room=${roomCode}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}`;

  if (!session) return <div className="text-center py-40 text-slate-300 font-black uppercase tracking-widest">No Active Sessions</div>;

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border flex flex-col min-h-[70vh]">
      <div className="bg-slate-900 text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black">{session.quiz.title}</h2>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Live • {responses.length} Active Participants</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowQR(!showQR)} className="bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all">
            <QrCode size={18} /> Invite Students
          </button>
          <button onClick={onEnd} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-full font-black text-xs shadow-xl shadow-red-900/20">Close Room</button>
        </div>
      </div>

      {showQR && (
        <div className="p-10 bg-blue-50 border-b flex flex-col md:flex-row items-center justify-center gap-12 text-center md:text-left animate-in slide-in-from-top duration-300 shrink-0">
          <img src={qr} className="w-44 h-44 border-8 border-white rounded-[2rem] shadow-2xl" />
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">Join Class</h3>
            <p className="text-slate-500 mb-6 font-medium max-w-xs">Have students scan the code or enter room code on mobile devices.</p>
            <div className="text-4xl font-black tracking-[0.3em] text-blue-600 bg-white px-8 py-3 rounded-2xl shadow-inner border-2 border-blue-100 inline-block">{roomCode}</div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
            <tr>
              <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest whitespace-nowrap">Participant</th>
              <th className="p-6 font-black text-slate-400 text-[10px] uppercase tracking-widest min-w-[150px]">Score/Progress</th>
              {session.quiz.questions.map((_, i) => <th key={i} className="p-6 text-center font-black text-slate-400 text-[10px] uppercase">Q{i + 1}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {responses.map(r => (
              <tr key={r.student_name} className="hover:bg-slate-50 transition-colors">
                <td className="p-6">
                  <div className="font-black text-slate-800 text-lg leading-none whitespace-nowrap">{r.student_name}</div>
                  <div className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 mt-1 tracking-wider">
                    <UserCheck size={12} /> {r.student_id}
                  </div>
                </td>
                <td className="p-6">
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-700 ease-out" style={{ width: `${(Object.keys(r.answers || {}).length / session.quiz.questions.length) * 100}%` }}></div>
                  </div>
                </td>
                {session.quiz.questions.map((q, idx) => {
                  const ans = r.answers?.[idx];
                  const ok = ans !== undefined && (q.type === 'sa' ? (q.correct && String(ans).toLowerCase().trim() === String(q.correct).toLowerCase().trim()) : (String(ans) === String(q.correct)));
                  return (
                    <td key={idx} className="p-6 text-center">
                      {ans === undefined ? (
                        <div className="w-3 h-3 bg-slate-100 rounded-full mx-auto"></div>
                      ) : (
                        ok ? <CheckCircle className="text-green-500 mx-auto" size={24} /> : <XCircle className="text-red-400 mx-auto" size={24} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {responses.length === 0 && <tr><td colSpan={100} className="p-32 text-center text-slate-300 font-bold uppercase tracking-widest">Waiting for connections...</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsTab({ reports }) {
  if (reports.length === 0) return <div className="text-center p-32 bg-white rounded-[3rem] text-slate-300 font-black uppercase tracking-widest border border-dashed">No Cloud Analytics Yet</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {reports.map(r => (
        <div key={r.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight">{r.title}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{new Date(r.ts).toLocaleDateString()}</p>
            </div>
            <span className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{r.type}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
            <div className="text-center border-r border-slate-50">
              <div className="text-2xl font-black text-slate-800">{(r.responses || []).length}</div>
              <div className="text-[9px] font-black text-slate-400 uppercase">Participants</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-slate-800">{(r.questions || []).length}</div>
              <div className="text-[9px] font-black text-slate-400 uppercase">Items</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


// ==========================================
//               STUDENT PORTAL
// ==========================================
function StudentPortal({ setRole, initialRoom }) {
  const [room, setRoom] = useState(initialRoom);
  const [name, setName] = useState('');
  const [sid, setSid] = useState('');
  const [joined, setJoined] = useState(false);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!joined || !room) return;

    const code = room.toUpperCase();

    // Initial check
    supabase.from('rooms').select('*').eq('id', code).single().then(res => {
      if (res.data) setSession(res.data);
    });

    const roomSub = supabase.channel(`student-chan-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${code}` }, s => {
        setSession(s.eventType === 'DELETE' ? null : s.new);
      }).subscribe();

    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [joined, room]);

  const submit = async (qIdx, ans) => {
    const next = { ...answers, [qIdx]: ans };
    setAnswers(next);

    const respId = `${room.toUpperCase()}_${sid || Math.random().toString(36).substring(7)}`;

    try {
      await supabase.from('responses').upsert({
        id: respId,
        room_code: room.toUpperCase(),
        student_name: name,
        student_id: sid,
        answers: next,
        ts: Date.now()
      });
      if (idx < session.quiz.questions.length - 1) setTimeout(() => setIdx(p => p + 1), 300);
    } catch (e) { console.error("Network Error", e); }
  };

  if (!joined) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <form onSubmit={e => { e.preventDefault(); setJoined(true); }} className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-slate-100">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <Users size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Student Entry</h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">Verified Join Required</p>
        </div>
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-widest">Access Room</label>
            <input
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center text-2xl font-black uppercase tracking-[0.3em] text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              placeholder="CODE" value={room} onChange={e => setRoom(e.target.value.toUpperCase())} required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-widest">Full Name</label>
            <input
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              placeholder="Name..." value={name} onChange={e => setName(e.target.value)} required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-widest">Student ID Number</label>
            <input
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              placeholder="ID-000000" value={sid} onChange={e => setSid(e.target.value)} required
            />
          </div>
          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-[2rem] font-black text-2xl shadow-xl shadow-orange-100 mt-6 active:scale-95 transition-all">JOIN NOW</button>
        </div>
        <button type="button" onClick={() => setRole(null)} className="w-full mt-8 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-slate-500">Exit to Menu</button>
      </form>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
      <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-10"></div>
      <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Synchronizing...</h2>
      <p className="text-blue-200/50 max-w-xs font-bold uppercase text-[10px] tracking-widest">Connected to Cloud Room {room}. Activity pending teacher launch.</p>
    </div>
  );

  const total = session.quiz.questions?.length || 1;
  if (Object.keys(answers).length >= session.quiz.questions?.length) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center">
      <div className="bg-white p-16 rounded-[4rem] shadow-2xl max-w-sm border border-slate-100">
        <CheckCircle size={100} className="text-green-500 mx-auto mb-8 shadow-green-100 shadow-2xl rounded-full" />
        <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter">Done!</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Response Securely Logged to Cloud. Awaiting Session Completion.</p>
      </div>
    </div>
  );

  const q = session.quiz.questions[idx];
  const progress = (Object.keys(answers).length / total) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white border-b p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Item {idx + 1} / {total}</div>
        <div className="font-black text-slate-800 text-xl truncate px-6 italic tracking-tighter">{session.quiz.title}</div>
        <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">ID: {sid}</div>
      </header>
      <div className="h-3 w-full bg-slate-50">
        <div className="h-full bg-orange-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(249,115,22,0.5)]" style={{ width: `${progress}%` }}></div>
      </div>
      <main className="flex-1 p-8 max-w-2xl mx-auto w-full pt-20">
        <h2 className="text-3xl font-black text-slate-800 mb-12 leading-tight tracking-tight">{q.text}</h2>
        <div className="space-y-5">
          {(q.type === 'mc' || q.type === 'tf') && q.options.map((o, i) => (
            <button key={i} onClick={() => submit(idx, i)} className="w-full text-left bg-white p-7 rounded-[2.5rem] border-4 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all font-black text-xl text-slate-700 shadow-sm flex items-center gap-6 group">
              <span className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 shrink-0 font-black group-hover:bg-blue-600 group-hover:text-white transition-colors uppercase">{String.fromCharCode(65 + i)}</span>
              {o}
            </button>
          ))}
          {q.type === 'sa' && (
            <div className="space-y-6">
              <textarea id="sa-box" className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] p-8 text-2xl font-bold focus:border-blue-500 focus:bg-white focus:outline-none shadow-inner min-h-[220px] transition-all" placeholder="Response..." />
              <button onClick={() => submit(idx, document.getElementById('sa-box').value)} className="w-full py-6 bg-blue-600 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest">Submit Response</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
