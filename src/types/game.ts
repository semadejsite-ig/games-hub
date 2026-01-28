export type Difficulty = 'easy' | 'medium' | 'hard' | 'million';

export interface Question {
  id: string | number;
  text: string;
  options: string[]; // Always 4 options
  correctDetails?: string; // Explanation or full text of correct answer for validation if needed, or just index
  correctOptionIndex: number; // 0-3
  difficulty: Difficulty;
}

export type LifelineType = 'cards' | 'placa' | 'guests' | 'skip';

export interface LifelineState {
  type: LifelineType;
  available: boolean;
  used: boolean;
  usesLeft?: number; // For "Livramento" (Skip)
}

export interface LifelineResult {
  type: LifelineType;
  suggestion?: number; // Index for Pastor
  stats?: number[]; // Percentages for Irmãos
}

export type GameStatus = 'playing' | 'won' | 'lost' | 'stopped';

export interface GameState {
  currentQuestionIndex: number; // 0 to 15 usually
  currentLevel: number; // 1 to ...
  accumulatedMoney: number;
  currentPrize: number;
  stopPrize: number;
  wrongPrize: number; // Prize if answer is wrong (usually 50% or safe haven)
  status: GameStatus;
  lifelines: {
    cards: LifelineState;
    placa: LifelineState;
    guests: LifelineState;
    skip: LifelineState;
  };
  eliminatedOptions: number[]; // Indices of options eliminated by "Cards" or similar logic?
  lifelineResult: LifelineResult | null; // Result to show in Modal
}
