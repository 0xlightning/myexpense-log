import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Wallet } from 'lucide-react';

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/5 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md p-10 bg-white/70 border-white/40 backdrop-blur-2xl shadow-2xl relative z-10 rounded-[2.5rem]">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="bg-indigo-600 p-4 rounded-3xl mb-6 shadow-xl shadow-indigo-100 transform -rotate-6">
                        <Wallet className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-indigo-600/70 font-bold uppercase tracking-widest text-[10px]">
                        {isLogin ? 'Access your financial dashboard' : 'Start your journey to financial freedom'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-xs font-black uppercase tracking-widest flex items-center gap-3 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-indigo-500/10 h-14 rounded-2xl px-6 transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Password</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:bg-white focus:ring-indigo-500/10 h-14 rounded-2xl px-6 transition-all"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest italic"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2 justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (isLogin ? 'Sign In Now' : 'Create My Account')}
                    </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest"
                    >
                        {isLogin ? (
                            <>Don't have an account? <span className="text-indigo-600 decoration-indigo-600/30 underline underline-offset-4">Join Free</span></>
                        ) : (
                            <>Already have an account? <span className="text-indigo-600 decoration-indigo-600/30 underline underline-offset-4">Sign In</span></>
                        )}
                    </button>
                </div>
            </Card>
        </div>
    );
}
