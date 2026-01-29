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
        placa: { type: 'placa', available: true, used: false }, // Irmãos
        guests: { type: 'guests', available: true, used: false }, // Pastor
        skip: { type: 'skip', available: true, used: false, usesLeft: 3 }, // Livramento (3x)
    },
    eliminatedOptions: [],
    lifelineResult: null,
    timeLeft: 30
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
            // If ran out of specific difficulty, try to find any unused question
            const fallback = dbQuestions.filter(q => !usedIds.includes(q.id));
            return fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)] : null;
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }, [dbQuestions]);

    // Timer Logic
    useEffect(() => {
        if (gameState.status !== 'playing' || !currentQuestion) return;

        const timer = setInterval(() => {
            setGameState(prev => {
                // Double check status inside updater to be safe
                if (prev.status !== 'playing') {
                    clearInterval(timer);
                    return prev;
                }

                const newTime = prev.timeLeft - 1;

                if (newTime <= 0) {
                    clearInterval(timer);
                    return {
                        ...prev,
                        status: 'lost',
                        statusReason: 'timeout', // Optional: could add this to GameState for specific Game Over msg
                        accumulatedMoney: prev.wrongPrize,
                        timeLeft: 0
                    };
                }
                return { ...prev, timeLeft: newTime };
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState.status, currentQuestion]);

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
                lifelineResult: null, // Reset modal
                timeLeft: 30 // Reset Timer on Next Level
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

    const closeLifelineModal = () => {
        setGameState(prev => ({ ...prev, lifelineResult: null }));
    };

    // Handle Lifelines
    const useLifeline = (type: LifelineType) => {
        console.log("Using lifeline:", type, gameState.lifelines[type]);
        if (!gameState.lifelines[type].available) return;
        if (!currentQuestion) return;

        if (type === 'skip') {
            // Logic for Skip (Livramento) - 3 Uses
            const currentUses = gameState.lifelines.skip.usesLeft ?? 0;
            if (currentUses <= 0) return;

            const newQ = getQuestionForLevel(gameState.currentLevel, usedQuestionIds);
            if (newQ) {
                setCurrentQuestion(newQ);
                setUsedQuestionIds(prev => [...prev, newQ.id]); // Mark new one as used

                setGameState(prev => ({
                    ...prev,
                    lifelineResult: null,
                    eliminatedOptions: [], // Reset 50/50 on skip
                    timeLeft: 30, // Reset Timer on Skip
                    lifelines: {
                        ...prev.lifelines,
                        [type]: {
                            ...prev.lifelines[type],
                            usesLeft: currentUses - 1,
                            available: (currentUses - 1) > 0, // Still available if > 0
                            used: (currentUses - 1) === 0 // Mark "used" (grayed out) only if 0 left
                        }
                    }
                }));
            }
        }
        else if (type === 'cards') { // Cortar Joio
            const wrongIndices = [0, 1, 2, 3].filter(i => i !== currentQuestion.correctOptionIndex);
            const toEliminate = wrongIndices.sort(() => 0.5 - Math.random()).slice(0, 2);

            setGameState(prev => ({
                ...prev,
                eliminatedOptions: toEliminate,
                lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
            }));
        }
        else if (type === 'guests') { // Pastor
            // Logic: High probability of being right on easy levels, lower on hard
            const correct = currentQuestion.correctOptionIndex;
            let suggestion = correct;

            // Error chance: Easy 10%, Medium 30%, Hard 60%
            let errorChance = 0.1;
            if (currentQuestion.difficulty === 'medium') errorChance = 0.3;
            if (currentQuestion.difficulty === 'hard') errorChance = 0.6;
            if (currentQuestion.difficulty === 'million') errorChance = 0.8;

            if (Math.random() < errorChance) {
                // Pick a wrong option
                const wrong = [0, 1, 2, 3].filter(i => i !== correct);
                suggestion = wrong[Math.floor(Math.random() * wrong.length)];
            }

            setGameState(prev => ({
                ...prev,
                lifelineResult: { type: 'guests', suggestion },
                lifelines: { ...prev.lifelines, [type]: { ...prev.lifelines[type], available: false, used: true } }
            }));
        }
        else if (type === 'placa') { // Irmãos
            // Logic: Generate distribution biased towards correct answer
            const correct = currentQuestion.correctOptionIndex;
            let stats = [0, 0, 0, 0];

            // "Bias" strength depends on difficulty (easier = church knows more)
            let confidence = 0.7; // 70% of votes go to correct
            if (currentQuestion.difficulty === 'medium') confidence = 0.5;
            if (currentQuestion.difficulty === 'hard') confidence = 0.3; // Confused church

            let remaining = 100;

            // Set correct option
            stats[correct] = Math.floor(remaining * confidence);
            remaining -= stats[correct];

            // Distribute rest randomly
            for (let i = 0; i < 4; i++) {
                if (i !== correct) {
                    if (i === 3) {
                        stats[i] = remaining; // Last one gets rest
                    } else {
                        const share = Math.floor(Math.random() * remaining);
                        stats[i] = share;
                        remaining -= share;
                    }
                }
            }

            setGameState(prev => ({
                ...prev,
                lifelineResult: { type: 'placa', stats },
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
        closeLifelineModal,
        restartGame: startGame,
        loading
    };
};
