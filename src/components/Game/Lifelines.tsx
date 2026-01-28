import { LifelineType, LifelineState } from '@/types/game';
import { Scissors, Users, Crown, Shield } from 'lucide-react';
// Scissors -> "Corta" (Elimina 2)
// Users -> "Irmãos" (Placas)
// Crown -> "Pastor" (Autoridade/Convidados)
// Shield -> "Livramento" (Pular/Proteção)

interface LifelinesProps {
    lifelines: { [key in LifelineType]: LifelineState };
    onUse: (type: LifelineType) => void;
    disabled: boolean;
}

export function Lifelines({ lifelines, onUse, disabled }: LifelinesProps) {
    const renderButton = (type: LifelineType, icon: React.ReactNode, label: string) => {
        const state = lifelines[type];
        const isAvailable = state.available && !state.used;

        return (
            <button
                onClick={() => onUse(type)}
                disabled={!isAvailable || disabled}
                className={`
          flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all
          ${isAvailable
                        ? 'bg-blue-600 border-blue-400 hover:bg-blue-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-500 opacity-50 cursor-not-allowed'}
        `}
            >
                <div className="mb-1">{icon}</div>
                <span className="text-[10px] md:text-xs font-bold uppercase text-center leading-tight max-w-[60px]">{label}</span>
            </button>
        );
    };

    return (
        <div className="grid grid-cols-4 gap-2 w-full max-w-md mx-auto mb-6">
            {renderButton('cards', <Scissors size={24} />, 'Cortar Joio')}
            {renderButton('placa', <Users size={24} />, 'Irmãos')}
            {renderButton('guests', <Crown size={24} />, 'Pastor')}
            {renderButton('skip', <Shield size={24} />, 'Livramento')}
        </div>
    );
}
