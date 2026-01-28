import { PRIZE_LADDER } from '@/data/questions';

interface MoneyLadderProps {
    currentLevel: number;
}

export function MoneyLadder({ currentLevel }: MoneyLadderProps) {
    // Mobile: Just show current/next prize?
    // Desktop: Show full ladder

    // We can reverse the ladder to show Million at top
    const ladder = [...PRIZE_LADDER].reverse();

    return (
        <div className="hidden lg:block bg-blue-950/90 border-l-4 border-blue-600 w-64 p-4 h-full overflow-y-auto">
            <h3 className="text-yellow-400 font-bold text-xl mb-4 text-center">PRÊMIOS</h3>
            <div className="space-y-1">
                {ladder.map((step) => {
                    const isActive = step.level === currentLevel;
                    const isPast = step.level < currentLevel;

                    return (
                        <div
                            key={step.level}
                            className={`
                flex justify-between items-center px-3 py-1 rounded
                ${isActive ? 'bg-yellow-600 text-white font-bold scale-105 origin-left' : ''}
                ${isPast ? 'text-green-400' : 'text-gray-400'}
                ${!isActive && !isPast ? 'text-white' : ''}
              `}
                        >
                            <span className="text-xs">{step.level}</span>
                            <span className="font-mono">
                                {step.prize.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
