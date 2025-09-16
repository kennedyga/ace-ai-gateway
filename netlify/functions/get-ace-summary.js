const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google AI client using the secret key from Netlify's settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  // Allow requests from any origin (for simplicity)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle pre-flight requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    const { analysisData, parameters, focus, boardName } = JSON.parse(event.body);

    // --- PROMPT ENGINEERING ---
    let prompt = `You are a professional healthcare performance analyst...`; // The full prompt as defined before
    if (focus === 'board' && boardName) {
        prompt += `Generate a board-specific strategic review for NHS ${boardName}...`; // Full prompt
    } else {
        prompt += `Generate a national-level executive summary...`; // Full prompt
    }
    // --- END OF PROMPT ENGINEERING ---
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary: text }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to communicate with the AI model." }),
    };
  }
};
