import os
import glob
import json
from tqdm import tqdm
from nltk.tokenize import word_tokenize, sent_tokenize
import openai
import nltk

# Download NLTK data if not already present.
nltk.download('punkt')

# Set your OpenAI API key from the environment.
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

# Directories for your data.
TXT_DIR = "./dataset"  # Folder containing .txt files (your code)
JSON_DIR = "./extracted-information"  # Folder containing JSON files (project details)

# Output file for prepared data.
OUTPUT_FILE = "rag_data.json"

documents = []

def flatten_json(y):
    """Recursively extract all string values from a nested JSON object."""
    out = []
    if isinstance(y, dict):
        for v in y.values():
            out.extend(flatten_json(v))
    elif isinstance(y, list):
        for item in y:
            out.extend(flatten_json(item))
    elif isinstance(y, str):
        out.append(y)
    else:
        out.append(str(y))
    return out

def process_txt_files():
    txt_files = glob.glob(os.path.join(TXT_DIR, "*.txt"))
    for file_path in txt_files:
        with open(file_path, "r", encoding="utf8") as f:
            content = f.read()
        doc = {
            "doc_id": os.path.basename(file_path),
            "source": "txt",
            "content": content,
            "tokens": word_tokenize(content.lower())
        }
        documents.append(doc)

def process_json_files():
    json_files = glob.glob(os.path.join(JSON_DIR, "*.json"))
    for file_path in json_files:
        with open(file_path, "r", encoding="utf8") as f:
            try:
                data = json.load(f)
                parts = flatten_json(data)
                content = "\n".join(parts)
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
                content = ""
        doc = {
            "doc_id": os.path.basename(file_path),
            "source": "json",
            "content": content,
            "tokens": word_tokenize(content.lower())
        }
        documents.append(doc)

print("Processing .txt files...")
process_txt_files()
print("Processing JSON files...")
process_json_files()
print(f"Total documents loaded: {len(documents)}")

def get_embedding_with_chunking(text, max_words=500):
    """
    Compute an embedding for text using OpenAI's text-embedding-ada-002.
    If the text exceeds max_words, split it into chunks and average the embeddings.
    """
    words = text.split()
    if len(words) <= max_words:
        try:
            response = openai.embeddings.create(
                input=text,
                model="text-embedding-ada-002"
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error embedding text: {e}")
            return None
    else:
        # Split text into chunks of at most max_words.
        chunks = []
        for i in range(0, len(words), max_words):
            chunk = " ".join(words[i : i + max_words])
            chunks.append(chunk)
        embeddings = []
        for chunk in chunks:
            try:
                response = openai.embeddings.create(
                    input=chunk,
                    model="text-embedding-ada-002"
                )
                embeddings.append(response.data[0].embedding)
            except Exception as e:
                print(f"Error embedding chunk: {e}")
        if not embeddings:
            return None
        # Average the embeddings element-wise.
        avg_embedding = [0] * len(embeddings[0])
        for emb in embeddings:
            for i, val in enumerate(emb):
                avg_embedding[i] += val
        avg_embedding = [val / len(embeddings) for val in avg_embedding]
        return avg_embedding

def get_document_embedding(text, chunk_size=1000):
    """
    Compute an embedding for the given text using OpenAI's text-embedding-ada-002.
    If the text is longer than chunk_size words, split it into chunks,
    compute an embedding for each chunk using get_embedding_with_chunking, and then average them.
    """
    words = text.split()
    if len(words) <= chunk_size:
        return get_embedding_with_chunking(text)
    else:
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
        embeddings = []
        for chunk in chunks:
            emb = get_embedding_with_chunking(chunk)
            if emb is not None:
                embeddings.append(emb)
        if not embeddings:
            return None
        avg_embedding = [0] * len(embeddings[0])
        for emb in embeddings:
            for i, val in enumerate(emb):
                avg_embedding[i] += val
        avg_embedding = [val / len(embeddings) for val in avg_embedding]
        return avg_embedding

def compute_sentence_embeddings(text):
    """
    Split the text into sentences, and for each sentence compute an embedding using get_embedding_with_chunking.
    Returns a list of dictionaries with each sentence and its embedding.
    """
    sentences = sent_tokenize(text)
    sentence_embeddings = []
    for sentence in sentences:
        if sentence.strip():  # skip empty sentences
            emb = get_embedding_with_chunking(sentence)
            if emb is not None:
                sentence_embeddings.append({
                    "sentence": sentence,
                    "embedding": emb
                })
    return sentence_embeddings

# Main processing: compute embeddings for each document.
print("Computing embeddings using OpenAI API...")
# We'll save progress periodically.
for i, doc in enumerate(tqdm(documents)):
    try:
        doc_embedding = get_document_embedding(doc["content"])
        if doc_embedding is None:
            print(f"Warning: Could not compute embedding for document {doc['doc_id']}")
            continue
        doc["embedding"] = doc_embedding
        doc["sentence_embeddings"] = compute_sentence_embeddings(doc["content"])
    except Exception as e:
        print(f"Error processing document {doc['doc_id']}: {e}")
        # Save progress so far.
        with open(OUTPUT_FILE, "w", encoding="utf8") as f:
            json.dump(documents, f, indent=2)
        raise e  # Optionally exit or continue

# Save final output.
with open(OUTPUT_FILE, "w", encoding="utf8") as f:
    json.dump(documents, f, indent=2)

print(f"Data preparation complete. Prepared data saved to {OUTPUT_FILE}.")
