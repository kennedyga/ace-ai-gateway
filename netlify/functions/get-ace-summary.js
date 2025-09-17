const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const payload = JSON.parse(event.body);

    // --- V3: FINAL, HIGHLY-DIRECTIVE PROMPT USING PRE-PROCESSED DATA ---
    const prompt = `You are an expert healthcare performance analyst.
    
    Your task is to write a concise, professional executive summary for a board-level strategic review.
    
    Use ONLY the following key findings that have been extracted for NHS ${payload.boardName} and do not add any extra sections or placeholders:

    - **Overall Health:**
      - Total Services Analyzed: ${payload.totalServicesInBoard}
      - Services in High-Priority Bands (Critical Failure or Severe Risk): ${payload.criticalServicesCount} (${payload.criticalPercentage}%)
      - Services with Positive Momentum (Improving Trajectory): ${payload.improvingCount}

    - **Primary Challenge:**
      - The most frequent archetype within high-priority services is: '${payload.topChallengeArchetype}'

    - **Performance vs. National Average (in % of services per band):**
      - Critical Failure: Board ${payload.boardDistribution.criticalFailure}% vs. National ${payload.nationalDistribution.criticalFailure}%
      - Severe Risk: Board ${payload.boardDistribution.severeRisk}% vs. National ${payload.nationalDistribution.severeRisk}%
      - High Concern: Board ${payload.boardDistribution.highConcern}% vs. National ${payload.nationalDistribution.highConcern}%
      - Moderate Concern: Board ${payload.boardDistribution.moderateConcern}% vs. National ${payload.nationalDistribution.moderateConcern}%
      - Monitor & Protect: Board ${payload.boardDistribution.monitorAndProtect}% vs. National ${payload.nationalDistribution.monitorAndProtect}%

    **INSTRUCTIONS:**
    1.  Synthesize these key findings into a fluid, narrative summary.
    2.  Provide 2-3 specific, actionable recommendations based *directly* on the "Primary Challenge" archetype identified.
    3.  The entire response MUST be a single HTML block using only <ul> and <li> tags for structure.
    4.  You MUST NOT use placeholders like '[Insert data]' or refer to 'JSON data'. Write the final summary as if all data has been provided.
    5.  Be direct, insightful, and concise.`;
    // --- END OF PROMPT ---
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
// Clean up the response by removing markdown formatting fences
    const cleanedText = text.replace(/^```html\n?/, '').replace(/```$/, '');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary: text }),
    };
  } catch (error) {
    console.error("Error:", error);
   return {
  statusCode: 200,
  headers,
  body: JSON.stringify({ summary: cleanedText }), // Use cleanedText here
};
  }
};
