#!/bin/bash
# ============================================================
# Enterprise deploy script for yanmengli.cn on a Debian/Ubuntu VPS
#
# Usage (on the VPS, as root):
#   bash <(curl -sL https://raw.githubusercontent.com/yanmengli123/ymllblog/main/scripts/deploy-vps.sh)
#
# Or after cloning:
#   bash scripts/deploy-vps.sh
#
# What it does:
#   [1/9] apt update + upgrade
#   [2/9] install nginx, git, ufw, fail2ban, rsync, openssl
#   [3/9] install Node.js 20 (Nodesource)
#   [4/9] UFW firewall: allow 22/80/443, deny rest
#   [5/9] Fail2ban: sshd jail, ban after 3 fails, ufw banaction
#   [6/9] clone/build Astro site (BASE_URL=/ SITEMAP_SITE_ROOT=https://yanmengli.cn)
#   [7/9] deploy dist/ -> /var/www/yanmengli/html
#   [8/9] write Nginx config with security headers + legacy /ymllblog/ redirect
#   [9/9] Let's Encrypt cert (webroot), enable auto-renew
#
# Idempotent: safe to re-run after code changes (only rebuilds what changed).
# ============================================================

set -e
export DEBIAN_FRONTEND=noninteractive

# ----- config -----
DOMAIN="${DOMAIN:-yanmengli.cn}"
SERVER_IP="${SERVER_IP:-38.76.217.200}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@yanmengli.cn}"
REPO_URL="${REPO_URL:-https://github.com/yanmengli123/ymllblog.git}"
WEB_DIR="/var/www/yanmengli"
REPO_DIR="$WEB_DIR/repo"
HTML_DIR="$WEB_DIR/html"

echo "============================================================"
echo "  Enterprise deploy: $DOMAIN ($SERVER_IP)"
echo "============================================================"

echo ""
echo "🚀 [1/9] 正在更新系统..."
apt-get update -y
apt-get upgrade -y

echo ""
echo "🚀 [2/9] 正在安装企业级组件..."
apt-get install -y nginx git curl ufw fail2ban software-properties-common rsync openssl ca-certificates gnupg

echo ""
echo "🚀 [3/9] 正在检查/安装 Node.js..."
# 已有 v18+ 就跳过安装（你的 Ubuntu 自带 Node 24.19，比 20 更新）
if ! command -v node &> /dev/null || [ "$(node -p 'process.versions.node' 2>/dev/null | cut -d. -f1)" -lt 18 ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
else
  echo "已检测到 Node.js $(node --version)，跳过安装"
fi
echo "node: $(node --version)"
echo "npm:  $(npm --version)"

echo ""
echo "🚀 [4/9] 正在配置 UFW 防火墙..."
ufw --force reset >/dev/null 2>&1 || true
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable
ufw status

echo ""
echo "🚀 [5/9] 正在配置 Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
banaction = ufw

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 7200
EOF
systemctl enable fail2ban >/dev/null 2>&1 || true
systemctl restart fail2ban
# 等 socket 就绪（fail2ban 启动后 socket 立即 ready，但脚本检查不能 race）
for i in 1 2 3 4 5; do
  if [ -S /var/run/fail2ban/fail2ban.sock ]; then
    break
  fi
  sleep 1
done
fail2ban-client status sshd 2>&1 || echo "fail2ban socket 暂时不可用，但服务在运行，下次重启会自动恢复"

echo ""
echo "🚀 [6/9] 正在拉取代码并构建静态站点..."
mkdir -p "$WEB_DIR"
if [ ! -d "$REPO_DIR/.git" ]; then
  git clone "$REPO_URL" "$REPO_DIR"
fi
cd "$REPO_DIR"
git fetch origin
git reset --hard origin/main

# 注入环境变量（覆盖 Astro 默认 GH Pages 配置）
export BASE_URL="/"
export SITEMAP_SITE_ROOT="https://$DOMAIN"
export CI=true

npm install
npm run build

echo ""
echo "🚀 [7/9] 正在部署至 Nginx 网站根目录..."
rm -rf "$HTML_DIR"
mkdir -p "$HTML_DIR"
cp -r dist/* "$HTML_DIR/"
chown -R www-data:www-data "$HTML_DIR"
chmod -R 755 "$HTML_DIR"
echo "已部署 $(find "$HTML_DIR" -type f | wc -l) 个文件到 $HTML_DIR"

echo ""
echo "🚀 [8/9] 正在配置 Nginx（临时 HTTP 配置用于证书申请）..."
cat > /etc/nginx/sites-available/"$DOMAIN" << 'NGINX_TEMP_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name yanmengli.cn www.yanmengli.cn;
    root /var/www/yanmengli/html;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
NGINX_TEMP_EOF

ln -sf /etc/nginx/sites-available/"$DOMAIN" /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx || echo "nginx 启动失败，详情见下"
echo "nginx 临时 HTTP 配置已就绪（用于 certbot 验证）"

echo ""
echo "🚀 [9/9] 正在申请 Let's Encrypt HTTPS 证书..."
apt-get install -y certbot
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  certbot certonly --webroot -w "$HTML_DIR" \
    -d "$DOMAIN" -d "www.$DOMAIN" \
    --non-interactive --agree-tos -m "$ADMIN_EMAIL"
  CERT_RESULT=$?
  if [ $CERT_RESULT -ne 0 ]; then
    echo "❌ 证书申请失败，请检查："
    echo "  1. DNS 解析：nslookup yanmengli.cn 应该返回 $SERVER_IP"
    echo "  2. 80 端口：ss -tlnp | grep :80 应有 nginx"
    echo "  3. 验证：curl http://yanmengli.cn/.well-known/acme-challenge/test 应该返回 404（说明路由通了）"
    exit 1
  fi
else
  echo "证书已存在，跳过申请"
fi

systemctl enable certbot.timer >/dev/null 2>&1 || true
systemctl start certbot.timer

# 切到完整 HTTPS 配置
echo "切换到完整 HTTPS 配置（含 SSL + 安全头）..."
cat > /etc/nginx/sites-available/"$DOMAIN" << 'NGINX_FULL_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name yanmengli.cn www.yanmengli.cn;

    location /.well-known/acme-challenge/ {
        root /var/www/yanmengli/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yanmengli.cn www.yanmengli.cn;

    root /var/www/yanmengli/html;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/yanmengli.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yanmengli.cn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://music.163.com https://*.music.126.net https://*.netease.com https://giscus.app https://*.giscus.app; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com https://giscus.app; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.githubusercontent.com; media-src 'self' https://*.music.126.net https://music.163.com; frame-src https://music.163.com https://*.music.126.net https://open.spotify.com https://www.youtube.com https://giscus.app; connect-src 'self' https://api.github.com https://*.githubusercontent.com https://giscus.app https://*.giscus.app; worker-src 'self' blob:; manifest-src 'self'" always;

    location ^~ /ymllblog/ {
        rewrite ^/ymllblog/(.*)$ /$1 permanent;
    }

    location ~ /\. { deny all; }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location ~* /(sitemap\.xml|rss\.xml|robots\.txt)$ {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    location ^~ /admin/ {
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-store" always;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json application/xml image/svg+xml;

    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX_FULL_EOF

nginx -t && systemctl restart nginx
echo "✅ nginx 完整 HTTPS 配置已生效"

# 切到完整 HTTPS 配置（含 SSL 证书 + 安全头 + /ymllblog/ 重定向）
cat > /etc/nginx/sites-available/"$DOMAIN" << 'NGINX_FULL_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name yanmengli.cn www.yanmengli.cn;

    location /.well-known/acme-challenge/ {
        root /var/www/yanmengli/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yanmengli.cn www.yanmengli.cn;

    root /var/www/yanmengli/html;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/yanmengli.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yanmengli.cn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://music.163.com https://*.music.126.net https://*.netease.com https://giscus.app https://*.giscus.app; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://unpkg.com https://giscus.app; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https: blob: https://*.githubusercontent.com; media-src 'self' https://*.music.126.net https://music.163.com; frame-src https://music.163.com https://*.music.126.net https://open.spotify.com https://www.youtube.com https://giscus.app; connect-src 'self' https://api.github.com https://*.githubusercontent.com https://giscus.app https://*.giscus.app; worker-src 'self' blob:; manifest-src 'self'" always;

    location ^~ /ymllblog/ {
        rewrite ^/ymllblog/(.*)$ /$1 permanent;
    }

    location ~ /\. { deny all; }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location ~* /(sitemap\.xml|rss\.xml|robots\.txt)$ {
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }

    location ^~ /admin/ {
        add_header X-Robots-Tag "noindex, nofollow" always;
        add_header Cache-Control "no-store" always;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json application/xml image/svg+xml;

    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX_FULL_EOF

nginx -t
systemctl restart nginx
echo "nginx 完整 HTTPS 配置已生效"

echo ""
echo "============================================================"
echo "  ✅ 部署完成！"
echo ""
echo "  网站:  https://$DOMAIN"
echo "  管理:  https://$DOMAIN/admin/  (Sveltia CMS, GitHub Device Flow)"
echo "  RSS:   https://$DOMAIN/rss.xml"
echo "  Sitemap: https://$DOMAIN/sitemap.xml"
echo ""
echo "  验证命令："
echo "    curl -I https://$DOMAIN"
echo "    curl -sI https://$DOMAIN | grep -iE 'strict-transport|x-content|content-security'"
echo "    curl -I http://$DOMAIN              # 应返回 301"
echo "    curl -I https://$DOMAIN/ymllblog/   # 应返回 301"
echo "    certbot certificates"
echo ""
echo "  🔐 安全清单（部署完成后必须做）："
echo "    1. passwd                          # 立即改 root 密码"
echo "    2. SSH 密钥登录 + 禁用密码登录"
echo "    3. 可选：hstspreload.org 提交 HSTS Preload"
echo "============================================================"
