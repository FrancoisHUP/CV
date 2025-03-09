import json
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
from nltk.tokenize import word_tokenize
from rank_bm25 import BM25Okapi
from sklearn.preprocessing import MinMaxScaler

# Path to the prepared data file.
PREPARED_FILE = "rag_data.json"

with open(PREPARED_FILE, "r", encoding="utf8") as f:
    documents = json.load(f)

# Build BM25 index using tokenized texts.
corpus_tokens = [doc["tokens"] for doc in documents]
bm25 = BM25Okapi(corpus_tokens)

# Load the Universal Sentence Encoder model.
print("Loading Universal Sentence Encoder model...")
model = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")
print("Model loaded.")

def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

def hybrid_search(query, top_k=5, weight_bm25=0.5, weight_embed=0.5):
    # Tokenize and compute embedding for the query.
    query_tokens = word_tokenize(query.lower())
    query_embedding = model([query]).numpy()[0]
    
    # BM25 scores.
    bm25_scores = bm25.get_scores(query_tokens)
    
    # Embedding cosine similarities.
    cosine_scores = []
    for doc in documents:
        doc_embedding = np.array(doc["embedding"])
        cosine_scores.append(cosine_similarity(query_embedding, doc_embedding))
    cosine_scores = np.array(cosine_scores)
    
    # Normalize scores.
    scaler = MinMaxScaler()
    bm25_norm = scaler.fit_transform(bm25_scores.reshape(-1, 1)).flatten()
    cosine_norm = scaler.fit_transform(cosine_scores.reshape(-1, 1)).flatten()
    
    # Combine scores.
    combined_scores = weight_bm25 * bm25_norm + weight_embed * cosine_norm
    
    # Get indices of top scoring documents.
    top_indices = np.argsort(combined_scores)[::-1][:top_k]
    
    results = []
    for idx in top_indices:
        result = {
            "doc_id": documents[idx]["doc_id"],
            "source": documents[idx]["source"],
            "content": documents[idx]["content"],
            "bm25_score": float(bm25_scores[idx]),
            "cosine_score": float(cosine_scores[idx]),
            "combined_score": float(combined_scores[idx])
        }
        results.append(result)
    return results

if __name__ == "__main__":
    query = input("Enter your query: ")
    results = hybrid_search(query)
    print("Top relevant documents:")
    for res in results:
        print("----------")
        print(f"Document: {res['doc_id']} (Source: {res['source']})")
        print(f"Combined Score: {res['combined_score']:.4f}")
        snippet = res['content'][:200].replace("\n", " ")
        print(f"Content snippet: {snippet}...")
