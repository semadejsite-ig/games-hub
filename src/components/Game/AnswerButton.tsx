import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming I need to create this or use clsx directly. I'll use clsx directly if utils is missing, but standards usually have it. I'll fallback to inline clsx/twMerge if needed.

interface AnswerButtonProps {
    option: string;
    index: number;
    state?: 'default' | 'selected' | 'correct' | 'wrong' | 'hidden';
    onClick: () => void;
    disabled?: boolean;
}

export function AnswerButton({ option, index, state = 'default', onClick, disabled }: AnswerButtonProps) {
    if (state === 'hidden') {
        return <div className="h-16 w-full invisible" />;
    }

    const baseStyles = "relative w-full p-4 rounded-full border-2 text-white font-bold text-lg transition-all transform active:scale-95 flex items-center shadow-lg";

    const variants = {
        default: "bg-blue-900 border-blue-500 hover:bg-blue-800 hover:border-yellow-400",
        selected: "bg-yellow-600 border-white scale-105 shadow-yellow-500/50",
        correct: "bg-green-600 border-green-300 animate-pulse shadow-green-500/50",
        wrong: "bg-red-600 border-red-300 shadow-red-500/50",
    };

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(baseStyles, variants[state])}
            onClick={onClick}
            disabled={disabled || state !== 'default'}
        >
            <span className="bg-yellow-500 text-blue-900 rounded-full w-8 h-8 flex items-center justify-center mr-4 border border-white">
                {index + 1}
            </span>
            <span className="flex-1 text-left">{option}</span>
        </motion.button>
    );
}
