import { useState, useEffect, useCallback } from 'react';
import { GameState, Question, Difficulty, LifelineType } from '@/types/game';
import { QUESTIONS, PRIZE_LADDER } from '@/data/questions';

const INITIAL_STATE: GameState = {
    currentQuestionIndex: 0,
    currentLevel: 1,
    accumulatedMoney: 0,
    currentPrize: 1000,
    stopPrize: 0,
    wrongPrize: 0,
    status: 'playing',
    lifelines: {
        cards: { type: 'cards', available: true, used: false },
        placa: { type: 'placa', available: true, used: false },
        guests: { type: 'guests', available: true, used: false },
        skip: { type: 'skip', available: true, used: false },
    },
    eliminatedOptions: [],
};

// Helper: Get random question by difficulty
const getQuestionForLevel = (level: number, usedIds: number[]): Question | null => {
    let difficulty: Difficulty = 'easy';
    if (level > 5) difficulty = 'medium';
    if (level > 10) difficulty = 'hard';
    if (level === 16) difficulty = 'million';

    const candidates = QUESTIONS.filter(q => q.difficulty === difficulty && !usedIds.includes(q.id));
    if (candidates.length === 0) return null; // Should not happen if DB is full
    return candidates[Math.floor(Math.random() * candidates.length)];
};

export const useGameState = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [usedQuestionIds, setUsedQuestionIds] = useState<number[]>([]);

    // Initialize Game
    const startGame = useCallback(() => {
        setUsedQuestionIds([]);
        const firstQ = getQuestionForLevel(1, []);
        if (firstQ) {
            setGameState({ ...INITIAL_STATE, currentPrize: PRIZE_LADDER[0].prize });
            setCurrentQuestion(firstQ);
            setUsedQuestionIds([firstQ.id]);
        }
    }, []);

    // Handle Answer
    const handleAnswer = (optionIndex: number) => {
        if (!currentQuestion || gameState.status !== 'playing') return;

        const isCorrect = optionIndex === currentQuestion.correctOptionIndex;

        if (isCorrect) {
            // Logic for Winning
            if (gameState.currentLevel === 16) {
                setGameState(prev => ({ ...prev, status: 'won', accumulatedMoney: 1000000 }));
                return;
            }

            // Advance
            const nextLevel = gameState.currentLevel + 1;
            const ladderInfo = PRIZE_LADDER.find(l => l.level === gameState.currentLevel); // Current prize won
            const nextLadder = PRIZE_LADDER.find(l => l.level === nextLevel);

            const nextQ = getQuestionForLevel(nextLevel, usedQuestionIds);

            setGameState(prev => ({
                ...prev,
                currentLevel: nextLevel,
                accumulatedMoney: ladderInfo?.prize || 0,
                currentPrize: nextLadder?.prize || 0,
                stopPrize: ladderInfo?.stop || 0, // Stop prize updates
                wrongPrize: nextLadder?.wrong || 0,
                eliminatedOptions: [], // Reset lifeline effects
            }));

            if (nextQ) {
                setCurrentQuestion(nextQ);
                setUsedQuestionIds(prev => [...prev, nextQ.id]);
            } else {
                // Fallback if no specific question found
                console.warn("No question found for level", nextLevel);
            }

        } else {
            // Wrong Answer
            setGameState(prev => ({
                ...prev,
                status: 'lost',
                accumulatedMoney: prev.wrongPrize, // You leave with the "wrong" amount logic
            }));
        }
    };

    // Handle Stop
    const handleStop = () => {
        setGameState(prev => ({
            ...prev,
            status: 'stopped',
            accumulatedMoney: prev.stopPrize,
        }));
    };

    // Handle Lifelines (Placeholder logic for now)
    const useLifeline = (type: LifelineType) => {
        if (!gameState.lifelines[type].available) return;

        if (type === 'skip') {
            // Skip logic: Fetch new question same level
            const newQ = getQuestionForLevel(gameState.currentLevel, usedQuestionIds);
            if (newQ) {
                setCurrentQuestion(newQ); // Logic: Usually skip doesn't eliminate options
                setGameState(prev => ({
                    ...prev,
                    lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
                }));
            }
        } else if (type === 'cards') {
            // Eliminate 2 wrong answers
            if (!currentQuestion) return;
            const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctOptionIndex);
            // Randomly pick 2 to eliminate
            const toEliminate = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);

            setGameState(prev => ({
                ...prev,
                eliminatedOptions: toEliminate,
                lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
            }));
        } else {
            // Others just mark used for now
            setGameState(prev => ({
                ...prev,
                lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
            }));
        }
    };

    useEffect(() => {
        startGame();
    }, [startGame]);

    return {
        gameState,
        currentQuestion,
        handleAnswer,
        handleStop,
        useLifeline,
        restartGame: startGame
    };
};
