import { LifelineResult } from '@/types/game';
import { Crown, Users, X } from 'lucide-react';

interface LifelineModalProps {
    result: LifelineResult | null;
    onClose: () => void;
}

export function LifelineModal({ result, onClose }: LifelineModalProps) {
    if (!result) return null;

    const getLabel = (i: number) => (i + 1).toString();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <div className="text-center">
                    {result.type === 'guests' && (
                        <>
                            <div className="inline-block p-4 bg-yellow-900/30 rounded-full mb-4 ring-4 ring-yellow-900/20">
                                <Crown size={48} className="text-yellow-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-yellow-500 mb-2">O Pastor diz...</h3>
                            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 mb-4 relative">
                                {/* Speech bubble triangle */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-4 h-4 bg-slate-950 border-t border-l border-slate-800 rotate-45"></div>

                                <p className="text-lg text-gray-200 italic">
                                    "Irmão, eu estudei bastante sobre isso. Eu tenho quase certeza que a resposta correta é a número <strong className="text-yellow-400 text-xl">{getLabel(result.suggestion!)}</strong>."
                                </p>
                            </div>
                        </>
                    )}

                    {result.type === 'placa' && (
                        <>
                            <div className="inline-block p-4 bg-blue-900/30 rounded-full mb-4 ring-4 ring-blue-900/20">
                                <Users size={48} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-blue-400 mb-6">Votação da Igreja</h3>

                            <div className="space-y-4">
                                {result.stats!.map((percentage, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="font-bold w-6 text-gray-400">{getLabel(index)}</span>
                                        <div className="flex-1 h-8 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                            <div
                                                className="h-full bg-blue-600 flex items-center justify-end px-2 transition-all duration-1000 ease-out"
                                                style={{ width: `${percentage}%` }}
                                            >
                                                <span className="text-xs font-bold text-white">{percentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
