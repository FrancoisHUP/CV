#!/usr/bin/env python3
"""
Integrated Pipeline for Building a Projects Tree with Positions, Sizes, Colors, and GitHub Links

Steps:
1. Extract repository tree from GitHub text files in the dataset folder.
2. Merge additional project and file-level details from the extracted-information folder.
3. Compute 3D positions (based on embeddings and last_modified timestamps), node sizes (log(num_lines)),
   and assign colors based on type or file extension.
4. Set GitHub URL links for each node, using the repository’s default branch.
5. Save the final JSON tree.
"""

import os
import re
import json
import math
import requests
import numpy as np
from datetime import datetime
from collections import OrderedDict
from bs4 import BeautifulSoup
from tqdm import tqdm
from sentence_transformers import SentenceTransformer

# ----------------------------
# Configuration
# ----------------------------
GITHUB_USERNAME = "francoisHUP"
GITHUB_API_URL = "https://api.github.com"
DATASET_DIR = "dataset"                # Folder with GitHub repo text files.
EXTRACTED_DIR = "extracted-information"  # Folder with additional project details.
OUTPUT_FILE = "projects_tree_enhanced_with_positions.json"
HEADERS = {"Accept": "application/vnd.github.v3+json"}
# Uncomment and add your GitHub API token if needed:
HEADERS["Authorization"] = "token ghp_..."

# Embedding model (384-dim)
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Parameters for positioning and visuals
MIN_DISTANCE = 1.0      # Base radial distance for the most recent sibling.
MAX_DISTANCE = 10.0      # Base radial distance for the oldest sibling.
DECAY_FACTOR = 0.6      # Each deeper level's distances are multiplied by this factor.
ALPHA = 0.45            # Blend factor for child direction vs parent's branch direction.
SIZE_SCALE = 0.08        # Scale factor for node sizes.

# ----------------------------
# Extraction Functions (extracter.py)
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

def parse_directory_structure(text):
    lines = text.splitlines()
    if lines and "Directory structure:" in lines[0]:
        lines = lines[1:]
    
    tree = []
    stack = []  # (indent, node)
    
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

def parse_code_content(text):
    code_dict = {}
    pattern = re.compile(r"=+\s*File:\s*(.*?)\s*=+\s*(.*?)\s*(?==+|$)", re.DOTALL)
    matches = pattern.findall(text)
    for file_path, code in matches:
        file_path = file_path.strip()
        code_dict[file_path] = code.strip()
    return code_dict

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

def update_embeddings_for_tree(nodes):
    for node in nodes:
        if node["type"] in ["file", "function"]:
            text_to_encode = node.get("code", node["name"])
        else:
            text_to_encode = node["name"]
        node["embedding"] = embedding_model.encode(text_to_encode[:512]).tolist()
        if node.get("children"):
            update_embeddings_for_tree(node["children"])

def assign_ids(node, prefix):
    node["id"] = f"{prefix}_{node['name'].replace(' ', '_')}"
    for child in node.get("children", []):
        child["parent_id"] = node["id"]
        assign_ids(child, node["id"])

def get_default_branch(repo_name):
    url = f"{GITHUB_API_URL}/repos/{GITHUB_USERNAME}/{repo_name}"
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            default_branch = data.get("default_branch")
            print(f"Repo: {repo_name}, default_branch: {default_branch}")
            return default_branch if default_branch else "main"
    except Exception as e:
        print(f"Error retrieving default branch for {repo_name}: {e}")
    return "main"

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
    
    # Flatten extra directory if it exists (e.g., "francoishup-gitarchiver")
    pattern = f"{GITHUB_USERNAME.lower()}-{repo_name.lower()}"
    if len(tree) == 1 and tree[0]["name"].lower() == pattern:
        tree = tree[0]["children"]
    
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
        "children": tree,
        "link": f"https://github.com/{GITHUB_USERNAME}/{repo_name}"
    }
    # Get and store the default branch.
    repo_node["default_branch"] = get_default_branch(repo_name)
    
    for child in repo_node["children"]:
        assign_ids(child, repo_node["id"])
    
    return repo_node

def build_full_json():
    root = {
        "id": GITHUB_USERNAME,
        "name": GITHUB_USERNAME,
        "type": "root",
        "last_modified": datetime.utcnow().isoformat() + "Z",
        "embedding": [],
        "size": None,
        "position": [0, 0, 0],
        "children": [],
        "link": f"https://github.com/{GITHUB_USERNAME}"
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
# Merge Functions (merge.py)
# ----------------------------
def merge_details_to_tree(node, extracted_dir):
    if node.get("type") == "project":
        project_name = node.get("name")
        details_file = os.path.join(extracted_dir, f"{project_name}.json")
        if os.path.exists(details_file):
            with open(details_file, "r", encoding="utf-8") as f:
                details_data = json.load(f)
            node["details"] = details_data.get("project", {})
        else:
            print(f"Warning: No details file for project '{project_name}' at {details_file}")
    for child in node.get("children", []):
        merge_details_to_tree(child, extracted_dir)

def merge_file_details(node, project_details=None):
    if node.get("type") == "project":
        project_details = node.get("details", {})
    if node.get("type") == "file" and project_details:
        file_name = os.path.basename(node.get("path", ""))
        for file_info in project_details.get("files", []):
            if file_info.get("path") == file_name:
                node["details"] = file_info
                break
    for child in node.get("children", []):
        merge_file_details(child, project_details)

def remove_files_from_project_details(node):
    if node.get("type") == "project" and "details" in node:
        if isinstance(node["details"], dict) and "files" in node["details"]:
            node["details"].pop("files")
    for child in node.get("children", []):
        remove_files_from_project_details(child)

def reorder_node(node):
    desired_order = ["id", "name", "type", "last_modified", "num_lines", "size", "embedding", "position", "parent_id", "link", "details", "default_branch"]
    new_node = OrderedDict()
    for key in desired_order:
        if key in node:
            new_node[key] = node[key]
    for key in node:
        if key not in desired_order and key != "children":
            new_node[key] = node[key]
    if "children" in node:
        new_children = []
        for child in node["children"]:
            new_children.append(reorder_node(child))
        new_node["children"] = new_children
    return new_node

# ----------------------------
# Position, Size, Color Functions (set_position.py)
# ----------------------------
def parse_date(date_str):
    return datetime.fromisoformat(date_str.replace("Z", "+00:00")).timestamp()

def reduce_to_3d(embedding):
    vec = np.array(embedding[:3], dtype=float)
    norm = np.linalg.norm(vec)
    if norm == 0:
        return np.array([1.0, 0.0, 0.0])
    return vec / norm

def fibonacci_sphere(samples, randomize=True):
    rnd = 1.
    if randomize:
        rnd = np.random.random() * samples
    points = []
    offset = 2.0 / samples
    increment = math.pi * (3.0 - math.sqrt(5.0))
    for i in range(samples):
        y = ((i * offset) - 1) + (offset / 2)
        r = math.sqrt(1 - y * y)
        phi = ((i + rnd) % samples) * increment
        x = math.cos(phi) * r
        z = math.sin(phi) * r
        points.append([x, y, z])
    return np.array(points)

def assign_sibling_distances(children):
    distances = {}
    timestamps = []
    for child in children:
        lm = child.get("last_modified")
        if lm:
            try:
                ts = parse_date(lm)
                timestamps.append(ts)
            except Exception:
                pass
    if timestamps:
        min_ts = min(timestamps)
        max_ts = max(timestamps)
        for child in children:
            lm = child.get("last_modified")
            if lm:
                try:
                    ts = parse_date(lm)
                    if max_ts == min_ts:
                        d = MIN_DISTANCE
                    else:
                        d = MIN_DISTANCE + ((max_ts - ts) / (max_ts - min_ts)) * (MAX_DISTANCE - MIN_DISTANCE)
                    distances[child["id"]] = d
                except Exception:
                    distances[child["id"]] = (MIN_DISTANCE + MAX_DISTANCE) / 2.0
            else:
                distances[child["id"]] = (MIN_DISTANCE + MAX_DISTANCE) / 2.0
    else:
        for child in children:
            distances[child["id"]] = (MIN_DISTANCE + MAX_DISTANCE) / 2.0
    return distances

def set_positions(node, depth=0, parent_branch_dir=None):
    if depth == 0:
        node["position"] = [0.0, 0.0, 0.0]
        if "children" in node and node["children"]:
            siblings = node["children"]
            num_siblings = len(siblings)
            directions = fibonacci_sphere(num_siblings, randomize=True)
            distances = assign_sibling_distances(siblings)
            for idx, child in enumerate(siblings):
                d = distances.get(child["id"], (MIN_DISTANCE + MAX_DISTANCE) / 2.0)
                final_d = d * (DECAY_FACTOR ** (depth + 1))
                pos = np.array(node["position"]) + np.array(directions[idx]) * final_d
                child["position"] = pos.tolist()
                child_branch_dir = np.array(directions[idx])
                set_positions(child, depth=depth+1, parent_branch_dir=child_branch_dir)
    else:
        if "children" in node and node["children"]:
            siblings = node["children"]
            distances = assign_sibling_distances(siblings)
            for child in siblings:
                child_raw_dir = reduce_to_3d(child["embedding"])
                if parent_branch_dir is None:
                    blended = child_raw_dir
                else:
                    blended = ALPHA * child_raw_dir + (1 - ALPHA) * np.array(parent_branch_dir)
                norm = np.linalg.norm(blended)
                if norm == 0:
                    final_dir = np.array([1.0, 0.0, 0.0])
                else:
                    final_dir = blended / norm
                d = distances.get(child["id"], (MIN_DISTANCE + MAX_DISTANCE) / 2.0)
                final_d = d * (DECAY_FACTOR ** (depth + 1))
                parent_pos = np.array(node["position"])
                child_pos = parent_pos + final_dir * final_d
                if np.linalg.norm(child_pos) < np.linalg.norm(parent_pos):
                    child_pos = parent_pos + final_dir * final_d
                child["position"] = child_pos.tolist()
                set_positions(child, depth=depth+1, parent_branch_dir=final_dir)
    return

def set_size_and_color(node):
    # Mapping for non-file nodes by type.
    type_color_mapping = {
        "ai": "#4CAF50",         # Green
        "web": "#2196F3",        # Blue
        "directory": "#9E9E9E",  # Grey
        "project": "#FF5722",    # Orange
        # Add more non-file types as needed.
    }
    # Mapping for file nodes by file extension.
    extension_color_mapping = {
        ".py": "#3572A5",    # Python: blue tone
        ".js": "#F1E05A",    # JavaScript: yellow
        ".ts": "#2B7489",    # TypeScript: blue-green
        ".html": "#E34C26",  # HTML: orange-red
        ".css": "#563D7C",   # CSS: purple
        ".cpp": "#f34b7d",   # C++: pinkish red
        ".c": "#555555",     # C: dark gray
        ".java": "#b07219",  # Java: brown
        ".rb": "#701516",    # Ruby: deep red
        ".go": "#00ADD8",    # Go: light blue
        ".php": "#4F5D95",   # PHP: dark blue
        ".sh": "#89e051",    # Shell: green
        ".ipynb": "#FEC945", # Jupyter Notebook: yellowish
        # Add other extensions as needed.
    }
    num_lines = node.get("num_lines")
    if num_lines and isinstance(num_lines, (int, float)) and num_lines > 0:
        node["size"] = SIZE_SCALE * math.log(num_lines + 1)
    else:
        node["size"] = SIZE_SCALE
    node_type = node.get("type", "").lower()
    if node_type == "file":
        file_name = node.get("name", "")
        ext = os.path.splitext(file_name)[1].lower()
        node["color"] = extension_color_mapping.get(ext, "#FFC107")  # default amber for files
    else:
        node["color"] = type_color_mapping.get(node_type, "#FFFFFF")
    if "children" in node and node["children"]:
        for child in node["children"]:
            set_size_and_color(child)
    return

def set_github_links(node, repo_name=None, default_branch="main"):
    if node["type"] == "root":
        node["link"] = f"https://github.com/{GITHUB_USERNAME}"
    elif node["type"] == "project":
        node["link"] = f"https://github.com/{GITHUB_USERNAME}/{node['name']}"
        repo_name = node["name"]
        default_branch = node.get("default_branch")
        if not default_branch:
            default_branch = "main"
    elif node["type"] == "directory":
        if repo_name:
            # For directories, remove the extra prefix if present.
            path = node["path"].replace(os.sep, "/")
            prefix = f"{GITHUB_USERNAME.lower()}-{repo_name.lower()}/"
            if path.startswith(prefix):
                path = path[len(prefix):]
            node["link"] = f"https://github.com/{GITHUB_USERNAME}/{repo_name}/tree/{default_branch}/{path}"
        else:
            node["link"] = ""
    elif node["type"] == "file":
        if repo_name:
            # Remove extra directory prefix if present.
            path = node["path"].replace(os.sep, "/")
            prefix = f"{GITHUB_USERNAME.lower()}-{repo_name.lower()}/"
            if path.startswith(prefix):
                path = path[len(prefix):]
            node["link"] = f"https://github.com/{GITHUB_USERNAME}/{repo_name}/blob/{default_branch}/{path}"
        else:
            node["link"] = ""
    if "children" in node and node["children"]:
        for child in node["children"]:
            set_github_links(child, repo_name, default_branch)
    return

# ----------------------------
# Integrated Main Pipeline
# ----------------------------
def main():
    # Step 1: Build the initial JSON tree from the dataset.
    print("Extracting projects tree from dataset...")
    full_json = build_full_json()
    with open("projects_tree.json", "w", encoding="utf-8") as f:
        json.dump(full_json, f, indent=2)
    print("Projects tree saved to projects_tree.json")
    
    # Step 2: Merge additional details from the extracted-information folder.
    tree_file = "projects_tree.json"
    with open(tree_file, "r", encoding="utf-8") as f:
        tree_data = json.load(f)
    
    if "root" in tree_data:
        merge_details_to_tree(tree_data["root"], EXTRACTED_DIR)
        merge_file_details(tree_data["root"])
        remove_files_from_project_details(tree_data["root"])
        tree_data["root"] = reorder_node(tree_data["root"])
    else:
        merge_details_to_tree(tree_data, EXTRACTED_DIR)
        merge_file_details(tree_data)
        remove_files_from_project_details(tree_data)
        tree_data = reorder_node(tree_data)
    
    with open("projects_tree_enhanced.json", "w", encoding="utf-8") as f:
        json.dump(tree_data, f, indent=2)
    print("Merged and enhanced tree saved to projects_tree_enhanced.json")
    
    # Step 3: Set 3D positions, sizes, colors, and GitHub links.
    with open("projects_tree_enhanced.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    
    root_node = data.get("root")
    if root_node is None:
        print("Error: JSON must have a top-level 'root' key.")
        return
    
    root_node["name"] = "FrancoisHUP"
    set_positions(root_node, depth=0, parent_branch_dir=None)
    set_size_and_color(root_node)
    set_github_links(root_node)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump({"root": root_node}, f, indent=2)
    
    print(f"Final JSON tree with positions, sizes, colors, and GitHub links saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
