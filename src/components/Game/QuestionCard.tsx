import { motion } from 'framer-motion';

interface QuestionCardProps {
    text: string;
}

export function QuestionCard({ text }: QuestionCardProps) {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-blue-950/80 border-4 border-blue-400 p-6 rounded-2xl shadow-2xl backdrop-blur-sm mb-6 min-h-[120px] flex items-center justify-center text-center"
        >
            <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">
                {text}
            </h2>
        </motion.div>
    );
}
