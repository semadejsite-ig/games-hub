import { useState, useEffect, useCallback } from 'react';
import { GameState, Question, Difficulty, LifelineType } from '@/types/game';
import { QUESTIONS as LOCAL_QUESTIONS, PRIZE_LADDER } from '@/data/questions';
import { createClient } from '@/lib/supabase';

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

export const useGameState = () => {
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [usedQuestionIds, setUsedQuestionIds] = useState<(string | number)[]>([]);

    // DB Questions Cache
    const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    // Fetch Questions on Mount
    useEffect(() => {
        const fetchQuestions = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('questions')
                    .select('*');

                if (error) console.error('Error loading questions:', error);

                if (data && data.length > 0) {
                    // Map DB fields to Question type
                    const mapped: Question[] = data.map(q => ({
                        id: q.id,
                        text: q.text,
                        options: q.options as string[],
                        correctOptionIndex: q.correct_option,
                        difficulty: q.difficulty as Difficulty,
                        correctDetails: q.correct_details
                    }));
                    setDbQuestions(mapped);
                } else {
                    // Fallback to local
                    setDbQuestions(LOCAL_QUESTIONS);
                }
            } catch (err) {
                console.error(err);
                setDbQuestions(LOCAL_QUESTIONS);
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, []);

    // Helper to get questions from the LOADED pool (DB or Local)
    const getQuestionForLevel = useCallback((level: number, usedIds: (string | number)[]): Question | null => {
        if (dbQuestions.length === 0) return null;

        let difficulty: Difficulty = 'easy';
        if (level > 5) difficulty = 'medium';
        if (level > 10) difficulty = 'hard';
        if (level === 16) difficulty = 'million';

        const candidates = dbQuestions.filter(q => q.difficulty === difficulty && !usedIds.includes(q.id));
        if (candidates.length === 0) {
            // Resort to any difficulty if ran out? Or just return null (error state usually)
            return null;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }, [dbQuestions]);

    // Initialize Game
    const startGame = useCallback(() => {
        if (loading || dbQuestions.length === 0) return;

        setUsedQuestionIds([]);
        const firstQ = getQuestionForLevel(1, []);
        if (firstQ) {
            setGameState({ ...INITIAL_STATE, currentPrize: PRIZE_LADDER[0].prize });
            setCurrentQuestion(firstQ);
            setUsedQuestionIds([firstQ.id]);
        }
    }, [loading, dbQuestions, getQuestionForLevel]);

    // Auto-start when loaded (only first time)
    useEffect(() => {
        if (!loading && currentQuestion === null && gameState.status === 'playing') {
            startGame();
        }
    }, [loading, startGame, currentQuestion, gameState.status]);

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
                console.warn("No question found for level", nextLevel);
                // Could finish game here if no more questions
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

    // Handle Lifelines
    const useLifeline = (type: LifelineType) => {
        if (!gameState.lifelines[type].available) return;

        if (type === 'skip') {
            const newQ = getQuestionForLevel(gameState.currentLevel, usedQuestionIds);
            if (newQ) {
                setCurrentQuestion(newQ);
                // Add old question back to pool? Or keep it used? 
                // Currently keeping used.
                setGameState(prev => ({
                    ...prev,
                    lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
                }));
            }
        } else if (type === 'cards') {
            if (!currentQuestion) return;
            const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctOptionIndex);
            const toEliminate = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);

            setGameState(prev => ({
                ...prev,
                eliminatedOptions: toEliminate,
                lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
            }));
        } else {
            setGameState(prev => ({
                ...prev,
                lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
            }));
        }
    };

    return {
        gameState,
        currentQuestion,
        handleAnswer,
        handleStop,
        useLifeline,
        restartGame: startGame,
        loading
    };
};
