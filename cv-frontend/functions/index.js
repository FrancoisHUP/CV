// cv-frontend/functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const express = require("express");
const { GoogleAuth } = require("google-auth-library");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const project = "curriculum-vitae-e1d87"; // Your Google Cloud Project ID
const location = "us-central1";
const modelName = "gemini-1.5-flash-001";
const streamingEndpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${modelName}:streamGenerateContent?alt=sse`;
const auth = new GoogleAuth({
  keyFilename: "./curriculum-vitae-e1d87-1df8210ebba6.json",
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token;
}

/**
 * Converts a Node.js Readable stream into a WHATWG-style ReadableStream.
 */
function nodeStreamToWebStream(nodeStream) {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
  });
}

/* --- Retrieval Setup --- */

// Load precomputed data (each document must have a unique "doc_id" and an "embedding" array)
const preparedDataPath = path.join(__dirname, "rag_data.json");
const preparedData = JSON.parse(fs.readFileSync(preparedDataPath, "utf8"));

// Utility: Compute cosine similarity between two vectors.
function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB + 1e-8);
}

// Normalize an array of scores to [0, 1].
function normalize(scores) {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return scores.map(s => (s - min) / (max - min + 1e-8));
}

/**
 * Uses the OpenAI API to compute the embedding for a given query.
 * This example uses the "text-embedding-ada-002" model.
 */
async function getQueryEmbedding(query) {
  const openAIEmbeddingURL = "https://api.openai.com/v1/embeddings";
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Ensure this is set.
  const response = await fetch(openAIEmbeddingURL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: query,
      model: "text-embedding-ada-002"
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Performs retrieval using only embeddings.
 * It computes cosine similarities between the query embedding and each document,
 * then returns a concatenated context (first 100 words from each top document).
 */
async function getRelevantContext(query) {
  const queryEmbedding = await getQueryEmbedding(query);
  
  // Compute cosine similarity for each document.
  const cosineScores = preparedData.map(doc => cosineSimilarity(queryEmbedding, doc.embedding));
  
  // Normalize scores.
  const cosineNorm = normalize(cosineScores);
  
  // Get top K documents (e.g., top 3).
  const topK = 3;
  const indices = cosineNorm
    .map((score, idx) => ({ idx, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.idx);
  
  // Concatenate a snippet (first 100 words) from each top document.
  let context = "";
  indices.forEach(idx => {
    const doc = preparedData[idx];
    const snippet = doc.content.split(/\s+/).slice(0, 100).join(" ");
    context += snippet + "\n";
  });
  return context.trim();
}

/* --- Main Handler --- */

app.post("/fairyChat", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { message } = req.body;
  if (!message) {
    res.status(400).send("Missing message.");
    return;
  }

  // Retrieve context using only embeddings.
  let contextText;
  try {
    contextText = await getRelevantContext(message);
  } catch (err) {
    console.error("Retrieval Error:", err);
    contextText = "";
  }

  // Define instructions for the generation.
  const instructions = `You are an assistant specialized in answering questions about my portfolio. Use the following context to answer concisely in one short paragraph. Answer in a chat user and ai format.`;

  // Compose the full prompt.
  const fullPrompt = `${instructions}\nContext: ${contextText}\nQuestion: ${message}`;

  console.log("fullPrompt", fullPrompt)

  // Construct payload for Vertex AI.
  const payload = {
    contents: {
      role: "user",
      parts: [{ text: fullPrompt }],
    },
  };

  try {
    const accessToken = await getAccessToken();
    const vertexResponse = await fetch(streamingEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!vertexResponse.body) {
      console.error("No response body from Vertex AI.");
      res.write("Error: No response from Vertex AI.");
      res.end();
      return;
    }

    const webStream = nodeStreamToWebStream(vertexResponse.body);
    const reader = webStream.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        res.write(chunk);
      }
    }
  } catch (err) {
    console.error("Vertex AI Request Error:", err);
    res.write(`Error: ${err.message}`);
  }

  res.end();
});

exports.fairyChat = onRequest(app);
