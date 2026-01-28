import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const apiKey = envConfig.GEMINI_API_KEY;

console.log(`Using API Key: ${apiKey ? apiKey.substring(0, 5) + '...' : 'NONE'}`);

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    console.log("--- Testing SDK Models ---");
    const modelsToTest = ["gemini-1.5-flash", "gemini-pro"];

    for (const m of modelsToTest) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Test");
            console.log(`✅ SDK SUCCESS: ${m}`);
        } catch (e) {
            console.log(`❌ SDK FAILED: ${m}`);
            console.log(`   MSG: ${e.message}`);
        }
    }

    console.log("\n--- Testing Raw REST API (gemini-1.5-flash) ---");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello" }] }]
            })
        });

        const data = await response.json();
        if (response.ok) {
            console.log("✅ RAW REST SUCCEEDED!");
        } else {
            console.log("❌ RAW REST FAILED");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Raw Fetch Error:", e);
    }
}

run();
