# YMLL Blog 管理后台

后台地址为站点的 `/admin/`。当前版本使用自有管理员会话服务，不再由浏览器直接连接 GitHub，因此日常使用只需要输入管理员用户名和密码。

## 工作方式

- 管理界面：`public/admin/`，提供文章、首页 NOW、项目、研究日志和阅读书架五类内容入口。文章支持增删改查、草稿、精选排序、成熟度、培育日志、标签、分类和封面上传；项目与研究日志支持独立 CRUD；首页状态与阅读书架支持结构化维护。
- 管理 API：`server/admin-server.mjs`，只监听 VPS 本机 `127.0.0.1:8787`，由 Nginx 代理 `/admin-api/`。
- 内容存储：API 通过服务端保存的最小权限 GitHub Token 修改 `src/content/blog/*.md`、`src/content/projects/*.md`、`src/content/research/*.md`、`src/content/garden.yml` 与 `src/content/reading.yml`，保留 Git 版本历史并自动触发现有部署流程。
- 本地开发：`CONTENT_BACKEND=local` 时直接读写项目内的 Markdown，便于完整测试。

## 安全边界

- 密码使用 scrypt 哈希，仓库中不保存明文密码。
- 登录成功后只下发 `HttpOnly + Secure + SameSite=Strict` 会话 Cookie。
- 创建、修改、删除和上传均验证 CSRF Token。
- 同一来源 15 分钟内连续失败 5 次会被临时锁定；Nginx 另有接口限流。
- GitHub Token 仅存放在 VPS 的 `/etc/ymllblog-admin.env`，浏览器无法读取。
- 服务使用 systemd 沙箱运行，并只监听回环地址，不直接暴露 8787 端口。

## 首次配置

在项目目录生成密码哈希：

```bash
npm run admin:password -- '你的至少12位强密码'
```

在 VPS 生成会话密钥：

```bash
openssl rand -base64 48
```

复制 `server/admin.env.example` 为 VPS 的 `/etc/ymllblog-admin.env`，填入：

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `GITHUB_TOKEN`：fine-grained personal access token，只授权 `yanmengli123/ymllblog` 的 Contents 读写权限

然后执行：

```bash
chmod 600 /etc/ymllblog-admin.env
bash scripts/deploy-vps.sh
```

不要把环境文件、Token、密码或密码哈希发到聊天、截图或提交进 Git。

## 本地测试

使用临时开发密码启动 API：

```powershell
$env:ADMIN_DEV_PASSWORD='仅限本机的临时密码'
npm run admin:server
```

另开终端运行 `npm run dev`，再打开 `http://localhost:4321/ymllblog/admin/`。开发服务器会精确重定向到独立静态后台入口；本地模式直接修改当前项目的 Markdown 文件，因此测试创建和删除时要注意工作区变化。用户名和密码从本地环境配置读取。
