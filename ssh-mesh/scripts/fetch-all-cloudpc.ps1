# Fetch all branches for all git repos on CloudPC
Write-Output "=== Fetching all branches for CloudPC repos ==="
Write-Output ""

function Fetch-Repo {
    param($RepoPath)

    $RepoName = Split-Path -Leaf $RepoPath

    if (Test-Path "$RepoPath\.git") {
        Write-Output "📦 $RepoName"
        Push-Location $RepoPath
        git fetch --all --prune --tags 2>&1 | ForEach-Object { "  $_" }
        Pop-Location
        Write-Output ""
    }
}

# Fetch from source/repos/
Write-Output "--- source/repos ---"
$reposPath = "C:\Users\LeonardoAcosta\source\repos"
if (Test-Path $reposPath) {
    Get-ChildItem -Path $reposPath -Directory | ForEach-Object {
        Fetch-Repo $_.FullName
    }
}

# Fetch from .claude
Write-Output "--- .claude ---"
$claudePath = "C:\Users\LeonardoAcosta\.claude"
if (Test-Path "$claudePath\.git") {
    Fetch-Repo $claudePath
}

Write-Output "=== Done ==="
