'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Plus, Users, Trophy, ChevronRight, Loader2, ArrowRight } from 'lucide-react';

interface League {
    id: string;
    name: string;
    code: string;
    owner_id: string;
    created_at: string;
    member_count?: number; // Calculated later or via view
}

export default function LeaguesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth/login');
        }
    }, [user, authLoading, router]);

    // Modal States
    const [showCreate, setShowCreate] = useState(false);
    const [showJoin, setShowJoin] = useState(false);
    const [newName, setNewName] = useState('');
    const [rankingMode, setRankingMode] = useState<'best' | 'accumulative'>('best');
    const [joinCode, setJoinCode] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchLeagues();
        } else if (!authLoading) {
            setLoading(false); // Stop local loading if auth finished and no user (will redirect)
        }
    }, [user, authLoading]);

    const fetchLeagues = async () => {
        try {
            // Get leagues where user is a member
            const { data, error } = await supabase
                .from('leagues')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeagues(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !user) return;
        setActionLoading(true);

        try {
            // Generate simple random code (e.g. 6 chars upper)
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 1. Create League
            const { data: league, error: lError } = await supabase
                .from('leagues')
                .insert({
                    name: newName,
                    code: code,
                    owner_id: user.id,
                    ranking_mode: rankingMode
                })
                .select()
                .single();

            if (lError) throw lError;

            // 2. Add creator as member
            const { error: mError } = await supabase
                .from('league_members')
                .insert({
                    league_id: league.id,
                    user_id: user.id
                });

            if (mError) throw mError;

            // Update UI
            setLeagues([league, ...leagues]);
            setShowCreate(false);
            setNewName('');
            setRankingMode('best');
        } catch (error) {
            alert('Erro ao criar liga. Tente novamente.');
            console.error("CREATE LEAGUE ERROR:", JSON.stringify(error, null, 2), error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim() || !user) return;
        setActionLoading(true);

        try {
            // 1. Find League by code (Using RPC to bypass RLS)
            const { data: league, error: fError } = await supabase
                .rpc('get_league_by_code', { _code: joinCode.toUpperCase() })
                .single<League>(); // Type hint for the response

            if (fError || !league) {
                alert('Liga não encontrada com este código.');
                return;
            }

            // 2. Insert Member
            const { error: jError } = await supabase
                .from('league_members')
                .insert({
                    league_id: league.id,
                    user_id: user.id
                });

            if (jError) {
                if (jError.code === '23505') { // Unique violation
                    alert('Você já participa desta liga!');
                } else {
                    throw jError;
                }
            } else {
                fetchLeagues(); // Refresh full list
                setShowJoin(false);
                setJoinCode('');
            }
        } catch (error) {
            alert('Erro ao entrar na liga.');
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-white"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black text-gray-100 p-4 pb-24">
            <div className="max-w-xl mx-auto">
                <header className="flex items-center justify-between mb-8 mt-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                            Minhas Ligas
                        </h1>
                        <p className="text-blue-200/60 text-sm font-medium tracking-wide">
                            DISPUTE A LIDERANÇA
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 -mr-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/5"
                    >
                        <ArrowRight className="text-blue-300 w-5 h-5 transform rotate-180" />
                    </button>
                </header>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    <button
                        onClick={() => setShowCreate(true)}
                        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-blue-400/30"
                    >
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="p-3 bg-blue-500/30 rounded-full border border-blue-400/30 shadow-inner">
                                <Plus size={28} className="text-white" />
                            </div>
                            <span className="font-bold text-lg text-white">Criar Liga</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowJoin(true)}
                        className="group relative overflow-hidden bg-slate-800/80 p-6 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 border border-white/10 hover:border-white/20 hover:bg-slate-800"
                    >
                        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="p-3 bg-slate-700/50 rounded-full border border-white/10 shadow-inner">
                                <Users size={28} className="text-blue-200" />
                            </div>
                            <span className="font-bold text-lg text-blue-100">Entrar</span>
                        </div>
                    </button>
                </div>

                {/* Section Title */}
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">
                    Ligas Ativas
                </h2>

                {/* List */}
                <div className="space-y-4">
                    {leagues.length === 0 ? (
                        <div className="relative overflow-hidden bg-white/5 border border-dashed border-white/10 rounded-2xl p-10 text-center">
                            <div className="inline-flex p-4 rounded-full bg-slate-900/50 mb-4 border border-white/5">
                                <Trophy size={32} className="text-gray-600" />
                            </div>
                            <h3 className="text-gray-300 font-bold mb-1">Nenhuma liga encontrada</h3>
                            <p className="text-sm text-gray-500">Crie sua própria competição ou entre em uma existente!</p>
                        </div>
                    ) : (
                        leagues.map(league => (
                            <div
                                key={league.id}
                                onClick={() => router.push(`/leagues/${league.id}`)}
                                className="group relative bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800/60 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
                            >
                                {/* Hover Glow */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Trophy size={20} className="text-yellow-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors">
                                            {league.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/20 tracking-wider">
                                                CÓDIGO: {league.code}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modals */}
                {/* Create Modal */}
                {showCreate && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />

                            <h2 className="text-2xl font-bold text-white mb-1">Nova Liga</h2>
                            <p className="text-gray-400 text-sm mb-6">Crie um espaço para competir com amigos</p>

                            <form onSubmit={handleCreate}>
                                <div className="space-y-5 mb-8">
                                    <div>
                                        <label className="block text-xs font-bold text-blue-300 uppercase mb-2 tracking-wide">Nome da Liga</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Ex: Jovens Ipiranga"
                                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                            value={newName}
                                            onChange={e => setNewName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-blue-300 uppercase mb-2 tracking-wide">Modo de Pontuação</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setRankingMode('best')}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${rankingMode === 'best' ? 'bg-blue-600/20 border-blue-500 text-blue-200' : 'bg-slate-950 border-slate-800 text-gray-500 hover:border-gray-600'}`}
                                            >
                                                <span className="text-xl">🏆</span>
                                                Melhor Pontuação
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRankingMode('accumulative')}
                                                className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-1 ${rankingMode === 'accumulative' ? 'bg-purple-600/20 border-purple-500 text-purple-200' : 'bg-slate-950 border-slate-800 text-gray-500 hover:border-gray-600'}`}
                                            >
                                                <span className="text-xl">➕</span>
                                                Acumulativo
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-colors"
                                        disabled={actionLoading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex justify-center items-center transition-all"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : 'Criar Liga'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Join Modal */}
                {showJoin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />

                            <h2 className="text-2xl font-bold text-white mb-1">Entrar na Liga</h2>
                            <p className="text-gray-400 text-sm mb-6">Digite o código compartilhado com você</p>

                            <form onSubmit={handleJoin}>
                                <div className="mb-8">
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="CÓDIGO"
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-center text-2xl font-mono tracking-[0.2em] uppercase placeholder:text-gray-700 placeholder:tracking-normal placeholder:font-sans"
                                        value={joinCode}
                                        onChange={e => setJoinCode(e.target.value)}
                                        maxLength={6}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowJoin(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-colors"
                                        disabled={actionLoading}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-500/20 flex justify-center items-center transition-all"
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : 'Entrar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
