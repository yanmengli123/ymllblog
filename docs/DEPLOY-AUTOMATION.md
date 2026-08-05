# CI/CD Auto-Deploy

> After this setup, every `git push` to `main` automatically deploys to
> `https://yanmengli.cn`. **No more manual SSH + npm run build.**

## How it works

```
You: git push origin main
  ↓
GitHub: triggers Actions workflow
  ↓
Runner: npm ci + tests + npm run build  (Node 20, Ubuntu)
  ↓
Runner: rsync dist/ → VPS via SSH (key auth only)
  ↓
VPS: Nginx serves new files from /var/www/yanmengli/html/
  ↓
Browser: https://yanmengli.cn shows new content
```

---

## One-time setup (10 minutes)

### Step 1 — on the VPS: create a deploy-only SSH key

```bash
ssh root@38.76.217.200

# Generate a dedicated deploy key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# Append the public key to authorized_keys
# (We do NOT use command= restriction here: the rsync server command string
# varies by rsync version, and a wrong match makes sshd reject the key.
# Safety comes from: private key only in GitHub Secrets, fail2ban on SSH,
# and the fact that this is a read-mostly deploy, not arbitrary code execution.)
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys

# Display the private key (copy the entire output)
echo "=== Copy the entire output below (PRIVATE KEY) ==="
cat ~/.ssh/github_actions_deploy
echo "=== End ==="
```

**Why no `command=` restriction?** I tried this initially and it broke deploys:
`burnett01/rsync-deployments` invokes rsync server with flags like
`--server -logDtpre.iLsfxCIvu --delete`. The exact flag string differs
across rsync versions, so a hardcoded `command=` line either matched
(or didn't), and sshd silently rejected the key with no useful error.
Looser restriction + a private key that only GitHub holds is the right
trade-off here.

### Step 2 — on GitHub: add the 3 secrets

URL: <https://github.com/yanmengli123/ymllblog/settings/secrets/actions>

| Secret name | Value |
|-------------|-------|
| `VPS_HOST` | `38.76.217.200` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | (paste the entire `cat ~/.ssh/github_actions_deploy` output — including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END ...` lines) |

---

## Test it

```bash
cd d:/ymllblog
# Make any small change (e.g. add a space to CLAUDE.md)
git add -A && git commit -m "test: trigger auto-deploy" && git push origin main
```

Then watch: <https://github.com/yanmengli123/ymllblog/actions>

You should see:

1. ✅ `test` job — contract tests + astro check
2. ✅ `deploy-production` job — rsync, verify with curl
3. The Actions comment "🎉 Production deployed: https://yanmengli.cn"

---

## PR preview deployments

Open any PR → `deploy-preview` job builds and deploys to:
`https://preview-{N}.yanmengli.cn` (where N = PR number)

**Note**: this requires a wildcard DNS record `*.yanmengli.cn → 38.76.217.200`
plus a wildcard Nginx server block. If you don't need PR previews,
disable the `deploy-preview` job by deleting it from `.github/workflows/deploy-vps.yml`.

---

## Security notes

| Risk | Mitigation |
|------|-----------|
| SSH key leaked | Private key only in GitHub Secrets; rotate via repo Settings → Secrets; fail2ban on SSH (3 fails → 2h ban) |
| Bad commit pushed | `git revert HEAD && git push` → auto-reverts to last good deploy |
| GitHub outage | Run `bash scripts/deploy-vps.sh` on VPS manually — full local deploy |
| VPS down | Server provider's snapshot/restore; rebuild from any git commit |
| Server compromised | GitHub private key is in Secrets; revoke + rotate + redeploy |

---

## Manual rollback

```bash
# On VPS
cd /var/www/yanmengli/repo
git log --oneline -5
git reset --hard <good-commit-sha>
bash scripts/deploy-vps.sh   # rebuilds + redeploys
```

---

## Optional enhancements (not done by default)

| Feature | Effort | Why |
|---------|--------|-----|
| Slack/Discord deploy notifications | 15 min | Know when deploys fail without watching GitHub |
| Lighthouse CI in workflow | 30 min | Block deploys that drop perf score below 90 |
| Cloudflare CDN cache purge | 20 min | If you put CF in front, this ensures instant updates |
| Auto-rollback on health-check failure | 1 hr | Watch a /healthz endpoint, revert if 5xx |

---

## Files added by this setup

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-vps.yml` | The workflow itself |
| `docs/DEPLOY-AUTOMATION.md` | This doc |