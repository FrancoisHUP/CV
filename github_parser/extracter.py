import os
import json
import re
import requests
import time
from datetime import datetime
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer

# ----------------------------
# Configuration
# ----------------------------
GITHUB_USERNAME = "francoisHUP"
GITHUB_API_URL = "https://api.github.com"
DATASET_DIR = "dataset"
OUTPUT_FILE = "projects_tree.json"
HEADERS = {"Accept": "application/vnd.github.v3+json"}
# Uncomment and add your GitHub API token if needed:
HEADERS["Authorization"] = "token ghp_..."

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------
# File Filtering Function
# ----------------------------
def is_valid_code_file(filename):
    allowed_extensions = {
        ".py", ".java", ".ipynb", ".js", ".ts", ".html", ".css",
        ".cpp", ".c", ".h", ".cs", ".rb", ".go", ".swift", ".tsx",
        ".sh", ".sql", ".vue", ".rst", ".toml", ".yaml", ".yml"
    }
    allowed_names = {"requirements.txt"}
    blacklisted_names = {"package-lock.json", ".gitignore", "todo"}
    blacklisted_extensions = {
        ".bat", ".bib", ".db", ".dev", ".dockerignore", ".drawio", ".ds_store",
        ".eot", ".example", ".form", ".gitignore", ".json", ".lock", ".md",
        ".pcl", ".pth", ".puml", ".python-version", ".raml", ".rules", ".run",
        ".webp", ".woff", ".woff2", ".xml"
    }
    
    base = os.path.basename(filename).lower()
    ext = os.path.splitext(filename)[1].lower()
    
    if base in allowed_names:
        return True
    if base in blacklisted_names:
        return False
    if ext in blacklisted_extensions:
        return False
    if ext in allowed_extensions:
        return True
    return False

def filter_tree(nodes):
    filtered = []
    for node in nodes:
        if node["type"] == "file":
            if is_valid_code_file(node["name"]):
                filtered.append(node)
        else:
            node["children"] = filter_tree(node.get("children", []))
            if node["children"]:
                filtered.append(node)
    return filtered

# ----------------------------
# Utility: Parse Directory Structure from gitingest output
# ----------------------------
def parse_directory_structure(text):
    lines = text.splitlines()
    if lines and "Directory structure:" in lines[0]:
        lines = lines[1:]
    
    tree = []
    stack = []  # Stack of (indent, node)
    
    for line in lines:
        if not line.strip():
            continue
        marker_match = re.search(r"(└──|├──)", line)
        if not marker_match:
            continue
        indent = marker_match.start()
        name = line[marker_match.end():].strip()
        node_type = "directory" if name.endswith("/") else "file"
        node = {
            "id": None,
            "name": name.rstrip("/"),
            "type": node_type,
            "last_modified": None,
            "num_lines": None,
            "size": None,
            "embedding": [],
            "position": [0, 0, 0],
            "parent_id": None,
            "children": []
        }
        while stack and stack[-1][0] >= indent:
            stack.pop()
        if stack:
            parent = stack[-1][1]
            node["parent_id"] = parent["id"] if parent["id"] else "temp"
            parent["children"].append(node)
        else:
            tree.append(node)
        stack.append((indent, node))
    return tree

# ----------------------------
# Utility: Parse Code Content Section
# ----------------------------
def parse_code_content(text):
    code_dict = {}
    pattern = re.compile(r"=+\s*File:\s*(.*?)\s*=+\s*(.*?)\s*(?==+|$)", re.DOTALL)
    matches = pattern.findall(text)
    for file_path, code in matches:
        file_path = file_path.strip()
        code_dict[file_path] = code.strip()
    return code_dict

# ----------------------------
# Utility: Compute Full Paths for Nodes
# ----------------------------
def compute_full_paths(nodes, parent_path=""):
    for node in nodes:
        current_path = os.path.join(parent_path, node["name"]) if parent_path else node["name"]
        node["path"] = current_path
        if node.get("children"):
            compute_full_paths(node["children"], current_path)

def get_file_last_modified_from_github(repo_name, file_path):
    cleaned_path = file_path.replace("\\", "/")
    repo_prefix = f"{GITHUB_USERNAME.lower()}-{repo_name.lower()}"
    if cleaned_path.lower().startswith(repo_prefix):
        cleaned_path = cleaned_path[len(repo_prefix):].lstrip("/")
    
    url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{repo_name}/commits?path={cleaned_path}&per_page=1"
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            if data:
                return data[0]["commit"]["committer"]["date"]
    except Exception as e:
        pass
    return None

def update_last_modified(nodes, repo_name):
    for node in nodes:
        if node["type"] == "file":
            full_path = node.get("path", node["name"])
            lm = get_file_last_modified_from_github(repo_name, full_path)
            if lm:
                node["last_modified"] = lm
        if node.get("children"):
            update_last_modified(node["children"], repo_name)

# ----------------------------
# Attach Code to File Nodes
# ----------------------------
def attach_code_to_tree(nodes, code_map):
    for node in nodes:
        if node["type"] == "file":
            basename = os.path.basename(node["path"])
            if basename in code_map:
                code = code_map[basename]
                node["code"] = code
                node["num_lines"] = len(code.splitlines())
            else:
                node["code"] = ""
                node["num_lines"] = 0
        if node.get("children"):
            attach_code_to_tree(node["children"], code_map)

# ----------------------------
# Update Embeddings Recursively
# ----------------------------
def update_embeddings_for_tree(nodes):
    for node in nodes:
        if node["type"] in ["file", "function"]:
            # Use code content if available, else fallback to the node name.
            text_to_encode = node.get("code", node["name"])
        else:
            text_to_encode = node["name"]
        node["embedding"] = embedding_model.encode(text_to_encode[:512]).tolist()
        if node.get("children"):
            update_embeddings_for_tree(node["children"])

# ----------------------------
# Build Repository Node from Gitingest Text
# ----------------------------
def build_repo_node(repo_name, full_text):
    sections = full_text.split("### Code Content ###")
    if len(sections) < 2:
        print(f"Warning: Unexpected format in repo {repo_name}")
        return None
    structure_text = sections[0].split("### Directory Structure ###")[-1].strip()
    code_text = sections[1].strip()
    
    tree = parse_directory_structure(structure_text)
    compute_full_paths(tree)
    tree = filter_tree(tree)
    
    code_map = parse_code_content(code_text)
    simple_code_map = {os.path.basename(k): v for k, v in code_map.items()}
    attach_code_to_tree(tree, simple_code_map)
    update_last_modified(tree, repo_name)
    update_embeddings_for_tree(tree)
    
    repo_node = {
        "id": f"repo_{repo_name}",
        "name": repo_name,
        "type": "project",
        "last_modified": datetime.utcnow().isoformat() + "Z",
        "num_lines": None,
        "size": None,
        "embedding": embedding_model.encode(repo_name).tolist(),
        "position": [0, 0, 0],
        "parent_id": GITHUB_USERNAME,
        "children": tree
    }
    
    def assign_ids(node, prefix):
        node["id"] = f"{prefix}_{node['name'].replace(' ', '_')}"
        for child in node["children"]:
            child["parent_id"] = node["id"]
            assign_ids(child, node["id"])
    for child in repo_node["children"]:
        assign_ids(child, repo_node["id"])
    
    return repo_node

# ----------------------------
# Build Full JSON from All Dataset Files
# ----------------------------
def build_full_json():
    root = {
        "id": GITHUB_USERNAME,
        "name": GITHUB_USERNAME,
        "type": "root",
        "last_modified": datetime.utcnow().isoformat() + "Z",
        "embedding": [],
        "size": None,
        "position": [0, 0, 0],
        "children": []
    }
    for filename in os.listdir(DATASET_DIR):
        if not filename.endswith(".txt"):
            continue
        repo_name = os.path.splitext(filename)[0]
        file_path = os.path.join(DATASET_DIR, filename)
        with open(file_path, "r", encoding="utf-8") as f:
            full_text = f.read()
        repo_node = build_repo_node(repo_name, full_text)
        if repo_node:
            root["children"].append(repo_node)
    return {"root": root}

# ----------------------------
# Main Function
# ----------------------------
def main():
    final_json = build_full_json()
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_json, f, indent=2)
    print(f"JSON tree saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
