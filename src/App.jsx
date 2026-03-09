import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';
import {
  Users, Rocket, CheckSquare, LogOut, Download, Upload,
  Plus, Trash2, Edit2, Play, CheckCircle, XCircle, QrCode,
  ArrowRight, ArrowLeft, Wifi, Database, FileText, AlertCircle, AlertTriangle,
  UserCheck, Fingerprint, Activity, BarChart2, UploadCloud, X, Eye, EyeOff, Video, Clock, Copy, Pencil, Search, Pause, PauseCircle, PlayCircle, Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ReactPlayer from 'react-player';
import QRCode from 'react-qr-code';

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe", "Other"
];

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
            <pre className="bg-slate-900 text-red-400 p-4 rounded-xl overflow-x-auto text-sm font-mono whitespace-pre-wrap">{String(this.state.error?.message || this.state.error || "Unknown error")}</pre>
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

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

    // --- CROSS-ORIGIN IFRAME OAUTH CALLBACK HANDLER ---
    // Flow: iframe (assess-me.vercel.app) breaks out of WordPress iframe → Google → 
    // redirects back to assess-me.vercel.app (standalone) → save session → redirect to WordPress
    // → WordPress iframe reloads assess-me.vercel.app → getSession() finds saved session → logged in!
    const hashStr = window.location.hash.substring(1);
    const isInIframe = window.self !== window.top;
    
    if (hashStr && hashStr.includes('access_token=')) {
        setLoadingContext(true);
        const hashParams = new URLSearchParams(hashStr);
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
            // Force Supabase to save this session to localStorage
            supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || ''
            }).then(({ data, error }) => {
                if (!error && data?.session) {
                    // Session is now saved to localStorage on assess-me.vercel.app domain.
                    // If we are NOT in an iframe (i.e., we were redirected here standalone after Google auth),
                    // redirect back to the WordPress page so the iframe reloads with the saved session.
                    if (!isInIframe) {
                        // Check if there's a stored WordPress URL to go back to
                        const wpUrl = localStorage.getItem('classlabx_wp_url');
                        if (wpUrl) {
                            localStorage.removeItem('classlabx_wp_url');
                            window.location.href = wpUrl;
                            return;
                        }
                    }
                    // If we ARE in an iframe somehow, or no wpUrl, just render normally
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                    setUser(data.session.user);
                    setRole('teacher');
                    setLoadingContext(false);
                } else {
                    setAuthError(error?.message || 'Failed to set session.');
                    setLoadingContext(false);
                }
            });
            return; // Stop the rest of useEffect
        }
    }
    // --- END OAUTH HANDLER ---

    // Normal Initialization for successful sessions (if we aren't handling a fresh OAuth redirect)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) setAuthError(error.message);
      else if (session) {
        setUser(session.user);
        setRole(prev => prev || 'teacher'); // Auto-derive if role unset
      }
      setLoadingContext(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setRole('teacher');
      } else if (event === 'SIGNED_OUT') {
        setRole(null); // Clear role cleanly on logout
      }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, []);

  if (loadingContext) return <SplashScreen message="Establishing Secure Connection..." />;
  if (authError) return <SplashScreen message={`Connection Error: ${authError}`} isError={true} />;

  if (!role || isRecoveryMode) return <RolePicker setRole={setRole} user={user} isRecoveryMode={isRecoveryMode} setIsRecoveryMode={setIsRecoveryMode} />;

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

function RolePicker({ setRole, user, isRecoveryMode, setIsRecoveryMode }) {
  const [showTeacherAuth, setShowTeacherAuth] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [schoolUniversity, setSchoolUniversity] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [authMode, setAuthMode] = useState(isRecoveryMode ? 'recovery' : 'login'); // 'login', 'signup', 'forgot', 'recovery'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isRecoveryMode) {
      setAuthMode('recovery');
      setShowTeacherAuth(true);
    }
  }, [isRecoveryMode]);

  const handleTeacherAccess = async (e) => {
    if (e) e.preventDefault();

    // If they are already authenticated securely
    if (user && !isRecoveryMode) {
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
    if (authMode === 'signup') {
      if (!selectedCountry) {
        alert("Please select your country.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: fullName,
            country: selectedCountry === 'Other' ? customCountry : selectedCountry,
            job_title: jobTitle,
            school_university: schoolUniversity,
            subscription: 'beta' // all new users start as beta
          }
        }
      });
      if (error) alert("Sign Up Error: " + error.message);
      else {
        alert("Account created! You can now log in.");
        setAuthMode('login');
      }
    } else if (authMode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) alert("Error: " + error.message);
      else alert("Check your email for the password reset link!");
    } else if (authMode === 'recovery') {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) alert("Error updating password: " + error.message);
      else {
        alert("Password updated successfully! You are now logged in.");
        setIsRecoveryMode(false);
        setRole('teacher');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Login Error: " + error.message);
      else setRole('teacher');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    // Remember the WordPress parent URL so we can redirect back after Google auth
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
        try {
            // Try to read the parent URL (may fail due to cross-origin)
            localStorage.setItem('classlabx_wp_url', document.referrer || 'https://toolabx.com/classlabx/');
        } catch(e) {
            localStorage.setItem('classlabx_wp_url', 'https://toolabx.com/classlabx/');
        }
    }
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect back to the APP's own origin (not the WordPress iframe)
        // so the app can process the token and save the session
        redirectTo: window.location.origin,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: 'select_account', // Always show the account picker
        },
      },
    });

    if (error) {
      alert("Google Login Error: " + error.message);
      setLoading(false);
    } else if (data?.url) {
      // Break out of the iframe entirely
      if (isInIframe) {
          try {
              window.top.location.href = data.url;
          } catch (e) {
              window.location.href = data.url;
          }
      } else {
          window.location.href = data.url;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-slate-100">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
          <Database size={40} />
        </div>
        <h1 className="text-4xl font-black text-slate-800 text-center mb-2">ClassLab<span className="text-blue-600">X</span></h1>
        <p className="text-slate-400 text-center mb-10 font-bold text-xs uppercase tracking-widest">Cloud Assessments</p>

        {(isRecoveryMode || !user) && showTeacherAuth ? (
          <form onSubmit={handleTeacherAccess} className="space-y-4 mb-4">
            {authMode !== 'recovery' && (
              <div>
                <input
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="Teacher Email"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            {authMode !== 'forgot' && (
              <div>
                <input
                  type="password"
                  name="password"
                  autoComplete={authMode === 'signup' || authMode === 'recovery' ? "new-password" : "current-password"}
                  placeholder={authMode === 'recovery' ? "Enter New Password" : "Password"}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            )}
            {authMode === 'signup' && (
              <>
                <div>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Full Name"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-4 block">Country</label>
                  <select
                    name="country"
                    autoComplete="country-name"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    value={selectedCountry}
                    onChange={e => setSelectedCountry(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {selectedCountry === 'Other' && (
                  <div>
                    <input
                      type="text"
                      name="custom_country"
                      placeholder="Enter Country Name"
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                      value={customCountry}
                      onChange={e => setCustomCountry(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div>
                  <input
                    type="text"
                    name="job_title"
                    autoComplete="organization-title"
                    placeholder="Job Title"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="organization"
                    autoComplete="organization"
                    placeholder="School / University"
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                    value={schoolUniversity}
                    onChange={e => setSchoolUniversity(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processing...' : (
                authMode === 'signup' ? 'Create Account' : 
                authMode === 'forgot' ? 'Send Reset Link' :
                authMode === 'recovery' ? 'Update Password' : 'Log In Securely'
              )}
            </button>

            {(authMode === 'login' || authMode === 'signup') && (
              <>
                <div className="flex items-center gap-4 my-2">
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OR</span>
                  <div className="flex-1 h-[1px] bg-slate-100"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-4 bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
            <div className="flex flex-col gap-2 text-center pt-2">
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                  Forgot Password?
                </button>
              )}
              {authMode !== 'recovery' && (
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                  className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                  {authMode === 'signup' ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
                </button>
              )}
              {authMode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors"
                >
                  Back to Login
                </button>
              )}
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

// --- Profile Completion Overlay for Google/OAuth Sign-ups ---
function ProfileCompletionOverlay({ profile, setProfile, user }) {
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [schoolUniversity, setSchoolUniversity] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCountry) {
      alert("Please select your country.");
      return;
    }

    setLoading(true);
    const updates = {
      id: user.id,
      full_name: fullName,
      country: selectedCountry === 'Other' ? customCountry : selectedCountry,
      job_title: jobTitle,
      school_university: schoolUniversity,
      updated_at: new Date()
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      setProfile({ ...profile, ...updates });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 text-center">
      <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
          <Activity size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2">Welcome!</h2>
        <p className="text-slate-500 mb-8 font-medium">Please complete your profile to continue.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-4 block">Full Name</label>
            <input
              type="text"
              name="name"
              autoComplete="name"
              placeholder="Your Full Name"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-4 block">Country</label>
            <select
              name="country"
              autoComplete="country-name"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              required
            >
              <option value="" disabled>Select Country</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {selectedCountry === 'Other' && (
            <div className="text-left">
              <input
                type="text"
                placeholder="Enter Country Name"
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
                value={customCountry}
                onChange={e => setCustomCountry(e.target.value)}
                required
              />
            </div>
          )}

          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-4 block">Job Title</label>
            <input
              type="text"
              name="job_title"
              autoComplete="organization-title"
              placeholder="e.g. Science Teacher"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              required
            />
          </div>

          <div className="text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 mb-1 ml-4 block">School / University</label>
            <input
              type="text"
              name="organization"
              autoComplete="organization"
              placeholder="Institution Name"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all"
              value={schoolUniversity}
              onChange={e => setSchoolUniversity(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl transition-all shadow-lg shadow-blue-100 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
//               TEACHER PORTAL
// ==========================================
function TeacherPortal({ setRole, user }) {
  useEffect(() => {
    if (!user) setRole(null);
  }, [user, setRole]);

  if (!user) return null;

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('ClassLabX_TeacherTab') || 'quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [reports, setReports] = useState([]);
  const [classes, setClasses] = useState([]);
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    localStorage.setItem('ClassLabX_TeacherTab', activeTab);
  }, [activeTab]);

  // Keep a stable room code for the browser
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem('ClassLabX_RoomCode') || '');
  const [asyncReports, setAsyncReports] = useState([]);

  // Active Room Navigation Warning State
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  // Fetch Quizzes and Reports
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      const [resProfile, resQuizzes, resReports, resClass, resAsyncRooms] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('quizzes').select('*').order('created_at', { ascending: false }),
        supabase.from('reports').select('*').order('ts', { ascending: false }),
        supabase.from('classes').select(`*, students(*)`).order('created_at', { ascending: false }),
        supabase.from('rooms').select('*').eq('is_async', true) // Fetch async rooms
      ]);

      if (resProfile.data) setProfile(resProfile.data);
      if (resQuizzes.data) setQuizzes(resQuizzes.data);
      if (resReports.data) setReports(resReports.data);
      if (resClass.data) setClasses(resClass.data);

      if (resAsyncRooms.data && resAsyncRooms.data.length > 0) {
        const asyncCodes = resAsyncRooms.data.map(r => r.id);
        const { data: asyncResponses } = await supabase.from('responses').select('*').in('room_code', asyncCodes);
        
        const pseudoReports = resAsyncRooms.data.map(room => ({
          id: room.id,
          user_id: room.user_id,
          title: room.quiz?.title || 'Untitled Quiz',
          type: room.type, // 'async_video' or 'async_quiz'
          ts: room.start_time ? new Date(room.start_time).getTime() : room.ts,
          responses: (asyncResponses || []).filter(r => r.room_code === room.id),
          questions: room.quiz?.questions || [],
          assigned_classes: room.quiz?.assigned_classes || []
        }));
        setAsyncReports(pseudoReports);
      }

      setLoadingData(false);
    };
    fetchData();
  }, [user.id]);

  const updateReportStatus = async (reportId, studentId, newStatus) => {
    // 1. Find the target report to get title/classes for matching
    const allReps = [...reports, ...asyncReports];
    const targetReport = allReps.find(r => r.id === reportId);
    if (!targetReport) return;

    const stdStudentId = String(studentId).trim();
    const targetTitle = targetReport.title;
    const targetClasses = (targetReport.assigned_classes || []).sort().join(',');

    // 2. Identify ALL reports that should be updated (matching title and classes)
    const matchingReports = allReps.filter(r => {
       if (r.type !== targetReport.type) return false;
       const rTitle = r.title;
       const rClasses = (r.assigned_classes || []).sort().join(',');
       return rTitle === targetTitle && rClasses === targetClasses;
    });

    // 3. Prepare updates for each matching report
    const updatedReportsMap = {}; // reportId -> updatedResponses
    
    matchingReports.forEach(rep => {
      const currentResponses = rep.responses || [];
      const existingResp = currentResponses.find(r => String(r.student_id).trim() === stdStudentId);
      let updatedResponses;
      
      if (existingResp) {
        updatedResponses = currentResponses.map(resp =>
          String(resp.student_id).trim() === stdStudentId ? { ...resp, status: newStatus, ts: Date.now() } : resp
        );
      } else {
        const student = (classes || []).flatMap(c => c.students || []).find(s => String(s.student_id).trim() === stdStudentId);
        const newResp = {
          id: Math.random().toString(36).substring(2, 9),
          student_id: studentId,
          student_name: student?.name || 'Anonymous',
          status: newStatus,
          ts: Date.now(),
          answers: {}
        };
        updatedResponses = [...currentResponses, newResp];
      }
      updatedReportsMap[rep.id] = updatedResponses;
    });

    // 4. Update Local State
    setReports(prev => prev.map(r => updatedReportsMap[r.id] ? { ...r, responses: updatedReportsMap[r.id] } : r));
    setAsyncReports(prev => prev.map(r => updatedReportsMap[r.id] ? { ...r, responses: updatedReportsMap[r.id] } : r));

    // 5. Update Database for all matching reports
    for (const rid of Object.keys(updatedReportsMap)) {
      const isAsync = asyncReports.some(r => r.id === rid);
      if (isAsync) {
         // Async rooms use individual records in 'responses' table
         const rep = matchingReports.find(r => r.id === rid);
         const existing = (rep.responses || []).find(r => String(r.student_id).trim() === stdStudentId);
         if (existing) {
           await supabase.from('responses').update({ status: newStatus }).eq('id', existing.id);
         } else {
           const student = (classes || []).flatMap(c => c.students || []).find(s => String(s.student_id).trim() === stdStudentId);
           await supabase.from('responses').insert({
             room_code: rid,
             student_id: studentId,
             student_name: student?.name || 'Anonymous',
             status: newStatus,
             ts: new Date().toISOString(),
             answers: {}
           });
         }
      } else {
         await supabase.from('reports').update({ responses: updatedReportsMap[rid] }).eq('id', rid);
      }
    }
  };

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

    const isAsync = type === 'async_quiz' || type === 'async_video';

    const data = {
      id: newCode,
      user_id: user.id,
      type,
      quiz: type === 'attendance'
        ? {
            title: quiz.attendanceMode === 'relaunch'
              ? (quiz.selectedOldAttendance?.title || quiz.sessionName || 'Attendance')
              : (quiz.sessionName || 'Attendance'),
            questions: [],
            assigned_classes: quiz.assigned_classes || [],
            old_report_id: quiz.attendanceMode === 'relaunch' ? quiz.selectedOldAttendance?.id : null,
            current_token: Date.now().toString()
          }
        : { ...quiz, current_question_idx: 0, show_results: false },
      is_active: !isAsync, // async rooms aren't "live" tracking
      ts: Date.now(),
      is_async: isAsync,
      start_time: type === 'attendance' ? new Date().toISOString() : quiz?.start_time,
      end_time: quiz?.end_time,
      prevent_skipping: quiz?.prevent_skipping,
      timer_duration: quiz?.timer_duration || null
    };

    const { error } = await supabase.from('rooms').insert(data);
    if (error) {
      alert("Error creating room: " + error.message);
      return null;
    } else {
      if (isAsync) {
        return newCode;
      } else {
        setRoomCode(newCode);
        localStorage.setItem('ClassLabX_RoomCode', newCode);
        setResponses([]); // clear prior
        setSession(data); // immediately populate so Results tab renders
        setActiveTab('synchronous');
        return newCode;
      }
    }
  };

  const onEnd = async () => {
    if (!session) return;

    const isRelaunch = !!(session.quiz?.old_report_id);
    const oldReportId = session.quiz?.old_report_id;

    if (isRelaunch && oldReportId) {
      // RELAUNCH: fetch the old report from local state to get existing responses
      const oldReport = reports.find(r => r.id === oldReportId) || asyncReports.find(r => r.id === oldReportId);
      const oldResponses = oldReport?.responses || [];

      // Build a map of previous responses keyed by student_id
      const mergedMap = {};
      oldResponses.forEach(r => { mergedMap[String(r.student_id).trim()] = r; });

      // Add/overwrite with NEW check-ins (students who scanned this relaunch)
      responses.forEach(r => { mergedMap[String(r.student_id).trim()] = r; });

      const mergedResponses = Object.values(mergedMap);

      // UPDATE existing report
      await supabase.from('reports').update({ responses: mergedResponses }).eq('id', oldReportId);

      // Update local state
      setReports(prev => prev.map(rep =>
        rep.id === oldReportId ? { ...rep, responses: mergedResponses } : rep
      ));
    } else {
      // NEW session: insert fresh report
      const repId = Date.now().toString();
      const newReport = {
        id: repId,
        user_id: user.id,
        title: session.quiz.title,
        type: session.type,
        ts: Date.now(),
        responses: responses,
        questions: session.quiz.questions,
        assigned_classes: session.quiz?.assigned_classes?.length > 0
          ? session.quiz.assigned_classes
          : (session.assigned_classes || [])
      };
      await supabase.from('reports').insert(newReport);
      setReports(prev => [newReport, ...prev]);
    }

    // Clear PUBLIC network buffer
    try {
      await supabase.from('rooms').delete().eq('id', roomCode);
    } catch (e) { console.error("Cleanup error", e); }

    setSession(null);
    setRoomCode('');
    localStorage.removeItem('ClassLabX_RoomCode');
    setActiveTab('reports');
  };

  const handleTabChange = (newTab) => {
    // If navigating away from an active sync room, warn them
    if (activeTab === 'synchronous' && session && !session.is_async && newTab !== 'synchronous') {
      setPendingTab(newTab);
      setShowCloseWarning(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  const isProfileIncomplete = profile && (!profile.country || !profile.job_title || !profile.school_university);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      {isProfileIncomplete && <ProfileCompletionOverlay profile={profile} setProfile={setProfile} user={user} />}
      {/* Top Header */}
      <header className="bg-white border-b px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex items-center gap-10">
          <h1 className="text-xl font-black text-blue-600 flex items-center gap-2 tracking-tighter">
            <Database size={20} /> ClassLabX <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full tracking-widest uppercase text-blue-800">Cloud Sync</span>
          </h1>
          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-1">
            {['Quizzes', 'Classes', 'Launch', 'Synchronous', 'Asynchronous', 'Reports'].map(t => (
              <button
                key={t} onClick={() => handleTabChange(t.toLowerCase())}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === t.toLowerCase() ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {profile && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Plan:</span>
              <span className={`text-[10px] font-black uppercase tracking-widest ${profile.subscription === 'free' ? 'text-slate-500' : 'text-blue-600'}`}>{profile.subscription.replace('_', ' ')}</span>
            </div>
          )}
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
      <div className="md:hidden flex p-3 border-b bg-white shadow-sm sticky top-16 z-40 w-full print:hidden">
        <div className="flex justify-between items-center bg-white rounded-full p-2 border border-slate-100 shadow-sm overflow-x-auto no-scrollbar gap-2">
          {['quizzes', 'classes', 'launch', 'synchronous', 'asynchronous', 'reports'].map(tab => (
            <button
              key={tab} onClick={() => handleTabChange(tab)}
              className={`px-8 py-3 rounded-full font-black text-sm uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 pt-6 md:pt-10">
        {activeTab === 'quizzes' && <QuizzesTab quizzes={quizzes} setQuizzes={setQuizzes} user={user} profile={profile} />}
        {activeTab === 'classes' && <ClassesTab classes={classes} setClasses={setClasses} user={user} />}
        {activeTab === 'launch' && <LaunchTab quizzes={quizzes} classes={classes} reports={reports} onLaunch={onLaunch} session={session} roomCode={roomCode} setActiveTab={setActiveTab} profile={profile} />}
        {activeTab === 'synchronous' && <ResultsTab session={session} responses={responses} onEnd={onEnd} roomCode={roomCode} />}
        {activeTab === 'asynchronous' && <ScheduledTab user={user} classes={classes} />}
        {activeTab === 'reports' && (() => {
          const allReports = [...reports, ...asyncReports];
          const visibleReports = allReports.filter(r => !r.hidden);
          return <ReportsTab reports={visibleReports} allReports={allReports} classes={classes} updateReportStatus={updateReportStatus} />;
        })()}
      </main>

      {/* Close Warning Modal */}
      {showCloseWarning && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Active Room Alert</h3>
            <p className="text-slate-500 font-bold mb-8 leading-relaxed">
              You are leaving an active session. <span className="text-blue-600 bg-blue-50 px-1 rounded">Results will not be finalized or saved to reports until this room is closed.</span> What would you like to do?
            </p>
            <div className="space-y-3">
              <button 
                onClick={async () => {
                   setShowCloseWarning(false);
                   await onEnd(); // trigger close
                   if (pendingTab && pendingTab !== 'reports') {
                      setActiveTab(pendingTab);
                   }
                   setPendingTab(null);
                }} 
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm uppercase tracking-widest transition-colors shadow-lg shadow-blue-100"
              >
                Close Room (Record Results & Go)
              </button>
              <button 
                onClick={() => {
                   setShowCloseWarning(false);
                   setActiveTab(pendingTab);
                   setPendingTab(null);
                }} 
                className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest transition-colors"
              >
                Keep Room Open (Go quietly)
              </button>
              <button 
                onClick={() => {
                   setShowCloseWarning(false);
                   setPendingTab(null);
                }} 
                className="w-full py-4 bg-white hover:bg-slate-50 text-slate-400 rounded-xl font-black text-xs uppercase tracking-widest transition-colors border-2 border-slate-100"
              >
                Cancel (Stay Here)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Teacher Sections ---

function ScheduledTab({ user, classes }) {
  const [scheduledRooms, setScheduledRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'running', 'past', 'paused'
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'quiz', 'video'

  useEffect(() => {
    fetchScheduled();
  }, []);

  const fetchScheduled = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rooms')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_async', true)
      .order('ts', { ascending: false });
      
    if (data) setScheduledRooms(data);
    setLoading(false);
  };



  const startEdit = (room) => {
    setEditingRoom(room.id);
    
    // Format to datetime-local expected string YYYY-MM-DDTHH:MM
    const formatLocal = (isoString) => {
      if (!isoString) return '';
      const d = new Date(isoString);
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    };

    setEditStart(formatLocal(room.start_time));
    setEditEnd(formatLocal(room.end_time));
  };

  const saveEdit = async (room) => {
    if (!editStart || !editEnd) {
      alert("Start and end time are required.");
      return;
    }
    
    const startObj = new Date(editStart);
    const endObj = new Date(editEnd);
    
    if (endObj <= startObj) {
      alert("End time must be after start time.");
      return;
    }

    const startIso = startObj.toISOString();
    const endIso = endObj.toISOString();

    const { error } = await supabase
      .from('rooms')
      .update({ start_time: startIso, end_time: endIso })
      .eq('id', room.id);

    if (!error) {
      setScheduledRooms(prev => prev.map(r => r.id === room.id ? { ...r, start_time: startIso, end_time: endIso } : r));
    } else {
      alert("Failed to update schedules: " + error.message);
    }
    setEditingRoom(null);
  };

  const togglePause = async (room) => {
    const newState = !room.is_paused;
    const { error } = await supabase.from('rooms').update({ is_paused: newState }).eq('id', room.id);
    if (!error) {
      setScheduledRooms(prev => prev.map(r => r.id === room.id ? { ...r, is_paused: newState } : r));
    } else {
      alert("Error: " + error.message);
    }
  };

  const filteredRooms = scheduledRooms.filter(room => {
    const matchesSearch = (room.quiz?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          room.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const assignedClasses = room.quiz?.assigned_classes || [];
    const matchesClass = !classFilter || assignedClasses.includes(classFilter);
    
    const matchesDate = !dateFilter || new Date(room.start_time).toLocaleDateString() === new Date(dateFilter).toLocaleDateString();
    
    const now = Date.now();
    const start = new Date(room.start_time).getTime();
    const end = new Date(room.end_time).getTime();
    
    const isRunning = now >= start && now <= end && !room.is_paused;
    const isPast = now > end;
    const isPaused = room.is_paused;
    
    let matchesStatus = true;
    if (statusFilter === 'running') matchesStatus = isRunning;
    else if (statusFilter === 'past') matchesStatus = isPast;
    else if (statusFilter === 'paused') matchesStatus = isPaused;
    
    let matchesType = true;
    if (typeFilter === 'quiz') matchesType = room.type === 'async_quiz';
    else if (typeFilter === 'video') matchesType = room.type === 'async_video';

    return matchesSearch && matchesClass && matchesDate && matchesStatus && matchesType;
  });

  if (loading) return (
    <div className="flex justify-center p-20">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
      <div className="p-8 border-b bg-slate-50 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Scheduled Quizzes</h2>
            <p className="text-slate-400 font-bold mt-1">Manage pending asynchronous activities</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search quiz or code..." 
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all w-40"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all"
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="running">Running</option>
              <option value="paused">Paused</option>
              <option value="past">Past</option>
            </select>

            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="quiz">Standard Quiz</option>
              <option value="video">Video Quiz</option>
            </select>

            <input 
              type="date" 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />

            {(searchQuery || classFilter || dateFilter || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button 
                onClick={() => { setSearchQuery(''); setClassFilter(''); setDateFilter(''); setStatusFilter('all'); setTypeFilter('all'); }}
                className="text-xs font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        {filteredRooms.length === 0 ? (
          <div className="p-20 text-center">
            <h3 className="text-2xl font-black text-slate-400 mb-2">No Quizzes Found</h3>
            <p className="text-slate-400 font-bold">Try adjusting your filters or launch a new quiz.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Quiz Title</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Code</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Status</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">Timer</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100" title={`Local: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}>Schedule</th>
                <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRooms.map(room => {
                const isEditing = editingRoom === room.id;
                const assignedClassNames = classes
                  .filter(c => (room.quiz?.assigned_classes || []).includes(c.id))
                  .map(c => c.name)
                  .join(', ');

                return (
                  <tr key={room.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="p-4">
                      <div className="font-black text-slate-700">{room.quiz?.title || 'Untitled Quiz'}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[200px]" title={assignedClassNames}>
                        {assignedClassNames || 'No Class Restricted'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-black text-sm tracking-widest border border-blue-100">{room.id}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1.5">
                        <div className={`text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit ${
                          room.type === 'async_video' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'
                        }`}>
                          {room.type === 'async_video' ? <Video size={10} /> : <FileText size={10} />}
                          {room.type === 'async_video' ? 'Video' : 'Standard'}
                        </div>
                        {room.is_paused ? (
                          <div className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1">
                            <PauseCircle size={10} /> Paused
                          </div>
                        ) : (
                          (() => {
                            const now = Date.now();
                            const end = new Date(room.end_time).getTime();
                            if (now > end) return <div className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Check size={10} /> Past</div>;
                            return <div className="text-[10px] font-black uppercase text-green-500 flex items-center gap-1"><PlayCircle size={10} /> Running</div>;
                          })()
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {room.timer_duration ? (
                        <div className="text-xs font-black text-blue-500 flex items-center gap-1">
                          <Clock size={12} /> {room.timer_duration}s
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {isEditing ? (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-slate-400 w-8" title={`Local: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}>Start</span>
                            <input type="datetime-local" className="flex-1 p-1 text-xs font-bold border border-slate-200 rounded" value={editStart} onChange={e => setEditStart(e.target.value)} />
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black uppercase text-slate-400 w-8" title={`Local: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}>End</span>
                            <input type="datetime-local" className="flex-1 p-1 text-xs font-bold border border-slate-200 rounded" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-500 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                            {new Date(room.start_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            {new Date(room.end_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => togglePause(room)}
                          className={`p-2 rounded-lg transition-colors ${room.is_paused ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                          title={room.is_paused ? "Resume Activity" : "Pause Activity"}
                        >
                          {room.is_paused ? <Play size={16} /> : <Pause size={16} />}
                        </button>

                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.href.split('?')[0]}?room=${room.id}`);
                            alert("Join Link Copied!");
                          }}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          title="Copy Link"
                        >
                          <Copy size={16} />
                        </button>
                        
                        {isEditing ? (
                          <>
                            <button onClick={() => saveEdit(room)} className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors" title="Save"><CheckCircle size={16} /></button>
                            <button onClick={() => setEditingRoom(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-400 rounded-lg transition-colors" title="Cancel"><X size={16} /></button>
                          </>
                        ) : (
                          <button onClick={() => startEdit(room)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors" title="Edit Schedule"><Edit2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function LaunchTab({ quizzes, classes, reports, onLaunch, session, roomCode, setActiveTab, profile }) {
  const [selected, setSelected] = useState('');
  const [category, setCategory] = useState(null); // 'sync', 'async', 'attendance'
  const [type, setType] = useState(null); // 'student_paced', 'teacher_paced', 'async_quiz', 'async_video', 'attendance'
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleChoices, setShuffleChoices] = useState(false);
  const [preventSkipping, setPreventSkipping] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduledLink, setScheduledLink] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [timerDuration, setTimerDuration] = useState('');
  
  // Attendance Relaunch State
  const [attendanceMode, setAttendanceMode] = useState('new'); // 'new' | 'relaunch'
  const [selectedOldAttendance, setSelectedOldAttendance] = useState(null);
  const [relaunchSearch, setRelaunchSearch] = useState('');

  if (session) return (
    <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-blue-100">
      <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <Wifi size={40} />
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-2">Room {session.quiz.title} is LIVE</h2>
      <p className="text-slate-400 font-medium mb-8">Room Code: {roomCode}</p>
      <button onClick={() => setActiveTab('synchronous')} className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100">Go to Synchronous Tab</button>
    </div>
  );

  if (scheduledLink) return (
    <div className="max-w-xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center animate-in zoom-in duration-300">
      <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
        <CheckCircle size={48} />
      </div>
      <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4">Quiz Scheduled!</h2>
      <p className="text-slate-500 font-bold mb-8">Your asynchronous quiz is ready to be shared with your students.</p>
      
      <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 mb-8 max-w-sm mx-auto">
        <div className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Room Code</div>
        <div className="text-4xl font-black text-blue-600 tracking-widest">{scheduledLink.code}</div>
      </div>

      <div className="text-left mb-10">
        <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest px-4">Direct Share Link</label>
        <div className="flex gap-2">
          <input readOnly value={scheduledLink.url} className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 text-sm focus:outline-none focus:border-blue-400 transition-colors" />
          <button onClick={() => {
            navigator.clipboard.writeText(scheduledLink.url);
            alert("Link copied to clipboard!");
          }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center">Copy</button>
        </div>
      </div>

      <button onClick={() => {
        setScheduledLink(null);
        setType(null);
        setCategory(null);
        setAssignedClasses([]);
        setShuffleQuestions(false);
        setShuffleChoices(false);
        setPreventSkipping(false);
        setStartTime('');
        setEndTime('');
        setTimerDuration('');
        setAttendanceMode('new');
        setSelectedOldAttendance(null);
      }} className="w-full py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest transition-colors shadow-sm">
        Schedule Another
      </button>
    </div>
  );

  const start = async () => {
    let launchedQuiz = null;

    if (category === 'attendance') {
      if (profile?.subscription === 'free') {
        const attendanceCount = reports.filter(r => r.type === 'attendance').length;
        if (attendanceCount >= 3) {
          alert("Free Tier Limit: You can only have up to 3 attendance sessions. Please upgrade to Pro to start more.");
          return;
        }
      }
      if (assignedClasses.length === 0) {
        alert("Please select at least one class.");
        return;
      }
      if (attendanceMode === 'new' && !sessionName) {
        alert("Please enter a session name.");
        return;
      }
      if (attendanceMode === 'relaunch' && !selectedOldAttendance) {
        alert("Please select a previous session to relaunch.");
        return;
      }

      await onLaunch({ 
        attendanceMode, 
        sessionName, 
        selectedOldAttendance, 
        assigned_classes: assignedClasses 
      }, 'attendance');
      return;
    }

    const q = quizzes.find(x => x.id === selected);
    if (q) {
      launchedQuiz = JSON.parse(JSON.stringify(q));

      if (shuffleQuestions) {
        launchedQuiz.questions = [...launchedQuiz.questions].sort(() => Math.random() - 0.5);
      }

      if (shuffleChoices) {
        launchedQuiz.questions.forEach(question => {
          if (question.type === 'mc' && question.options) {
            const originalOptions = [...question.options];
            const originalCorrectValue = originalOptions[question.correct];

            question.options = [...originalOptions].sort(() => Math.random() - 0.5);
            question.correct = question.options.findIndex(opt => opt === originalCorrectValue);
          }
        });
      }

      if (category === 'async') {
        launchedQuiz.is_async = true;
        launchedQuiz.start_time = new Date(startTime).toISOString();
        launchedQuiz.end_time = new Date(endTime).toISOString();
        launchedQuiz.prevent_skipping = preventSkipping;
        if (type === 'async_quiz' && timerDuration && parseInt(timerDuration) > 0) {
          launchedQuiz.timer_duration = parseInt(timerDuration);
        }
      }

      const code = await onLaunch({ ...launchedQuiz, assigned_classes: assignedClasses }, type);
      if (category === 'async' && code) {
        const joinUrl = `${window.location.href.split('?')[0]}?room=${code}`;
        setScheduledLink({ code, url: joinUrl });
      }
    }
    
    if (category !== 'async') {
      setType(null);
      setCategory(null);
      setAssignedClasses([]);
      setShuffleQuestions(false);
      setShuffleChoices(false);
      setPreventSkipping(false);
      setStartTime('');
      setEndTime('');
      setTimerDuration('');
      setAttendanceMode('new');
      setSelectedOldAttendance(null);
    }
  };

  const toggleClass = (id) => {
    setAssignedClasses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filteredQuizzes = quizzes.filter(q => {
    if (type === 'async_video') return q.type === 'video';
    if (type === 'async_quiz' || category === 'sync') return q.type === 'standard' || !q.type;
    return true; 
  });

  if (type && category !== 'attendance') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
      <h2 className="text-2xl font-black mb-6 text-slate-800">
        Choose a {type === 'async_video' ? 'Video Quiz' : 'Standard Quiz'}
      </h2>
      <div className="space-y-3 mb-10 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
        {filteredQuizzes.map(q => (
          <button
            key={q.id} onClick={() => setSelected(q.id)}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-3 ${selected === q.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-slate-200'}`}
          >
            {q.type === 'video' ? <Video size={20} className="text-purple-500 shrink-0" /> : (q.type === 'survey' ? <BarChart2 size={20} className="text-green-500 shrink-0" /> : <FileText size={20} className="text-blue-500 shrink-0" />)}
            <div>
              <div className="font-black text-slate-800">{q.title}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{(q.questions || []).length} {q.type === 'survey' ? 'Items' : 'Questions'}</div>
            </div>
          </button>
        ))}
        {filteredQuizzes.length === 0 && <p className="text-slate-400 italic text-center py-6">No matching quizzes found. Go to Quizzes to create one.</p>}
      </div>

      <h2 className="text-xl font-black mb-4 text-slate-800 border-t pt-6">Assign to Class(s) (Required)</h2>
      <div className="space-y-2 mb-10 max-h-[150px] overflow-y-auto pr-2 custom-scroll">
        {classes.length === 0 ? (
          <p className="text-slate-400 italic text-center text-sm py-4">No classes created yet. Please create a class first.</p>
        ) : (
          classes.map(c => (
            <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox" className="w-5 h-5 accent-blue-600 rounded"
                checked={assignedClasses.includes(c.id)}
                onChange={() => toggleClass(c.id)}
              />
              <div>
                <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(c.students || []).length} Students</div>
              </div>
            </label>
          ))
        )}
      </div>

      <h2 className="text-xl font-black mb-4 text-slate-800 border-t pt-6">Quiz Settings</h2>
      <div className="space-y-2 mb-10">
        {category === 'async' && (
          <div className="space-y-4 mb-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
            <div>
              <label className="text-[10px] font-black uppercase text-orange-600 mb-1 block">Start Time (Local: {Intl.DateTimeFormat().resolvedOptions().timeZone})</label>
              <input type="datetime-local" className="w-full p-2 rounded-xl text-sm font-bold border border-orange-200" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-orange-600 mb-1 block">End Time (Local: {Intl.DateTimeFormat().resolvedOptions().timeZone})</label>
              <input type="datetime-local" className="w-full p-2 rounded-xl text-sm font-bold border border-orange-200" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
        )}

        {category === 'async' && type === 'async_quiz' && (
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <label className="text-[10px] font-black uppercase text-blue-600 mb-1 block">Time per Question (seconds) — Optional</label>
            <input
              type="number"
              min="5"
              placeholder="e.g. 30, 60, 90 — leave empty for no timer"
              className="w-full p-2 rounded-xl text-sm font-bold border border-blue-200"
              value={timerDuration}
              onChange={e => setTimerDuration(e.target.value)}
            />
            <p className="text-[9px] font-bold text-blue-400 mt-1">Each question gets this many seconds. When time runs out the quiz auto-advances to the next question.</p>
          </div>
        )}

        {type === 'async_video' && (
          <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors bg-purple-50">
            <input type="checkbox" className="w-5 h-5 accent-purple-600 rounded" checked={preventSkipping} onChange={e => setPreventSkipping(e.target.checked)} />
            <span className="font-bold text-purple-900 text-sm flex items-center gap-2"><Video size={16} /> Prevent Skipping Video</span>
          </label>
        )}

        {type !== 'async_video' && (
          <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
            <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded" checked={shuffleQuestions} onChange={e => setShuffleQuestions(e.target.checked)} />
            <span className="font-bold text-slate-700 text-sm">Shuffle Questions</span>
          </label>
        )}
        {true && (
          <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
            <input type="checkbox" className="w-5 h-5 accent-blue-600 rounded" checked={shuffleChoices} onChange={e => setShuffleChoices(e.target.checked)} />
            <span className="font-bold text-slate-700 text-sm">Shuffle Choices (MCQs only)</span>
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <button onClick={() => { setType(null); setCategory(null); }} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl">Cancel</button>
        <button
          onClick={start}
          disabled={!selected || assignedClasses.length === 0 || (category === 'async' && (!startTime || !endTime))}
          className="flex-1 py-4 font-black text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {category === 'async' ? 'Schedule' : 'Launch'}
        </button>
      </div>
    </div>
  );

  if (category === 'attendance') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800">Start Attendance</h2>
        <p className="text-slate-400 font-bold mt-1">Capture student check-ins quickly</p>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
        <button 
          onClick={() => { setAttendanceMode('new'); setSelectedOldAttendance(null); setAssignedClasses([]); setSessionName(''); }}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${attendanceMode === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >New Session</button>
        <button 
          onClick={() => setAttendanceMode('relaunch')}
          className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${attendanceMode === 'relaunch' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >Relaunch Old</button>
      </div>

      {attendanceMode === 'new' ? (
        <div className="space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Session Name (e.g., Lecture 1: Intro)</label>
            <input
              type="text"
              className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:outline-blue-500 transition-all"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter a title..."
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Select Target Class(s)</label>
            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scroll">
              {classes.length === 0 ? (
                <p className="text-slate-400 italic text-center text-sm py-4">No classes created yet. Cannot start attendance.</p>
              ) : (
                classes.map(c => (
                  <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox" className="w-5 h-5 accent-blue-600 rounded"
                      checked={assignedClasses.includes(c.id)}
                      onChange={() => toggleClass(c.id)}
                    />
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(c.students || []).length} Students</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Select Previous Session</label>
            {/* Search bar */}
            <div className="relative mb-3">
              <input
                type="text"
                value={relaunchSearch}
                onChange={e => setRelaunchSearch(e.target.value)}
                placeholder="Search by name, class or date (DD/MM/YYYY)..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-2 border-slate-100 focus:border-blue-400 rounded-xl text-sm font-bold text-slate-700 focus:outline-none transition-all placeholder:text-slate-300"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scroll">
              {(() => {
                const allAttendance = reports.filter(r => r.type === 'attendance').sort((a, b) => new Date(b.ts) - new Date(a.ts));
                const q = relaunchSearch.trim().toLowerCase();
                const filtered = !q ? allAttendance : allAttendance.filter(rep => {
                  const className = rep.assigned_classes?.length > 0
                    ? (classes.find(c => c.id === rep.assigned_classes[0])?.name || '').toLowerCase()
                    : '';
                  const dateStr = new Date(rep.ts).toLocaleDateString('en-GB').toLowerCase();
                  return (
                    (rep.title || '').toLowerCase().includes(q) ||
                    className.includes(q) ||
                    dateStr.includes(q)
                  );
                });

                if (allAttendance.length === 0) return <p className="text-slate-400 italic text-center text-sm py-4">No past attendance sessions found.</p>;
                if (filtered.length === 0) return <p className="text-slate-400 italic text-center text-sm py-4">No sessions match your search.</p>;

                return filtered.map(rep => {
                  const targetClassName = rep.assigned_classes?.length > 0
                    ? (classes.find(c => c.id === rep.assigned_classes[0])?.name || 'Unknown Class')
                    : 'No Class Assigned';
                  return (
                    <button
                      key={rep.id}
                      onClick={() => {
                        setSelectedOldAttendance(rep);
                        setAssignedClasses(rep.assigned_classes || []);
                      }}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${selectedOldAttendance?.id === rep.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                    >
                      <div>
                        <div className="font-black text-slate-800 text-sm mb-1">{rep.title || 'Untitled Session'}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={12} />
                          {new Date(rep.ts).toLocaleDateString('en-GB')} {new Date(rep.ts).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-blue-600 bg-blue-100 px-3 py-1.5 rounded-lg uppercase whitespace-nowrap ml-2">
                        {targetClassName}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
            {selectedOldAttendance && (
               <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl text-orange-800 text-xs font-bold flex gap-3 items-start">
                 <AlertCircle size={16} className="shrink-0 mt-0.5" />
                 <p>Relaunching this session will generate a new live access code. Any students who check in will be ADDED to the existing report list. Prevously present students will remain present.</p>
               </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setCategory(null)} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl">Cancel</button>
        <button
          onClick={start}
          disabled={(attendanceMode === 'new' && (!sessionName || assignedClasses.length === 0)) || (attendanceMode === 'relaunch' && !selectedOldAttendance)}
          className="flex-1 py-4 font-black text-white bg-blue-600 rounded-2xl shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {attendanceMode === 'relaunch' ? 'Relaunch Session' : 'Start Session'}
        </button>
      </div>
    </div>
  );

  if (category === 'feedback') return (
    <div className="max-w-md mx-auto bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <BarChart2 size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800">Launch Feedback</h2>
        <p className="text-slate-400 font-bold mt-1">Anonymous session satisfaction survey</p>
      </div>

      <div className="space-y-6 mb-8">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Feedback Title (e.g., Lecture 1 Feedback)</label>
          <input
            type="text"
            className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:outline-purple-500 transition-all"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter a title..."
          />
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest text-center">Select ONE Target Class</label>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scroll">
            {classes.length === 0 ? (
              <p className="text-slate-400 italic text-center text-sm py-4">No classes created yet.</p>
            ) : (
              classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setAssignedClasses([c.id])}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${assignedClasses.includes(c.id) ? 'border-purple-600 bg-purple-50 shadow-sm' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${assignedClasses.includes(c.id) ? 'border-purple-600 bg-purple-600' : 'border-slate-300'}`}>
                    {assignedClasses.includes(c.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-700 text-sm">{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{(c.students || []).length} Students</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => setCategory(null)} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl">Cancel</button>
        <button
          onClick={() => {
            const feedbackQuiz = {
              title: sessionName || 'Feedback Session',
              assigned_classes: assignedClasses,
              questions: [
                { id: 1, text: "The session’s objectives and content were clearly presented and well-organized.", type: "rating" },
                { id: 2, text: "The session significantly enhanced my knowledge, skills, or understanding of the topic.", type: "rating" },
                { id: 3, text: "The instructor/facilitator effectively guided the session and maintained a productive learning environment.", type: "rating" },
                { id: 4, text: "The activities, examples, or materials used were highly relevant and supported the goals of the session.", type: "rating" },
                { id: 5, text: "Additional Comments & Suggestions (Optional).", type: "text" }
              ]
            };
            onLaunch(feedbackQuiz, 'feedback');
            setCategory(null);
            setSessionName('');
            setAssignedClasses([]);
          }}
          disabled={!sessionName || assignedClasses.length === 0}
          className="flex-1 py-4 font-black text-white bg-purple-600 rounded-2xl shadow-lg shadow-purple-100 disabled:opacity-50"
        >
          Launch Now
        </button>
      </div>
    </div>
  );

  if (category === null) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <button
          onClick={() => setCategory('sync')}
          className="bg-blue-600 text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 transition-transform hover:scale-[1.03] active:scale-95 text-center"
        >
          <div className="p-3 bg-white/10 rounded-2xl"><Users size={40} /></div>
          <span className="text-2xl font-black">Synchronous</span>
          <span className="text-xs font-medium opacity-80 leading-relaxed">Launch a live quiz for students to take right now together.</span>
        </button>
        <button
          onClick={() => setCategory('async')}
          className="bg-orange-500 text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 transition-transform hover:scale-[1.03] active:scale-95 text-center"
        >
          <div className="p-3 bg-white/10 rounded-2xl"><Clock size={40} /></div>
          <span className="text-2xl font-black">Asynchronous</span>
          <span className="text-xs font-medium opacity-80 leading-relaxed">Schedule quizzes for students to complete on their own time.</span>
        </button>
        <button
          onClick={() => setCategory('attendance')}
          className="bg-green-500 text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 transition-transform hover:scale-[1.03] active:scale-95 text-center"
        >
          <div className="p-3 bg-white/10 rounded-2xl"><UserCheck size={40} /></div>
          <span className="text-2xl font-black">Attendance</span>
          <span className="text-xs font-medium opacity-80 leading-relaxed">Instantly capture secure, device-verified student check-ins.</span>
        </button>
        <button
          onClick={() => setCategory('feedback')}
          className="bg-purple-600 text-white p-10 rounded-[2.5rem] shadow-xl flex flex-col items-center gap-4 transition-transform hover:scale-[1.03] active:scale-95 text-center"
        >
          <div className="p-3 bg-white/10 rounded-2xl"><BarChart2 size={40} /></div>
          <span className="text-2xl font-black">Feedback Survey</span>
          <span className="text-xs font-medium opacity-80 leading-relaxed">Collect anonymous session satisfaction feedback with graphical analytics.</span>
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <button onClick={() => setCategory(null)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">
          <ArrowLeft size={20} /> Back
        </button>
        <h2 className="text-2xl font-black text-slate-800">
          {category === 'sync' ? 'Synchronous Modes' : 'Asynchronous Modes'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {category === 'sync' ? [
          { id: 'student_paced', name: 'Student-Paced Quiz', icon: <Users size={48} />, color: 'bg-blue-600', desc: 'Students progress at their own speed' },
          { id: 'teacher_paced', name: 'Teacher-Paced Quiz', icon: <Activity size={48} />, color: 'bg-purple-600', desc: 'Control the flow and show live results' }
        ].map(c => (
          <button
            key={c.id} onClick={() => setType(c.id)}
            className={`${c.color} text-white p-12 rounded-[3rem] shadow-xl flex flex-col items-center gap-6 transition-transform hover:scale-[1.03] active:scale-95 text-center`}
          >
            <div className="p-4 bg-white/10 rounded-2xl">{c.icon}</div>
            <span className="text-3xl font-black">{c.name}</span>
            <span className="text-sm font-medium opacity-80">{c.desc}</span>
          </button>
        )) : [
          { id: 'async_quiz', name: 'Standard Quiz', icon: <FileText size={48} />, color: 'bg-blue-600', desc: 'Schedule a standard quiz.' },
          { id: 'async_video', name: 'Video Quiz', icon: <Video size={48} />, color: 'bg-purple-600', desc: 'Schedule a video quiz with timestamped questions.' },
        ].map(c => {
          return (
            <button
              key={c.id} onClick={() => setType(c.id)}
              className={`${c.color} text-white p-12 rounded-[3rem] shadow-xl flex flex-col items-center gap-6 transition-transform hover:scale-[1.03] active:scale-95 text-center`}
            >
              <div className="p-4 bg-white/10 rounded-2xl">{c.icon}</div>
              <span className="text-3xl font-black">{c.name}</span>
              <span className="text-sm font-medium opacity-80">{c.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
} // Close LaunchTab

function QuizzesTab({ quizzes, setQuizzes, user, profile }) {
  const [edit, setEdit] = useState(null);

  const save = async (data) => {
    let saved;
    if (!data.id) {
      // New creation limits for free tier
      if (profile?.subscription === 'free') {
        if (data.type === 'survey') {
          const surveysCount = quizzes.filter(q => q.type === 'survey').length;
          if (surveysCount >= 3) {
            alert("Free Tier Limit: You can only have up to 3 surveys. Please upgrade to Pro to create more.");
            return;
          }
        } else {
          const quizzesCount = quizzes.filter(q => q.type !== 'survey').length;
          if (quizzesCount >= 3) {
            alert("Free Tier Limit: You can only have up to 3 quizzes. Please upgrade to Pro to create more.");
            return;
          }
        }
      }

      const { data: ret, error } = await supabase.from('quizzes').insert({ user_id: user.id, title: data.title, type: data.type, video_url: data.video_url, questions: data.questions }).select().single();
      if (error) alert("Save error: " + error.message);
      else saved = ret;
    } else {
      // Edit limits for free tier: only the first 3 are editable if they have more
      if (profile?.subscription === 'free') {
        const sorted = [...quizzes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const indexInHistory = sorted.findIndex(q => q.id === data.id);
        if (indexInHistory >= 3) {
          alert("Free Tier Restriction: You can only edit your 3 oldest items. This item is locked. Please upgrade to Pro to edit all items.");
          return;
        }
      }

      const { data: ret, error } = await supabase.from('quizzes').update({ title: data.title, type: data.type, video_url: data.video_url, questions: data.questions }).eq('id', data.id).select().single();
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

  if (edit) return <QuizEditor quiz={edit} onSave={save} onCancel={() => setEdit(null)} profile={profile} />;

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
              <div className="flex items-center gap-2">
                {q.type === 'video' ? <Video size={16} className="text-purple-500" /> : (q.type === 'survey' ? <BarChart2 size={16} className="text-green-500" /> : <FileText size={16} className="text-blue-500" />)}
                <h3 className="text-lg font-black text-slate-800">{q.title}</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                {q.type === 'video' ? 'Video Quiz' : (q.type === 'survey' ? 'Survey' : 'Standard Quiz')} • {(q.questions || []).length} Items
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setEdit(q)} 
                className={`p-3 rounded-xl transition-all ${profile?.subscription === 'free' && [...quizzes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).findIndex(x => x.id === q.id) >= 3 ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                title={profile?.subscription === 'free' && [...quizzes].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).findIndex(x => x.id === q.id) >= 3 ? "Locked for Free Tier" : "Edit"}
              >
                <Edit2 size={20} />
              </button>
              <button onClick={() => del(q.id)} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20} /></button>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && <div className="p-20 text-center text-slate-300 font-bold uppercase tracking-widest text-sm">No quizzes saved in your cloud library.</div>}
      </div>
    </div>
  );
}

function QuizEditor({ quiz, onSave, onCancel, profile }) {
  const [title, setTitle] = useState(quiz.title || '');
  const [type, setType] = useState(quiz.type || null);
  const [videoUrl, setVideoUrl] = useState(quiz.video_url || '');
  const [qs, setQs] = useState(quiz.questions || []);
  const [err, setErr] = useState('');
  const [uploadingImageFor, setUploadingImageFor] = useState(null);

  const playerRef = useRef(null);

  if (!type) {
    return (
      <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200 p-16 text-center animate-in fade-in zoom-in duration-300">
        <h2 className="text-3xl font-black text-slate-800 mb-4">Choose Quiz Type</h2>
        <p className="text-slate-500 mb-12 font-medium">Select the format for your new cloud quiz.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          <button onClick={() => setType('standard')} className="p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-4 group">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={32} /></div>
            <h3 className="text-xl font-black text-slate-800">Standard Quiz</h3>
            <p className="text-sm text-slate-500 font-medium">Traditional text and image based questions.</p>
          </button>
          <button onClick={() => setType('video')} className="p-8 rounded-[2rem] border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center gap-4 group">
            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Video size={32} /></div>
            <h3 className="text-xl font-black text-slate-800">Video Quiz</h3>
            <p className="text-sm text-slate-500 font-medium">Embed a YouTube video and add questions at specific timestamps.</p>
          </button>
        </div>
        <button onClick={onCancel} className="mt-12 px-8 py-3 text-slate-400 font-black hover:text-slate-600 transition-colors">Cancel</button>
      </div>
    );
  }

  const handleImageUpload = async (idx, file) => {
    if (!file) return;
    if (file.size > 1 * 1024 * 1024) {
      alert(`Image too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Please upload an image under 1 MB.`);
      return;
    }
    if (profile?.subscription === 'free' || profile?.subscription === 'beta') {
      alert("Photo uploads are not available on your current subscription plan. Please upgrade to Pro.");
      return;
    }
    setUploadingImageFor(idx);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('question-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('question-images')
        .getPublicUrl(filePath);

      const n = [...qs];
      n[idx].image_url = data.publicUrl;
      setQs(n);
    } catch (error) {
      alert("Error uploading image: " + error.message);
    } finally {
      setUploadingImageFor(null);
    }
  };

  const removeImage = (idx) => {
    const n = [...qs];
    delete n[idx].image_url;
    setQs(n);
  };

  const submit = () => {
    if (!title.trim()) { setErr('Quiz Name is Mandatory'); return; }
    if (type === 'video' && !videoUrl.trim()) { setErr('YouTube Video URL is Mandatory for Video Quizzes'); return; }
    onSave({ ...quiz, title, type, video_url: videoUrl, questions: qs });
  };

  const add = (qType) => {
    let timestamp = 0;
    if (type === 'video' && playerRef.current) {
      timestamp = Math.floor(playerRef.current.getCurrentTime());
    }
    setQs([...qs, {
      id: Date.now(),
      type: qType,
      text: '',
      options: qType === 'mc' ? ['', '', '', ''] : (qType === 'tf' ? ['True', 'False'] : []),
      correct: 0,
      timestamp: timestamp
    }]);
  };

  const formatTime = (seconds) => {
    if (seconds === undefined || seconds === null) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Type', 'Question', 'Option_1', 'Option_2', 'Option_3', 'Option_4', 'Correct_Answer'],
      ['mc', 'What is 2 + 2?', '1', '2', '3', '4', '4'],
      ['tf', 'The sky is blue.', '', '', '', '', 'True'],
      ['sa', 'What color is the sun?', '', '', '', '', 'Yellow']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Quiz_Template");
    XLSX.writeFile(wb, "ClassLabX_Quiz_Template.xlsx");
  };

  const importExcel = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        const newQs = [];
        data.forEach((row, i) => {
          let type = String(row['Type'] || '').toLowerCase().trim();
          if (!['mc', 'tf', 'sa'].includes(type)) return;

          let q = { id: Date.now() + i, type, text: String(row['Question'] || ''), options: [], correct: 0 };

          if (type === 'mc') {
            q.options = [String(row['Option_1'] || ''), String(row['Option_2'] || ''), String(row['Option_3'] || ''), String(row['Option_4'] || '')];
            const ansStr = String(row['Correct_Answer'] || '').trim();
            const idx = q.options.findIndex(o => o.trim() === ansStr);
            q.correct = idx >= 0 ? idx : 0;
          } else if (type === 'tf') {
            q.options = ['True', 'False'];
            const ansStr = String(row['Correct_Answer'] || '').toLowerCase().trim();
            q.correct = ansStr === 'false' ? 1 : 0;
          } else if (type === 'sa') {
            q.correct = String(row['Correct_Answer'] || '');
          }
          newQs.push(q);
        });

        if (newQs.length > 0) setQs([...qs, ...newQs]);
      } catch (err) {
        alert("Failed to parse Quiz Excel file.");
      }
      e.target.value = null;
    };
    reader.readAsBinaryString(f);
  };

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

      {type === 'video' && (
        <div className="p-8 bg-purple-50 border-b border-purple-100 flex flex-col gap-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-purple-600 mb-2 flex items-center gap-1.5">
                YouTube Video URL <span className="text-red-500 font-black">* MANDATORY</span>
              </label>
              <input
                className={`bg-white text-lg font-bold text-slate-800 w-full p-3 rounded-xl focus:outline-none border-2 transition-all ${err && !videoUrl ? 'border-red-500' : 'border-purple-200 focus:border-purple-500'}`}
                placeholder="https://www.youtube.com/watch?v=..." value={videoUrl}
                onChange={e => { setVideoUrl(e.target.value); if (e.target.value) setErr(''); }}
              />
            </div>
          </div>
          {videoUrl && (
            <div className="rounded-2xl overflow-hidden shadow-xl aspect-video w-full max-w-3xl mx-auto bg-black">
              <ReactPlayer
                ref={playerRef}
                url={videoUrl}
                controls
                width="100%"
                height="100%"
              />
            </div>
          )}
        </div>
      )}

      <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar bg-slate-50/20">
        {qs.map((q, idx) => (
          <div key={q.id || idx} className={`p-8 bg-slate-50 rounded-[2.5rem] border relative group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100 ${type === 'video' ? 'border-purple-100' : 'border-slate-200'}`}>
            <button onClick={() => setQs(qs.filter((_, i) => i !== idx))} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
            <div className="flex items-center gap-4 mb-4">
              <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${type === 'video' ? 'text-purple-400' : 'text-slate-300'}`}>Item {idx + 1} • {q.type}</div>
              {type === 'video' && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                  <Clock size={12} /> {formatTime(q.timestamp)}
                </div>
              )}
            </div>

            {q.image_url ? (
              <div className="relative mb-4 group inline-block">
                <img src={q.image_url} alt="Question Preview" className="h-32 rounded-xl object-contain border border-slate-200 shadow-sm bg-white" />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-600 hover:scale-110 active:scale-95 z-10"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 mb-4 cursor-pointer text-xs font-bold text-slate-400 hover:text-blue-500 transition-colors bg-slate-100 hover:bg-blue-50 px-3 py-2 rounded-xl w-fit border border-dashed border-slate-300 hover:border-blue-300">
                {uploadingImageFor === idx ? <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <UploadCloud size={16} />}
                {uploadingImageFor === idx ? 'Uploading...' : 'Add Image'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageUpload(idx, e.target.files[0])}
                  disabled={uploadingImageFor === idx}
                />
              </label>
            )}

            <textarea
              className="w-full bg-transparent p-4 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 border-2 border-slate-100 mb-6 font-bold text-slate-700"
              placeholder="Question Content..." value={q.text}
              onChange={e => { const n = [...qs]; n[idx].text = e.target.value; setQs(n); }}
            />
            {q.type === 'mc' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${q.correct === oIdx ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}>
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
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 py-10 border-t border-dashed border-slate-200">
          <div className="flex gap-2">
            {type === 'video' ? (
              <>
                <div className="text-xs font-bold text-purple-600 mr-4 flex items-center gap-2"><Video size={16} /> Add at current video time:</div>
                <button onClick={() => add('mc')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-purple-200 text-xs uppercase tracking-widest">Multi Choice</button>
                <button onClick={() => add('tf')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-purple-200 text-xs uppercase tracking-widest">True/False</button>
                <button onClick={() => add('sa')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-purple-200 text-xs uppercase tracking-widest">Short Answer</button>
              </>
            ) : (
              <>
                <button onClick={() => add('mc')} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">Multi Choice</button>
                <button onClick={() => add('tf')} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">True/False</button>
                <button onClick={() => add('sa')} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">Short Answer</button>
              </>
            )}
          </div>
          <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>
          <div className="flex gap-2">
            <button onClick={downloadTemplate} className="px-6 py-3 bg-green-50 text-green-600 hover:bg-green-100 rounded-2xl font-black transition-all text-xs uppercase tracking-widest flex items-center gap-2"><Download size={14} /> Template</button>
            <label className="cursor-pointer px-6 py-3 bg-green-600 text-white hover:bg-green-700 rounded-2xl font-black shadow-lg shadow-green-100 transition-all text-xs uppercase tracking-widest flex items-center gap-2">
              <Upload size={14} /> Import Excel
              <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={importExcel} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsTab({ session, responses, onEnd, roomCode }) {
  const [showQR, setShowQR] = useState(true);
  const [attendanceToken, setAttendanceToken] = useState(() => Date.now().toString());

  useEffect(() => {
    if (session?.type !== 'attendance') return;
    const interval = setInterval(async () => {
      const newToken = Date.now().toString();
      setAttendanceToken(newToken);
      // Persist Valid Token to Server for strict validation
      await supabase.from('rooms').update({
        quiz: { ...session.quiz, current_token: newToken }
      }).eq('id', roomCode);
    }, 10000); // 10 seconds
    return () => clearInterval(interval);
  }, [session?.type, roomCode, session?.quiz]);

  const joinUrl = session?.type === 'attendance'
    ? `${window.location.href.split('?')[0]}?room=${roomCode}&token=${attendanceToken}`
    : `${window.location.href.split('?')[0]}?room=${roomCode}`;

  if (!session) return <div className="text-center py-40 text-slate-300 font-black uppercase tracking-widest">No Active Sessions</div>;

  const handleTeacherNext = async () => {
    if (session.quiz.current_question_idx < session.quiz.questions.length - 1) {
      await supabase.from('rooms').update({
        quiz: {
          ...session.quiz,
          current_question_idx: session.quiz.current_question_idx + 1,
          show_results: false
        }
      }).eq('id', session.id);
    }
  };

  const handleTeacherPrev = async () => {
    if (session.quiz.current_question_idx > 0) {
      await supabase.from('rooms').update({
        quiz: {
          ...session.quiz,
          current_question_idx: session.quiz.current_question_idx - 1,
          show_results: false
        }
      }).eq('id', session.id);
    }
  };

  const toggleResults = async () => {
    await supabase.from('rooms').update({
      quiz: { ...session.quiz, show_results: !session.quiz.show_results }
    }).eq('id', session.id);
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border flex flex-col min-h-[70vh]">
      <div className="bg-slate-900 text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 z-10">
        <div>
          <h2 className="text-2xl font-black text-white">{session.quiz?.title || session.title || 'Live Session'}</h2>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Live • {session.type === 'teacher_paced' ? 'Teacher Paced' : session.type === 'attendance' ? 'Attendance Mode' : 'Student Paced'} • {responses.length} Participants
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setShowQR(!showQR)} className="bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 transition-all">
            <QrCode size={18} /> Invite Students
          </button>
          <button onClick={onEnd} className="bg-red-600 hover:bg-red-700 text-white px-8 py-2.5 rounded-full font-black text-xs shadow-xl shadow-red-900/20">Close Room</button>
        </div>
      </div>

      {showQR && (
        <div className="p-10 bg-blue-50 border-b flex flex-col items-center justify-center gap-8 text-center animate-in slide-in-from-top duration-300 shrink-0 z-0 relative">
          {session.type === 'attendance' && (
            <div className="bg-red-100 text-red-600 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-[-1rem] animate-pulse">
              <Activity size={14} /> Dynamic QR Active (Refreshes every 10s)
            </div>
          )}
          <div className="relative group flex justify-center items-center">
            <div className="bg-white p-4 rounded-xl shadow-2xl relative z-10 border-4 border-slate-50">
              <QRCode value={joinUrl} size={220} bgColor="#ffffff" fgColor="#000000" level="H" />
            </div>
            <div className="absolute inset-0 bg-blue-200 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800 mb-2">Join {session.type === 'attendance' ? 'Attendance' : 'Class'}</h3>
            <p className="text-slate-500 mb-4 font-medium max-w-sm mx-auto">
              Scan the code to join.
              {session.type === 'attendance' && " This QR refreshes continuously for security to prevent proxy scanning."}
            </p>
            <div className="flex flex-col items-center gap-4">
              {session.type !== 'attendance' && (
                <div className="text-4xl font-black tracking-[0.3em] text-blue-600 bg-white px-8 py-3 rounded-2xl shadow-inner border-2 border-blue-100 inline-block">{roomCode}</div>
              )}
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(joinUrl);
                  alert("Join Link copied to clipboard!");
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm active:scale-95"
              >
                <Copy size={14} /> Copy Direct Join URL
              </button>
            </div>
          </div>
        </div>
      )}

      {session.type === 'attendance' ? (
        <div className="flex-1 overflow-x-auto p-6 md:p-12 relative">
           <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
             <UserCheck size={400} />
           </div>
           <div className="max-w-4xl mx-auto relative z-10">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {responses.map((r, i) => (
                  <div key={i} className="bg-white p-4 rounded-3xl border-2 border-green-100 shadow-sm shadow-green-50 flex flex-col items-center text-center animate-in zoom-in duration-300">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-3">
                      <CheckCircle size={24} />
                    </div>
                    <div className="font-black text-slate-800 text-sm leading-tight mb-1">{r.student_name}</div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.student_id}</div>
                  </div>
                ))}
              </div>
              {responses.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-6">
                     <QrCode size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-300">Waiting for check-ins...</h3>
                </div>
              )}
           </div>
        </div>
      ) : session.type === 'teacher_paced' ? (
        <TeacherPacedDashboard
          session={session}
          responses={responses}
          onNext={handleTeacherNext}
          onPrev={handleTeacherPrev}
          onToggleResults={toggleResults}
          onEnd={onEnd}
        />
      ) : (
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
              {responses.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6">
                    <div className="font-black text-slate-800 text-lg leading-none whitespace-nowrap">Student {i + 1}</div>
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
      )}
    </div>
  );
}

function TeacherPacedDashboard({ session, responses, onNext, onPrev, onToggleResults, onEnd }) {
  const qIdx = session?.quiz?.current_question_idx || 0;
  const q = session.quiz.questions[qIdx];
  const total = session.quiz.questions.length;

  // Calculate responses for current question
  const responsesForCurrent = responses.filter(r => r.answers && r.answers[qIdx] !== undefined);
  const respCount = responsesForCurrent.length;
  const totalCount = responses.length;

  // Chart Data
  let chartData = [];
  if (q.type === 'mc' || q.type === 'tf') {
    const labels = q.type === 'mc' ? ['A', 'B', 'C', 'D'].slice(0, q.options.length) : ['True', 'False'];
    chartData = labels.map((label, idx) => {
      const count = responsesForCurrent.filter(r => Number(r.answers[qIdx]) === idx).length;
      return {
        label,
        count,
        percent: respCount > 0 ? (count / respCount) * 100 : 0,
        isCorrect: q.correct === idx
      };
    });
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center z-10 shadow-sm relative text-center">
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Participants</div>
          <div className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2"><Users size={20} className="text-blue-500" /> {totalCount}</div>
        </div>
        <div className="w-px h-10 bg-slate-200"></div>
        <div className="flex-1">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Responses for Q{qIdx + 1}</div>
          <div className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2"><CheckSquare size={20} className="text-orange-500" /> {respCount} <span className="text-sm text-slate-400">/ {totalCount}</span></div>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto w-full max-w-4xl mx-auto flex flex-col items-center">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Question {qIdx + 1} of {total}</div>
        <h2 className={`text-3xl font-black text-slate-800 text-center ${q.image_url ? 'mb-6' : 'mb-10'} w-full max-w-2xl`}>{q.text}</h2>
        {q.image_url && <img src={q.image_url} alt="Question content" className="max-h-64 object-contain rounded-2xl border border-slate-100 shadow-sm mb-10 bg-white" />}

        {session.quiz?.show_results ? (
          <div className="w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-2"><BarChart2 size={18} /> Live Results</h3>

            {(q.type === 'mc' || q.type === 'tf') && (
              <div className="flex items-end justify-center gap-6 md:gap-12 h-64 border-b-2 border-slate-100 pb-4 relative">
                <div className="absolute inset-x-0 bottom-1/4 border-b border-dashed border-slate-200 z-0"></div>
                <div className="absolute inset-x-0 bottom-2/4 border-b border-dashed border-slate-200 z-0"></div>
                <div className="absolute inset-x-0 bottom-3/4 border-b border-dashed border-slate-200 z-0"></div>
                {chartData.map((d, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 z-10 w-16 md:w-24 group">
                    <div className="text-sm font-black text-slate-700">{d.count}</div>
                    <div className="text-[10px] font-bold text-slate-400">({Math.round(d.percent)}%)</div>
                    <div
                      className={`w-full rounded-t-xl transition-all duration-1000 ease-out shadow-lg ${d.isCorrect ? 'bg-green-500 shadow-green-500/30' : 'bg-slate-300 shadow-slate-300/30'}`}
                      style={{ height: `${Math.max(d.percent, 4)}%` }}
                    ></div>
                    <div className="text-sm font-black text-slate-700 w-full text-center flex flex-col gap-1 items-center">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-white text-xs ${d.isCorrect ? 'bg-green-600' : 'bg-slate-700'}`}>{d.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {q.type === 'sa' && (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                {responsesForCurrent.map((r, i) => {
                  const ans = String(r.answers[qIdx]).trim();
                  const ok = q.correct && ans.toLowerCase() === String(q.correct).toLowerCase().trim();
                  return (
                    <div key={i} className={`p-5 rounded-2xl border-2 font-bold text-slate-700 flex justify-between items-center ${ok ? 'border-green-200 bg-green-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div>
                        {ans}
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Student {i + 1}</div>
                      </div>
                      {ok && <CheckCircle className="text-green-500" size={20} />}
                    </div>
                  );
                })}
                {responsesForCurrent.length === 0 && <p className="text-center text-slate-400 font-bold italic py-10">No responses submitted yet.</p>}
              </div>
            )}

            <div className="mt-8 text-center text-xs font-bold text-slate-400 bg-slate-50 py-3 rounded-xl border border-slate-100">
              Students {session.quiz?.show_results ? 'cannot edit' : 'can edit'} their responses while results are shown.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {(q.type === 'mc' || q.type === 'tf') && q.options.map((o, i) => {
              if (!o || !String(o).trim()) return null;
              return (
                <div key={i} className="bg-white p-6 rounded-[2rem] border-4 border-slate-50 text-xl font-black text-slate-700 shadow-sm flex items-center gap-6">
                  <span className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs text-slate-400 shrink-0 uppercase">{String.fromCharCode(65 + i)}</span>
                  {o}
                </div>
              );
            })}
            {q.type === 'sa' && (
              <div className="col-span-full bg-white p-8 rounded-[2rem] border-4 border-slate-50 text-center text-slate-400 italic font-bold h-32 flex items-center justify-center">
                Awaiting short answers from students...
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border-t p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] relative z-10">
        <button
          onClick={onPrev}
          disabled={qIdx === 0}
          className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-2xl font-black transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={20} /> Previous
        </button>

        <button
          onClick={onToggleResults}
          className={`w-full sm:w-auto px-10 py-4 text-white rounded-[2rem] font-black text-lg transition-transform active:scale-95 shadow-xl flex items-center justify-center gap-3 ${session.quiz?.show_results ? 'bg-orange-500 shadow-orange-500/20' : 'bg-purple-600 shadow-purple-600/20'}`}
        >
          {session.quiz?.show_results ? <><Activity size={20} /> Hide Results</> : <><BarChart2 size={20} /> Show Results</>}
        </button>

        {qIdx >= total - 1 ? (
          <button
            onClick={onEnd}
            className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-colors shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
          >
            End Quiz <XCircle size={20} />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            Next <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function FeedbackSurvey({ session, answers, submit, onFinish }) {
  const [localAnswers, setLocalAnswers] = useState(answers || {});
  const questions = session.quiz.questions;

  const handleRating = (qIdx, val) => {
    const next = { ...localAnswers, [qIdx]: val };
    setLocalAnswers(next);
    submit(qIdx, val);
  };

  const handleText = (qIdx, val) => {
    const next = { ...localAnswers, [qIdx]: val };
    setLocalAnswers(next);
    submit(qIdx, val);
  };

  const isComplete = questions.every((q, i) => q.type === 'text' || localAnswers[i] !== undefined);

  return (
    <div className="max-w-2xl mx-auto py-10 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 mb-8">
        <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
          <BarChart2 size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-800 mb-2 leading-tight">{session.quiz.title}</h2>
        <p className="text-slate-400 font-bold mb-10">Please share your honest feedback. This survey is completely anonymous.</p>

        <div className="space-y-12">
          {questions.map((q, i) => (
            <div key={q.id}>
              <div className="flex items-start gap-4 mb-6">
                <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">{i + 1}</span>
                <h3 className="text-xl font-black text-slate-700 leading-snug">{q.text}</h3>
              </div>
              
              {q.type === 'rating' ? (
                <div className="flex flex-row-reverse justify-center gap-2 md:gap-4">
                  {[5, 4, 3, 2, 1].map(val => (
                    <button
                      key={val}
                      onClick={() => handleRating(i, val)}
                      className={`flex-1 max-w-[80px] aspect-square rounded-2xl border-4 transition-all flex flex-col items-center justify-center gap-1 ${localAnswers[i] === val ? 'border-purple-600 bg-purple-50 text-purple-600 shadow-xl shadow-purple-100 scale-110 z-10' : 'border-slate-50 bg-slate-50 text-slate-300 hover:border-purple-200 hover:bg-white'}`}
                    >
                      <span className="text-2xl font-black">{val}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest">{val === 5 ? 'Highest' : (val === 1 ? 'Lowest' : '')}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full bg-slate-50 border-4 border-slate-100 rounded-[2rem] p-6 font-bold text-slate-700 focus:outline-none focus:border-purple-500 focus:bg-white transition-all min-h-[150px]"
                  placeholder="Your suggestions/comments (optional)..."
                  value={localAnswers[i] || ''}
                  onChange={(e) => handleText(i, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onFinish}
        disabled={!isComplete}
        className="w-full py-6 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-[2.5rem] font-black text-xl shadow-xl shadow-purple-100 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
      >
        Submit Feedback <CheckCircle size={24} />
      </button>
      <p className="text-center text-slate-400 font-bold text-[10px] mt-6 uppercase tracking-widest">Thank you for helping us improve!</p>
    </div>
  );
}

function FeedbackDashboard({ reports, classes }) {
  const feedbackReports = reports.filter(r => r.type === 'feedback');
  const [classFilter, setClassFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filtered = feedbackReports.filter(r => {
    if (classFilter && !r.assigned_classes?.includes(classFilter)) return false;
    if (sessionFilter && r.title !== sessionFilter) return false;
    if (dateFilter && new Date(r.created_at).toLocaleDateString() !== new Date(dateFilter).toLocaleDateString()) return false;
    return true;
  });

  const allResponses = filtered.flatMap(r => r.responses || []);
  const questionStats = [0, 1, 2, 3].map(idx => {
    const scores = allResponses.map(resp => resp.answers[idx]).filter(val => val !== undefined);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const satisfaction = (avg / 5) * 100;
    return { avg, satisfaction, count: scores.length };
  });

  const comments = allResponses.map(resp => resp.answers[4]).filter(val => val && val.trim());

  const uniqueTitles = [...new Set(feedbackReports.map(r => r.title))];

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Overview Stats
      const overviewData = [
        ['Feedback Dashboard Export'],
        ['Date Generated', new Date().toLocaleString()],
        [],
        ['Metric', 'Satisfaction Score (%)', 'Average Rating / 5.0', 'Responses Count']
      ];
      
      const labels = [
        "Session Content & Clarity",
        "Knowledge Enhancement",
        "Instruction Quality",
        "Materials & Support"
      ];

      labels.forEach((label, i) => {
        overviewData.push([
          label,
          Math.round(questionStats[i].satisfaction),
          questionStats[i].avg.toFixed(1),
          questionStats[i].count
        ]);
      });

      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

      // Sheet 2: Comments
      const commentsData = [['Student Comments']];
      if (comments.length === 0) {
        commentsData.push(['No comments available for this filter.']);
      } else {
        comments.forEach(c => commentsData.push([c]));
      }
      
      const wsComments = XLSX.utils.aoa_to_sheet(commentsData);
      // Make the comments column wide enough
      wsComments['!cols'] = [{wch: 100}];
      XLSX.utils.book_append_sheet(wb, wsComments, 'Comments');

      let filename = 'Feedback_Report';
      if (classFilter) filename += `_Class-${classFilter}`;
      if (sessionFilter) filename += `_${sessionFilter}`;
      XLSX.writeFile(wb, `ClassLabX_${filename.replace(/\\s+/g, '_')}_${Date.now()}.xlsx`);
    } catch (e) { alert('Error exporting to Excel: ' + e.message); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Print-only Dynamic Header */}
      <div className="hidden print:block text-center py-4 border-b-2 border-slate-100 mb-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">Feedback Report</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
          Class: {classFilter ? classes.find(c => c.id === classFilter)?.name : 'All Classes'}  •  
          Session: {sessionFilter || 'All Sessions'}
        </p>
      </div>

      {/* Filters and Exports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-purple-400">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-purple-400">
          <option value="">All Sessions</option>
          {uniqueTitles.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:border-purple-400" />
        
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-red-100 transition-transform active:scale-95">
            <Download size={16} /> PDF
          </button>
          <button onClick={exportToExcel} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-green-100 transition-transform active:scale-95">
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><BarChart2 size={20} /></span>
            Average Satisfaction
          </h3>
          <div className="space-y-8">
            {[
              "Session Content & Clarity",
              "Knowledge Enhancement",
              "Instruction Quality",
              "Materials & Support"
            ].map((label, i) => (
              <div key={label} className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-black text-slate-600">{label}</span>
                  <span className="text-xl font-black text-purple-600">{Math.round(questionStats[i].satisfaction)}%</span>
                </div>
                <div className="h-4 bg-slate-50 print:bg-slate-200 rounded-full overflow-hidden border border-slate-100 p-1 print:border-slate-300" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-purple-600 print:bg-purple-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{ width: `${questionStats[i].satisfaction}%`, WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
                  ></div>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{questionStats[i].count} Responses • Avg: {questionStats[i].avg.toFixed(1)}/5.0</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FileText size={20} /></span>
            Student Comments
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[400px] print:max-h-none print:overflow-visible pr-4 custom-scroll space-y-4">
            {comments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <AlertCircle size={40} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">No comments yet</p>
              </div>
            ) : (
              comments.map((c, i) => (
                <div key={i} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-600 font-bold leading-relaxed italic">"{c}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ reports, allReports, classes, updateReportStatus }) {
  const [view, setView] = useState('history'); 
  const [openReport, setOpenReport] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [hiddenSessions, setHiddenSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ClassLabX_HiddenSessions')) || []; }
    catch { return []; }
  });
  const [typeFilter, setTypeFilter] = useState({ teacher_paced: true, student_paced: true, attendance: true });
  // Helper: map async types to the student_paced filter bucket
  const matchesTypeFilter = (type) => {
    if (type === 'async_quiz' || type === 'async_video') return typeFilter['student_paced'];
    return typeFilter[type];
  };
  const [renamingReport, setRenamingReport] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [assigningClassReport, setAssigningClassReport] = useState(null);
  const [assignClassValue, setAssignClassValue] = useState('');
  const [selectedForEmail, setSelectedForEmail] = useState([]);
  const [localReportPatch, setLocalReportPatch] = useState({}); // id -> {title?, assigned_classes?}
  const [quizWeights, setQuizWeights] = useState({}); // { classId: { quizTitle: weight% } }
  const [gradebookSettings, setGradebookSettings] = useState({}); // { classId: { mode, topN } }
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [draftWeights, setDraftWeights] = useState({});
  const [draftMode, setDraftMode] = useState('simple'); // 'simple' | 'weighted' | 'top_n'
  const [draftTopN, setDraftTopN] = useState(3);
  const [saOverrides, setSaOverrides] = useState({}); // { reportId: { "studentId___qIdx": true|false } }
  const [saAnswerPopup, setSaAnswerPopup] = useState(null); // { reportId, studentId, qIdx, answer, isOk }

  const getEffectiveField = (r, field) => localReportPatch[r.id]?.[field] ?? r[field];
  const getEffectiveResponses = (r) => r.responses || []; // now synced directly by parent state

  const handleRename = async (r) => {
    const newTitle = renameValue.trim();
    if (!newTitle) return;
    await supabase.from('reports').update({ title: newTitle }).eq('id', r.id);
    setLocalReportPatch(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), title: newTitle } }));
    setRenamingReport(null);
    setRenameValue('');
  };

  const handleAssignClass = async (r) => {
    if (!assignClassValue) return;
    const newClasses = [assignClassValue];
    await supabase.from('reports').update({ assigned_classes: newClasses }).eq('id', r.id);
    setLocalReportPatch(prev => ({ ...prev, [r.id]: { ...(prev[r.id] || {}), assigned_classes: newClasses } }));
    setAssigningClassReport(null);
    setAssignClassValue('');
  };

  const toggleHidden = (id) => {
    setHiddenSessions(prev => {
      const newHidden = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('ClassLabX_HiddenSessions', JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const deleteReport = async (id, roomId, isAsync) => {
    if (!window.confirm("Delete this session from history?")) return;
    if (isAsync) {
       await supabase.from('rooms').delete().eq('id', id);
       // State update happens via parent prop sync if we use the update callbacks, but for now we rely on re-fetch or manual delete prop
    } else {
       await supabase.from('reports').delete().eq('id', id);
    }
  };


  useEffect(() => {
    if (openReport) setSelectedForEmail([]);
  }, [openReport]);

  const exportToExcel = (report) => {
    try {
      const wb = XLSX.utils.book_new();
      const safeTitle = (report.title || 'Report').replace(/[\\/*?[\]:]/g, '').replace(/\s+/g, '_');
      const typeLabel = report.type === 'teacher_paced' ? 'Teacher Paced' : report.type === 'attendance' ? 'Attendance' : 'Student Paced';

      const overviewData = [
        ['Report Title', getEffectiveField(report, 'title') || 'Untitled'],
        ['Date', new Date(report.ts).toLocaleString()],
        ['Type', typeLabel],
        ['Total Participants', getEffectiveResponses(report).length],
        ['Total Questions', (report.questions || []).length],
        []
      ];
      const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

      if (report.type === 'attendance') {
        // Attendance: just show who attended
        const attHeaders = ['#', 'Student ID', 'Student Name', 'Status'];
        const attRows = [attHeaders];
        getEffectiveResponses(report)
          .sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''))
          .forEach((r, i) => { attRows.push([i + 1, r.student_id || '', r.student_name || 'Anonymous', r.status || 'present']); });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(attRows), 'Attendees');
      } else {
        // Quiz: full scores + per-question breakdown
        const questions = report.questions || [];
        const headers = [
          'Student ID', 'Student Name', 'Overall Score (%)',
          ...questions.map((_, i) => `Q${i + 1} Answer`),
          ...questions.map((_, i) => `Q${i + 1} Correct?`)
        ];
        const resultsData = [headers];
        getEffectiveResponses(report).forEach(r => {
          let correctCount = 0;
          const ansRow = [];
          const isCorrectRow = [];
          questions.forEach((q, qIdx) => {
            const rawAns = r.answers?.[qIdx];
            let formattedAns = rawAns;
            if (rawAns !== undefined && q.type !== 'sa') {
              formattedAns = q.options && q.type === 'mc'
                ? String.fromCharCode(65 + Number(rawAns))
                : (q.type === 'tf' ? (Number(rawAns) === 0 ? 'True' : 'False') : rawAns);
            }
            ansRow.push(formattedAns !== undefined ? formattedAns : 'N/A');
            const isOk = rawAns !== undefined && (
              q.type === 'sa'
                ? (q.correct && String(rawAns).toLowerCase().trim() === String(q.correct).toLowerCase().trim())
                : (String(rawAns) === String(q.correct))
            );
            isCorrectRow.push(isOk ? 'Yes' : 'No');
            if (isOk) correctCount++;
          });
          const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 'N/A';
          resultsData.push([r.student_id, r.student_name, score, ...ansRow, ...isCorrectRow]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resultsData), 'Student Results');
      }

      XLSX.writeFile(wb, `ClassLabX_Report_${safeTitle}_${new Date(report.ts).getTime()}.xlsx`);
    } catch (e) { alert('Error exporting to Excel: ' + e.message); }
  };

  // Helper to compute student scores for a report, respecting manual SA overrides
  const computeScores = (report) => {
    const overrides = saOverrides[report.id] || report.score_overrides || {};
    return getEffectiveResponses(report).map(r => {
      let correctCount = 0;
      let email = '';
      for (const c of classes) {
        const s = (c.students || []).find(st => st.student_id === r.student_id);
        if (s && s.email) {
          email = s.email;
          break;
        }
      }

      const perQ = report.questions.map((q, qIdx) => {
        const rawAns = r.answers?.[qIdx];
        let display = 'N/A';
        let isOk = false;
        if (rawAns !== undefined) {
          if (q.type === 'mc') display = String.fromCharCode(65 + Number(rawAns));
          else if (q.type === 'tf') display = Number(rawAns) === 0 ? 'True' : 'False';
          else display = String(rawAns);
          // Check for manual override first, then fall back to auto-grade
          const overrideKey = `${r.student_id}___${qIdx}`;
          if (overrides[overrideKey] !== undefined) {
            isOk = overrides[overrideKey];
          } else {
            isOk = q.type === 'sa'
              ? (q.correct && String(rawAns).toLowerCase().trim() === String(q.correct).toLowerCase().trim())
              : (String(rawAns) === String(q.correct));
          }
          if (isOk) correctCount++;
        }
        return { display, isOk, isSA: q.type === 'sa', rawAns };
      });

      // Attendance status weight
      let attendanceWeight = 0;
      if (report.type === 'attendance') {
        if (r.status === 'late') attendanceWeight = 0.5;
        else if (r.status === 'absent') attendanceWeight = 0;
        else attendanceWeight = 1; // default to present
      }

      return { ...r, perQ, total: Math.round((correctCount / (report.questions.length || 1)) * 100), email, attendanceWeight };
    }).sort((a, b) => (a.student_name || '').localeCompare(b.student_name || ''));
  };

  // Detail view for a single report
  const activeReport = openReport ? (allReports || reports).find(r => r.id === openReport.id) : null;

  if (activeReport) {
    const scored = computeScores(activeReport);

    // Calculate difficulty index per question
    const difficultyIndices = (activeReport.questions || []).map((_, qIdx) => {
      let correctAttempts = 0;
      let totalAttempts = 0;

      scored.forEach(s => {
        if (s.perQ[qIdx].display !== 'N/A') {
          totalAttempts++;
          if (s.perQ[qIdx].isOk) correctAttempts++;
        }
      });

      return totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : null;
    });

    return (
      <>
      <div className="space-y-6">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setOpenReport(null)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm transition-colors text-slate-500"><ArrowLeft size={20} /></button>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeReport.title}</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">
                  {new Date(activeReport.ts).toLocaleString()} • {activeReport.type === 'teacher_paced' ? 'Teacher Paced' : 'Student Paced'} • {scored.length} Students • {(activeReport.questions || []).length} Questions
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedForEmail.length > 0 && (
                <a
                  href={`mailto:?bcc=${selectedForEmail.map(id => scored.find(s => s.student_id === id)?.email).filter(Boolean).join(',')}&subject=Your Quiz Results: ${activeReport.title}&body=Hello Class,%0D%0A%0D%0AYour scores for the recent quiz "${activeReport.title}" are now available.`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  Email Selected ({selectedForEmail.length})
                </a>
              )}
              <button onClick={() => exportToExcel(activeReport)} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-green-100 transition-all active:scale-95">
                <Download size={16} /> Export Excel
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black whitespace-nowrap">
                  <th className="p-4 border-b border-slate-200 text-center sticky left-0 bg-slate-50 z-20">
                    <input
                      type="checkbox"
                      className="accent-blue-600 rounded cursor-pointer"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedForEmail(scored.filter(s => s.email).map(s => s.student_id));
                        else setSelectedForEmail([]);
                      }}
                      checked={scored.filter(s => s.email).length > 0 && selectedForEmail.length === scored.filter(s => s.email).length}
                      title="Select all students with emails"
                    />
                  </th>
                  <th className="p-4 border-b border-slate-200 z-10">#</th>
                  <th className="p-4 border-b border-slate-200 z-10">Student Name</th>
                  <th className="p-4 border-b border-slate-200">ID</th>
                  {activeReport.type === 'attendance' && <th className="p-4 border-b border-slate-200 text-center">Status</th>}
                  {(activeReport.questions || []).map((_, i) => <th key={i} className="p-4 border-b border-slate-200 text-center">Q{i + 1}</th>)}
                  {activeReport.type !== 'attendance' && <th className="p-4 border-b border-slate-200 text-center text-blue-600">Total %</th>}
                  <th className="p-4 border-b border-slate-200 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-100">
                {scored.map((s, i) => {
                  const hasEmail = !!s.email;
                  return (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 text-center sticky left-0 bg-white z-10">
                        {hasEmail && (
                          <input
                            type="checkbox"
                            className="accent-blue-600 rounded cursor-pointer"
                            checked={selectedForEmail.includes(s.student_id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedForEmail([...selectedForEmail, s.student_id]);
                              else setSelectedForEmail(selectedForEmail.filter(id => id !== s.student_id));
                            }}
                          />
                        )}
                      </td>
                      <td className="p-4 text-slate-400">{i + 1}</td>
                      <td className="p-4 whitespace-nowrap">{s.student_name || 'Anonymous'}</td>
                      <td className="p-4 font-mono text-slate-400 text-xs">{s.student_id || '-'}</td>
                      
                      {activeReport.type === 'attendance' && (
                        <td className="p-4 text-center">
                          <div className={`inline-block text-[10px] font-black uppercase px-3 py-1 rounded-lg border-2 ${
                            (s.status || 'present') === 'present' ? 'bg-green-50 text-green-600 border-green-100' :
                            s.status === 'late' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                            'bg-red-50 text-red-600 border-red-100'
                          }`}>
                            {s.status || 'present'}
                          </div>
                        </td>
                      )}

                      {s.perQ.map((pq, qi) => {
                        if (pq.display === 'N/A') {
                          return <td key={qi} className="p-4 text-center text-slate-300"><span className="text-xs">—</span></td>;
                        }
                        if (pq.isSA) {
                          // SA cell: clickable, shows truncated answer + badge
                          return (
                            <td key={qi} className="p-2 text-center">
                              <button
                                onClick={() => setSaAnswerPopup({ reportId: activeReport.id, studentId: s.student_id, qIdx: qi, answer: pq.rawAns, isOk: pq.isOk })}
                                title="Click to read the full answer & toggle marking"
                                className={`max-w-[160px] text-left text-xs font-bold px-3 py-1.5 rounded-xl border-2 border-dashed transition-all hover:shadow-md ${
                                  pq.isOk
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                <span className="block truncate max-w-[130px]">{pq.display}</span>
                                <span className="text-[10px] font-black">{pq.isOk ? '✓ Correct' : '✗ Incorrect'}</span>
                              </button>
                            </td>
                          );
                        }
                        // MC / TF plain cell
                        return (
                          <td key={qi} className={`p-4 text-center ${pq.isOk ? 'text-green-600' : 'text-red-500'}`}>
                            {pq.isOk ? <span>{pq.display} ✓</span> : <span>{pq.display} ✗</span>}
                          </td>
                        );
                      })}
                      {activeReport.type !== 'attendance' && (
                        <td className={`p-4 text-center font-black text-lg ${s.total >= 80 ? 'text-green-600' : s.total >= 60 ? 'text-orange-500' : 'text-red-500'}`}>{s.total}%</td>
                      )}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={activeReport.type === 'attendance' 
                              ? `mailto:${s.email}?subject=Attendance Status: ${activeReport.title}&body=Hello ${s.student_name},%0D%0A%0D%0AYour attendance status for "${activeReport.title}" is marked as ${s.status?.toUpperCase() || 'PRESENT'}.`
                              : `mailto:${s.email}?subject=Your Quiz Results: ${activeReport.title}&body=Hello ${s.student_name},%0D%0A%0D%0AYour score for the recent quiz "${activeReport.title}" is ${s.total}%.`
                            }
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${hasEmail ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-50 text-slate-300 pointer-events-none'}`}
                            title={hasEmail ? "Send Email" : "No email address found"}
                          >
                            Email
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {activeReport.type !== 'attendance' && activeReport.type !== 'async_survey' && scored.length > 0 && (
                  <tr className="bg-slate-50/50 border-t-4 border-slate-200">
                    <td colSpan="4" className="p-4 text-right font-black uppercase tracking-widest text-slate-500 text-xs">% Correct</td>
                    {difficultyIndices.map((di, i) => (
                      <td key={i} className={`p-4 text-center font-black ${di === null ? 'text-slate-300' : (di >= 80 ? 'text-green-600' : di >= 50 ? 'text-orange-500' : 'text-red-500')}`}>
                        {di !== null ? `${di}%` : '-'}
                      </td>
                    ))}
                    <td colSpan="2"></td>
                  </tr>
                )}
                {activeReport.type !== 'attendance' && scored.length === 0 && <tr><td colSpan={(activeReport.questions || []).length + 6} className="p-16 text-center text-slate-400 italic">No participants in this session.</td></tr>}
                {activeReport.type === 'attendance' && scored.length === 0 && <tr><td colSpan={6} className="p-16 text-center text-slate-400 italic">No attendance records in this session.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SA Answer Reader & Override Popup — must live inside the activeReport return */}
      {saAnswerPopup && (() => {
        const { reportId, studentId, qIdx, answer, isOk } = saAnswerPopup;
        const rep = (allReports || reports).find(r => r.id === reportId);
        const question = rep?.questions?.[qIdx];
        const modelAnswer = question?.correct || '';
        const handleToggle = async (newIsOk) => {
          const overrideKey = `${studentId}___${qIdx}`;
          const prevForReport = saOverrides[reportId] || rep?.score_overrides || {};
          const newForReport = { ...prevForReport, [overrideKey]: newIsOk };
          setSaOverrides(prev => ({ ...prev, [reportId]: newForReport }));
          setSaAnswerPopup(null);
          await supabase.from('reports').update({ score_overrides: newForReport }).eq('id', reportId);
        };
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 p-6 border-b flex items-start gap-4">
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm ${isOk ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {isOk ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Q{qIdx + 1} — Short Answer</p>
                  <p className="font-black text-slate-800 text-sm leading-snug">{question?.question || ''}</p>
                </div>
                <button onClick={() => setSaAnswerPopup(null)} className="shrink-0 text-slate-400 hover:text-slate-700 font-black text-xl leading-none">✕</button>
              </div>
              <div className="p-6 space-y-4">
                {modelAnswer && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Model Answer</p>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm font-bold text-green-800">{modelAnswer}</div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Student's Answer</p>
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 min-h-[80px] max-h-[220px] overflow-y-auto leading-relaxed whitespace-pre-wrap break-words">
                    {answer || <span className="text-slate-400 italic font-normal">No answer provided</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Mark:</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-lg ${isOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isOk ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 p-6 pt-0">
                <button onClick={() => handleToggle(false)} className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${!isOk ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}>
                  ✗ Mark Incorrect
                </button>
                <button onClick={() => handleToggle(true)} className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isOk ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600'}`}>
                  ✓ Mark Correct
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </>
    );
  }

  const exportGradebook = (cls, assignedReps, matrix, hasAttendance, attendanceTitles, attendanceOnly = false) => {

    try {
      const wb = XLSX.utils.book_new();
      const weights = quizWeights[cls.id] || cls.quiz_weights || {};

      // Separate out quizzes from attendance
      const quizTitles = attendanceOnly ? [] : Array.from(new Set(assignedReps.filter(r => r.type !== 'attendance').map(r => r.title)));

      const headers = ['Student ID', 'Student Name'];
      if (!attendanceOnly) headers.push('Weighted Score (%)');
      if (hasAttendance) headers.push('Overall Attendance (%)');
      if (!attendanceOnly) headers.push(...quizTitles.map(t => Object.keys(weights).length > 0 ? `${t} (${weights[t] ?? 0}%)` : t));
      if (hasAttendance) headers.push(...attendanceTitles);

      const rows = [headers];
      matrix.forEach(row => {
        const studentData = [row.student_id, row.name];
        if (!attendanceOnly) studentData.push(row.average);
        if (hasAttendance) studentData.push(row.attendanceTotal);
        
        if (!attendanceOnly) quizTitles.forEach(title => { studentData.push(row.scores[title] !== undefined ? row.scores[title] : 'N/A'); });
        if (hasAttendance) {
          attendanceTitles.forEach(title => { studentData.push(row.attendanceRecords[title] ? 'Present' : 'Absent'); });
        }
        
        rows.push(studentData);
      });
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, attendanceOnly ? "Attendance" : "Gradebook");
      XLSX.writeFile(wb, attendanceOnly
        ? `ClassLabX_Attendance_${cls.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`
        : `ClassLabX_Gradebook_${cls.name.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
    } catch (e) { alert("Error exporting: " + e.message); }
  };

  // Gradebook Logic
  let gradebookClass = null;
  let assignedReports = [];
  let gradeMatrix = [];

  if ((view === 'gradebook' || view === 'attendance') && selectedClassId) {
    gradebookClass = classes.find(c => c.id === selectedClassId);
    if (gradebookClass) {
      const classStudentIds = (gradebookClass.students || []).map(s => s.student_id);

      assignedReports = (allReports || reports).filter(r => {
        if (r.type === 'feedback') return false;
        
        // Apply any local repair patches (from the Assign-Class UI in Session History)
        const effectiveClasses = localReportPatch[r.id]?.assigned_classes ?? (r.assigned_classes || []);

        // Include if explicitly assigned (in DB or via local patch)
        if (effectiveClasses.includes(selectedClassId)) return true;

        // For reports with no assigned_classes (old format before the fix)
        if (effectiveClasses.length === 0) {
          // Determine which class the session belongs to by checking students who responded
          const responderIds = getEffectiveResponses(r).map(resp => String(resp.student_id).trim().toLowerCase());
          if (responderIds.length === 0) return false; // can't determine class if nobody responded
          
          const classIds = classStudentIds.map(id => String(id).trim().toLowerCase());
          return responderIds.some(id => classIds.includes(id));
        }

        return false;
      });
      // Separation of Quiz Reports and Attendance Reports
      const quizReports = assignedReports.filter(r => r.type !== 'attendance');
      const attendanceReports = assignedReports.filter(r => r.type === 'attendance');

      // We want to group by Quiz/Attendance Title
      const uniqueQuizTitles = Array.from(new Set(quizReports.map(r => r.title)));
      const uniqueAttendanceTitles = Array.from(new Set(attendanceReports.map(r => r.title)));

      gradeMatrix = (gradebookClass.students || []).map(stu => {
        const scores = {}; // Keys: Quiz Title, Values: HIGHEST score
        const attendanceRecords = {}; // Keys: Attendance Title, Values: Boolean (Present/Absent)

        // Check if there are other students in this class with the exact same ID
        const hasDuplicateId = (gradebookClass.students || []).filter(s => s.student_id === stu.student_id).length > 1;

        // Process Quizzes
        quizReports.forEach(rep => {
          const stuResp = getEffectiveResponses(rep).find(res => {
            const resId = String(res.student_id).trim();
            const stuId = String(stu.student_id).trim();
            if (resId !== stuId) return false;
            if (hasDuplicateId) return res.student_name === stu.name;
            return true;
          });
          if (stuResp) {
            let correctCount = 0;
            rep.questions.forEach((q, qIdx) => {
              const rawAns = stuResp.answers?.[qIdx];
              if (rawAns !== undefined) {
                const isOk = q.type === 'sa' ? (q.correct && String(rawAns).toLowerCase().trim() === String(q.correct).toLowerCase().trim()) : (String(rawAns) === String(q.correct));
                if (isOk) correctCount++;
              }
            });
            const score = Math.round((correctCount / rep.questions.length) * 100);
            if (scores[rep.title] === undefined || score > scores[rep.title]) {
              scores[rep.title] = score;
            }
          }
        });

          // Process Attendance
          attendanceReports.forEach(rep => {
            const stuResp = getEffectiveResponses(rep).find(res => {
              const resId = String(res.student_id).trim();
              const stuId = String(stu.student_id).trim();
              if (resId !== stuId) return false;
              // Name matching check for duplicates happens on submission side for attendance, but just to be safe:
              if (hasDuplicateId && res.student_name && res.student_name !== 'Anonymous') {
                return res.student_name === stu.name;
              }
              return true;
            });
            // Attendance status weight
            if (stuResp) {
               let weight = 1;
               if (stuResp.status === 'late') weight = 0.5;
               else if (stuResp.status === 'absent') weight = 0;
               attendanceRecords[rep.title] = { reportId: rep.id, present: true, status: stuResp.status || 'present', weight };
            } else {
               attendanceRecords[rep.title] = { reportId: rep.id, present: false, status: 'absent', weight: 0 };
            }
          });

          // Calculate average based on gradebook mode
          const settings = gradebookSettings[gradebookClass.id] || {};
          const currentMode = settings.mode || gradebookClass.gradebook_mode || 'simple';
          const currentTopN = settings.topN ?? gradebookClass.top_n_count ?? 0;
          const currentWeights = quizWeights[gradebookClass.id] || gradebookClass.quiz_weights || {};
          let average = 0;

          if (currentMode === 'weighted' && Object.keys(currentWeights).length > 0) {
            // Weighted sum: each quiz score × (its weight / 100)
            let weightedSum = 0;
            uniqueQuizTitles.forEach(title => {
              const w = currentWeights[title] ?? 0;
              const score = scores[title] ?? 0;
              weightedSum += (score * w) / 100;
            });
            average = Math.round(weightedSum);
          } else if (currentMode === 'top_n' && currentTopN > 0) {
            // Top-N: take the N highest best-scores and average them equally
            const allScores = Object.values(scores).sort((a, b) => b - a);
            const topSlice = allScores.slice(0, currentTopN);
            average = topSlice.length > 0 ? Math.round(topSlice.reduce((s, v) => s + v, 0) / topSlice.length) : 0;
          } else {
            // Simple: unweighted average of all best-scores
            const vals = Object.values(scores);
            average = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
          }

          let attendancePoints = 0;
          Object.values(attendanceRecords).forEach(rec => {
            attendancePoints += rec.weight;
          });

          const attendanceTotal = uniqueAttendanceTitles.length > 0 
            ? Math.round((attendancePoints / uniqueAttendanceTitles.length) * 100) 
            : 0;

          return { 
            ...stu, 
            scores, 
            average,
            attendanceRecords,
            attendanceTotal
          };
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  if (reports.length === 0 && classes.length === 0) return <div className="text-center p-32 bg-white rounded-[3rem] text-slate-300 font-black uppercase tracking-widest border border-dashed">No Analytics Yet</div>;

  return (
    <>
    <div className="space-y-6">
      <div className="flex bg-white rounded-2xl p-2 border border-slate-100 shadow-sm max-w-4xl mx-auto overflow-x-auto whitespace-nowrap custom-scroll print:hidden">
        <button onClick={() => setView('history')} className={`px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest flex-1 ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Session History</button>
        <button onClick={() => setView('gradebook')} className={`px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest flex-1 ${view === 'gradebook' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Class Gradebook</button>
        <button onClick={() => setView('attendance')} className={`px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest flex-1 ${view === 'attendance' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Attendance Report</button>
        <button onClick={() => setView('feedback')} className={`px-4 py-3 rounded-xl font-black text-xs transition-all uppercase tracking-widest flex-1 ${view === 'feedback' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>Feedback</button>
      </div>

      {view === 'history' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <input value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search sessions by name..." className="flex-1 bg-white border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:outline-none focus:border-blue-400 transition-all placeholder:text-slate-300" />
            <div className="flex flex-wrap gap-2 items-center">
              {[
                { id: 'teacher_paced', label: 'Sync', icon: <BarChart2 size={14} />, color: 'purple' },
                { id: 'student_paced', label: 'Async', icon: <BarChart2 size={14} />, color: 'blue' },
                { id: 'attendance', label: 'Attendance', icon: <UserCheck size={14} />, color: 'green' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setTypeFilter(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors border-2 ${typeFilter[f.id] ? `bg-${f.color}-100 text-${f.color}-700 border-${f.color}-200` : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}
                >
                  {f.icon} {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center px-2">
             <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">{reports.filter(r => !hiddenSessions.includes(r.id)).length} Visible Sessions</div>
             <button onClick={() => setHiddenSessions([])} className="text-[10px] uppercase font-black tracking-widest text-slate-400 hover:text-blue-500 underline underline-offset-4">Reset Hidden</button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto custom-scroll">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black whitespace-nowrap">
                    <th className="p-4 border-b border-slate-200 w-16 text-center">Type</th>
                    <th className="p-4 border-b border-slate-200">Session Name</th>
                    <th className="p-4 border-b border-slate-200">Date/Time</th>
                    <th className="p-4 border-b border-slate-200 text-center">Students</th>

                    <th className="p-4 border-b border-slate-200 text-right pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const grouped = {};
                    reports
                      .filter(r => r.type !== 'feedback')
                      .filter(r => !hiddenSessions.includes(r.id))
                      .filter(r => matchesTypeFilter(r.type))
                      .filter(r => {
                        const title = getEffectiveField(r, 'title') || (r.type === 'attendance' ? 'Attendance Session' : 'Untitled');
                        return !searchFilter || title.toLowerCase().includes(searchFilter.toLowerCase());
                      })
                      .forEach(r => {
                        const title = getEffectiveField(r, 'title') || (r.type === 'attendance' ? 'Attendance Session' : 'Untitled');
                        const assignedClasses = getEffectiveField(r, 'assigned_classes') || [];
                        const classKey = JSON.stringify(assignedClasses.sort());
                        const key = `${title}|${classKey}|${r.type}`;

                        if (!grouped[key]) {
                          grouped[key] = { ...r, title, responses: [...getEffectiveResponses(r)] };
                        } else {
                          const existing = grouped[key];
                          if (r.ts > existing.ts) {
                            existing.ts = r.ts;
                            existing.questions = r.questions;
                          }
                          const respMap = {};
                          existing.responses.forEach(resp => { respMap[resp.student_id] = resp; });
                          getEffectiveResponses(r).forEach(resp => {
                            if (!respMap[resp.student_id] || (resp.ts > respMap[resp.student_id].ts)) {
                              respMap[resp.student_id] = resp;
                            }
                          });
                          existing.responses = Object.values(respMap);
                        }
                      });

                    return Object.values(grouped)
                      .sort((a, b) => b.ts - a.ts)
                      .map(r => {
                      const effectiveTitle = getEffectiveField(r, 'title') || (r.type === 'attendance' ? 'Attendance Session' : 'Untitled');
                      const effectiveClasses = getEffectiveField(r, 'assigned_classes') || [];
                      const assignedClassName = effectiveClasses.length > 0 ? (classes.find(c => c.id === effectiveClasses[0])?.name) : null;
                      const isUnlinkedAttendance = r.type === 'attendance' && effectiveClasses.length === 0;
                      return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 text-center align-middle">
                        <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center ${r.type === 'teacher_paced' ? 'bg-purple-100 text-purple-600' : r.type === 'attendance' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {r.type === 'attendance' ? <UserCheck size={16} /> : <BarChart2 size={16} />}
                        </div>
                      </td>
                      <td className="p-3 align-middle">
                        {renamingReport === r.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              autoFocus
                              className="flex-1 border-2 border-blue-300 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 focus:outline-blue-500"
                              value={renameValue}
                              onChange={e => setRenameValue(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRename(r); if (e.key === 'Escape') { setRenamingReport(null); setRenameValue(''); } }}
                            />
                            <button onClick={() => handleRename(r)} className="text-blue-600 font-black text-xs px-2 py-1 bg-blue-50 rounded-lg hover:bg-blue-100">Save</button>
                            <button onClick={() => { setRenamingReport(null); setRenameValue(''); }} className="text-slate-400 font-black text-xs px-2 py-1 bg-slate-50 rounded-lg hover:bg-slate-100">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="font-black text-slate-800 text-sm truncate max-w-[160px] sm:max-w-xs">{effectiveTitle}</div>
                            <button onClick={() => { setRenamingReport(r.id); setRenameValue(effectiveTitle === 'Attendance Session' ? '' : effectiveTitle); }} className="text-slate-300 hover:text-blue-400 transition-colors shrink-0" title="Rename">
                              <Pencil size={12} />
                            </button>
                          </div>
                        )}
                        {assignedClassName && (
                          <div className="text-[9px] text-blue-600 font-bold uppercase tracking-widest mt-0.5">{assignedClassName}</div>
                        )}
                        {isUnlinkedAttendance && (
                          assigningClassReport === r.id ? (
                            <div className="flex gap-2 items-center mt-1">
                              <select autoFocus className="text-xs border border-orange-300 rounded-lg px-2 py-1 font-bold text-slate-700" value={assignClassValue} onChange={e => setAssignClassValue(e.target.value)}>
                                <option value="">-- Select Class --</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                              </select>
                              <button onClick={() => handleAssignClass(r)} className="text-orange-600 font-black text-xs px-2 py-1 bg-orange-50 rounded-lg hover:bg-orange-100">Link</button>
                              <button onClick={() => { setAssigningClassReport(null); setAssignClassValue(''); }} className="text-slate-400 text-xs px-2 py-1 bg-slate-50 rounded-lg hover:bg-slate-100">✕</button>
                            </div>
                          ) : (
                            <button onClick={() => { setAssigningClassReport(r.id); setAssignClassValue(''); }} className="mt-1 text-[9px] text-orange-500 font-black uppercase tracking-widest hover:text-orange-700 flex items-center gap-1">
                              ⚠ Unlinked — click to assign class
                            </button>
                          )
                        )}
                      </td>
                      <td className="p-3 align-middle">
                        <div className="text-xs font-bold text-slate-500">
                          {new Date(r.ts).toLocaleDateString('en-GB')} • {new Date(r.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[9px] uppercase tracking-widest text-slate-400 mt-0.5">{r.type === 'teacher_paced' ? 'Teacher Paced' : r.type === 'attendance' ? 'Attendance' : r.type === 'async_video' ? 'Async Video' : r.type === 'async_quiz' ? 'Async Quiz' : 'Student Paced'}</div>
                      </td>
                      <td className="p-3 text-center align-middle font-black text-slate-700 text-sm">
                        {getEffectiveResponses(r).length}
                      </td>

                      <td className="p-3 text-right align-middle pr-6 space-x-2">
                        <button onClick={() => toggleHidden(r.id)} className="px-3 py-2 inline-flex bg-slate-50 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg font-black text-xs transition-all items-center gap-2" title="Hide Session">
                          <EyeOff size={14} />
                        </button>
                        <button onClick={() => setOpenReport(r)} className="px-4 py-2 inline-flex bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg font-black text-xs transition-all items-center gap-2">
                          <Eye size={14} /> Open
                        </button>
                      </td>
                    </tr>
                      );
                    });
                  })()}
                  {(() => {
                    const hasVisible = reports
                      .filter(r => !hiddenSessions.includes(r.id))
                      .filter(r => matchesTypeFilter(r.type))
                      .filter(r => {
                        const title = getEffectiveField(r, 'title') || (r.type === 'attendance' ? 'Attendance Session' : 'Untitled');
                        return !searchFilter || title.toLowerCase().includes(searchFilter.toLowerCase());
                      }).length > 0;
                    
                    return !hasVisible && (
                      <tr>
                        <td colSpan="6" className="p-16 text-center text-slate-300 font-bold italic border-b-0">
                          No sessions match your filters.
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : view === 'feedback' ? (
        <FeedbackDashboard reports={allReports} classes={classes} />
      ) : view === 'gradebook' ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Select a Class</label>
              <select className="w-full max-w-md bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:outline-blue-500 appearance-none" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {gradebookClass && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const uniqueTitles = Array.from(new Set(assignedReports.filter(r => r.type !== 'attendance').map(r => r.title)));
                    const current = quizWeights[gradebookClass.id] || gradebookClass.quiz_weights || {};
                    const draft = {};
                    uniqueTitles.forEach(t => { draft[t] = current[t] ?? 0; });
                    setDraftWeights(draft);
                    // init mode
                    const settings = gradebookSettings[gradebookClass.id] || {};
                    const mode = settings.mode || gradebookClass.gradebook_mode || 'simple';
                    const topN = settings.topN ?? gradebookClass.top_n_count ?? Math.min(3, uniqueTitles.length);
                    setDraftMode(mode);
                    setDraftTopN(topN || 3);
                    setShowWeightModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-100 transition-transform active:scale-95"
                >
                  <BarChart2 size={18} /> Set Weights
                </button>
                <button onClick={() => {
                   exportGradebook(gradebookClass, assignedReports, gradeMatrix, false, []);
                }} className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-green-100 transition-transform active:scale-95">
                  <Download size={18} /> Export Gradebook
                </button>
              </div>
            )}
          </div>
          {!selectedClassId ? (
            <div className="text-center py-20 text-slate-400 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">Select a class above to view the combined gradebook matrix.</div>
          ) : gradebookClass ? (
            <div className="overflow-x-auto custom-scroll border rounded-[2rem]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black whitespace-nowrap">
                    <th className="p-4 border-b border-slate-200 sticky left-0 bg-slate-50 z-10 w-48">Student Name</th>
                    <th className="p-4 border-b border-slate-200 w-32">ID</th>
                    {(() => {
                      const s = gradebookSettings[gradebookClass?.id] || {};
                      const m = s.mode || gradebookClass?.gradebook_mode || 'simple';
                      const n = s.topN ?? gradebookClass?.top_n_count ?? 0;
                      const label = m === 'top_n' ? `Top ${n} Score` : m === 'weighted' ? 'Weighted Score' : 'Average Score';
                      return <th className="p-4 border-b border-slate-200 text-center text-blue-600 w-24">{label}</th>;
                    })()}
                    
                    {Array.from(new Set(assignedReports.filter(r => r.type !== 'attendance').map(r => r.title))).map(title => {
                      const activeMode = (gradebookSettings[gradebookClass?.id] || {}).mode || gradebookClass?.gradebook_mode || 'simple';
                      const w = (quizWeights[gradebookClass?.id] || gradebookClass?.quiz_weights || {})[title];
                      return (
                        <th key={`q-${title}`} className="p-4 border-b border-slate-200 min-w-[120px]">
                          <div className="truncate w-full max-w-[150px]" title={title}>{title}</div>
                          <div className="text-slate-300 font-medium text-[8px] mt-1">
                            {activeMode === 'weighted' && w !== undefined ? `Weight: ${w}%` : 'Best Score'}
                          </div>
                        </th>
                      );
                    })}

                    {assignedReports.filter(r => r.type !== 'attendance').length === 0 && <th className="p-4 border-b border-slate-200">No quizzes recorded yet.</th>}
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-100">
                  {gradeMatrix.map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                      <td className="p-4 sticky left-0 z-10 whitespace-nowrap truncate max-w-xs bg-white" title={row.name}>
                        <div className="flex items-center gap-2">
                           {row.name}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-xs">{row.student_id}</td>
                      <td className={`p-4 text-center font-black ${row.average >= 80 ? 'text-green-500' : row.average >= 60 ? 'text-orange-500' : 'text-slate-400'}`}>{row.average > 0 ? `${row.average}%` : '-'}</td>
                      
                      {Array.from(new Set(assignedReports.filter(r => r.type !== 'attendance').map(r => r.title))).map(title => (
                        <td key={`q-${title}`} className="p-4 text-slate-500 font-black">{row.scores[title] !== undefined ? `${row.scores[title]}%` : '-'}</td>
                      ))}

                      {assignedReports.filter(r => r.type !== 'attendance').length === 0 && <td className="p-4"></td>}
                    </tr>
                  ))}
                  {gradeMatrix.length === 0 && (<tr><td colSpan={assignedReports.length + 3} className="p-10 text-center text-slate-400 italic">No students in this class.</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : view === 'attendance' ? (
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mt-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Select a Class</label>
              <select className="w-full max-w-md bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold text-slate-700 focus:outline-blue-500 appearance-none" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                <option value="">-- Choose Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {gradebookClass && (
              <div className="flex gap-2">
                {Array.from(new Set(assignedReports.filter(r => r.type === 'attendance').map(r => r.title))).length > 0 && gradeMatrix.filter(r => r.attendanceTotal < 75 && r.email).length > 0 && (
                  <a
                    href={`mailto:?bcc=${gradeMatrix.filter(r => r.attendanceTotal < 75 && r.email).map(r => r.email).join(',')}&subject=⚠ Attendance Warning – Immediate Action Required&body=Dear Student,%0D%0A%0D%0AThis is an official notification from your course instructor.%0D%0A%0D%0AOur records show that your current attendance rate has dropped BELOW the required minimum of 75%.%0D%0A%0D%0APlease contact your instructor IMMEDIATELY to discuss your attendance record and any possible remediation.`}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-red-100 transition-transform active:scale-95"
                  >
                    <AlertCircle size={18} /> Email At-Risk
                  </a>
                )}
                <button onClick={() => {
                   const as = Array.from(new Set(assignedReports.filter(r => r.type === 'attendance').map(r => r.title)));
                   exportGradebook(gradebookClass, assignedReports, gradeMatrix, as.length > 0, as, true);
                }} className="bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-green-100 transition-transform active:scale-95">
                  <Download size={18} /> Export Attendance
                </button>
              </div>
            )}
          </div>
          {!selectedClassId ? (
            <div className="text-center py-20 text-slate-400 font-bold italic border-2 border-dashed border-slate-100 rounded-[2rem]">Select a class above to view the attendance record.</div>
          ) : gradebookClass ? (
            <div className="overflow-x-auto custom-scroll border rounded-[2rem]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-black whitespace-nowrap">
                    <th className="p-4 border-b border-slate-200 sticky left-0 bg-slate-50 z-10 w-48">Student Name</th>
                    <th className="p-4 border-b border-slate-200 w-32">ID</th>
                    {Array.from(new Set(assignedReports.filter(r => r.type === 'attendance').map(r => r.title))).length > 0 && (
                      <th className="p-4 border-b border-slate-200 text-center text-green-600 w-28">Overall Attendance</th>
                    )}
                    {Array.from(new Set(assignedReports.filter(r => r.type === 'attendance').map(r => r.title)))
                      .sort((a, b) => {
                         const repA = assignedReports.find(r => r.title === a && r.type === 'attendance');
                         const repB = assignedReports.find(r => r.title === b && r.type === 'attendance');
                         return new Date(repA?.ts).getTime() - new Date(repB?.ts).getTime();
                      })
                      .map(title => {
                       const rep = assignedReports.find(r => r.title === title && r.type === 'attendance');
                       return (
                         <th key={title} className="p-4 border-b border-slate-200 min-w-[120px] text-center">
                           <div className="truncate w-full max-w-[150px] text-slate-700" title={title}>{title}</div>
                           <div className="text-slate-400 font-black text-[8px] mt-1">{new Date(rep?.ts).toLocaleDateString('en-GB')} {new Date(rep?.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         </th>
                       )
                    })}
                    {assignedReports.filter(r => r.type === 'attendance').length === 0 && <th className="p-4 border-b border-slate-200">No attendance sessions recorded yet.</th>}
                  </tr>
                </thead>
                <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-100">
                  {gradeMatrix.map((row, i) => {
                    const hasAttendance = Array.from(new Set(assignedReports.filter(r => r.type === 'attendance').map(r => r.title))).length > 0;
                    const isAtRisk = hasAttendance && row.attendanceTotal < 75;
                    return (
                    <tr key={i} className={`hover:bg-blue-50/30 transition-colors ${isAtRisk ? 'bg-red-50/20' : ''}`}>
                      <td className={`p-4 sticky left-0 z-10 whitespace-nowrap truncate max-w-xs ${isAtRisk ? 'bg-red-50/40 text-red-700 font-black' : 'bg-white'}`} title={row.name}>
                        <div className="flex items-center gap-2">
                           {row.name}
                           {isAtRisk && <span className="bg-red-500 text-white px-2 py-0.5 rounded-md text-[8px] uppercase tracking-widest font-black shrink-0 shadow-sm animate-pulse">At Risk</span>}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-400 text-xs">{row.student_id}</td>
                      
                      {hasAttendance && (
                        <td className={`p-4 text-center font-black ${row.attendanceTotal >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                          {row.attendanceTotal}%
                        </td>
                      )}

                      {Array.from(new Set(assignedReports.filter(r => r.type === 'attendance').map(r => r.title)))
                         .sort((a, b) => {
                           const repA = assignedReports.find(r => r.title === a && r.type === 'attendance');
                           const repB = assignedReports.find(r => r.title === b && r.type === 'attendance');
                           return new Date(repA?.ts).getTime() - new Date(repB?.ts).getTime();
                         })
                         .map(title => {
                           const rec = row.attendanceRecords[title];
                           const status = rec?.status || 'absent';
                           const reportId = rec?.reportId;
                           return (
                             <td key={`a-${title}`} className={`p-4 font-black text-center ${
                               status === 'present' ? 'text-green-500 bg-green-50/10' : 
                               status === 'late' ? 'text-orange-500 bg-orange-50/10' : 
                               'text-red-400 bg-red-50/30'
                             }`}>
                               <select
                                 className="bg-transparent border-none text-center font-black cursor-pointer focus:outline-none"
                                 value={status}
                                 onChange={(e) => updateReportStatus(reportId, row.student_id, e.target.value)}
                               >
                                 <option value="present">Present</option>
                                 <option value="late">Late</option>
                                 <option value="absent">Absent</option>
                               </select>
                             </td>
                           );
                         })}

                      {assignedReports.filter(r => r.type === 'attendance').length === 0 && <td className="p-4"></td>}
                    </tr>
                  )})}
                  {gradeMatrix.length === 0 && (<tr><td colSpan={10} className="p-10 text-center text-slate-400 italic">No students in this class.</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>

      {/* Quiz Weights Modal */}
      {showWeightModal && gradebookClass && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <BarChart2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Gradebook Scoring Mode</h3>
                <p className="text-xs font-bold text-slate-400">{gradebookClass.name}</p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-slate-100 rounded-2xl p-1 mb-6 gap-1">
              {[
                { key: 'simple', label: 'Simple Average' },
                { key: 'weighted', label: 'Custom Weights' },
                { key: 'top_n', label: 'Top N Scores' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDraftMode(opt.key)}
                  className={`flex-1 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                    draftMode === opt.key
                      ? 'bg-white text-blue-600 shadow-md'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Mode descriptions */}
            {draftMode === 'simple' && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-sm font-bold text-slate-500">
                All quiz best-scores for each student are averaged equally. No configuration needed.
              </div>
            )}

            {/* Custom Weights Mode */}
            {draftMode === 'weighted' && (
              <>
                {Object.keys(draftWeights).length === 0 ? (
                  <p className="text-slate-400 font-bold text-center py-8 italic">No quizzes found for this class yet.</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {Object.keys(draftWeights).map(title => (
                      <div key={title} className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-700 text-sm truncate" title={title}>{title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number" min="0" max="100"
                            value={draftWeights[title]}
                            onChange={e => {
                              const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                              setDraftWeights(prev => ({ ...prev, [title]: val }));
                            }}
                            className="w-20 text-center bg-white border-2 border-slate-200 rounded-xl font-black text-slate-700 p-2 focus:outline-none focus:border-blue-500 transition-all"
                          />
                          <span className="text-slate-500 font-black text-sm">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {Object.keys(draftWeights).length > 0 && (() => {
                  const total = Object.values(draftWeights).reduce((s, v) => s + (Number(v) || 0), 0);
                  const isValid = total === 100;
                  const diff = 100 - total;
                  return (
                    <div className={`flex items-center justify-between p-4 rounded-2xl mb-6 border-2 ${isValid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                      <span className={`font-black text-sm uppercase tracking-widest ${isValid ? 'text-green-700' : 'text-orange-600'}`}>
                        {isValid ? '✓ Total is 100%' : `Total: ${total}% (${diff > 0 ? `+${diff}` : diff} needed)`}
                      </span>
                      <span className={`text-2xl font-black ${isValid ? 'text-green-600' : 'text-orange-500'}`}>{total}%</span>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Top N Mode */}
            {draftMode === 'top_n' && (
              <div className="mb-6">
                <p className="text-sm font-bold text-slate-500 mb-4">
                  Only each student's <strong className="text-blue-600">N highest quiz scores</strong> will be averaged equally. 
                  Set N below (must be between 1 and {Object.keys(draftWeights).length || '?'} quizzes).
                </p>
                <div className="flex items-center gap-4 bg-slate-50 rounded-2xl p-5">
                  <label className="font-black text-slate-700 text-sm uppercase tracking-widest flex-1">Consider Top</label>
                  <input
                    type="number"
                    min="1"
                    max={Object.keys(draftWeights).length || 100}
                    value={draftTopN}
                    onChange={e => setDraftTopN(Math.max(1, Math.min(Object.keys(draftWeights).length || 100, Number(e.target.value) || 1)))}
                    className="w-24 text-center bg-white border-2 border-slate-200 rounded-xl font-black text-slate-700 p-3 text-xl focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <label className="font-black text-slate-700 text-sm uppercase tracking-widest">Quizzes</label>
                </div>
                {draftTopN >= Object.keys(draftWeights).length && Object.keys(draftWeights).length > 0 && (
                  <p className="text-orange-500 font-bold text-xs mt-3 ml-1">⚠ N equals or exceeds total quizzes — same as Simple Average.</p>
                )}
              </div>
            )}

            {/* Save / Cancel */}
            <div className="flex gap-3">
              <button onClick={() => setShowWeightModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm uppercase tracking-widest transition-colors">
                Cancel
              </button>
              <button
                disabled={draftMode === 'weighted' && Object.values(draftWeights).reduce((s, v) => s + (Number(v) || 0), 0) !== 100}
                onClick={async () => {
                  const updatePayload = {
                    gradebook_mode: draftMode,
                    top_n_count: draftMode === 'top_n' ? draftTopN : 0,
                    quiz_weights: draftMode === 'weighted' ? draftWeights : {},
                  };
                  const { error } = await supabase.from('classes').update(updatePayload).eq('id', gradebookClass.id);
                  if (error) { alert('Error saving: ' + error.message); return; }
                  // Update local state for instant recalculation
                  setGradebookSettings(prev => ({ ...prev, [gradebookClass.id]: { mode: draftMode, topN: draftTopN } }));
                  if (draftMode === 'weighted') {
                    setQuizWeights(prev => ({ ...prev, [gradebookClass.id]: { ...draftWeights } }));
                  }
                  setShowWeightModal(false);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-colors shadow-lg shadow-blue-100"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SA Answer Reader & Override Popup */}
      {saAnswerPopup && (() => {
        const { reportId, studentId, qIdx, answer, isOk } = saAnswerPopup;
        const rep = (allReports || reports).find(r => r.id === reportId);
        const question = rep?.questions?.[qIdx];
        const modelAnswer = question?.correct || '';

        const handleToggle = async (newIsOk) => {
          const overrideKey = `${studentId}___${qIdx}`;
          const prevForReport = saOverrides[reportId] || rep?.score_overrides || {};
          const newForReport = { ...prevForReport, [overrideKey]: newIsOk };
          setSaOverrides(prev => ({ ...prev, [reportId]: newForReport }));
          setSaAnswerPopup(null);
          await supabase.from('reports').update({ score_overrides: newForReport }).eq('id', reportId);
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="bg-slate-50 p-6 border-b flex items-start gap-4">
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-sm ${isOk ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {isOk ? '✓' : '✗'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Q{qIdx + 1} — Short Answer</p>
                  <p className="font-black text-slate-800 text-sm leading-snug">{question?.question || ''}</p>
                </div>
                <button onClick={() => setSaAnswerPopup(null)} className="shrink-0 text-slate-400 hover:text-slate-700 font-black text-xl leading-none">✕</button>
              </div>

              <div className="p-6 space-y-4">
                {modelAnswer && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Model Answer</p>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm font-bold text-green-800">{modelAnswer}</div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Student's Answer</p>
                  <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 min-h-[80px] max-h-[220px] overflow-y-auto leading-relaxed whitespace-pre-wrap break-words">
                    {answer || <span className="text-slate-400 italic font-normal">No answer provided</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Mark:</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-lg ${isOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isOk ? '✓ Correct' : '✗ Incorrect'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={() => handleToggle(false)}
                  className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${!isOk ? 'bg-red-500 text-white shadow-lg shadow-red-100' : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600'}`}
                >
                  ✗ Mark Incorrect
                </button>
                <button
                  onClick={() => handleToggle(true)}
                  className={`flex-1 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${isOk ? 'bg-green-500 text-white shadow-lg shadow-green-100' : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600'}`}
                >
                  ✓ Mark Correct
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}





// ==========================================
//               STUDENT PORTAL
// ==========================================
function StudentPortal({ setRole, initialRoom }) {
  // Initialize from cache if refresh happened mid-session
  const [cachedState] = useState(() => {
    try {
      const stored = localStorage.getItem('ClassLabX_StudentState');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return null;
  });

  const [room, setRoom] = useState(initialRoom || cachedState?.room || '');
  const [sid, setSid] = useState(() => {
    const cachedSid = cachedState?.sid || '';
    if (cachedSid === 'anonymous' || cachedSid.startsWith('anon_')) return '';
    return cachedSid;
  });
  const [name, setName] = useState(cachedState?.name || ''); 
  const [joined, setJoined] = useState((!initialRoom || initialRoom === cachedState?.room) ? (cachedState?.joined || false) : false);

  // Stable random ID for open rooms
  const [localId] = useState(() => Math.random().toString(36).substring(2, 9));

  // States for restricted entry flow
  const [checkingId, setCheckingId] = useState(false);
  const [idError, setIdError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [tempSession, setTempSession] = useState(null); // hold room data before full join

  const [session, setSession] = useState(null);
  const [quizEnded, setQuizEnded] = useState(false);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [roomType, setRoomType] = useState('');
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null); // seconds remaining for current question

  // Reset session if entering a NEW room via initialRoom (QR scan/URL)
  useEffect(() => {
    if (initialRoom && initialRoom !== cachedState?.room) {
      setRoom(initialRoom);
      setJoined(false);
      setSession(null);
      setAnswers({});
      setIdx(0);
      setAttendanceSuccess(false);
      setQuizEnded(false);
    }
  }, [initialRoom]);

  // Keep cache synced if they successfully join
  useEffect(() => {
    if (joined && room && (sid || name)) {
      localStorage.setItem('ClassLabX_StudentState', JSON.stringify({ room, sid, name, joined }));
    }
  }, [joined, room, sid, name]);

  const clearStudentSession = () => {
    localStorage.removeItem('ClassLabX_StudentState');
    setRole(null);
  };

  useEffect(() => {
    if (room?.trim().length >= 4) {
      supabase.from('rooms').select('type').eq('id', room.toUpperCase()).single().then(res => {
        if (res.data) setRoomType(res.data.type);
      });
    } else {
      setRoomType('');
    }
  }, [room]);

  // Video Quiz States
  const playerRef = useRef(null);
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [maxPlayed, setMaxPlayed] = useState(0);
  const [videoInitializing, setVideoInitializing] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCompleted, setVideoCompleted] = useState(false);

  useEffect(() => {
    if (!joined || !room) return;

    const code = room.toUpperCase();

    // Initial check
    supabase.from('rooms').select('*').eq('id', code).single().then(res => {
      if (res.data) setSession(res.data);
    });

    const roomSub = supabase.channel(`student-chan-${code}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${code}` }, s => {
        if (s.eventType === 'DELETE') {
          setSession(null);
          setQuizEnded(true);
        } else {
          setSession(s.new);
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(roomSub);
    };
  }, [joined, room]);

  // Restore answers & question index when rejoining via cached localStorage state
  useEffect(() => {
    if (!joined || !session || !sid) return;
    if (!session.is_async) return;
    const code = room.toUpperCase();
    const respId = `${code}_${sid}`;
    supabase.from('responses').select('answers, current_idx').eq('id', respId).single().then(({ data }) => {
      if (data?.answers && Object.keys(data.answers).length > 0 && Object.keys(answers).length === 0) {
        setAnswers(data.answers);
      }
      if (data?.current_idx !== undefined && data?.current_idx !== null) {
        setIdx(data.current_idx);
      }
    });
  }, [joined, session, sid]);

  // Save progress helper (used by submit, auto-save, and timer expiry)
  const saveProgress = useCallback(async (currentAnswers, currentIdx) => {
    const respId = `${room.toUpperCase()}_${sid || localId}`;
    try {
      await supabase.from('responses').upsert({
        id: respId,
        room_code: room.toUpperCase(),
        student_name: name,
        student_id: sid,
        answers: currentAnswers,
        current_idx: currentIdx,
        ts: Date.now()
      });
    } catch { 
      // Network ignore
    }
  }, [room, sid, localId, name]);

  const submit = async (qIdx, ans) => {
    const next = { ...answers, [qIdx]: ans };
    setAnswers(next);
    await saveProgress(next, idx);
  };

  const handleNext = () => setIdx(p => Math.min(p + 1, total));
  const handlePrev = () => setIdx(p => Math.max(p - 1, 0));

  // Auto-sync Student idx with Teacher in Teacher-Paced mode
  useEffect(() => {
    if (session && session.type === 'teacher_paced' && session.quiz?.current_question_idx !== undefined) {
      setIdx(session.quiz.current_question_idx);
    }
  }, [session]);

  // === PER-QUESTION COUNTDOWN TIMER for async standard quizzes ===
  const total = session?.quiz?.questions?.length || 1;
  const questionTimerStartRef = useRef(null);
  
  // Use a ref for answers so the highly volatile `answers` state doesn't reset the timer interval every keystroke:
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    if (!session || !session.timer_duration) {
      setQuestionTimeLeft(null);
      return;
    }
    if (idx >= total) return; // finished
    // Reset timer for this question
    const duration = session.timer_duration; // seconds
    questionTimerStartRef.current = Date.now();
    setQuestionTimeLeft(duration);
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - questionTimerStartRef.current) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setQuestionTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        // Auto-save current answer and advance
        saveProgress(answersRef.current, idx + 1).then(() => {
          if (idx + 1 >= total) {
            setIdx(total); // trigger finished screen
          } else {
            setIdx(prev => prev + 1);
          }
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session, idx, total, saveProgress]);

  // === AUTO-SAVE on tab switch / browser hide ===
  useEffect(() => {
    if (!joined || !session) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress(answers, idx);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [joined, session, answers, idx]);

  const attemptJoin = async (e) => {
    e.preventDefault();
    setCheckingId(true);
    setIdError('');

    const code = room.toUpperCase();
    const { data: roomData } = await supabase.from('rooms').select('*').eq('id', code).single();

    if (!roomData) {
      setIdError("Room not found.");
      setCheckingId(false);
      return;
    }

    if (roomData.type === 'feedback') {
      setSid(`anon_${localId}`);
      setName('Anonymous Student');
      setTempSession(roomData);
      setJoined(true);
      setCheckingId(false);
      return;
    }

    // --- Async Pause/Time Check ---
    if (roomData.is_async && roomData.type !== 'attendance') {
      if (roomData.is_paused) {
        setIdError("This activity has been paused by the teacher.");
        setCheckingId(false);
        return;
      }
      const now = Date.now();
      const start = new Date(roomData.start_time).getTime();
      const end = new Date(roomData.end_time).getTime();
      const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (now < start) {
        setIdError(`This quiz is not yet available. It starts at ${new Date(roomData.start_time).toLocaleString()} (${tzName}).`);
        setCheckingId(false);
        return;
      }
      if (now > end) {
        setIdError(`This quiz has ended. It closed at ${new Date(roomData.end_time).toLocaleString()} (${tzName}).`);
        setCheckingId(false);
        return;
      }
    }

    if (roomData.type === 'attendance') {
      if (!sid.trim()) {
        setIdError("Student ID is required for Attendance.");
        setCheckingId(false);
        return;
      }

      // 1. Server-Side Validate Token
      // The teacher's screen rotates the token every 10s and pushes it to roomData.quiz.current_token
      try {
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        const serverTokenStr = roomData.quiz?.current_token;

        if (!serverTokenStr || !urlToken) {
          setIdError("Invalid QR Code link. Missing security token.");
          setCheckingId(false);
          return;
        }

        const serverToken = parseInt(serverTokenStr, 10);
        const clientToken = parseInt(urlToken, 10);

        // Allow the currently active server token, OR one that is within the previous 10-15s window (to handle transit padding)
        // If the client token is entirely out of bounds from what the server is broadcasting right now, reject it.
        if (isNaN(clientToken) || isNaN(serverToken) || clientToken > serverToken + 5000 || clientToken < serverToken - 15000) {
           setIdError("Expired QR Code. Please look at the screen and scan the active QR code.");
           setCheckingId(false);
           return;
        }
      } catch {
        // Validation skipped due to missing token
      }

      // 2. Anti-Fraud Device Lock
      // Generate a simple fingerprint (userAgent + language + screen resolution + a localStorage persistent id)
      let deviceId = localStorage.getItem('ClassLabX_DeviceID');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('ClassLabX_DeviceID', deviceId);
      }
      const fingerprint = `${deviceId}_${navigator.userAgent}_${navigator.language}_${window.screen.width}x${window.screen.height}`;

      // Check if this fingerprint already voted in this room
      const { data: existingVotes } = await supabase.from('responses')
        .select('*')
        .eq('room_code', code)
        .like('id', `%|${fingerprint}`); // we will store it like ROOM_SID|fingerprint

      if (existingVotes && existingVotes.length > 0) {
        // Did they already vote with THIS exact sid on THIS device? That's fine, maybe they refreshed.
        const votedWithThisSid = existingVotes.find(v => v.student_id === sid.trim());
        if (!votedWithThisSid) {
           // They voted with another SID on this device
           setIdError("Anti-Fraud Alert: Only one attendance entry allowed per device.");
           setCheckingId(false);
           return;
        }
      }

      // Check student in database
      const assigned = roomData.quiz?.assigned_classes;
      let stuQuery = supabase.from('students').select('*').eq('student_id', sid.trim());
      
      if (assigned && assigned.length > 0) {
        stuQuery = stuQuery.in('class_id', assigned);
      }
      
      const { data: stuData } = await stuQuery;

      if (!stuData || stuData.length === 0) {
        setIdError(assigned && assigned.length > 0 ? "ID not found in assigned classes." : "Student ID not found in database.");
        setCheckingId(false);
        return;
      }
      
      // Ask for confirmation
      const stuName = stuData[0].name;
      setName(stuName);
      setTempSession(roomData);
      setNeedsConfirmation(true);
      setCheckingId(false);
      return;
    }

    const assigned = roomData.quiz?.assigned_classes;
    
    if (!sid.trim()) {
      setIdError("Student ID is required.");
      setCheckingId(false);
      return;
    }

    let stuQuery = supabase.from('students').select('*').eq('student_id', sid.trim());
    if (assigned && assigned.length > 0) {
      stuQuery = stuQuery.in('class_id', assigned);
    }

    const { data: stuData } = await stuQuery;

    if (!stuData || stuData.length === 0) {
      setIdError(assigned && assigned.length > 0 ? "ID not found in assigned classes." : "Student ID not found in database.");
      setCheckingId(false);
      return;
    }

    // Found the student - ask for confirmation
    setName(stuData[0].name);
    setTempSession(roomData);
    setNeedsConfirmation(true);
    setCheckingId(false);
  };

  const confirmJoin = async () => {
    if (tempSession?.type === 'feedback') {
        setJoined(true);
        setNeedsConfirmation(false);
        return;
    }

    if (tempSession?.type === 'attendance') {
        const code = tempSession.id;
        let deviceId = localStorage.getItem('ClassLabX_DeviceID');
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('ClassLabX_DeviceID', deviceId);
        }
        const fingerprint = `${deviceId}_${navigator.userAgent}_${navigator.language}_${window.screen.width}x${window.screen.height}`;
        const respId = `${code}_${sid.trim()}|${fingerprint}`;
        
        await supabase.from('responses').upsert({
          id: respId,
          room_code: code,
          student_name: name.trim(),
          student_id: sid.trim(),
          answers: {},
          ts: Date.now()
        });

        setNeedsConfirmation(false);
        setAttendanceSuccess(true);
        return;
    }

    // If it's an async room, fetch previous responses to allow resuming
    if (tempSession?.is_async && sid) {
      const code = tempSession.id;
      const respId = `${code}_${sid}`;
      const { data: prevResp } = await supabase.from('responses').select('answers, current_idx').eq('id', respId).single();
      if (prevResp && prevResp.answers) {
        setAnswers(prevResp.answers);
      }
      // Restore question index so student resumes where they left off
      if (prevResp?.current_idx !== undefined && prevResp?.current_idx !== null) {
        setIdx(prevResp.current_idx);
      }
    }
    setNeedsConfirmation(false);
    setJoined(true);
  };

  if (!joined) {
    if (needsConfirmation) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-slate-100 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <UserCheck size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Is this you?</h2>
            <p className="text-slate-500 font-bold mt-4 text-xl bg-slate-50 py-3 rounded-2xl border border-slate-100">{name}</p>
            <div className="mt-8 space-y-3">
              <button onClick={confirmJoin} className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-green-100 transition-all active:scale-95">Yes, {tempSession?.type === 'attendance' ? 'Confirm Attendance' : 'Start Quiz'}</button>
              <button onClick={() => setNeedsConfirmation(false)} className="w-full bg-white hover:bg-slate-50 text-slate-400 py-4 rounded-[2rem] font-black tracking-widest uppercase transition-colors">No, go back</button>
            </div>
          </div>
        </div>
      );
    }

    if (attendanceSuccess) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center animate-in zoom-in duration-300">
          <div className="bg-white p-12 md:p-16 flex flex-col items-center rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-slate-100 relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-green-50 to-transparent"></div>
             <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 relative z-10 shadow-inner">
               <CheckCircle size={48} />
             </div>
             <h2 className="text-4xl font-black text-slate-800 tracking-tighter relative z-10 mb-2">Present!</h2>
             <p className="text-slate-500 font-bold mb-8 relative z-10">Your attendance has been recorded. You may close this page.</p>
             <button onClick={clearStudentSession} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest transition-colors relative z-10">Done</button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <form onSubmit={attemptJoin} className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-sm border border-slate-100 relative">
          <div className="text-center mb-10">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative ${roomType === 'feedback' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
              {roomType === 'feedback' ? <BarChart2 size={40} /> : <Users size={40} />}
              {roomType !== 'feedback' && <Fingerprint size={16} className="absolute bottom-4 right-4 text-orange-400" />}
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Student Entry</h2>
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2 px-2 text-center break-words">{idError ? <span className="text-red-500 flex items-center justify-center gap-1"><AlertCircle size={12} className="shrink-0" /> {idError}</span> : "Enter details below"}</p>
          </div>
          <div className="space-y-4">
            <div>
              <input
                className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center text-xl font-black uppercase tracking-[0.2em] text-blue-600 focus:outline-none focus:border-blue-200 transition-all placeholder:text-blue-200"
                placeholder="ROOM CODE" value={room} onChange={e => setRoom(e.target.value.toUpperCase())} required
              />
            </div>
            {roomType !== 'feedback' && (
              <>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="w-full sm:flex-1 p-5 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-bold text-slate-700 focus:outline-none focus:border-orange-200 transition-all text-sm placeholder:text-slate-300 text-center uppercase tracking-[0.2em]"
                    placeholder="STUDENT ID" value={sid} onChange={e => setSid(e.target.value)}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 text-center px-4 leading-relaxed">
                  Please enter your exact Student ID number to access this activity.
                </p>
              </>
            )}
            {roomType === 'feedback' && (
              <p className="text-[10px] font-bold text-purple-400 text-center px-4 leading-relaxed bg-purple-50 py-3 rounded-2xl border border-purple-100">
                This is an anonymous feedback session. No Student ID is required to join.
              </p>
            )}
            <button type="submit" disabled={checkingId} className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl mt-2 transition-transform active:scale-95 flex justify-center items-center text-white ${roomType === 'feedback' ? 'bg-purple-600 shadow-purple-100' : 'bg-orange-500 shadow-orange-100'}`}>
              {checkingId ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : (roomType === 'feedback' ? 'JOIN ANONYMOUSLY' : 'ENTER ROOM')}
            </button>
          </div>
          <button type="button" onClick={clearStudentSession} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </form>
      </div>
    );
  }

  const isFinished = (session?.type === 'student_paced' || session?.type === 'async_quiz' || session?.type === 'async_video' || session?.type === 'feedback') ?
    (session?.quiz?.type === 'video' ? idx >= total : idx >= total) : false;

  if (quizEnded || isFinished) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="bg-white p-12 md:p-16 flex flex-col items-center rounded-[3.5rem] shadow-2xl w-full max-w-md border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-green-50 to-transparent"></div>
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 relative z-10 shadow-inner">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tighter relative z-10">Thank You!</h2>
        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-10 relative z-10 px-4">
          Your answers have been securely synced to the cloud. You are all set and may safely close this page.
        </p>
        <button onClick={() => setRole(null)} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[2rem] font-black tracking-widest uppercase transition-colors relative z-10 text-sm shadow-sm">
          Return Home
        </button>
      </div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
      <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-10 shadow-[0_0_30px_rgba(59,130,246,0.3)]"></div>
      <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Synchronizing...</h2>
      <p className="text-blue-200/50 max-w-xs font-bold uppercase text-[10px] tracking-widest">Connected to Cloud Room {room}. Activity pending teacher launch.</p>
    </div>
  );

  const q = session.quiz.questions[idx];
  // Calculate progress purely on answered questions
  const progress = (Object.keys(answers).length / total) * 100;

  // Lock editing if teacher is showing results
  const isLocked = session.type === 'teacher_paced' && session.quiz?.show_results;

  if (session.type === 'feedback') {
    return <FeedbackSurvey session={session} answers={answers} submit={submit} onFinish={() => setIdx(total)} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col ${session.quiz.type === 'video' ? 'lg:flex-row lg:h-screen lg:overflow-hidden' : ''}`}>
      {session.quiz.type !== 'video' && (
        <header className="bg-white border-b p-6 flex justify-between items-center sticky top-0 z-10 shadow-sm print:hidden">
          <div className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Item {idx + 1} / {total}</div>
          <div className="flex items-center gap-3">
            <div className="font-black text-slate-800 text-xl truncate px-6 italic tracking-tighter">{session.quiz.title}</div>
            {questionTimeLeft !== null && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm tracking-wider shrink-0 ${
                questionTimeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : questionTimeLeft <= 30 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
              }`}>
                <Clock size={14} />
                {questionTimeLeft}s
              </div>
            )}
          </div>
          <div className="bg-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">ID: {sid}</div>
        </header>
      )}
      {session.quiz.type !== 'video' && (
        <div className="h-3 w-full bg-slate-50">
          <div className="h-full bg-orange-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(249,115,22,0.5)]" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      {session.quiz.type === 'video' && (
        <div className="w-full flex flex-col sticky top-0 z-20 shadow-2xl shrink-0 lg:w-2/3 lg:h-full bg-black">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <div className="font-black text-white text-lg truncate pr-4">{session.quiz.title}</div>
            <div className="bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 uppercase shrink-0">ID: {sid || 'OPEN'}</div>
          </div>
          <div className="w-full aspect-video lg:aspect-auto lg:flex-1 relative">
            <ReactPlayer
              ref={playerRef}
              url={session.quiz.video_url}
              playing={videoPlaying}
              controls={!session.prevent_skipping}
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              onReady={() => {
                if (playerRef.current) setVideoDuration(playerRef.current.getDuration());
              }}
              onStart={() => {
                if (videoInitializing) {
                  playerRef.current?.seekTo(0);
                  setVideoPlaying(true);
                  setVideoInitializing(false);
                }
              }}
              onProgress={(state) => {
                const currentSec = state.playedSeconds;
                setPlayedSeconds(currentSec);
                if (currentSec > maxPlayed) setMaxPlayed(currentSec);
              }}
              onPlay={() => setVideoPlaying(true)}
              onPause={() => setVideoPlaying(false)}
              onEnded={() => setVideoCompleted(true)}
            />
          </div>
          {session.prevent_skipping && (
            <div className="bg-slate-900 p-4 border-t border-slate-800 flex flex-col items-center">
              <div className="w-full max-w-lg mb-2 flex items-center gap-4">
                <button onClick={() => setVideoPlaying(!videoPlaying)} className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                  {videoPlaying ? <span className="font-black text-xs">||</span> : <Play size={16} fill="currentColor" />}
                </button>
                <div
                  className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative cursor-pointer"
                  onClick={(e) => {
                    // Allow seeking backward only (up to maxPlayed)
                    const rect = e.currentTarget.getBoundingClientRect();
                    const fraction = (e.clientX - rect.left) / rect.width;
                    const dur = videoDuration || 1;
                    const seekTo = fraction * dur;
                    if (seekTo <= maxPlayed) {
                      playerRef.current?.seekTo(seekTo);
                      setPlayedSeconds(seekTo);
                    }
                  }}
                >
                  <div className="h-full bg-slate-600 absolute left-0 top-0" style={{ width: `${(maxPlayed / (videoDuration || 1)) * 100}%` }}></div>
                  <div className="h-full bg-blue-500 absolute left-0 top-0 transition-all" style={{ width: `${(playedSeconds / (videoDuration || 1)) * 100}%` }}></div>
                </div>
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center">You can seek backward but not forward.{!videoCompleted && ' Complete the video to submit.'}</p>
            </div>
          )}
        </div>
      )}

      <main className={`flex-1 p-8 w-full ${session.quiz.type === 'video' ? 'lg:w-1/3 lg:h-full lg:overflow-y-auto custom-scroll bg-slate-50 border-l border-slate-200' : 'max-w-2xl mx-auto pt-10 pb-32 bg-white'}`}>
        {session.type === 'teacher_paced' && (
          <div className="flex items-center justify-center gap-2 mb-8 bg-purple-50 text-purple-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest w-fit mx-auto">
            <Activity size={14} /> Teacher Paced Mode Focus
          </div>
        )}

        {session.quiz.type === 'video' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Question {idx + 1} / {total}</div>
              <div className="h-2 flex-1 mx-4 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 transition-all duration-500" style={{ width: `${(Object.keys(answers).length / total) * 100}%` }}></div>
              </div>
              <div className="text-[10px] font-black text-orange-500">{Object.keys(answers).length}/{total} answered</div>
            </div>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className={`text-3xl font-black text-slate-800 ${q?.image_url ? 'mb-6' : 'mb-12'} leading-tight tracking-tight`}>{q?.text}</h2>
          {q?.image_url && <img src={q.image_url} alt="Question content" className="w-full max-h-72 object-contain rounded-[2rem] border border-slate-100 shadow-sm mb-12 bg-slate-50 p-4" />}
          <div className="space-y-5">
            {(q?.type === 'mc' || q?.type === 'tf') && q.options.map((o, i) => {
              if (!o || !String(o).trim()) return null;
              const isSelected = answers[idx] === i;
              let bgColorInfo = '';

              if (isLocked) {
                if (q.correct === i) {
                  bgColorInfo = 'border-green-500 bg-green-50 text-green-900 shadow-green-500/20';
                } else if (isSelected) {
                  bgColorInfo = 'border-red-400 bg-red-50 text-red-900 shadow-red-500/20 opacity-70';
                } else {
                  bgColorInfo = 'border-slate-100 bg-slate-50 text-slate-400 opacity-50';
                }
              } else {
                bgColorInfo = isSelected ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-orange-500/20' : 'border-slate-50 hover:border-orange-500 hover:bg-orange-50 text-slate-700';
              }

              return (
                <button
                  key={i}
                  onClick={() => !isLocked && submit(idx, i)}
                  disabled={isLocked}
                  className={`w-full text-left bg-white p-7 rounded-[2.5rem] border-4 transition-all font-black text-xl shadow-sm flex items-center gap-6 group ${bgColorInfo} ${isLocked ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs shrink-0 font-black transition-colors uppercase ${isLocked && q.correct === i ? 'bg-green-600 text-white' : (isSelected && !isLocked ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-600 group-hover:text-white')}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {o}
                  {isLocked && q.correct === i && <CheckCircle className="ml-auto text-green-500" size={24} />}
                  {isLocked && isSelected && q.correct !== i && <XCircle className="ml-auto text-red-400" size={24} />}
                </button>
              );
            })}
            {q?.type === 'sa' && (
              <div className="space-y-6">
                <textarea
                  id="sa-box"
                  value={answers[idx] || ''}
                  onChange={(e) => submit(idx, e.target.value)}
                  disabled={isLocked}
                  className={`w-full border-4 rounded-[2.5rem] p-8 text-2xl font-bold focus:outline-none shadow-inner min-h-[220px] transition-all ${isLocked ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-100 focus:border-orange-500 focus:bg-white text-slate-800'}`}
                  placeholder={isLocked ? "Editing locked by teacher" : "Start typing your answer here... It saves automatically!"}
                />
                {isLocked && q.correct && (
                  <div className="p-6 bg-green-50 rounded-[2rem] border-2 border-green-200 text-green-800 font-bold">
                    <div className="text-[10px] uppercase tracking-widest text-green-600 mb-1">Correct Answer:</div>
                    {q.correct}
                  </div>
                )}
              </div>
            )}
          </div>

           {/* Video Quiz Navigation: Prev / Next / Finish */}
          {session.quiz.type === 'video' && (() => {
            const allAnswered = Object.keys(answers).length >= total;
            const watchedPct = videoDuration > 0 ? Math.round((maxPlayed / videoDuration) * 100) : 0;
            const canSubmit = allAnswered && (session.prevent_skipping ? videoCompleted : watchedPct >= 50);
            return (
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={idx <= 0}
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} /> Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={idx >= total - 1}
                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    Next <ArrowRight size={18} />
                  </button>
                </div>
                
                {idx === total - 1 && (
                  <button
                    onClick={() => setIdx(total)} // Set idx equal to total to trigger finish screen
                    disabled={!canSubmit}
                    className="w-full py-5 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                    title={!canSubmit ? (session.prevent_skipping ? 'Finish watching the video first' : `Watch at least 50% of the video (${watchedPct}% watched)`) : ''}
                  >
                    Finish & Submit {!canSubmit && <span className="text-xs font-bold opacity-70">({session.prevent_skipping ? 'finish video' : `${watchedPct}%/50%`})</span>} <CheckCircle size={18} />
                  </button>
                )}
              </div>
            );
          })()}

          {/* Non-video quiz Navigation */}
          {(session.type === 'student_paced' || session.type === 'async_quiz' || session.type === 'async_video') && session.quiz.type !== 'video' && (
            <div className="mt-12 space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={idx <= 0}
                  className="w-1/3 py-5 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-600 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <ArrowLeft size={20} /> Prev
                </button>
                <button
                  onClick={handleNext}
                  disabled={idx >= total - 1}
                  className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3"
                >
                  Next <ArrowRight size={20} />
                </button>
              </div>

              {idx === total - 1 && (
                <button
                  onClick={() => setIdx(total)} // Map to the "finished" state
                  disabled={Object.keys(answers).length < total} // Simple validation for completion
                  className="w-full py-5 bg-green-500 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xl shadow-xl shadow-green-100 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest mt-4"
                >
                  Finish & Submit <CheckCircle size={20} />
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ==========================================
//               CLASSES & ROSTERS
// ==========================================
function ClassesTab({ classes, setClasses, user }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  if (isCreating) {
    return <CreateClassView user={user} onCancel={() => setIsCreating(false)} onSaved={(newClass) => {
      setClasses([newClass, ...classes]);
      setIsCreating(false);
    }} />;
  }

  if (selectedClass) {
    return <ClassDetailView
      cls={classes.find(c => c.id === selectedClass) || selectedClass}
      onBack={() => setSelectedClass(null)}
      onUpdate={(updated) => {
        setClasses(classes.map(c => c.id === updated.id ? updated : c));
        setSelectedClass(updated);
      }}
      onDeleted={(id) => {
        setClasses(classes.filter(c => c.id !== id));
        setSelectedClass(null);
      }}
    />;
  }

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-8 border-b flex justify-between items-center bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Student Classes</h2>
          <p className="text-slate-400 font-bold mt-1">Manage classes and verified rosters</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="relative z-10 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-blue-100 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
          <Plus size={18} /> New Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-slate-50/50 min-h-[400px]">
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClass(c.id)}
            className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 hover:shadow-xl transition-all text-left flex flex-col group relative overflow-hidden h-48"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 group-hover:bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-colors z-0"></div>
            <div className="relative z-10 flex-1">
              <h3 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors mb-2 pr-10">{c.name}</h3>
              <p className="text-xs font-bold text-slate-400">{new Date(c.created_at).toLocaleDateString()}</p>
            </div>
            <div className="relative z-10 flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
              <div className="flex items-center gap-2 text-slate-500 font-black">
                <Users size={16} />
                <span>{(c.students || []).length} Students</span>
              </div>
              <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500 transition-colors transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
        {classes.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-center p-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
            <Users size={48} className="text-slate-200 mb-4" />
            <p className="font-black text-xl mb-2 text-slate-600">No Classes Found</p>
            <p className="font-bold text-sm">Create a new class to restrict quiz access to specific students.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateClassView({ user, onCancel, onSaved }) {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState([]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    // Preview the Excel file
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        // Find ID and Name columns
        if (data.length > 0) {
          const headers = data[0].map(h => String(h).toLowerCase().trim());
          let idIdx = headers.findIndex(h => h.includes('id') || h === 'student id');
          let nameIdx = headers.findIndex(h => h.includes('name') || h === 'student name');
          let emailIdx = headers.findIndex(h => h.includes('email') || h === 'student email');

          if (idIdx === -1) idIdx = 0; // fallback to col 1
          if (nameIdx === -1) nameIdx = 1; // fallback to col 2
          if (emailIdx === -1) emailIdx = 2; // fallback to col 3

          const parsedStudents = [];
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row[idIdx] && String(row[idIdx]).trim() !== '') {
              parsedStudents.push({
                student_id: String(row[idIdx]).trim(),
                name: row[nameIdx] ? String(row[nameIdx]).trim() : 'Unknown',
                email: row[emailIdx] ? String(row[emailIdx]).trim() : ''
              });
            }
          }
          setPreview(parsedStudents.filter(s => s.student_id));
        }
      } catch {
        setError("Failed to parse Excel file. Make sure it has ID and Name columns.");
      }
    };
    reader.readAsBinaryString(f);
  };

  const downloadRosterTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['ID', 'Name', 'Email'],
      ['1001', 'Alice Smith', 'alice@school.edu'],
      ['1002', 'Bob Johnson', 'bob@school.edu']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roster_Template");
    XLSX.writeFile(wb, "ClassLabX_Roster_Template.xlsx");
  };

  const submit = async () => {
    if (!name.trim()) return setError("Class Name is required");
    setUploading(true);
    setError('');

    try {
      // Create Class
      const { data: newClass, error: classErr } = await supabase.from('classes')
        .insert({ user_id: user.id, name })
        .select()
        .single();

      if (classErr) throw classErr;

      // Insert Students if uploaded
      if (preview.length > 0) {
        const studentsToInsert = preview.map(s => ({
          class_id: newClass.id,
          student_id: s.student_id,
          name: s.name,
          email: s.email
        }));

        const { data: insertedStudents, error: stuErr } = await supabase.from('students').insert(studentsToInsert).select();
        if (stuErr) throw stuErr;
        newClass.students = insertedStudents;
      } else {
        newClass.students = [];
      }

      onSaved(newClass);
    } catch (e) {
      setError(e.message);
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
        <h2 className="text-2xl font-black text-slate-800">Create New Class</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
      </div>

      <div className="p-8 space-y-8 max-w-2xl">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center gap-2"><AlertCircle size={18} />{error}</div>}

        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block tracking-widest">Class Name <span className="text-red-500">*</span></label>
          <input
            className="w-full text-2xl font-black text-slate-800 border-b-4 border-slate-100 focus:border-blue-600 focus:outline-none transition-all pb-2 bg-transparent"
            placeholder="e.g. Fall 2026 Biology" value={name} onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <label className="text-[10px] font-black uppercase text-slate-400 mb-4 block tracking-widest">Initial Roster (Optional Excel/CSV)</label>

          {!file ? (
            <div className="space-y-4">
              <label className="w-full border-4 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-blue-300 transition-all group">
                <UploadCloud size={48} className="text-slate-300 mb-4 group-hover:text-blue-500 transition-colors" />
                <span className="text-lg font-black text-slate-600 mb-1">Click to browse Excel/CSV files</span>
                <span className="text-xs font-bold text-slate-400">Must contain 'ID' and 'Name' columns</span>
                <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleFile} />
              </label>
              <div className="text-center">
                <button onClick={downloadRosterTemplate} className="text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors uppercase tracking-widest inline-flex items-center gap-2"><Download size={14} /> Download Template</button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 mb-4">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500" size={24} />
                  <div>
                    <div className="font-black text-slate-700">{file.name}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">{preview.length} Valid Students Found</div>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setPreview([]); }} className="text-red-400 hover:bg-red-50 p-2 rounded-xl transition-colors"><Trash2 size={18} /></button>
              </div>

              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2">
                {preview.map((s, i) => (
                  <div key={i} className="flex flex-col md:flex-row justify-between bg-white p-3 rounded-xl border border-slate-100 font-bold text-sm text-slate-600 gap-2">
                    <span className="truncate">{s.name}</span>
                    <div className="flex gap-4 opacity-70">
                      {s.email && <span className="text-xs truncate">{s.email}</span>}
                      <span className="font-mono text-xs">{s.student_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 flex justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-3 font-black text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">Discard</button>
          <button disabled={uploading || !name.trim()} onClick={submit} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
            {uploading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle size={18} />}
            Save Class
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassDetailView({ cls, onUpdate, onBack, onDeleted }) {
  const [students, setStudents] = useState(cls.students || []);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Temporary state for inline edit
  const [editName, setEditName] = useState('');
  const [editSid, setEditSid] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const appendFromExcel = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length > 0) {
          const headers = data[0].map(h => String(h).toLowerCase().trim());
          let idIdx = headers.findIndex(h => h.includes('id') || h === 'student id');
          let nameIdx = headers.findIndex(h => h.includes('name') || h === 'student name');
          let emailIdx = headers.findIndex(h => h.includes('email') || h === 'student email');
          if (idIdx === -1) idIdx = 0;
          if (nameIdx === -1) nameIdx = 1;
          if (emailIdx === -1) emailIdx = 2;

          const existingIds = new Set(students.map(s => String(s.student_id).toLowerCase().trim()));
          const existingEmails = new Set(students.map(s => String(s.email).toLowerCase().trim()).filter(Boolean));
          let duplicatesSkipped = 0;

          const parsedStudents = [];
          for (let i = 1; i < data.length; i++) {
            const row = data[i];
            const sid = row[idIdx] ? String(row[idIdx]).trim() : '';
            const semail = row[emailIdx] ? String(row[emailIdx]).trim() : '';
            const sname = row[nameIdx] ? String(row[nameIdx]).trim() : 'Unknown';

            if (sid !== '') {
              const sidLower = sid.toLowerCase();
              const semailLower = semail.toLowerCase();

              if (existingIds.has(sidLower) || (semailLower && existingEmails.has(semailLower))) {
                duplicatesSkipped++;
                continue;
              }

              existingIds.add(sidLower);
              if (semailLower) existingEmails.add(semailLower);

              parsedStudents.push({
                class_id: cls.id,
                student_id: sid,
                name: sname,
                email: semail
              });
            }
          }

          if (duplicatesSkipped > 0) {
            alert(`Skipped ${duplicatesSkipped} student(s) from the import because their Student ID or Email already exists in this class.`);
          }

          if (parsedStudents.length > 0) {
            const { data: inserted, error } = await supabase.from('students').insert(parsedStudents).select();
            if (error) throw error;
            const nextStudents = [...students, ...inserted];
            setStudents(nextStudents);
            onUpdate({ ...cls, students: nextStudents });
          }
        }
      } catch (err) {
        alert("Failed to append: " + err.message);
      }
      setLoading(false);
      e.target.value = null; // reset input
    };
    reader.readAsBinaryString(f);
  };

  const downloadRosterTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['ID', 'Name', 'Email'],
      ['1001', 'Alice Smith', 'alice@school.edu'],
      ['1002', 'Bob Johnson', 'bob@school.edu']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Roster_Template");
    XLSX.writeFile(wb, "ClassLabX_Roster_Template.xlsx");
  };

  const addSingleStudent = async () => {
    setLoading(true);
    const newId = `ID-${Math.floor(Math.random() * 1000)}`;
    const newStudent = { class_id: cls.id, student_id: newId, name: 'New Student', email: '' };

    const { data, error } = await supabase.from('students').insert([newStudent]).select().single();
    setLoading(false);
    if (error) return alert("Failed to add: " + error.message);

    const nextStudents = [data, ...students];
    setStudents(nextStudents);
    onUpdate({ ...cls, students: nextStudents });
    startEdit(data);
  };

  const deleteStudent = async (id) => {
    if (!window.confirm("Remove this student?")) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) return alert("Failed to delete: " + error.message);

    const nextStudents = students.filter(s => s.id !== id);
    setStudents(nextStudents);
    onUpdate({ ...cls, students: nextStudents });
  };

  const clearRoster = async () => {
    if (!window.confirm("ARE YOU SURE? This removes all students from this class.")) return;
    setLoading(true);
    const { error } = await supabase.from('students').delete().eq('class_id', cls.id);
    setLoading(false);
    if (error) return alert("Failed to clear: " + error.message);

    setStudents([]);
    onUpdate({ ...cls, students: [] });
  };

  const triggerDeleteClass = async () => {
    if (!window.confirm("Delete entire class and its roster? This action is permanent!")) return;
    setLoading(true);
    const { error } = await supabase.from('classes').delete().eq('id', cls.id);
    setLoading(false);
    if (error) alert("Failed to delete class: " + error.message);
    else onDeleted(cls.id);
  };

  const startEdit = (s) => {
    setEditingId(s.id);
    setEditName(s.name);
    setEditSid(s.student_id);
    setEditEmail(s.email || '');
  };

  const saveEdit = async (s) => {
    if (!editName.trim() || !editSid.trim()) return alert("Name and ID cannot be empty.");

    // Uniqueness Checks
    const isDuplicateId = students.find(x => x.id !== s.id && String(x.student_id).toLowerCase().trim() === editSid.toLowerCase().trim());
    if (isDuplicateId) return alert("Error: That Student ID is already used by another student in this class.");

    if (editEmail.trim()) {
      const isDuplicateEmail = students.find(x => x.id !== s.id && x.email && String(x.email).toLowerCase().trim() === editEmail.toLowerCase().trim());
      if (isDuplicateEmail) return alert("Error: That Email is already used by another student in this class.");
    }

    const { error } = await supabase.from('students').update({ name: editName, student_id: editSid, email: editEmail }).eq('id', s.id);
    if (error) return alert("Failed to save: " + error.message);

    const nextStudents = students.map(x => x.id === s.id ? { ...x, name: editName, student_id: editSid, email: editEmail } : x);
    setStudents(nextStudents);
    onUpdate({ ...cls, students: nextStudents });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden animate-in slide-in-from-right-8 duration-300">
      <div className="p-8 border-b bg-slate-50 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-3 bg-white hover:bg-slate-100 rounded-2xl shadow-sm transition-colors text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{cls.name}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{students.length} Registered Students</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={triggerDeleteClass} className="px-5 py-2.5 bg-white border-2 border-slate-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-xl font-black text-sm transition-all flex items-center gap-2">
            <Trash2 size={16} /> Delete Class
          </button>
        </div>
      </div>

      <div className="p-8 bg-slate-50/30 flex justify-between items-center border-b border-slate-100 flex-wrap gap-4">
        <div className="flex gap-3">
          <button onClick={addSingleStudent} disabled={loading} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-sm transition-all shadow-md shadow-blue-100 flex items-center gap-2">
            <Plus size={16} /> Add 1 Student
          </button>
          <label className="px-6 py-3 bg-white border-2 border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded-xl font-black text-sm transition-all cursor-pointer flex items-center gap-2">
            <Upload size={16} /> Append CSV/Excel
            <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={appendFromExcel} disabled={loading} />
          </label>
          <button onClick={downloadRosterTemplate} disabled={loading} className="px-6 py-3 bg-slate-50 text-blue-600 hover:bg-blue-100 rounded-xl font-black text-sm transition-all flex items-center gap-2">
            <Download size={14} /> Template
          </button>
        </div>
        {students.length > 0 && (
          <button onClick={clearRoster} disabled={loading} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest flex items-center gap-1">
            <Trash2 size={14} /> Clear Roster
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto no-scrollbar">
        {students.map((s, idx) => {
          const isEditing = editingId === s.id;

          return (
            <div key={s.id} className={`p-6 flex items-center justify-between transition-colors ${isEditing ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
              {isEditing ? (
                <div className="flex-1 flex flex-col md:flex-row gap-4 mr-6">
                  <input className="flex-[2] p-3 text-sm font-bold bg-white border-2 border-blue-200 rounded-lg focus:outline-none" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full Name" />
                  <input className="flex-1 p-3 text-sm font-bold bg-white border-2 border-blue-200 rounded-lg focus:outline-none font-mono" value={editSid} onChange={e => setEditSid(e.target.value)} placeholder="Student ID" />
                  <input className="flex-[2] p-3 text-sm font-bold bg-white border-2 border-blue-200 rounded-lg focus:outline-none" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email (optional)" />
                </div>
              ) : (
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xs font-black shrink-0">{idx + 1}</div>
                    <div>
                      <div className="text-slate-800 font-bold">{s.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-slate-400 text-xs font-mono w-fit bg-slate-100 px-2 py-0.5 rounded">{s.student_id}</div>
                        {s.email && <div className="text-slate-400 text-[10px] truncate max-w-[150px] ml-2">{s.email}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button onClick={() => setEditingId(null)} className="px-4 py-2 text-xs font-black text-slate-400 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => saveEdit(s)} className="px-4 py-2 text-xs font-black bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition-colors">Save</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(s)} className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                    <button onClick={() => deleteStudent(s.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><X size={18} /></button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {students.length === 0 && (
          <div className="p-20 text-center text-slate-400 font-bold italic">
            Roster is empty. Add students manually or upload an Excel file.
          </div>
        )}
      </div>
    </div>
  );
}
