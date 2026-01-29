'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/hooks/useGameState';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase';
import { QuestionCard } from '@/components/Game/QuestionCard';
import { AnswerButton } from '@/components/Game/AnswerButton';
import { Lifelines } from '@/components/Game/Lifelines';
import { LifelineModal } from '@/components/Game/LifelineModal';
import { MoneyLadder } from '@/components/Game/MoneyLadder';
import { Trophy } from 'lucide-react';

import { PRIZE_LADDER } from '@/data/questions';

export default function GamePage() {
    const router = useRouter();
    const {
        gameState,
        currentQuestion,
        handleAnswer,
        handleStop,
        useLifeline,
        closeLifelineModal,
        restartGame
    } = useGameState();
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
        // Calculate Title (Level - 1 because currentLevel is the one they were facing)
        const levelsCompleted = gameState.currentLevel - 1;
        let reachedTitle = PRIZE_LADDER.find(l => l.level === levelsCompleted)?.title;

        if (!reachedTitle) {
            reachedTitle = levelsCompleted === 0 ? 'Vigia Irmão! 👀' : 'Iniciante';
        }


        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] p-4 text-center z-10 relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black overflow-hidden">
                {/* Background FX */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                </div>

                <div className="relative z-10 max-w-2xl w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">

                    {/* Status Badge */}
                    <div className="mb-8 relative">
                        {gameState.status === 'won' && (
                            <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 animate-pulse" />
                        )}
                        <h1 className={`text-5xl md:text-7xl font-bold tracking-tight drop-shadow-2xl ${gameState.status === 'won' ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600' :
                            gameState.status === 'stopped' ? 'text-blue-200' : 'text-red-500'
                            }`}>
                            {gameState.status === 'won' ? 'MILIONÁRIO!' :
                                gameState.status === 'stopped' ? 'PAROU!' : 'FIM DE JOGO'}
                        </h1>
                        <p className="text-gray-400 font-medium tracking-widest uppercase mt-2 text-sm md:text-base">
                            {gameState.status === 'won' ? 'VOCÊ ZEROU O JOGO' :
                                gameState.status === 'stopped' ? 'VOCÊ PREFERIU NÃO ARRISCAR' : 'VOCÊ ERROU A QUESTÃO'}
                        </p>
                    </div>

                    {/* Journey Title Card */}
                    <div className="bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 w-full mb-8 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4">
                            <Trophy size={120} />
                        </div>
                        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">Sua Patente Bíblica</p>
                        <p className="text-3xl md:text-4xl font-bold text-white mb-1 group-hover:scale-105 transition-transform duration-500">
                            {reachedTitle}
                        </p>
                    </div>

                    {/* Prize Card */}
                    <div className="flex flex-col items-center mb-10 scale-110">
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Prêmio Conquistado</p>
                        <p className={`text-4xl md:text-6xl font-mono font-bold tracking-tighter ${gameState.status === 'won' ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'text-green-400'
                            }`}>
                            {gameState.accumulatedMoney.toLocaleString('pt-BR')} <span className="text-sm md:text-xl text-blue-200 font-sans font-bold uppercase tracking-wider ml-1">Dracmas</span>
                        </p>
                    </div>

                    {/* Wrong Answer Details (if lost) */}
                    {gameState.status === 'lost' && currentQuestion && (
                        <div className="w-full bg-red-950/30 border border-red-500/20 p-6 rounded-2xl mb-8 text-left relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/50" />
                            <p className="text-red-300 text-xs font-bold uppercase mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                A resposta correta era:
                            </p>
                            <p className="text-xl md:text-2xl font-bold text-white mb-3">
                                {currentQuestion.options[currentQuestion.correctOptionIndex]}
                            </p>
                            {currentQuestion.correctDetails && (
                                <div className="bg-black/20 p-3 rounded-lg border border-red-500/10">
                                    <p className="text-yellow-200/90 italic text-sm flex gap-2">
                                        <span>💡</span>
                                        {currentQuestion.correctDetails}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <button
                            onClick={restartGame}
                            className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-yellow-500/20 hover:scale-105 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                        >
                            <Trophy size={20} className="text-yellow-900" />
                            Jogar Novamente
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-slate-800 hover:bg-slate-700 text-white border border-white/5 px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-all w-full md:w-auto"
                        >
                            Menu Principal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[100dvh] w-full overflow-hidden">
            {/* Main Game Area */}
            <div className="flex-1 flex flex-col items-center p-4 pb-24 md:p-8 max-w-4xl mx-auto relative z-10 overflow-y-auto">

                {/* Header Stats */}
                <div className="w-full flex justify-between items-center mb-6 bg-black/30 p-4 rounded-xl backdrop-blur">
                    <div>
                        <p className="text-sm text-gray-400">PERGUNTA</p>
                        <p className="text-2xl font-bold text-yellow-500">{gameState.currentLevel} <span className="text-sm text-white">/ 16</span></p>
                    </div>
                    {/* Timer UI */}
                    <div className="relative flex flex-col items-center">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                            {/* Background Ring */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    className="text-white/10"
                                    strokeWidth="6"
                                    fill="none"
                                    stroke="currentColor"
                                />
                                {/* Progress Ring */}
                                <circle
                                    cx="40"
                                    cy="40"
                                    r="36"
                                    className={`transition-all duration-1000 ease-linear ${gameState.timeLeft <= 10 ? 'text-red-500' : 'text-blue-500'}`}
                                    strokeWidth="6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeDasharray="226" // 2 * pi * 36
                                    strokeDashoffset={226 - (226 * gameState.timeLeft) / 30}
                                />
                            </svg>
                            {/* Text */}
                            <span className={`absolute text-2xl font-bold font-mono ${gameState.timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                {gameState.timeLeft}
                            </span>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-400">VALENDO</p>
                        <p className="text-2xl font-bold text-green-400">
                            {gameState.currentPrize.toLocaleString('pt-BR')} <span className="text-sm">Dracmas</span>
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
                <Lifelines
                    lifelines={gameState.lifelines}
                    onUse={useLifeline}
                    disabled={selectedOption !== null || gameState.currentLevel === 16}
                />

                {/* Modal for Pastor/Irmãos */}
                <LifelineModal
                    result={gameState.lifelineResult}
                    onClose={closeLifelineModal}
                />

                <button
                    onClick={handleStop}
                    disabled={selectedOption !== null}
                    className="text-red-400 border border-red-400/30 px-6 py-2 rounded-full hover:bg-red-500/10 text-sm font-bold uppercase tracking-widest mt-auto transition-colors"
                >
                    Parar Jogo ({gameState.stopPrize.toLocaleString('pt-BR')} Dracmas)
                </button>

            </div>

            {/* Sidebar Ladder (Hidden on mobile) */}
            <MoneyLadder currentLevel={gameState.currentLevel} />
        </div >
    );
}
