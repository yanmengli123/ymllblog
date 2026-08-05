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

**Important**: this key is restricted so it can ONLY run rsync to the
deploy directory. Even if compromised, it can't open a shell.

```bash
ssh root@38.76.217.200

# 生成专用密钥（专用，不与登录密钥混用）
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""

# 限制此密钥只能 rsync 到指定目录（防止被滥用开 shell）
cat >> ~/.ssh/authorized_keys << 'KEY_LINE'
command="/usr/bin/rsync --server -logDtpre.iLsfxCIvu --delete . /var/www/yanmengli/html/",no-pty,no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519
KEY_LINE

# 实际写法（替换为上面 ssh-keygen 输出的真实公钥）：
# cat github_actions_deploy.pub | while read line; do
#   echo "command=\"/usr/bin/rsync --server -logDtpre.iLsfxCIvu --delete . /var/www/yanmengli/html/\",no-pty,no-port-forwarding,no-X11-forwarding,no-agent-forwarding $line" >> ~/.ssh/authorized_keys
# done

# 显示私钥内容（要复制到 GitHub Secret）
echo "=== 复制下面的整段内容（PRIVATE KEY）==="
cat ~/.ssh/github_actions_deploy
echo "=== 结束 ==="
```

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
| SSH key leaked | Key is restricted via `command=` in authorized_keys — can only rsync to html/, no shell |
| Bad commit pushed | `git revert HEAD && git push` → auto-reverts to last good deploy |
| GitHub outage | Run `bash scripts/deploy-vps.sh` on VPS manually — full local deploy |
| VPS down | Server provider's snapshot/restore; rebuild from any git commit |
| Secrets leaked | Rotate via repo Settings → Secrets; the old deploy key loses access |

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