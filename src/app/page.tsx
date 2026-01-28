import Link from 'next/link';
import { Play, Trophy, Star } from 'lucide-react';
import { Leaderboard } from '@/components/Platform/Leaderboard';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full">

      {/* Hero Section */}
      <section className="text-center mb-16 mt-8">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4">
          Bem-vindo ao <span className="text-yellow-500">Hub de Jogos</span>
        </h1>
        <p className="text-blue-200 text-lg max-w-2xl mx-auto">
          Participe, aprenda e some pontos para sua equipe. A diversão bíblica começa aqui.
        </p>
      </section>

      {/* Featured Games Grid */}
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Star className="text-yellow-500" /> JOGOS EM DESTAQUE
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Games */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Game Card: Show do Milhão */}
          <Link
            href="/games/show-do-milhao"
            className="group relative bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-1 border border-blue-700 hover:border-yellow-400 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            <div className="bg-slate-950/50 rounded-xl p-6 h-full flex flex-col">
              <div className="h-40 bg-blue-600/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-500/10 blur-xl group-hover:bg-yellow-500/10 transition-colors" />
                <Trophy size={64} className="text-yellow-500 relative z-10" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                Mestre da Palavra
              </h3>
              <p className="text-sm text-gray-400 mb-6 flex-1">
                Teste seus conhecimentos bíblicos e tente chegar ao prêmio máximo de 1 milhão de pontos!
              </p>

              <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                <Play size={18} fill="currentColor" /> JOGAR AGORA
              </button>
            </div>
          </Link>

          {/* Coming Soon Card */}
          <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center text-center opacity-70">
            <div className="h-20 w-20 bg-slate-800 rounded-full mb-4 flex items-center justify-center">
              <span className="text-3xl text-gray-600">?</span>
            </div>
            <h3 className="text-xl font-bold text-gray-400">Em Breve</h3>
            <p className="text-sm text-gray-600">Novos desafios chegando...</p>
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-1">
          <Leaderboard />
        </div>

      </div>

    </div>
  );
}
