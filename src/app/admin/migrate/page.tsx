'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { QUESTIONS } from '@/data/questions';

export default function MigratePage() {
    const [status, setStatus] = useState('Idle');
    const [log, setLog] = useState<string[]>([]);
    const supabase = createClient();

    const handleMigrate = async () => {
        setStatus('Migrating...');
        setLog([]);
        let count = 0;

        for (const q of QUESTIONS) {
            try {
                // Prepare data matching DB schema
                const { error } = await supabase.from('questions').insert({
                    text: q.text,
                    options: q.options,
                    correct_option: q.correctOptionIndex,
                    correct_details: q.correctDetails,
                    difficulty: q.difficulty,
                    // reference: q.reference // If exists in legacy
                });

                if (error) throw error;

                setLog(prev => [...prev, `✅ Saved: ${q.text.substring(0, 30)}...`]);
                count++;
            } catch (e: any) {
                setLog(prev => [...prev, `❌ Error: ${e.message}`]);
            }
        }

        setStatus(`Done! Migrated ${count} questions.`);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <h1 className="text-2xl font-bold mb-6 text-yellow-500">Ferramenta de Migração</h1>

            <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                <p className="mb-2">Total de Perguntas no Código: <strong>{QUESTIONS.length}</strong></p>
                <button
                    onClick={handleMigrate}
                    disabled={status === 'Migrating...'}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-full disabled:opacity-50"
                >
                    {status === 'Migrating...' ? 'Migrando...' : 'Iniciar Migração para Supabase'}
                </button>
            </div>

            <div className="bg-black/50 p-4 rounded-lg font-mono text-xs h-96 overflow-y-auto border border-gray-800">
                <p className="text-gray-500 mb-2">// Logs de operação...</p>
                {status !== 'Idle' && <p className="text-blue-400">Status: {status}</p>}
                {log.map((l, i) => (
                    <div key={i} className="mb-1">{l}</div>
                ))}
            </div>
        </div>
    );
}
