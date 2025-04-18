const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

// Create Express app
const app = express();

// Configure CORS for your frontend
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Parse JSON requests
app.use(express.json());

// Common configuration and functions
const OPENROUTER_CONFIG = {
  baseURL: "https://openrouter.ai/api/v1",
  model: "deepseek/deepseek-r1:free",
  apiKey: process.env.OPENROUTER_API_KEY
};

// Create OpenAI client once
const createClient = () => new OpenAI({
  baseURL: OPENROUTER_CONFIG.baseURL,
  apiKey: OPENROUTER_CONFIG.apiKey,
  dangerouslyAllowBrowser: true
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Algorithm Analysis API is running!');
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    apiKeyConfigured: !!OPENROUTER_CONFIG.apiKey
  });
});

// Algorithm explanation endpoint
app.post('/api/explain-algorithm', async (req, res) => {
  console.log('Received algorithm explanation request');

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    console.log(`Code length: ${code.length} characters`);

    // Check for API key
    if (!OPENROUTER_CONFIG.apiKey) {
      console.error('API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        explanation: "Server configuration error. API key not set."
      });
    }

    const client = createClient();
    const prompt = `
Provide a clear, educational explanation of the following Python code or algorithm.
Format your response with the following sections:

# Explanation of the Python Code

## High-Level Purpose
[Explain what the code does overall]

## Key Steps
* [Bullet point for first main step]
* [Bullet point for second main step]
* [Etc.]

## Notable Techniques/Data Structures
* [Bullet point about techniques used]
* [Bullet point about data structures]

## Examples
* Example 1: [Show input/output example]
* Example 2: [Show another example]
* Example 3: [Show edge case if relevant]

## Edge Cases/Limitations
* [Bullet point about limitation]
* [Bullet point about edge case]

Please use proper markdown formatting with bullet points (*) and section headers (##).
Do NOT use double asterisks (**) for emphasis.

Python code:
\`\`\`python
${code}
\`\`\``;

    console.log('Sending request to API...');
    const completion = await client.chat.completions.create({
      model: OPENROUTER_CONFIG.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.2
    });

    console.log('Received API response');
    const explanation = completion.choices[0].message.content;
    console.log('Response received, length:', explanation.length);

    return res.json({
      explanation: explanation,
      status: 'success'
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error: ' + error.message,
      explanation: "Could not generate explanation. Server error occurred."
    });
  }
});

// Complexity analysis endpoint
app.post('/api/analyze-complexity', async (req, res) => {
  console.log('Received complexity analysis request');

  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    console.log(`Code length: ${code.length} characters`);

    // Check for API key
    if (!OPENROUTER_CONFIG.apiKey) {
      console.error('API key not configured');
      return res.status(500).json({
        error: 'API key not configured',
        timeComplexity: "Error",
        spaceComplexity: "Error",
        bestCase: "Error",
        worstCase: "Error",
        isKnownAlgorithm: false,
        description: "Server configuration error. API key not set."
      });
    }

    const client = createClient();
    const prompt = `
Analyze the time and space complexity of the following Python code.
Your response must be a valid JSON object with the following structure:
{
  "timeComplexity": "O(...)", 
  "spaceComplexity": "O(...)",
  "bestCase": "O(...)", 
  "worstCase": "O(...)",
  "algorithmName": "...", 
  "isKnownAlgorithm": true/false,
  "description": "..."
}

Only return the JSON object, nothing else.

Python code:
\`\`\`python
${code}
\`\`\``;

    console.log('Sending request to API...');
    const completion = await client.chat.completions.create({
      model: OPENROUTER_CONFIG.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.1
    });

    console.log('Received API response');
    const responseText = completion.choices[0].message.content;

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const analysisJson = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON response');
        return res.json(analysisJson);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return res.status(500).json({
          error: 'Failed to parse API response',
          timeComplexity: "Error",
          spaceComplexity: "Error",
          bestCase: "Error",
          worstCase: "Error",
          isKnownAlgorithm: false,
          description: "Could not analyze algorithm complexity. Please try again later."
        });
      }
    } else {
      console.error('No JSON found in API response');
      return res.status(500).json({
        error: 'Invalid API response format',
        timeComplexity: "Error",
        spaceComplexity: "Error",
        bestCase: "Error",
        worstCase: "Error",
        isKnownAlgorithm: false,
        description: "Could not analyze algorithm complexity. Please try again later."
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Server error: ' + error.message,
      timeComplexity: "Error",
      spaceComplexity: "Error",
      bestCase: "Error",
      worstCase: "Error",
      isKnownAlgorithm: false,
      description: "Could not analyze algorithm complexity. Server error occurred."
    });
  }
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Algorithm Analysis API running at http://localhost:${PORT}`);
  console.log(`OpenRouter API key configured: ${!!OPENROUTER_CONFIG.apiKey}`);
});