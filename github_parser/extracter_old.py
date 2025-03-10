import requests
import json
import ast
import os
import time
from datetime import datetime
from sentence_transformers import SentenceTransformer

# ----------------------------
# Global Variables for Extension Stats
# ----------------------------
RAW_EXTENSIONS = set()
FINAL_EXTENSIONS = set()

# ----------------------------
# Configuration
# ----------------------------
GITHUB_USERNAME = "FrancoisHUP"
GITHUB_API_URL = "https://api.github.com"
OUTPUT_FILE = "projects_tree.json"
HEADERS = {"Accept": "application/vnd.github.v3+json"}
# Uncomment and add your token to avoid rate limits:
# HEADERS["Authorization"] = "token YOUR_GITHUB_TOKEN"

# Use a SentenceTransformer model for embeddings (adjust model if needed)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------
# Helper Functions
# ----------------------------

def fetch_repositories(username):
    """Fetch all public repositories for the given username."""
    repos = []
    page = 1
    while True:
        url = f"{GITHUB_API_URL}/users/{username}/repos?per_page=100&page={page}"
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            print(f"Error fetching repos (page {page}): {response.status_code}")
            break
        data = response.json()
        if not data:
            break
        repos.extend(data)
        page += 1
        time.sleep(0.5)  # be kind with rate limits
    return repos

def fetch_contents(owner, repo, path=""):
    """Fetch repository contents for a given path (file or directory)."""
    url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/contents/{path}"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        return response.json()  # returns list for directories, dict for files
    return None

def get_file_last_modified(owner, repo, path):
    """Retrieve the last modified date for a file via the commits API."""
    url = f"{GITHUB_API_URL}/repos/{owner}/{repo}/commits?path={path}&per_page=1"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        data = response.json()
        if data:
            return data[0]["commit"]["committer"]["date"]
    return None

def parse_python_functions(code):
    """Extract function definitions from Python code using the AST module."""
    functions = []
    try:
        tree = ast.parse(code)
        lines = code.splitlines()
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                start_line = node.lineno
                # end_lineno available in Python 3.8+; if not, estimate using node.body length
                end_line = getattr(node, 'end_lineno', start_line + len(node.body))
                func_code = "\n".join(lines[start_line-1:end_line])
                functions.append({
                    "id": f"function_{node.name}",
                    "name": f"def {node.name}",
                    "type": "function",
                    "last_modified": None,  # to be filled from file's last_modified
                    "num_lines": end_line - start_line + 1,
                    "size": None,
                    "embedding": embedding_model.encode(func_code).tolist(),
                    "position": [0, 0, 0],
                    "parent_id": None,
                    "code": func_code
                })
    except Exception as e:
        print("Error parsing Python code:", e)
    return functions

def is_valid_code_file(filename):
    # Define allowed file extensions (in lower case)
    allowed_extensions = {
        ".py", ".java", ".ipynb", ".js", ".ts", ".html", ".css",
        ".cpp", ".c", ".h", ".cs", ".rb", ".go", ".swift", ".tsx",
        
    }
    # Define file names that are explicitly allowed (whitelist)
    allowed_names = {
        "requirements.txt"
    }
    # Define file names (exact matches) and extensions to ignore
    blacklisted_names = {
        "package-lock.json", ".gitignore", "todo"
    }
    blacklisted_extensions = {
        ".eot", ".ttf", ".woff", ".woff2", ".png", ".jpg", ".jpeg", ".gif", ".txt", ".pth"
    }
    
    base = os.path.basename(filename).lower()
    ext = os.path.splitext(filename)[1].lower()
    
    # First, if the base name is explicitly whitelisted, allow the file.
    if base in allowed_names:
        return True
    
    if base in blacklisted_names:
        return False
    if ext in blacklisted_extensions:
        return False
    if ext in allowed_extensions:
        return True
    return False

def process_file(owner, repo, item, parent_id):
    """Process a file item from the GitHub API."""
    filename = item["name"]
    # Record raw extension
    raw_ext = os.path.splitext(filename)[1].lower()
    RAW_EXTENSIONS.add(raw_ext)
    
    if not is_valid_code_file(filename):
        return None
    # Record final extension since it passed the filter
    FINAL_EXTENSIONS.add(raw_ext)
    
    file_url = item.get("download_url")
    if not file_url:
        return None
    r = requests.get(file_url)
    if r.status_code != 200:
        return None
    content = r.text
    last_modified = get_file_last_modified(owner, repo, item["path"])
    file_node = {
        "id": f"repo_{repo}_file_{item['path'].replace('/', '_')}",
        "name": item["path"],
        "type": "file",
        "last_modified": last_modified,
        "num_lines": len(content.splitlines()),
        "size": None,
        "embedding": embedding_model.encode(content[:512]).tolist(),  # snippet embedding
        "position": [0, 0, 0],
        "parent_id": parent_id,
        "children": []
    }
    # Process Python files for functions
    if filename.lower().endswith(".py"):
        funcs = parse_python_functions(content)
        for func in funcs:
            func["parent_id"] = file_node["id"]
            if not func["last_modified"]:
                func["last_modified"] = last_modified
        file_node["children"] = funcs
    return file_node

def process_directory(owner, repo, path, parent_id):
    """Recursively process a directory and return a list of nodes."""
    children = []
    items = fetch_contents(owner, repo, path)
    if not items or not isinstance(items, list):
        return children
    for item in items:
        if item["type"] == "dir":
            # Create a directory node and recurse into it
            dir_id = f"repo_{repo}_dir_{item['path'].replace('/', '_')}"
            last_modified = get_file_last_modified(owner, repo, item["path"])
            dir_node = {
                "id": dir_id,
                "name": item["name"],
                "type": "directory",
                "last_modified": last_modified,
                "num_lines": None,
                "size": None,
                "embedding": embedding_model.encode(item["name"]).tolist(),
                "position": [0, 0, 0],
                "parent_id": parent_id,
                "children": process_directory(owner, repo, item["path"], dir_id)
            }
            children.append(dir_node)
        elif item["type"] == "file":
            file_node = process_file(owner, repo, item, parent_id)
            if file_node:
                children.append(file_node)
    return children

def build_tree(username):
    """Build the complete hierarchical JSON tree from GitHub repositories."""
    root = {
        "id": username,
        "name": username,
        "type": "root",
        "last_modified": datetime.utcnow().isoformat() + "Z",
        "embedding": [],
        "size": None,
        "position": [0, 0, 0],
        "children": []
    }
    repos = fetch_repositories(username)
    print(f"Found {len(repos)} repositories.")
    for repo in repos:
        repo_id = f"repo_{repo['id']}"
        repo_node = {
            "id": repo_id,
            "name": repo["name"],
            "type": "project",
            "last_modified": repo.get("updated_at"),
            "num_lines": None,  # Optionally compute aggregate lines
            "size": None,
            "embedding": embedding_model.encode(repo["name"]).tolist(),
            "position": [0, 0, 0],
            "parent_id": username,
            "children": []
        }
        # Recursively process repository contents starting at the root directory.
        repo_contents = process_directory(username, repo["name"], "", repo_id)
        repo_node["children"] = repo_contents
        root["children"].append(repo_node)
        time.sleep(1)  # delay to avoid hitting rate limits
    return root

def traverse(node, stats):
    """
    Recursively traverse the tree and update stats based on node type.
    """
    node_type = node.get("type", "unknown")
    stats["total"] += 1
    stats[node_type] = stats.get(node_type, 0) + 1

    children = node.get("children", [])
    for child in children:
        traverse(child, stats)

def print_tree_stats():
    # Load the final JSON tree
    file_path = OUTPUT_FILE
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    stats = {"total": 0}
    root_node = data.get("root", {})
    traverse(root_node, stats)
    
    print("Statistics from the JSON tree:")
    print(f"Total nodes: {stats.get('total', 0)}")
    print(f"Projects: {stats.get('project', 0)}")
    print(f"Files: {stats.get('file', 0)}")
    print(f"Functions: {stats.get('function', 0)}")
    print(f"Directories: {stats.get('directory', 0)}")
    print(f"Root nodes: {stats.get('root', 0)}")
    print()
    print("Final extensions (included files):", sorted(list(FINAL_EXTENSIONS)))
    print("Raw extensions (all encountered):", sorted(list(RAW_EXTENSIONS)))

# ----------------------------
# Main Function
# ----------------------------
def main():
    tree = build_tree(GITHUB_USERNAME)
    final_data = {"root": tree}
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2)
    print(f"Tree JSON saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
    print_tree_stats()
