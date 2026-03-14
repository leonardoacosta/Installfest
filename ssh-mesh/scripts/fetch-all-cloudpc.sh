#!/bin/bash
# Fetch all branches for all git repos on CloudPC

echo "=== Fetching all branches for CloudPC repos ==="
echo ""

# Function to fetch all branches for a repo
fetch_repo() {
    local repo_path="$1"
    local repo_name=$(basename "$repo_path")

    if [ -d "$repo_path/.git" ]; then
        echo "📦 $repo_name"
        git -C "$repo_path" fetch --all --prune --tags 2>&1 | sed 's/^/  /'
        echo ""
    fi
}

# Fetch from source/repos/
echo "--- source/repos ---"
if [ -d "/mnt/c/Users/LeonardoAcosta/source/repos" ]; then
    for repo in /mnt/c/Users/LeonardoAcosta/source/repos/*/; do
        [ -d "$repo" ] && fetch_repo "$repo"
    done
fi

# Fetch from .claude
echo "--- .claude ---"
if [ -d "/mnt/c/Users/LeonardoAcosta/.claude/.git" ]; then
    fetch_repo "/mnt/c/Users/LeonardoAcosta/.claude"
fi

echo "=== Done ==="
