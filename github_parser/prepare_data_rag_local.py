import os
import glob
import json
from tqdm import tqdm
from nltk.tokenize import word_tokenize
import openai

# Set your OpenAI API key from the environment.
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

# Directories for your data
TXT_DIR = "./dataset"         # Folder containing .txt files (your code)
JSON_DIR = "./extracted-information"  # Folder containing JSON files (project details)

# Output file for prepared data
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

def get_document_embedding(text, chunk_size=1000):
    """
    Compute an embedding for the given text using OpenAI's text-embedding-ada-002.
    If the text is longer than `chunk_size` words, split it into chunks,
    compute an embedding for each, and then average them.
    """
    words = text.split()
    if len(words) <= chunk_size:
        response = openai.embeddings.create(
            input=text,
            model="text-embedding-ada-002"
        )
        return response.data[0].embedding
    else:
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i : i + chunk_size])
            chunks.append(chunk)
        embeddings = []
        for chunk in chunks:
            response = openai.embeddings.create(
                input=chunk,
                model="text-embedding-ada-002"
            )
            embeddings.append(response.data[0].embedding)
        # Average the embeddings element-wise.
        avg_embedding = [0] * len(embeddings[0])
        for emb in embeddings:
            for i, val in enumerate(emb):
                avg_embedding[i] += val
        avg_embedding = [val / len(embeddings) for val in avg_embedding]
        return avg_embedding

print("Computing embeddings using OpenAI API...")
for doc in tqdm(documents):
    doc["embedding"] = get_document_embedding(doc["content"])

with open(OUTPUT_FILE, "w", encoding="utf8") as f:
    json.dump(documents, f, indent=2)

print(f"Data preparation complete. Prepared data saved to {OUTPUT_FILE}.")
