'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { Loader2, Save, Sparkles, Trash2, CheckCircle, Zap } from 'lucide-react';

interface AIQuestion {
  text: string;
  options: string[];
  correct_option: number;
  difficulty: string;
  correct_details: string;
}

export default function GeneratorPage() {
  const [topic, setTopic] = useState('');
  const [amount, setAmount] = useState(5);
  const [autoSave, setAutoSave] = useState(false);
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
        body: JSON.stringify({ topic, amount })
      });
      const data = await res.json();

      if (data.questions) {
        if (autoSave) {
          // Bulk Insert Directly
          await handleBulkSave(data.questions);
        } else {
          // Show for review
          setGenerated(data.questions);
        }
      }
    } catch (e) {
      alert('Erro ao gerar: ' + e);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSave = async (questionsToSave: AIQuestion[]) => {
    const { error } = await supabase.from('questions').insert(questionsToSave);
    if (!error) {
      setSavedCount(questionsToSave.length);
      setGenerated([]); // Clear list
    } else {
      alert('Erro ao salvar no banco em massa: ' + error.message);
    }
  };

  const handleSave = async (index: number) => {
    const q = generated[index];
    const { error } = await supabase.from('questions').insert(q);

    if (!error) {
      setGenerated(prev => prev.filter((_, i) => i !== index));
      savedCountSuccess();
    } else {
      alert('Erro ao salvar no banco: ' + error.message);
    }
  };

  const savedCountSuccess = () => {
    setSavedCount(prev => prev + 1);
  };

  const getLetter = (i: number) => ['A', 'B', 'C', 'D'][i];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-2 text-yellow-500">
          <Sparkles /> Gerador de Perguntas com IA
        </h1>

        {/* Input Area */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8 space-y-4">

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">Tema Bíblico</label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Ex: Milagres, Davi, Apocalipse..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            <div className="w-full md:w-32">
              <label className="block text-sm text-gray-400 mb-2">Qtd.</label>
              <input
                type="number"
                min={1} max={50}
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoSave(!autoSave)}
                className={`
                            flex items-center gap-2 px-4 py-2 rounded-full border transition-all
                            ${autoSave
                    ? 'bg-purple-900/50 border-purple-500 text-purple-300'
                    : 'bg-slate-950 border-slate-700 text-gray-500'}
                        `}
              >
                <Zap size={18} className={autoSave ? "fill-current" : ""} />
                <span>{autoSave ? 'Modo Automático (Sem Curadoria)' : 'Revisar Perguntas (Manual)'}</span>
              </button>
              {autoSave && <span className="text-xs text-purple-400 animate-pulse">Salvará direto no banco!</span>}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
              GERAR
            </button>
          </div>
        </div>

        {/* Results Area */}
        {savedCount > 0 && (
          <div className="bg-green-900/20 border border-green-800 text-green-400 p-4 rounded-xl mb-6 text-center flex items-center justify-center gap-2">
            <CheckCircle size={24} />
            <span className="font-bold text-lg">{savedCount} pergunta(s) salva(s) com sucesso!</span>
          </div>
        )}

        {generated.length > 0 && !autoSave && (
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-300">Revisão ({generated.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setGenerated([])}
                className="text-gray-500 hover:text-white px-4 py-2"
              >
                Descartar Todas
              </button>
              <button
                onClick={() => handleBulkSave(generated)}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <Save size={18} /> Aprovar Tudo
              </button>
            </div>
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
                  >
                    <Trash2 size={18} />
                  </button>
                  <button
                    onClick={() => handleSave(index)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white py-1 px-4 rounded-lg font-bold text-sm transition-colors"
                  >
                    <Save size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{q.text}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${i === q.correct_option ? 'bg-green-900/20 border-green-500/50 text-green-200' : 'bg-slate-950 border-slate-800 text-gray-400'}`}>
                    <span className="font-bold opacity-50 mr-2">{getLetter(i)}.</span> {opt}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-blue-300 bg-blue-900/20 p-2 rounded inline-block">💡 {q.correct_details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
