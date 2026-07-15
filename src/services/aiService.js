// Groq API & Mock Fallback Service

const GROQ_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAIN_MODEL = "llama-3.3-70b-versatile";

// Resolve API key: env var is always the primary source.
// settings.groqApiKey is only used as a fallback (e.g. for tests).
function resolveApiKey(settings) {
  return import.meta.env.VITE_GROQ_API_KEY || settings?.groqApiKey || '';
}

// Helper to make fetch request to Groq API
async function callGroqAPI(systemPrompt, userPrompt, apiKey, jsonMode = false) {
  if (!apiKey) {
    throw new Error("Groq API Key is missing");
  }

  const response = await fetch(GROQ_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MAIN_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
      response_format: jsonMode ? { type: "json_object" } : undefined
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ----------------------------------------------------
// 1. INTENT PARSING ENGINE
// ----------------------------------------------------
export async function parseIntent(prompt, settings) {
  const groqApiKey = resolveApiKey(settings);
  const isMockMode = settings?.isMockMode;

  const systemPrompt = `You are PromptFolio's intent parser for a Solana portfolio manager.
Parse the user's natural language instruction and return ONLY a valid JSON object — no markdown, no explanation.

Return this structure:
{
  "intent": "rebalance" | "send" | "buy" | "sell" | "query" | "unknown",
  "confidence": 0.0–1.0,
  "parsed_summary": "short human-readable summary of what will happen",
  "tokens_involved": ["SOL", "USDC", ...],
  "allocations": { "SOL": 40, "USDC": 30, ... },  // only for rebalance intents, % values
  "recipient": "name or address",  // only for send intents
  "amount": 20,  // only for send intents
  "currency": "USDC",  // only for send intents
  "estimated_fees": "$0.01–$0.05",
  "estimated_slippage": "0.2%–0.6%",
  "warnings": ["string", ...],  // any risk warnings to surface to user
  "explanation": "1–2 sentence plain-English breakdown of this transaction shown to user"
}`;

  if (isMockMode || !groqApiKey) {
    // Delay to simulate API call latency (600ms)
    await new Promise(resolve => setTimeout(resolve, 600));
    return parseMockIntent(prompt);
  }

  try {
    const rawResult = await callGroqAPI(systemPrompt, prompt, groqApiKey, true);
    return JSON.parse(rawResult);
  } catch (error) {
    console.error("Groq Intent Parse error, falling back to mock:", error);
    // Return mock with a small explanation indicator or let it fail gracefully
    return parseMockIntent(prompt);
  }
}

// Robust Regex Mock Intent Parser
function parseMockIntent(prompt) {
  const cleanPrompt = prompt.toLowerCase().trim();

  // 1. Send Intent
  // e.g. "Send 20 USDC to Alex", "send 1.5 SOL to 4vMsoUT2BWatFweudnQM1xedRLfJgJ7hsWhcDtZkY2hf"
  const sendRegex = /send\s+([\d.]+)\s*([a-zA-Z]+)\s+to\s+([a-zA-Z0-9_]+)/i;
  const sendMatch = cleanPrompt.match(sendRegex);

  if (sendMatch) {
    const amount = parseFloat(sendMatch[1]);
    const currency = sendMatch[2].toUpperCase();
    const recipient = sendMatch[3];

    // Standard contacts lookup to mock warning if unknown address
    const knownContacts = ["alex", "sarah", "mike"];
    const isKnown = knownContacts.includes(recipient.toLowerCase()) || recipient.length > 20;

    return {
      intent: "send",
      confidence: 0.98,
      parsed_summary: `Send ${amount} ${currency} to ${recipient}`,
      tokens_involved: [currency],
      recipient: recipient,
      amount: amount,
      currency: currency,
      estimated_fees: "$0.00005 (Solana network fee)",
      estimated_slippage: "0.0%",
      warnings: isKnown ? [] : ["Recipient address is not in your contacts. Double-check before sending."],
      explanation: `Transfer ${amount} ${currency} directly to ${recipient}. This transaction settles instantly on the Solana blockchain and is irreversible.`
    };
  }

  // 2. Rebalance Intent
  // e.g. "Rebalance: 50% SOL, 30% USDC, 20% JUP" or "Keep 40% in USDC and split the rest across AI tokens"
  const isRebalancePrompt = cleanPrompt.includes("rebalance") || cleanPrompt.includes("allocation") || cleanPrompt.includes("split") || cleanPrompt.includes("keep");

  if (isRebalancePrompt) {
    // Let's parse custom percentage tokens
    const allocations = {};
    const tokensInvolved = [];
    
    // Look for patterns like "50% SOL", "SOL 50%", "40% in USDC"
    const pctTokenRegex = /([\d]+)%\s*(?:in\s+)?([a-zA-Z]+)|([a-zA-Z]+)\s*(?:at\s+)?([\d]+)%/g;
    let match;
    let totalPctParsed = 0;

    while ((match = pctTokenRegex.exec(cleanPrompt)) !== null) {
      let pct = 0;
      let token = "";
      if (match[1]) {
        pct = parseInt(match[1]);
        token = match[2].toUpperCase();
      } else {
        token = match[3].toUpperCase();
        pct = parseInt(match[4]);
      }
      allocations[token] = pct;
      tokensInvolved.push(token);
      totalPctParsed += pct;
    }

    // Default allocations if we couldn't parse correctly or user typed vague rebalance instruction
    if (tokensInvolved.length === 0) {
      if (cleanPrompt.includes("ai tokens") || cleanPrompt.includes("render")) {
        allocations["USDC"] = 40;
        allocations["SOL"] = 30;
        allocations["RENDER"] = 30;
        tokensInvolved.push("USDC", "SOL", "RENDER");
      } else {
        // Standard rebalance default
        allocations["SOL"] = 50;
        allocations["USDC"] = 30;
        allocations["JUP"] = 20;
        tokensInvolved.push("SOL", "USDC", "JUP");
      }
    } else if (totalPctParsed < 100 && tokensInvolved.length > 0) {
      // split remaining percentage into USDC or SOL
      const remaining = 100 - totalPctParsed;
      if (!allocations["USDC"]) {
        allocations["USDC"] = remaining;
        tokensInvolved.push("USDC");
      } else if (!allocations["SOL"]) {
        allocations["SOL"] = remaining;
        tokensInvolved.push("SOL");
      } else {
        // add to first token
        allocations[tokensInvolved[0]] += remaining;
      }
    }

    const allocationSummary = Object.entries(allocations).map(([t, v]) => `${v}% ${t}`).join(', ');

    return {
      intent: "rebalance",
      confidence: 0.94,
      parsed_summary: `Rebalance portfolio to ${allocationSummary}`,
      tokens_involved: tokensInvolved,
      allocations: allocations,
      estimated_fees: "$0.02–$0.04 (Solana DEX fees)",
      estimated_slippage: "0.3%–0.5% (Jupiter aggregator slippage)",
      warnings: [
        "Rebalancing involves executing DEX swaps. Muted price slippage may occur during market volatility.",
        "Reducing exposure to certain assets might trigger taxable capital gains events."
      ],
      explanation: `Adjust your current portfolio allocations to targets: ${allocationSummary}. This will initiate simulated swaps on Solana via Jupiter aggregator to achieve the percentages.`
    };
  }

  // 3. Query / Unknown / Low Confidence Intents
  // e.g. "Is my portfolio risky?"
  if (cleanPrompt.includes("risky") || cleanPrompt.includes("risk") || cleanPrompt.includes("worth") || cleanPrompt.includes("holding") || cleanPrompt.includes("help")) {
    return {
      intent: "query",
      confidence: 0.90,
      parsed_summary: "Portfolio Analysis / Query",
      tokens_involved: [],
      estimated_fees: "N/A",
      estimated_slippage: "N/A",
      warnings: [],
      explanation: "You are asking a general question about your holdings. I will provide direct portfolio insights via the chat interface."
    };
  }

  // Unknown intent (triggers safety gate warning, no approve button)
  return {
    intent: "unknown",
    confidence: 0.40,
    parsed_summary: "Unrecognized instruction",
    tokens_involved: [],
    estimated_fees: "N/A",
    estimated_slippage: "N/A",
    warnings: ["Could not identify a clear rebalance, send, or query action in this prompt."],
    explanation: `I'm not sure what you mean by "${prompt}". Solana portfolio commands should be instructions like 'Rebalance: 50% SOL, 50% USDC' or 'Send 10 USDC to Alex'. Please rephrase.`
  };
}

// ----------------------------------------------------
// 2. POST-TRANSACTION CONFIRMATION CHAT MESSAGE
// ----------------------------------------------------
export async function generatePostExecutionMessage(transactionJson, settings) {
  const groqApiKey = resolveApiKey(settings);
  const isMockMode = settings?.isMockMode;

  const systemPrompt = `You are PromptFolio, a friendly AI portfolio assistant on Solana. The user just executed a transaction.
Write a short (2–3 sentence) friendly confirmation message acknowledging what was done, any notable details, and a brief insight or tip.
Keep it conversational, not robotic. No markdown.`;

  const userPrompt = JSON.stringify(transactionJson);

  if (isMockMode || !groqApiKey) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return getMockPostExecutionMessage(transactionJson);
  }

  try {
    return await callGroqAPI(systemPrompt, userPrompt, groqApiKey);
  } catch (error) {
    console.error("Groq PostExecutionMessage error, using mock:", error);
    return getMockPostExecutionMessage(transactionJson);
  }
}

function getMockPostExecutionMessage(tx) {
  if (tx.intent === "rebalance") {
    const allocationsText = Object.entries(tx.allocations || {})
      .map(([k, v]) => `${v}% ${k}`)
      .join(', ');
    return `Awesome! Your portfolio rebalance to ${allocationsText} has been executed. Swaps were routed through Jupiter DEX to secure minimal slippage. Tip: Rebalancing during stable market hours helps minimize trading costs.`;
  } else if (tx.intent === "send") {
    return `Transaction complete! Sent ${tx.amount} ${tx.currency} to ${tx.recipient}. The transfer finalized on Solana in 400ms. Insight: You can quickly initiate another transfer by writing 'Send [amount] to [name]' anytime!`;
  }
  return `Transaction successfully simulated! All updates are now reflected in your PromptFolio holdings dashboard. Let me know if there's anything else I can help you parse.`;
}

// ----------------------------------------------------
// 3. AI PORTFOLIO ADVISOR (RIGHT PANEL)
// ----------------------------------------------------
export async function askAdvisor(question, portfolioJson, settings) {
  const groqApiKey = resolveApiKey(settings);
  const isMockMode = settings?.isMockMode;

  const systemPrompt = `You are a crypto portfolio advisor. The user has the following holdings: ${JSON.stringify(portfolioJson)}.
Answer their question concisely (3–5 sentences max). Be specific to their actual portfolio. No markdown.`;

  if (isMockMode || !groqApiKey) {
    await new Promise(resolve => setTimeout(resolve, 600));
    return getMockAdvisorResponse(question, portfolioJson);
  }

  try {
    return await callGroqAPI(systemPrompt, question, groqApiKey);
  } catch (error) {
    console.error("Groq Advisor error, using mock:", error);
    return getMockAdvisorResponse(question, portfolioJson);
  }
}

function getMockAdvisorResponse(question, holdings) {
  const q = question.toLowerCase();
  const solHolding = holdings.find(h => h.token === "SOL");
  const usdcHolding = holdings.find(h => h.token === "USDC");
  
  const solAllocation = solHolding ? solHolding.allocation : 0;
  const usdcAllocation = usdcHolding ? usdcHolding.allocation : 0;

  if (q.includes("risk") || q.includes("risky") || q.includes("volatile")) {
    return `Your portfolio allocates ${solAllocation}% to SOL, which carries high beta. However, your cash reserve of ${usdcAllocation}% USDC acts as a solid hedge, keeping you liquid. To decrease risk further, you could reallocate 5% from RENDER or JUP into USDC. Overall, this is a balanced DeFi allocation.`;
  }
  if (q.includes("rebalance") || q.includes("when")) {
    return `A good rule of thumb is to rebalance when any asset drifts by more than 5% from its target allocation, or once a month. Right now, your allocations are stable. If SOL runs up significantly, you'll want to lock in profits by moving excess value back to USDC.`;
  }
  if (q.includes("yield") || q.includes("passive") || q.includes("earn")) {
    return `To earn passive yield on this portfolio, you could supply your ${usdcAllocation}% USDC holding to Kamino Finance or Solend for 6-9% APY. Additionally, your SOL can be liquid-staked (e.g., swapped for JitoSOL) to earn 7% staking yield without locking your capital. Let me know if you want to write a rebalance command for this.`;
  }

  return `Looking at your holdings, you have a solid mix of core crypto (SOL), stablecoins (USDC), and ecosystem utility tokens (JUP & RENDER). Your largest exposure is SOL at ${solAllocation}%, which drives your portfolio performance. I recommend keeping a 20-30% USDC cash cushion to buy dips during market corrections.`;
}

// ----------------------------------------------------
// 4. MONTHLY REPORT INSIGHT GENERATION
// ----------------------------------------------------
export async function generateMonthlyReportInsight(monthName, tradesJson, settings) {
  const groqApiKey = resolveApiKey(settings);
  const isMockMode = settings?.isMockMode;

  const systemPrompt = `You are a crypto portfolio advisor. The user has the following monthly trade data for ${monthName}: ${JSON.stringify(tradesJson)}.
Provide a 2-sentence portfolio insight or performance summary. No markdown.`;

  if (isMockMode || !groqApiKey) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return `During ${monthName}, you executed several portfolio adjustments that successfully hedged against local token swings. Maintaining a cash buffer in USDC helped absorb Solana network fluctuations, resulting in optimized execution.`;
  }

  try {
    return await callGroqAPI(systemPrompt, `Generate 2-sentence summary for trades: ${JSON.stringify(tradesJson)}`, groqApiKey);
  } catch (error) {
    console.error("Groq Monthly Insight error, using mock:", error);
    return `In ${monthName}, PromptFolio routed your transactions via aggregator services, minimizing slippage. Locking in gains during mid-month peaks helped secure positive capital growth.`;
  }
}
