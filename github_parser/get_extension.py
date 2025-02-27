# $ python get_extension.py dataset/
import re
import sys
import os

def extract_tree_section(file_path):
    """
    Reads the file and returns only the text up to the "### Code Content ###" section.
    """
    tree_lines = []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            # Stop reading when we hit the separator for the code content section.
            if "### Code Content ###" in line:
                break
            tree_lines.append(line)
    return "".join(tree_lines)

def extract_extensions_from_text(text):
    """
    Given a text (tree representation), extract file extensions.
    """
    extensions = set()
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        # Remove leading tree characters like "├──", "└──", "│", etc.
        line_clean = re.sub(r'^[│├└─\s]+', '', line)
        # Skip lines that don't look like file entries (e.g. header lines)
        if line_clean.startswith("Directory structure:") or line_clean.startswith("###"):
            continue
        # If the line ends with a slash, it's a directory so skip it.
        if line_clean.endswith('/'):
            continue
        # If there's a dot in the line, assume it's a file name.
        if '.' in line_clean:
            ext = '.' + line_clean.split('.')[-1].lower()
            extensions.add(ext)
    return extensions

def process_file(file_path):
    """
    Reads only the tree section of the file and extracts extensions from its contents.
    """
    tree_text = extract_tree_section(file_path)
    return extract_extensions_from_text(tree_text)

def main():
    if len(sys.argv) < 2:
        print("Usage: python get_extension.py <file_or_directory>")
        sys.exit(1)
    
    path = sys.argv[1]
    all_exts = set()
    
    if os.path.isdir(path):
        # Walk through the directory and process all .txt files
        for root, dirs, files in os.walk(path):
            for file in files:
                if file.endswith(".txt"):
                    file_path = os.path.join(root, file)
                    exts = process_file(file_path)
                    all_exts = all_exts.union(exts)
    elif os.path.isfile(path):
        all_exts = process_file(path)
    else:
        print("Provided path is neither a file nor a directory.")
        sys.exit(1)
    
    print("Extracted extensions:", sorted(list(all_exts)))

if __name__ == "__main__":
    main()
