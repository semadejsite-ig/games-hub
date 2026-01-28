import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  const { topic, amount = 5, difficulty = 'mix' } = await request.json();

  try {
    // Validated model from list_available_models.js
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log(`Generating with Gemini 2.5 Flash (Topic: ${topic})...`);

    const prompt = `
      Gere ${amount} perguntas bíblicas sobre o tema "${topic}" para um jogo estilo Show do Milhão.
      Dificuldade desejada: ${difficulty}.
      
      Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com este formato exacto:
      [
        {
          "text": "Pergunta aqui?",
          "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
          "correct_option": 0, // Índice 0-3 da resposta correta
          "difficulty": "medium", // easy, medium, hard, ou million
          "correct_details": "Explicação breve de onde está na bíblia"
        }
      ]
      Certifique-se que o JSON é válido.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini Success! Length:", text.length);

    // Clean up potential markdown formatting
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const questions = JSON.parse(cleanedText);

    return NextResponse.json({ questions });

  } catch (error: any) {
    console.error("Gemini API Error:", error.message);

    // FALLBACK MOCK (Modo Demonstração)
    // Se a API falhar (cota, modelo não encontrado), retornamos dados fictícios
    // para o usuário não ficar travado e poder testar o fluxo de "Salvar".
    console.log("⚠️ Activating Fallback Mock Data...");

    const mockQuestions = [
      {
        text: `(MOCK) Quem liderou o povo de Israel após a morte de Moisés (Tema: ${topic})?`,
        options: ["Josué", "Calebe", "Arão", "Gideão"],
        correct_option: 0,
        difficulty: "medium",
        correct_details: "Josué 1:1-9"
      },
      {
        text: `(MOCK) Qual destes é um livro do Pentateuco (Tema: ${topic})?`,
        options: ["Salmos", "Isaías", "Números", "Mateus"],
        correct_option: 2,
        difficulty: "easy",
        correct_details: "O Pentateuco são os 5 primeiros livros."
      },
      {
        text: `(MOCK) O que aconteceu no dia de Pentecostes (Tema: ${topic})?`,
        options: ["O mar se abriu", "Desceu fogo do céu", "O Espírito Santo desceu", "Jesus nasceu"],
        correct_option: 2,
        difficulty: "hard",
        correct_details: "Atos 2"
      },
      {
        text: `(MOCK) Pergunta gerada automaticamente sobre ${topic}?`,
        options: ["Resposta A", "Resposta B", "Resposta C", "Resposta Certa"],
        correct_option: 3,
        difficulty: "easy",
        correct_details: "Mock gerado por falha na API."
      },
      {
        text: `(MOCK) Última pergunta de teste sobre ${topic}?`,
        options: ["Errada", "Certa", "Errada", "Errada"],
        correct_option: 1,
        difficulty: "million",
        correct_details: "Apenas um teste de fallback."
      }
    ];

    return NextResponse.json({
      questions: mockQuestions,
      is_mock: true,
      error_reason: error.message
    });
  }
}
