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
        <div className="min-h-screen bg-[#0f172a] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

            <Card className="w-full max-w-md p-10 bg-white/5 border-white/10 backdrop-blur-2xl shadow-2xl relative z-10">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="bg-indigo-600/20 p-4 rounded-2xl mb-6 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
                        <Wallet className="text-indigo-400 w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-slate-400 font-medium">
                        {isLogin ? 'Access your financial dashboard' : 'Start your journey to financial freedom'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-indigo-500/20 h-12 rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:bg-white/10 focus:ring-indigo-500/20 h-12 rounded-xl"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-bold text-base shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] mt-4"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (isLogin ? 'Sign In Now' : 'Create My Account')}
                    </Button>
                </form>

                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                        {isLogin ? (
                            <>Don't have an account? <span className="text-indigo-400">Join Free</span></>
                        ) : (
                            <>Already have an account? <span className="text-indigo-400">Sign In</span></>
                        )}
                    </button>
                </div>
            </Card>
        </div>
    );
}
