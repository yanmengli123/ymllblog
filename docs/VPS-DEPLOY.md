# VPS Deployment Guide (yanmengli.cn)

Enterprise-grade deployment to a Debian/Ubuntu VPS. This is the **primary host**
for the blog at `https://yanmengli.cn`. Cloudflare Pages remains a secondary
option (see RUNBOOK for rollback).

> ⚠️ **IMPORTANT**: This deployment requires you to run commands on the VPS
> yourself. Claude Code cannot SSH into your server. Follow the steps below
> in order; they are designed to be copy-paste safe.

---

## 1. Prerequisites

| Item | Value | Status |
|------|-------|--------|
| VPS public IP | `38.76.217.200` | ✅ confirmed |
| Domain | `yanmengli.cn` | ✅ bought (Alibaba) |
| DNS A record `@` | `38.76.217.200` | ✅ confirmed resolving |
| DNS A record `www` | `38.76.217.200` | ✅ confirmed resolving |
| SSH access | `root@38.76.217.200` | ✅ confirmed |

---

## 2. Deploy (one-time, on the VPS)

Connect from your local PowerShell:

```powershell
ssh root@38.76.217.200
```

Then run the deploy script. Two options:

### Option A — one command (recommended)

```bash
bash <(curl -sL https://raw.githubusercontent.com/yanmengli123/ymllblog/main/scripts/deploy-vps.sh)
```

### Option B — from a clone

```bash
git clone https://github.com/yanmengli123/ymllblog.git /tmp/ymllblog
bash /tmp/ymllblog/scripts/deploy-vps.sh
```

The script is **idempotent** — safe to re-run after any code change
(it re-clones, rebuilds, redeploys, and restarts Nginx).

---

## 3. What the script configures

| # | Component | What it does |
|---|-----------|--------------|
| 1 | `apt` | update + upgrade system |
| 2 | nginx, git, curl, ufw, fail2ban, rsync, openssl | core tooling |
| 3 | Node.js 20 | via Nodesource |
| 4 | UFW | allow 22/80/443 only, deny everything else |
| 5 | Fail2ban | ban SSH IP after 3 failed logins (2h), ufw banaction |
| 6 | Build | `git reset --hard origin/main`, `BASE_URL=/`, `SITEMAP_SITE_ROOT=https://yanmengli.cn`, `npm ci && npm run build` |
| 7 | Deploy | `dist/` → `/var/www/yanmengli/html` (www-data, 755) |
| 8 | Nginx | security headers, legacy `/ymllblog/*` 301, immutable asset cache, gzip, deny hidden files |
| 9 | TLS | Let's Encrypt webroot, auto-renew via `certbot.timer` |

---

## 4. Verify (run after deploy, paste output back)

```bash
echo "=== 1. UFW ===" && ufw status verbose
echo "=== 2. Homepage ===" && curl -sI https://yanmengli.cn | head -5
echo "=== 3. Security headers ===" && curl -sI https://yanmengli.cn | grep -iE "strict-transport|x-content|content-security|referrer|x-frame"
echo "=== 4. HTTP → HTTPS ===" && curl -sI http://yanmengli.cn | head -3
echo "=== 5. Legacy /ymllblog/ redirect ===" && curl -sI https://yanmengli.cn/ymllblog/blog/ | head -3
echo "=== 6. Sitemap ===" && curl -s https://yanmengli.cn/sitemap.xml | head -5
echo "=== 7. RSS ===" && curl -s https://yanmengli.cn/rss.xml | head -5
echo "=== 8. Cert ===" && certbot certificates
echo "=== 9. Fail2ban ===" && fail2ban-client status sshd
echo "=== 10. Nginx ===" && systemctl status nginx --no-pager | head -5
```

**Paste the output back to Claude Code** — it will tell you which checks passed.

---

## 5. Security hardening (MUST DO after first deploy)

### 5.1 Change root password immediately

The password `5231506ymL` was exposed in this chat log. Change it now:

```bash
passwd
```

Use a 20+ char password with mixed case, digits, symbols.

### 5.2 SSH key login + disable password auth

**On your local machine (PowerShell):**

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\yanmengli_vps -C "your-laptop"
type $env:USERPROFILE\.ssh\yanmengli_vps.pub | ssh root@38.76.217.200 "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
ssh -i $env:USERPROFILE\.ssh\yanmengli_vps root@38.76.217.200 "echo 'key login OK'"
```

**Only after key login confirmed working**, on the VPS:

```bash
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart sshd
```

### 5.3 HSTS Preload (optional, do after 2 weeks)

Submit `yanmengli.cn` to <https://hstspreload.org/?domain=yanmengli.cn>.

---

## 6. CI/CD auto-deploy from GitHub (after first manual deploy)

So `git push` auto-deploys (no manual SSH). On the VPS, create a deploy key:

```bash
# VPS: generate a key just for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
echo "=== PRIVATE KEY (copy to GitHub secret VPS_SSH_KEY) ==="
cat ~/.ssh/github_actions
```

Add to GitHub repo **Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `VPS_HOST` | `38.76.217.200` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | (private key from above) |

Then add `.github/workflows/deploy-vps.yml`:

```yaml
name: Deploy to VPS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci && npm run build
        env:
          BASE_URL: "/"
          SITEMAP_SITE_ROOT: "https://yanmengli.cn"
          CI: true
      - uses: burnett01/rsync-deployments@5.2
        with:
          switches: -avzr --delete
          path: dist/
          remote_path: /var/www/yanmengli/html/
          remote_host: ${{ secrets.VPS_HOST }}
          remote_user: ${{ secrets.VPS_USER }}
          remote_key: ${{ secrets.VPS_SSH_KEY }}
```

---

## 7. Rollback / disaster recovery

| Scenario | Recovery |
|----------|----------|
| Site broken after deploy | `cd /var/www/yanmengli/repo && git revert HEAD && git push` then re-run `scripts/deploy-vps.sh` |
| Cert expired | `certbot renew --force-renewal` |
| Server dead | Recreate VPS → re-run deploy script (repo has everything) |
| Lost SSH key | Console access from VPS provider → regenerate |
| GitHub down | VPS repo still has source; `npm run build` locally then `rsync` |

---

## 8. Daily ops

- **Write a post**: browse to `https://yanmengli.cn/admin/` → log in with the administrator username/password → save → Git commit and automatic deploy.
- **Check health**: `systemctl status nginx ymllblog-admin`, `curl http://127.0.0.1:8787/admin-api/health`, `certbot certificates`, `fail2ban-client status sshd`.
- **Backup**: Git history is the backup. Add `git remote add backup git@gitlab.com:you/ymllblog.git && git push backup main` for a second copy.

---

## 9. Costs

| Item | Cost |
|------|------|
| VPS (2 vCPU / 2 GB) | ~¥24–45/mo (Alibaba lightweight) |
| Domain `.cn` | ~¥10–30/yr |
| Let's Encrypt cert | $0 |
| **Total** | **~¥35–75/mo** |
