const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local to find the key
const envPath = path.resolve(__dirname, '../.env.local');
let apiKey = '';

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) apiKey = match[1].trim();
} catch (e) {
    console.error("Could not read .env.local");
    process.exit(1);
}

console.log(`Checking models for API Key: ${apiKey.substring(0, 8)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.error("API Error:", json.error.message);
            } else if (json.models) {
                console.log("\n✅ AVAILABLE MODELS:");
                json.models.forEach(m => {
                    console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
                });
            } else {
                console.log("Response:", json);
            }
        } catch (e) {
            console.error("Parse Error:", e);
        }
    });
}).on('error', (err) => {
    console.error("Request Error:", err);
});
