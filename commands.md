Remove all old workflows

```bash
REPO_OWNER="leonardoacosta";
REPO_NAME="homelab";
gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs" --paginate -q '.workflow_runs | .[] | .id' | xargs -I {} gh run cancel {} --force --repo $REPO_OWNER/$REPO_NAME;
gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs" --paginate -q '.workflow_runs | .[] | .id' | xargs -I {} gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs/{}" -X DELETE

REPO_NAME="tribal-cities";
gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs" --paginate -q '.workflow_runs | .[] | .id' | xargs -I {} gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs/{}" -X DELETE

REPO_NAME="tribal-cities";
gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs" --paginate -q '.workflow_runs | .[] | .id' | xargs -I {} gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs/{}" -X DELETE

REPO_NAME="otaku-odyssey";
gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs" --paginate -q '.workflow_runs | .[] | .id' | xargs -I {} gh api "repos/$REPO_OWNER/$REPO_NAME/actions/runs/{}" -X DELETE


```

Test tailscale

```bash
tailscale status
ping -c 3 100.94.11.104
nc -zv 100.94.11.104 445
nc -zv 100.94.11.104 22
smbclient -L //100.94.11.104 -N
```
