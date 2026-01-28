'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { QuestionCard } from '@/components/Game/QuestionCard';
import { AnswerButton } from '@/components/Game/AnswerButton';
import { Lifelines } from '@/components/Game/Lifelines';
import { MoneyLadder } from '@/components/Game/MoneyLadder';

export default function GamePage() {
    const router = useRouter();
    const { gameState, currentQuestion, handleAnswer, handleStop, useLifeline, restartGame } = useGameState();
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // Auth & Score Saving
    const { user } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        const saveScore = async () => {
            if (!user) return;
            if (gameState.status === 'won' || gameState.status === 'lost' || gameState.status === 'stopped') {
                try {
                    // Check if already saved for this session? 
                    // For simplicity, we assume one save per end state trigger.
                    // In a real app, we might need a Ref to prevent double-save on strict-mode rerenders.

                    await supabase.from('game_matches').insert({
                        user_id: user.id,
                        game_id: 'show-do-milhao',
                        score: gameState.accumulatedMoney,
                        metadata: { level: gameState.currentLevel }
                    });

                    // Also update total_xp in profile (trigger or manual)
                    // Let's do a manual rpc or simple update for now if trigger not set
                } catch (error) {
                    console.error("Error saving score:", error);
                }
            }
        };

        saveScore();
    }, [gameState.status, user]); // Only run when status changes

    // Auto-redirect if won/lost/stopped (or show modal)
    // For now, simple game over screen logic inline or conditional text

    if (!currentQuestion && gameState.status === 'playing') {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    const onOptionClick = (index: number) => {
        setSelectedOption(index);
        // Add delay for tension? 
        setTimeout(() => {
            handleAnswer(index);
            setSelectedOption(null);
        }, 2000); // 2 second suspense
    };

    // Game Over / Win UI
    if (gameState.status !== 'playing') {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4 text-center z-10 relative">
                <h1 className="text-4xl font-bold mb-4">
                    {gameState.status === 'won' ? 'PARABÉNS! VOCÊ GANHOU!' :
                        gameState.status === 'stopped' ? 'VOCÊ PAROU!' : 'QUE PENA! VOCÊ PERDEU!'}
                </h1>
                <p className="text-2xl mb-8">
                    Prêmio Final: {gameState.accumulatedMoney.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="flex gap-4">
                    <button onClick={restartGame} className="bg-yellow-500 text-blue-900 px-8 py-3 rounded-full font-bold text-xl hover:bg-yellow-400">
                        Jogar Novamente
                    </button>
                    <button onClick={() => router.push('/')} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold text-xl hover:bg-blue-500">
                        Menu Principal
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full">
            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center p-4 md:p-8 max-w-4xl mx-auto relative z-10">

                {/* Header Stats */}
                <div className="w-full flex justify-between items-center mb-6 bg-black/30 p-4 rounded-xl backdrop-blur">
                    <div>
                        <p className="text-sm text-gray-400">PERGUNTA</p>
                        <p className="text-2xl font-bold text-yellow-500">{gameState.currentLevel} <span className="text-sm text-white">/ 16</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">VALENDO</p>
                        <p className="text-2xl font-bold text-green-400">
                            {gameState.currentPrize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </p>
                    </div>
                </div>

                {/* Question */}
                {currentQuestion && <QuestionCard text={currentQuestion.text} />}

                {/* Options */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {currentQuestion?.options.map((option, idx) => {
                        // Calculate state
                        let state: 'default' | 'selected' | 'correct' | 'wrong' | 'hidden' = 'default';

                        if (gameState.eliminatedOptions.includes(idx)) {
                            state = 'hidden';
                        } else if (selectedOption === idx) {
                            state = 'selected';
                        }

                        return (
                            <AnswerButton
                                key={idx}
                                index={idx}
                                option={option}
                                state={state}
                                onClick={() => onOptionClick(idx)}
                                disabled={selectedOption !== null}
                            />
                        );
                    })}
                </div>

                {/* Lifelines & Controls */}
                <Lifelines lifelines={gameState.lifelines} onUse={useLifeline} disabled={selectedOption !== null} />

                <button
                    onClick={handleStop}
                    disabled={selectedOption !== null}
                    className="text-red-400 border border-red-400/30 px-6 py-2 rounded-full hover:bg-red-500/10 text-sm font-bold uppercase tracking-widest mt-auto"
                >
                    Parar Jogo (R$ {gameState.stopPrize.toLocaleString('pt-BR', { maximumFractionDigits: 0 })})
                </button>

            </div>

            {/* Sidebar Ladder (Hidden on mobile) */}
            <MoneyLadder currentLevel={gameState.currentLevel} />
        </div>
    );
}
