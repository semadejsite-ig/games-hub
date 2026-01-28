import { Question } from '@/types/game';

export const QUESTIONS: Question[] = [
    // EASY (Levels 1-5)
    {
        id: 1,
        text: "Quem foi o primeiro homem criado por Deus?",
        options: ["Abraão", "Moisés", "Adão", "Noé"],
        correctOptionIndex: 2,
        correctDetails: "Adão",
        difficulty: 'easy'
    },
    {
        id: 2,
        text: "Qual animal engoliu o profeta Jonas?",
        options: ["Um leão", "Uma baleia (grande peixe)", "Um urso", "Um jacaré"],
        correctOptionIndex: 1,
        correctDetails: "Uma baleia (grande peixe)",
        difficulty: 'easy'
    },
    {
        id: 3,
        text: "Quantos discípulos Jesus escolheu principamente?",
        options: ["12", "7", "3", "70"],
        correctOptionIndex: 0,
        correctDetails: "12",
        difficulty: 'easy'
    },
    {
        id: 4,
        text: "Em quantos dias Deus criou o mundo segundo Gênesis 1?",
        options: ["3 dias", "6 dias", "7 dias", "10 dias"],
        correctOptionIndex: 1,
        correctDetails: "6 dias (descansou no sétimo)",
        difficulty: 'easy'
    },
    {
        id: 5,
        text: "Qual era o nome da esposa de Isaque?",
        options: ["Sara", "Rebeca", "Raquel", "Lia"],
        correctOptionIndex: 1,
        correctDetails: "Rebeca",
        difficulty: 'easy'
    },

    // MEDIUM (Levels 6-10)
    {
        id: 6,
        text: "Quem interpretou o sonho do Faraó no Egito?",
        options: ["Daniel", "José", "Elias", "Arão"],
        correctOptionIndex: 1,
        correctDetails: "José",
        difficulty: 'medium'
    },
    {
        id: 7,
        text: "Para qual cidade Paulo estava indo quando viu uma grande luz?",
        options: ["Jerusalém", "Jericó", "Damasco", "Roma"],
        correctOptionIndex: 2,
        correctDetails: "Damasco",
        difficulty: 'medium'
    },

    // HARD (Levels 11-15)
    {
        id: 11,
        text: "Qual o livro da Bíblia que vem logo após o livro de Jó?",
        options: ["Salmos", "Provérbios", "Isaías", "Ester"],
        correctOptionIndex: 0,
        correctDetails: "Salmos",
        difficulty: 'hard'
    },

    // MILLION
    {
        id: 16,
        text: "Qual é o capítulo mais curto da Bíblia?",
        options: ["Salmo 23", "Salmo 117", "Salmo 119", "Judas 1"],
        correctOptionIndex: 1,
        correctDetails: "Salmo 117",
        difficulty: 'million'
    }
];

export const PRIZE_LADDER = [
    { level: 1, prize: 1000, stop: 0, wrong: 0, title: "Hebreu no Egito" },
    { level: 2, prize: 2000, stop: 1000, wrong: 500, title: "Fugitivo de Faraó" },
    { level: 3, prize: 3000, stop: 2000, wrong: 1000, title: "Atravessador do Mar" },
    { level: 4, prize: 4000, stop: 3000, wrong: 1500, title: "Peregrino do Deserto" },
    { level: 5, prize: 5000, stop: 4000, wrong: 2000, title: "Bebedor da Rocha" },
    { level: 6, prize: 10000, stop: 5000, wrong: 2500, title: "Comedor de Maná" },
    { level: 7, prize: 20000, stop: 10000, wrong: 5000, title: "Observador da Nuvem" },
    { level: 8, prize: 30000, stop: 20000, wrong: 10000, title: "Guerreiro de Josué" },
    { level: 9, prize: 40000, stop: 30000, wrong: 15000, title: "Espia da Terra" },
    { level: 10, prize: 50000, stop: 40000, wrong: 20000, title: "Conquistador de Jericó" },
    { level: 11, prize: 100000, stop: 50000, wrong: 25000, title: "Juiz de Israel" },
    { level: 12, prize: 200000, stop: 100000, wrong: 50000, title: "Valente de Davi" },
    { level: 13, prize: 300000, stop: 200000, wrong: 100000, title: "Voz do Profeta" },
    { level: 14, prize: 400000, stop: 300000, wrong: 150000, title: "Apóstolo do Rei" },
    { level: 15, prize: 500000, stop: 400000, wrong: 200000, title: "Coluna da Igreja" },
    { level: 16, prize: 1000000, stop: 0, wrong: 0, title: "Cidadão do Céu" }
];
