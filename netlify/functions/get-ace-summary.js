const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Google AI client using the secret key from Netlify's settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle CORS pre-flight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const { analysisData, parameters, focus, boardName } = JSON.parse(event.body);

    // --- V2: HIGHLY IMPROVED AND SPECIFIC PROMPT ENGINEERING ---
    let prompt = `You are a strategic healthcare performance analyst specializing in interpreting the Archetype Creation Engine (ACE) model. Your task is to provide a comprehensive executive summary based ONLY on the JSON data provided. Do not invent new sections like SWOT or Financial Performance.

    The analysis was conducted with the following parameters:
    - Baseline Period: ${new Date(parameters.baselineStart).toLocaleDateString('en-GB')} to ${new Date(parameters.baselineEnd).toLocaleDateString('en-GB')}
    - Performance Period: ${new Date(parameters.performanceStart).toLocaleDateString('en-GB')} to ${new Date(parameters.performanceEnd).toLocaleDateString('en-GB')}
    
    The provided JSON ('analysisData') is an array of objects, where each object represents a healthcare service. Key fields for your analysis are 'board', 'specialty', 'currentArchetype', 'priorityBand', 'nationalRank', and 'trajectory'.

    ---
    YOUR TASK:
    `;

    if (focus === 'board' && boardName) {
        prompt += `Generate a board-specific strategic review for NHS ${boardName}. Address the following points clearly:
        1.  Start with a qualitative profile of the board's overall service health based on the distribution of Priority Bands.
        2.  Compare its performance profile directly to the national average, highlighting key differences in risk distribution.
        3.  Identify internal patterns, concentrations of risk (e.g., specific archetypes or specialties), or likely root causes for its high-priority services.
        4.  Suggest a prioritized list of 2-3 specific, actionable recommendations for management based directly on the archetype diagnoses.
        
        Your entire response MUST be a single HTML block using only <ul> and <li> tags for structure. Do NOT use markdown headers like ##. Base all findings exclusively on the provided JSON data.`;
    } else {
        prompt += `Generate a national-level executive summary for the entire dataset. Address the following points clearly:
        1.  Provide a high-level statement on the overall health of the system based on the distribution of archetypes and priority bands.
        2.  Identify the most significant systemic weaknesses revealed by the most common 'Critical Failure' or 'Severe Risk' archetypes.
        3.  Pinpoint any geographic hotspots (boards that are struggling disproportionately).
        4.  Highlight any positive outliers or areas of potential best practice.
        
        Your entire response MUST be a single HTML block using only <ul> and <li> tags for structure. Do NOT use markdown headers like ##. Base all findings exclusively on the provided JSON data.`;
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
