import json
import os
from collections import defaultdict

def traverse_tree(node, stats):
    # Count this node by its type
    node_type = node.get("type", "unknown")
    stats["types"][node_type] += 1
    stats["total"] += 1

    # If it's a file node, extract its extension and count it
    if node_type == "file":
        ext = os.path.splitext(node["name"])[1].lower()
        stats["extensions"][ext] += 1

    # Recursively traverse children if they exist
    for child in node.get("children", []):
        traverse_tree(child, stats)

def main():
    # Load the JSON file
    with open("projects_tree.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    # Initialize stats dictionary
    stats = {
        "types": defaultdict(int),
        "extensions": defaultdict(int),
        "total": 0,
    }

    # Start with the root node
    root = data.get("root")
    if root:
        traverse_tree(root, stats)
    else:
        print("No root node found in the JSON.")

    # Print out the statistics
    print("Node types distribution:")
    for node_type, count in stats["types"].items():
        print(f"  {node_type}: {count}")
    print(f"  total: {stats['total']}\n")

    print("Extensions distribution (for file nodes):")
    for ext, count in stats["extensions"].items():
        print(f"  {ext}: {count}")

if __name__ == "__main__":
    main()

# Node types distribution:
#   root: 1
#   project: 25
#   directory: 141
#   file: 310
#   total: 477

# Extensions distribution (for file nodes):
#   .py: 123
#   .txt: 7
#   .toml: 2
#   .ipynb: 16
#   .java: 36
#   .yml: 12
#   .js: 26
#   .html: 31
#   .ts: 2
#   .css: 6
#   .tsx: 14
#   .vue: 15
#   .sql: 9
#   .sh: 3
#   .yaml: 4
#   .rst: 4