# WorldcupYY

Next.js + PostgreSQL 的 2026 美加墨世界杯胜平负竞猜站，适合朋友之间用虚拟币娱乐。

## 本地配置

1. 创建 PostgreSQL 数据库和专用用户。
2. 复制 `.env.example` 为 `.env`，填写独立的 `DATABASE_URL` 和至少 32 位的 `AUTH_SECRET`。
3. 安装依赖并初始化数据库：

```bash
npm install
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

配置了 Next.js `basePath: "/football"`，本地开发访问地址是 `http://localhost:3000/football`。

管理员账号：`Leon`  
初始密码：`070604`

## Ubuntu 24 / 复用已有 PostgreSQL 实例

建议在同一个 PostgreSQL 服务里创建独立数据库和低权限用户，不复用其它网站的数据库账号：

下面的 `kickoff` / `kickoff_user` 只是数据库示例名；如果已经部署并有数据，不需要为了项目改名而重命名数据库或数据库用户。

```sql
CREATE DATABASE kickoff;
CREATE USER kickoff_user WITH ENCRYPTED PASSWORD 'replace_with_a_strong_password';
GRANT CONNECT ON DATABASE kickoff TO kickoff_user;
\c kickoff
GRANT USAGE, CREATE ON SCHEMA public TO kickoff_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO kickoff_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO kickoff_user;
```

生产启动：

```bash
npm ci
npm run build
npm run prisma:deploy
npm run prisma:seed
npm run start
```

线上部署在子路径 `/football` 下，例如 `http://81.71.163.74/football`。后续开发时：

- `<Link href="/login">`、`redirect("/login")`、`router.push("/login")` 继续写不带 `/football` 的应用内路径。
- 客户端原生 `fetch` 请求 API 时需要写完整子路径，例如 `fetch("/football/api/...")`，或封装统一请求工具。
- 引用 `public/` 目录静态资源时需要写 `/football/...` 前缀。

## 赛程数据

`prisma/worldcup2026.games.csv` 和 `prisma/worldcup2026.teams.csv` 固定为本地 seed 数据。当前 CSV 覆盖 72 场小组赛；seed 会用 FIFA 官方小组名单覆盖中文球队名称，并自动补齐 73-104 的淘汰赛占位赛程。管理员可以在后台修正球队、北京时间开赛时间、赔率和赛果。

原计划参考 FIFA 官方赛程页：
https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/match-schedule-fixtures-results-teams-stadiums

FIFA 官方 PDF 赛程：
https://digitalhub.fifa.com/m/1be9ce37eb98fcc5/original/FWC26-Match-Schedule_English.pdf
