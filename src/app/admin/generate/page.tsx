'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Save, Sparkles, Trash2 } from 'lucide-react';

interface AIQuestion {
  text: string;
  options: string[];
  correct_option: number;
  difficulty: string;
  correct_details: string;
}

export default function GeneratorPage() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<AIQuestion[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const supabase = createClient();

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    setGenerated([]);
    setSavedCount(0);

    try {
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, amount: 5 })
      });
      const data = await res.json();

      if (data.questions) {
        setGenerated(data.questions);
      }
    } catch (e) {
      alert('Erro ao gerar: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (index: number) => {
    const q = generated[index];
    const { error } = await supabase.from('questions').insert(q);

    if (!error) {
      setGenerated(prev => prev.filter((_, i) => i !== index));
      setSavedCount(prev => prev + 1);
    } else {
      alert('Erro ao salvar no banco: ' + error.message);
    }
  };

  // Helper to get letter for index
  const getLetter = (i: number) => ['A', 'B', 'C', 'D'][i];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-yellow-500">
          <Sparkles /> Gerador de Perguntas com IA
        </h1>

        {/* Input Area */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8 flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-2">Tema Bíblico (Ex: "Milagres de Jesus", "Livro de Daniel")</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="Digite o tema..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !topic}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
            GERAR
          </button>
        </div>

        {/* Results Area */}
        {savedCount > 0 && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 p-4 rounded-xl mb-6 text-center">
            {savedCount} pergunta(s) salva(s) com sucesso no banco de dados!
          </div>
        )}

        <div className="space-y-6">
          {generated.map((q, index) => (
            <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl p-6 relative group hover:border-blue-500/50 transition-colors">

              <div className="flex justify-between items-start mb-4">
                <span className={`
                            text-xs font-bold px-2 py-1 rounded uppercase
                            ${q.difficulty === 'easy' ? 'bg-green-900 text-green-400' :
                    q.difficulty === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                      'bg-red-900 text-red-400'}
                        `}>
                  {q.difficulty}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenerated(prev => prev.filter((_, i) => i !== index))}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Descartar"
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleSave(index)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white py-1 px-4 rounded-lg font-bold text-sm transition-colors"
                  >
                    <Save size={16} /> APROVAR
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4">{q.text}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`
                                    p-3 rounded-lg border 
                                    ${i === q.correct_option
                        ? 'bg-green-900/20 border-green-500/50 text-green-200'
                        : 'bg-slate-950 border-slate-800 text-gray-400'}
                                `}
                  >
                    <span className="font-bold opacity-50 mr-2">{getLetter(i)}.</span> {opt}
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm text-blue-300 bg-blue-900/20 p-2 rounded inline-block">
                💡 {q.correct_details}
              </p>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
