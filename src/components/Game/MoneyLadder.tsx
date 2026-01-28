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
                flex justify-between items-center px-3 py-1 rounded transition-all
                ${isActive ? 'bg-yellow-600 text-white font-bold scale-105 origin-left shadow-lg shadow-yellow-900/50' : ''}
                ${isPast ? 'text-green-400 opacity-60' : 'text-gray-400'}
                ${!isActive && !isPast ? 'text-white' : ''}
              `}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-xs w-6 text-center ${isActive ? 'bg-black/20 rounded' : ''}`}>{step.level}</span>
                                <span className="text-sm font-medium hidden xl:inline-block max-w-[120px] truncate" title={step.title}>
                                    {step.title}
                                </span>
                            </div>
                            <span className="font-mono text-sm">
                                {(step.prize / 1000).toLocaleString('pt-BR')}k
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
