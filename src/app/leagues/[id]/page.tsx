'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Trophy, Users, ArrowLeft, Copy, Check, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Member {
    user_id: string;
    joined_at: string;
    profile?: {
        full_name: string;
        username: string;
    };
    best_score: number;
}

interface League {
    id: string;
    name: string;
    code: string;
    owner_id: string;
    ranking_mode: 'best' | 'accumulative' | 'limited';
}

export default function LeagueDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    const [league, setLeague] = useState<League | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (id) fetchLeagueData();
    }, [id]);

    const fetchLeagueData = async () => {
        try {
            // 1. Fetch League Details
            const { data: leagueData, error: lError } = await supabase
                .from('leagues')
                .select('*')
                .eq('id', id)
                .single();

            if (lError) throw lError;
            setLeague(leagueData);

            // 2. Fetch Members
            const { data: memberData, error: mError } = await supabase
                .from('league_members')
                .select('user_id, joined_at');

            if (mError) throw mError;

            // Deduplicate Members (Safeguard against DB issues)
            const uniqueMap = new Map();
            memberData?.forEach(m => {
                if (!uniqueMap.has(m.user_id)) {
                    uniqueMap.set(m.user_id, m);
                }
            });
            const memberDataUnique = Array.from(uniqueMap.values());

            // 3. Fetch Profiles & Scores for these members
            const userIds = memberDataUnique.map(m => m.user_id);

            // Fetch Profiles
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, username')
                .in('id', userIds);

            // Fetch Max Scores (Best Score Mode)
            // Note: In a larger app, we'd use a SQL View or RPC for this aggregation.
            // For now, we fetch all matches for these users and compute in JS.
            const { data: matches } = await supabase
                .from('game_matches')
                .select('user_id, score')
                .in('user_id', userIds);

            // Combine Data
            const leaderboard: Member[] = memberDataUnique.map(m => {
                const profile = profiles?.find(p => p.id === m.user_id);
                const userMatches = matches?.filter(match => match.user_id === m.user_id) || [];

                let score = 0;
                if (leagueData.ranking_mode === 'accumulative') {
                    // Sum all scores
                    score = userMatches.reduce((sum, match) => sum + match.score, 0);
                } else {
                    // Default: Best Score
                    score = userMatches.reduce((max, match) => (match.score > max ? match.score : max), 0);
                }

                return {
                    user_id: m.user_id,
                    joined_at: m.joined_at,
                    profile: profile || { full_name: 'Usuário Desconhecido', username: 'anon' },
                    best_score: score
                };
            });

            // Sort by Score Descending
            leaderboard.sort((a, b) => b.best_score - a.best_score);

            setMembers(leaderboard);

        } catch (error) {
            console.error(error);
            router.push('/leagues'); // Back if error
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        if (!league) return;
        navigator.clipboard.writeText(league.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Carregando Ranking...</div>;
    if (!league) return null;

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black text-gray-100 p-4 pb-24">
            <div className="max-w-xl mx-auto">

                {/* Header */}
                <div className="mb-8 mt-2">
                    <button
                        onClick={() => router.push('/leagues')}
                        className="group flex items-center text-blue-300 hover:text-white mb-6 transition-colors font-medium text-sm"
                    >
                        <div className="p-1 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 mr-2 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        Voltar para Ligas
                    </button>

                    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 p-1">
                        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-10 -translate-y-10">
                            <Trophy size={180} className="text-blue-500" />
                        </div>

                        <div className="bg-slate-950/50 backdrop-blur-sm rounded-[20px] p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${league.ranking_mode === 'accumulative' ? 'text-purple-300 border-purple-500/30 bg-purple-500/10' : 'text-blue-300 border-blue-500/30 bg-blue-500/10'}`}>
                                            {league.ranking_mode === 'accumulative' ? 'Acumulativo' : 'Melhor PJ'}
                                        </span>
                                        {user?.id === league.owner_id && (
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border text-yellow-500 border-yellow-500/30 bg-yellow-500/10 flex items-center gap-1">
                                                <Shield size={10} /> Admin
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-3xl font-bold text-white leading-tight drop-shadow-md">{league.name}</h1>
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                                    <Users size={14} className="text-gray-400" />
                                    <span className="text-sm font-bold text-gray-200">{members.length}</span>
                                </div>
                            </div>

                            {/* Invite Code */}
                            <div className="flex items-center gap-3 mt-6">
                                <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 flex flex-col justify-center">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Código de Acesso</span>
                                    <span className="font-mono text-2xl font-bold text-white tracking-[0.15em]">{league.code}</span>
                                </div>
                                <button
                                    onClick={copyCode}
                                    className={`h-full px-6 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 border ${copied ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-blue-600 hover:bg-blue-500 border-blue-400/50 text-white shadow-lg shadow-blue-500/20'}`}
                                    style={{ height: '76px' }}
                                >
                                    {copied ? <Check size={20} /> : <Copy size={20} />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                        <div className="p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                            <Trophy className="text-yellow-500" size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Ranking da Liga</h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {members.map((member, index) => {
                            const isCurrentUser = member.user_id === user?.id;

                            // Rank Styles
                            let cardStyle = "bg-slate-900/60 border-white/5";
                            let rankBadge = "bg-slate-800 text-gray-400";
                            let scoreColor = "text-white";

                            if (index === 0) {
                                cardStyle = "bg-gradient-to-r from-yellow-900/30 to-slate-900/60 border-yellow-500/30 shadow-[0_0_15px_-5px_rgba(234,179,8,0.2)]";
                                rankBadge = "bg-yellow-500 text-yellow-950 shadow-lg shadow-yellow-500/50";
                                scoreColor = "text-yellow-400";
                            } else if (index === 1) {
                                cardStyle = "bg-gradient-to-r from-slate-700/30 to-slate-900/60 border-gray-400/30";
                                rankBadge = "bg-gray-300 text-gray-900";
                                scoreColor = "text-gray-200";
                            } else if (index === 2) {
                                cardStyle = "bg-gradient-to-r from-amber-900/20 to-slate-900/60 border-amber-600/30";
                                rankBadge = "bg-amber-700 text-amber-100";
                                scoreColor = "text-amber-500";
                            }

                            return (
                                <div
                                    key={member.user_id}
                                    className={`relative p-4 rounded-2xl border flex items-center justify-between transition-all backdrop-blur-sm group ${cardStyle} ${isCurrentUser ? 'ring-1 ring-blue-500 bg-blue-900/10' : ''}`}
                                >
                                    {/* Left Side: Rank + Info */}
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${rankBadge}`}>
                                            {index + 1}
                                        </div>

                                        <div>
                                            <p className={`font-bold flex items-center gap-2 ${isCurrentUser ? 'text-blue-300' : 'text-gray-100'}`}>
                                                {member.profile?.full_name?.split(' ')[0] || member.profile?.username || 'Jogador'}
                                                {isCurrentUser && <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Você</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Membro desde {new Date(member.joined_at).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right Side: Score */}
                                    <div className="text-right">
                                        <div className={`text-xl font-bold font-mono tracking-tight ${scoreColor}`}>
                                            {(member.best_score).toLocaleString('pt-BR')}
                                        </div>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Pontos</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
