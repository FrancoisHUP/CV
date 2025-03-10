import json
import os
from collections import OrderedDict

def merge_details_to_tree(node, extracted_dir):
    """
    Recursively traverse the tree and merge details for nodes of type "project".
    (Assumes that for project nodes, the details JSON is in extracted_dir/<project_name>.json)
    """
    if node.get("type") == "project":
        project_name = node.get("name")
        details_file = os.path.join(extracted_dir, f"{project_name}.json")
        if os.path.exists(details_file):
            with open(details_file, "r", encoding="utf-8") as f:
                details_data = json.load(f)
            # Merge project-level details (e.g., description, architecture, technical_details, files)
            node["details"] = details_data.get("project", {})
        else:
            print(f"Warning: No details file found for project '{project_name}' at {details_file}")

    children = node.get("children", [])
    if isinstance(children, list):
        for child in children:
            merge_details_to_tree(child, extracted_dir)

def merge_file_details(node, project_details=None):
    """
    Recursively traverse the tree and, for each file node, merge the extracted file-level details.
    The project_details parameter is passed from the nearest ancestor node of type "project".
    """
    # If this node is a project, update project_details to its details
    if node.get("type") == "project":
        project_details = node.get("details", {})

    # If this node is a file and we have project details available:
    if node.get("type") == "file" and project_details:
        # Extract the file's base name from its path (e.g., "francoishup-2048\\main.py" -> "main.py")
        file_name = os.path.basename(node.get("path", ""))
        # Look for a matching file in the project's details "files" list
        for file_info in project_details.get("files", []):
            # Assuming the extracted file info "path" is just the file name
            if file_info.get("path") == file_name:
                node["details"] = file_info
                break

    # Recurse into children, passing the current project_details (if any)
    for child in node.get("children", []):
        merge_file_details(child, project_details)

def remove_files_from_project_details(node):
    """
    Recursively remove the "files" key from project nodes' details.
    This ensures that file-level information only appears on file nodes.
    """
    if node.get("type") == "project" and "details" in node:
        if isinstance(node["details"], dict) and "files" in node["details"]:
            node["details"].pop("files")
    
    # Process children
    for child in node.get("children", []):
        remove_files_from_project_details(child)

def reorder_node(node):
    """
    Reorder the keys in a node so that "children" is the last key.
    This function recursively applies to all children.
    """
    desired_order = ["id", "name", "type", "last_modified", "num_lines", "size", "embedding", "position", "parent_id", "details"]
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

def main():
    tree_file = "projects_tree.json"
    extracted_dir = "extracted-information"  # Folder with enhanced project details
    output_file = "merged_projects_tree.json"

    # Load the projects tree JSON
    with open(tree_file, "r", encoding="utf-8") as f:
        tree_data = json.load(f)

    # Merge project-level details into the tree
    if "root" in tree_data:
        merge_details_to_tree(tree_data["root"], extracted_dir)
        # Merge file-level details using the project's "files" details
        merge_file_details(tree_data["root"])
        # Remove the redundant "files" key from project-level details
        remove_files_from_project_details(tree_data["root"])
        # Reorder keys for better readability
        tree_data["root"] = reorder_node(tree_data["root"])
    else:
        merge_details_to_tree(tree_data, extracted_dir)
        merge_file_details(tree_data)
        remove_files_from_project_details(tree_data)
        tree_data = reorder_node(tree_data)

    # Write the merged and cleaned data to a new JSON file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(tree_data, f, indent=2)
    
    print(f"Merged projects tree with file details saved to {output_file}")

if __name__ == "__main__":
    main()
