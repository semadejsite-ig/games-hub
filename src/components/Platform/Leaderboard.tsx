'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Trophy } from 'lucide-react';

interface Team {
    id: string;
    name: string;
    color: string;
    total_score: number;
}

export function Leaderboard() {
    const [teams, setTeams] = useState<Team[]>([]);
    const supabase = createClient();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            // Fetch teams sorted by score
            const { data, error } = await supabase
                .from('teams')
                .select('*')
                .order('total_score', { ascending: false });

            if (data) setTeams(data);
        };

        fetchLeaderboard();

        // Realtime subscription could go here
    }, []);

    return (
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="text-yellow-500" /> RANKING DAS EQUIPES
            </h2>

            <div className="space-y-4">
                {teams.map((team, index) => (
                    <div
                        key={team.id}
                        className="flex items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800 relative overflow-hidden"
                    >
                        {/* Rank Number */}
                        <div className="w-8 font-bold text-gray-500">{index + 1}º</div>

                        {/* Team Color Indicator */}
                        <div
                            className="w-3 h-3 rounded-full mr-3 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                            style={{ backgroundColor: team.color, boxShadow: `0 0 10px ${team.color}` }}
                        />

                        <div className="flex-1">
                            <span className="font-bold text-white uppercase tracking-wider text-sm">{team.name}</span>
                        </div>

                        <div className="font-mono font-bold text-yellow-500">
                            {team.total_score.toLocaleString()} <span className="text-xs text-gray-500">XP</span>
                        </div>

                        {/* Progress Bar Background (Visual Flair) */}
                        <div
                            className="absolute bottom-0 left-0 h-1 opacity-50"
                            style={{
                                width: `${(team.total_score / (teams[0]?.total_score || 1)) * 100}%`,
                                backgroundColor: team.color
                            }}
                        />
                    </div>
                ))}

                {teams.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                        Nenhuma equipe pontuou ainda.
                    </div>
                )}
            </div>
        </div>
    );
}
