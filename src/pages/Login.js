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
        <div className="min-h-screen bg-slate-50/50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <Card className="w-full max-w-md p-12 bg-white border border-slate-200 shadow-2xl relative z-10 rounded-[2rem]">
                <div className="flex flex-col items-center mb-12 text-center">
                    <div className="bg-[#0067ff] p-5 rounded-2xl mb-8 shadow-lg shadow-blue-200">
                        <Wallet className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3 uppercase">
                        {isLogin ? 'Welcome' : 'Join Us'}
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] opacity-60 px-4">
                        {isLogin ? 'Access your financial dashboard' : 'Start your journey to financial freedom'}
                    </p>
                </div>

                {error && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Email Address</label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-[#0067ff]/10 h-16 rounded-2xl px-6 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Secure Password</label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-[#0067ff]/10 h-16 rounded-2xl px-6 transition-all font-medium"
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-[#0067ff] hover:bg-blue-600 text-white h-16 rounded-2xl font-black text-xs shadow-xl shadow-blue-200 transition-all uppercase tracking-[0.2em]"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center gap-3 justify-center">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </div>
                        ) : (isLogin ? 'Sign In Now' : 'Create My Account')}
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-[10px] font-black text-slate-400 hover:text-[#0067ff] transition-all uppercase tracking-[0.2em]"
                    >
                        {isLogin ? (
                            <>Don't have an account? <span className="text-[#0067ff] decoration-[#0067ff]/30 underline underline-offset-4">Join Free</span></>
                        ) : (
                            <>Already have an account? <span className="text-[#0067ff] decoration-[#0067ff]/30 underline underline-offset-4">Sign In</span></>
                        )}
                    </button>
                </div>
            </Card>
        </div>
    );
}
