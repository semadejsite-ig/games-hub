'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, ArrowRight, Loader2, KeyRound } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.push('/');
            }
            else if (mode === 'register') {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } }
                });
                if (error) throw error;

                // If email confirmation is disabled in Supabase, we get a session immediately.
                if (data.session) {
                    router.push('/');
                    return;
                }

                // Otherwise, assume verification is needed
                setMessage('Cadastro realizado! Se necessário, verifique seu email.');
                setMode('login');
            }
            else if (mode === 'forgot') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                });
                if (error) throw error;
                setMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">

                {/* Header Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setMode('login')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${mode === 'login' ? 'bg-slate-800 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        ENTRAR
                    </button>
                    <button
                        onClick={() => setMode('register')}
                        className={`flex-1 py-4 font-bold text-sm transition-colors ${mode === 'register' ? 'bg-slate-800 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        CRIAR CONTA
                    </button>
                </div>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {mode === 'login' && 'Bem-vindo de volta!'}
                        {mode === 'register' && 'Junte-se a nós!'}
                        {mode === 'forgot' && 'Recuperar Senha'}
                    </h2>
                    <p className="text-gray-400 mb-8 text-sm">
                        {mode === 'login' && 'Acesse sua conta para salvar seu progresso.'}
                        {mode === 'register' && 'Crie sua conta para competir no ranking.'}
                        {mode === 'forgot' && 'Digite seu email para receber o link.'}
                    </p>

                    {error && <div className="bg-red-900/20 border border-red-800 text-red-400 p-3 rounded-lg mb-6 text-sm">{error}</div>}
                    {message && <div className="bg-green-900/20 border border-green-800 text-green-400 p-3 rounded-lg mb-6 text-sm">{message}</div>}

                    <form onSubmit={handleAuth} className="space-y-4">

                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-600" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:border-blue-500 outline-none"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-600" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:border-blue-500 outline-none"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        {mode !== 'forgot' && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 text-gray-600" size={18} />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 text-white focus:border-blue-500 outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight size={18} />}
                            {mode === 'login' && 'ENTRAR'}
                            {mode === 'register' && 'CADASTRAR'}
                            {mode === 'forgot' && 'ENVIAR LINK'}
                        </button>
                    </form>

                    {mode === 'login' && (
                        <div className="flex justify-between items-center mt-6 text-sm">
                            <button onClick={() => setMode('forgot')} className="text-gray-500 hover:text-white transition-colors">Esqueceu a senha?</button>
                        </div>
                    )}

                    {mode === 'forgot' && (
                        <button onClick={() => setMode('login')} className="block w-full text-center text-gray-500 hover:text-white text-sm mt-6">
                            Voltar para Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
