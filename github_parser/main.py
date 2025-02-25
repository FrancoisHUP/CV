import os
import requests
import time
from tqdm import tqdm
from bs4 import BeautifulSoup

# ------------------------------
# Configuration
# ------------------------------
GITHUB_USERNAME = "francoisHUP"  # Replace with your GitHub username
GITINGEST_URL = "https://gitingest.com/"    # gitingest API endpoint
DATASET_DIR = "dataset"
MAX_RETRIES = 5             # Number of retries on error 429
INITIAL_DELAY = 30          # Starting delay (in seconds) on rate limit hit

# Create the dataset directory if it doesn't exist
os.makedirs(DATASET_DIR, exist_ok=True)

# ------------------------------
# Fetch All GitHub Repositories (with Pagination)
# ------------------------------
def fetch_github_repos():
    repos = []
    page = 1
    per_page = 100  # GitHub API allows up to 100 per page
    while True:
        url = f"https://api.github.com/users/{GITHUB_USERNAME}/repos?per_page={per_page}&page={page}"
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error fetching repos from page {page}: {response.status_code}")
            break
        data = response.json()
        if not data:  # No more repos returned
            break
        repos.extend(data)
        page += 1
    return repos

# ------------------------------
# Fetch Data from gitingest with Retry on 429
# ------------------------------
def fetch_gitingest_data(repo_url, max_retries=MAX_RETRIES):
    payload = {
        "input_text": repo_url,
        "max_file_size": 243,
        "pattern_type": "exclude",
        "pattern": ""
    }
    delay = INITIAL_DELAY
    for attempt in range(max_retries):
        response = requests.post(GITINGEST_URL, data=payload)
        if response.status_code == 200:
            return response.text
        elif response.status_code == 429:
            print(f"Rate limit hit for {repo_url}. Attempt {attempt+1}/{max_retries}. Waiting {delay} seconds.")
            time.sleep(delay)
            delay *= 2  # Exponential backoff
        else:
            print(f"Error fetching data for {repo_url}: {response.status_code}")
            return None
    print(f"Exceeded maximum retries for {repo_url}. Skipping.")
    return None

# ------------------------------
# Extract Directory Structure and Code Content
# ------------------------------
def extract_directory_and_code(html_text):
    soup = BeautifulSoup(html_text, "html.parser")
    # Extract the hidden input containing the directory structure
    dir_structure_tag = soup.find("input", {"id": "directory-structure-content"})
    directory_structure = dir_structure_tag["value"] if dir_structure_tag else "No directory structure found."
    
    # Extract the textarea that holds the code content
    code_area_tag = soup.find("textarea", {"class": "result-text"})
    code_content = code_area_tag.text if code_area_tag else "No code content found."
    
    return directory_structure, code_content

# ------------------------------
# Save Data to a File in the dataset Directory
# ------------------------------
def save_to_file(repo_name, directory_structure, code_content):
    file_path = os.path.join(DATASET_DIR, f"{repo_name}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write("### Directory Structure ###\n")
        f.write(directory_structure + "\n\n")
        f.write("### Code Content ###\n")
        f.write(code_content + "\n")
    # print(f"Saved: {file_path}")

# ------------------------------
# Main Process
# ------------------------------
def main():
    repos = fetch_github_repos()
    total_repos = len(repos)
    print(f"Total repositories found: {total_repos}")
    
    # Use tqdm for a progress bar; it will automatically skip repos already processed.
    for repo in tqdm(repos, desc="Processing Repositories", unit="repo"):
        repo_name = repo["name"]
        repo_url = repo["html_url"]
        
        # Resume support: Skip if dataset file already exists
        file_path = os.path.join(DATASET_DIR, f"{repo_name}.txt")
        if os.path.exists(file_path):
            continue

        # Fetch and process the repository via gitingest
        html_text = fetch_gitingest_data(repo_url)
        if html_text:
            directory_structure, code_content = extract_directory_and_code(html_text)
            save_to_file(repo_name, directory_structure, code_content)
        
        # Small delay to be friendly with API limits
        time.sleep(1)

if __name__ == "__main__":
    main()
