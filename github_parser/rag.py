import json
import numpy as np
from nltk.tokenize import sent_tokenize
from sklearn.preprocessing import MinMaxScaler
import openai
import os
from openai import OpenAI

# Set your OpenAI API key.
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

# Path to the prepared data file.
PREPARED_FILE = "rag_data.json"

with open(PREPARED_FILE, "r", encoding="utf8") as f:
    documents = json.load(f)

def cosine_similarity(a, b):
    """Compute cosine similarity between two vectors."""
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    return dot / (norm_a * norm_b + 1e-8)

def get_query_embedding(query):
    """Compute the query embedding using OpenAI's text-embedding-ada-002."""
    response = openai.embeddings.create(
         input=query,
         model="text-embedding-ada-002"
    )
    return response.data[0].embedding

def get_relevant_sentences(doc, query_embedding, top_n=3):
    """
    From the document's precomputed sentence embeddings, select the top_n sentences 
    that have the highest cosine similarity with the query embedding.
    Returns a list of tuples: (sentence, similarity score).
    """
    sentence_embeds = doc.get("sentence_embeddings", [])
    if not sentence_embeds:
        # Fallback: split full text if sentence embeddings are missing.
        sentences = sent_tokenize(doc["content"])
        sentence_embeds = []
        for sent in sentences:
            response = openai.embeddings.create(
                input=sent,
                model="text-embedding-ada-002"
            )
            sentence_embeds.append({
                "sentence": sent,
                "embedding": response.data[0].embedding
            })
    scored_sentences = []
    for item in sentence_embeds:
        sent = item["sentence"]
        emb = np.array(item["embedding"])
        score = cosine_similarity(query_embedding, emb)
        scored_sentences.append((sent, score))
    # Sort sentences by score descending.
    scored_sentences.sort(key=lambda x: x[1], reverse=True)
    return scored_sentences[:top_n]

def search(query, top_k=2, threshold=0.5, top_n_sentences=10):
    """
    Perform a sentence-level search over documents using precomputed sentence embeddings.
    Only include documents where the best sentence exceeds the threshold.
    Returns a list of results in the retrieval schema.
    """
    query_embedding = get_query_embedding(query)
    doc_results = []
    
    for doc in documents:
        sentence_embeds = doc.get("sentence_embeddings", [])
        if not sentence_embeds:
            continue
        
        scored_sentences = []
        for item in sentence_embeds:
            sent = item["sentence"]
            emb = np.array(item["embedding"])
            score = cosine_similarity(query_embedding, emb)
            scored_sentences.append((sent, score))
        
        scored_sentences.sort(key=lambda x: x[1], reverse=True)
        if not scored_sentences:
            continue
        
        best_score = scored_sentences[0][1]
        if best_score >= threshold:
            top_sentences = scored_sentences[:top_n_sentences]
            doc_results.append({
                "document_name": doc["doc_id"],
                "type": "code" if doc["source"] == "txt" else "project_details",
                "cosine_sentence_score": [
                    {"score": round(score, 4), "sentence": sent} for sent, score in top_sentences
                ],
                # "full_document_content": doc["content"]
            })
    
    doc_results.sort(key=lambda x: x["cosine_sentence_score"][0]["score"], reverse=True)
    return doc_results[:top_k]

def prepare_prompt(query, retrieval_results):
    """
    Constructs a prompt string for the LLM, embedding the user query and the retrieval JSON.
    """
    formatted_retrieval = json.dumps(retrieval_results, indent=2)
    prompt = f"""
You are an ai assistant impersonating Francois Huppe-Marcoux the AI / ML and software enginner.
You will be prompted about my portfolio and your job is to respond as if you are me answering the user question about my portfolio.
Answer concisely in one short paragraph in a chat format. Keep the conversation informal so that the user feels like they are talking to a human.

REALLY IMPORTANT => You should not answer if the question is not related to my portfolio.

Here's the user prompt:
<user_prompt>
{query}
</user_prompt>

I want you to use relevant information only if it serves to answer the question.
Otherwise, if you feel the question doesn't need specific information, ignore the following retrieval context.
Make sure you mention the project where the information was found!

This is the retrieval JSON schema:
[
  {{
    "document_name": "<document_filename>",
    "type": "<project_details or code>",
    "cosine_sentence_score": [
      {{ "score": <the_score:int>, "sentence": "<the sentence:string>" }},
      ... (top 3)
    ],
    "full_document_content": "<full text/json content>"
  }},
  ... (other documents)
]

Here is the result of the cosine similarity search:
<retrieval>
{formatted_retrieval}
</retrieval>
"""
    return prompt.strip()

def main():
    query = input("Enter your query: ")
    retrieval_results = search(query, top_k=2, threshold=0.5, top_n_sentences=3)
    
    prompt_text = prepare_prompt(query, retrieval_results)
    
    # Call the LLM using the latest OpenAI ChatCompletion API.
    client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    answer = ""
    stream = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt_text,
            }
        ],
        model="gpt-4o",
        stream=True,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            answer += delta
            print(delta, end="")

if __name__ == "__main__":
    main()
