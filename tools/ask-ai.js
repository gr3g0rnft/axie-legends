// tools/ask-ai.js - Version OpenRouter con soporte para prompt file
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env');
if (!fs.existsSync(envPath)) {
    console.error('❌ No se encuentra .env en la raíz del proyecto');
    process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const match = envContent.match(/OPENROUTER_API_KEY=(.+)/);
const API_KEY = match ? match[1].trim() : null;

if (!API_KEY) {
    console.error('❌ Configura OPENROUTER_API_KEY en .env');
    process.exit(1);
}

const arg1 = process.argv[2];
const arg2 = process.argv[3];

let pregunta = '';
let archivoCodigo = null;

if (arg1 && arg1.startsWith('@')) {
    const promptPath = arg1.slice(1);
    if (!fs.existsSync(promptPath)) {
        console.error(`❌ No existe el archivo de prompt: ${promptPath}`);
        process.exit(1);
    }
    pregunta = fs.readFileSync(promptPath, 'utf-8');
    archivoCodigo = arg2;
} else {
    pregunta = arg1;
    archivoCodigo = arg2;
}

if (!pregunta) {
    console.log('Uso: node tools/ask-ai.js "pregunta" [archivo.js]');
    console.log('     node tools/ask-ai.js @prompt.txt [archivo.js]');
    process.exit(1);
}

let contexto = '';
if (archivoCodigo && fs.existsSync(archivoCodigo)) {
    const contenido = fs.readFileSync(archivoCodigo, 'utf-8');
    contexto = `\n\nArchivo (${archivoCodigo}):\n\`\`\`javascript\n${contenido}\n\`\`\``;
    console.log(`📄 Archivo adjunto: ${archivoCodigo} (${contenido.length} chars)`);
}

console.log('🤖 Consultando IA...\n');

const messages = [
    { role: 'system', content: 'Eres un experto senior en Three.js, JavaScript y desarrollo de videojuegos MOBA. Respondes con código concreto, ejemplos claros y explicaciones técnicas precisas. Cuando te piden refactorizar o agregar features, das el código completo listo para pegar.' },
    { role: 'user', content: pregunta + contexto }
];

try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://axielegends.local',
            'X-Title': 'AxieLegends Dev'
        },
        body: JSON.stringify({
            model: 'nvidia/nemotron-3-ultra-550b-a55b',
            messages,
            max_tokens: 8000,
            temperature: 0.7
        })
    });

    const data = await res.json();

    if (data.error) {
        console.error('❌ Error:', data.error);
        process.exit(1);
    }

    console.log('📝 Respuesta:\n');
    console.log(data.choices[0].message.content);
    console.log('\n' + '─'.repeat(60));
    console.log(`💰 Tokens: ${data.usage?.total_tokens || '?'}`);

} catch (err) {
    console.error('❌ Error de red:', err.message);
}