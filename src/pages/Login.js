import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Wallet, ShieldCheck, Zap, Globe, ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
            navigate('/');
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex font-sans overflow-hidden">
            {/* Left Side: Illustration & Branding (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 bg-stone-50 relative flex-col items-center justify-center p-12 overflow-hidden border-r border-stone-100">
                <div className="absolute top-12 left-12 flex items-center gap-2">
                    <div className="bg-stone-900 p-2 rounded-lg">
                        <Wallet className="text-white w-5 h-5" />
                    </div>
                    <span className="font-black text-stone-900 uppercase tracking-tighter text-lg">MyExpense Log</span>
                </div>

                <div className="relative z-10 w-full max-w-lg text-center">
                    <div className="mb-8 animate-float">
                        <img
                            src="/C:/Users/Lenovo/.gemini/antigravity/brain/8dc6160a-529f-4e7f-b100-a5f8a6751429/auth_page_illustration_1769695290529.png"
                            alt="Auth Illustration"
                            className="w-full h-auto drop-shadow-2xl rounded-[3rem]"
                        />
                    </div>
                    <h2 className="text-4xl font-black text-stone-900 mb-6 leading-tight">
                        Experience Financial <br />
                        <span className="text-teal-600">Peace of Mind.</span>
                    </h2>
                    <p className="text-stone-500 font-medium text-lg leading-relaxed mb-12">
                        Precision tracking, intelligent insights, and total control over your wealth. Join a community of smart earners.
                    </p>

                    <div className="grid grid-cols-3 gap-6 opacity-60">
                        <div className="flex flex-col items-center gap-2">
                            <ShieldCheck className="text-stone-900" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Secure</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Zap className="text-stone-900" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Instant</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Globe className="text-stone-900" size={24} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Global</span>
                        </div>
                    </div>
                </div>

                {/* Decorative circles */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-teal-50 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[-5%] left-[-5%] w-64 h-64 bg-stone-200 rounded-full blur-3xl opacity-30" />
            </div>

            {/* Right Side: Authentication Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 lg:p-24 relative bg-white">
                <div className="w-full max-w-md animate-fade-in-up">
                    <div className="lg:hidden flex items-center gap-2 mb-12 justify-center">
                        <div className="bg-stone-900 p-2 rounded-lg">
                            <Wallet className="text-white w-5 h-5" />
                        </div>
                        <span className="font-black text-stone-900 uppercase tracking-tighter text-lg">MyExpense Log</span>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-4xl font-black text-stone-900 tracking-tight mb-3">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </h1>
                        <p className="text-stone-400 font-medium">
                            {isLogin ? 'Enter your details to access your dashboard' : 'Start your journey with a premium account'}
                        </p>
                    </div>

                    {error && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-8 text-[11px] font-bold uppercase tracking-wider flex items-center gap-3 animate-shake">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Email Address</label>
                            </div>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-teal-600 transition-colors" size={20} />
                                <Input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="h-14 pl-14 pr-6 rounded-2xl border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-all text-stone-900 placeholder:text-stone-300 focus:bg-white focus:border-teal-600/30 focus:ring-8 focus:ring-teal-600/5"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Password</label>
                                {isLogin && (
                                    <button type="button" className="text-[10px] font-black text-teal-600/60 hover:text-teal-600 uppercase tracking-[0.1em] transition-colors">Forgot Password?</button>
                                )}
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-teal-600 transition-colors" size={20} />
                                <Input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="h-14 pl-14 pr-6 rounded-2xl border-stone-100 bg-stone-50/50 hover:bg-stone-50 transition-all text-stone-900 placeholder:text-stone-300 focus:bg-white focus:border-teal-600/30 focus:ring-8 focus:ring-teal-600/5"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-stone-200/50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Secure Login' : 'Create Free Account'}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-stone-100 text-center">
                        <p className="text-stone-400 text-sm font-medium">
                            {isLogin ? "Don't have an account?" : "Already have an account?"}
                            <button
                                type="button"
                                onClick={() => setIsLogin(!isLogin)}
                                className="ml-2 text-teal-600 font-bold hover:text-teal-700 transition-colors underline decoration-teal-600/20 underline-offset-4"
                            >
                                {isLogin ? 'Sign Up Now' : 'Sign In Protected'}
                            </button>
                        </p>
                    </div>

                    <div className="mt-12 flex items-center justify-center gap-6 opacity-30 grayscale pointer-events-none">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-900">Protected by Firebase</span>
                        <div className="w-1 h-1 bg-stone-400 rounded-full"></div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-900">256-Bit SSL</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
