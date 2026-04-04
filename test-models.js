import fs from 'fs';

async function checkModels() {
  try {
    const envFile = fs.readFileSync('.env', 'utf-8');
    const keyMatch = envFile.match(/GEMINI_API_KEY=(.+)/);
    if (!keyMatch) {
      console.log('No GEMINI_API_KEY found in .env');
      return;
    }
    const key = keyMatch[1].trim().replace(/['"]/g, '');
    
    // We do a raw REST fetch to Google to bypass any "@google/generative-ai" SDK quirks
    // and see EXACTLY what models your specific API key is allowed to see!
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    
    if (data.error) {
      console.error('Google API Error:', data.error);
    } else {
      console.log('--- MODELS YOUR KEY HAS ACCESS TO ---');
      const supported = data.models
        .filter(m => m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));
      console.log(supported.join(', '));
    }
  } catch (err) {
    console.error('Failed to run test:', err.message);
  }
}

checkModels();
