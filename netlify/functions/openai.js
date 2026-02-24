const https = require('https');

exports.handler = async function(event) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const API_KEY = process.env.OPENAI_KEY;

  try {
    const body = JSON.parse(event.body || '{}');
    const prompt = body.prompt || '';

    const postData = JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      temperature: 0.4,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) reject(new Error(parsed.error.message));
            else resolve(parsed.choices?.[0]?.message?.content || 'No description available.');
          } catch(e) {
            reject(new Error('Invalid JSON from OpenAI'));
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    return { statusCode: 200, headers, body: JSON.stringify({ text }) };

  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
