# AI Workflow Sharing Platform (MVP)

这是根据你的 `aitoolpool.docx` 需求实现的可本地运行前后端项目。

## 已实现功能

- 用户注册 / 登录（JWT）
- 创建 AI workflow note（支持可编辑 stage：新增/删除）
- note 支持：title, summary, markdown content, primary tool, tags, visibility, steps、edge prompt
- 我的笔记列表
- 公开内容搜索（keyword）与 Blog 风格卡片展示
- 点击卡片进入 Workflow 详情页
- Workflow 详情页支持：节点图、边上 prompt、阶段详情
- 示例素材接入：`assets/workflow1` 中的 `info.txt`、`input_image1.jpg`、`kling_output.mp4`
- 收藏公开内容
- 后端 API 自动化测试（Vitest）

## 技术栈

- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript
- Data: SQLite 数据库（开发 `backend/src/data/app.db`，测试 `backend/src/data/app.test.db`）

## 本地启动

1. 安装依赖

```bash
cd /Users/danielsmith/Documents/1-RL/ASU/research/77workflowAItools
npm install
npm run install:all
```

2. 启动前后端

```bash
npm run dev
```

- 前端: [http://localhost:5173](http://localhost:5173)
- 后端: [http://localhost:4000](http://localhost:4000)

3. 运行测试

```bash
npm run test
```

## 默认演示账号

- email: `demo@workflowbase.ai`
- password: `demo123456`

后端会在首次启动时自动写入该账号和示例公开 workflow（`NODE_ENV=test` 时不会注入，避免影响测试）。

## API 概览

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/notes` (auth)
- `GET /api/notes/mine` (auth)
- `GET /api/notes/:id` (public note detail)
- `PATCH /api/notes/:id` (auth)
- `POST /api/uploads` (auth, multipart/form-data, field: `file`)
- `GET /api/uploads/mine` (auth)
- `GET /api/community/search`
- `POST /api/community/bookmarks/:noteId` (auth)
- `GET /api/community/bookmarks` (auth)
- `GET /api/workflows/examples`
- `GET /api/workflows/examples/:slug`
- `GET /media/:workflowSlug/:filename`

## 说明

这个版本优先保证你“今天能在本地启动和测试完整流程”。
下一步如果你确认，我可以直接把数据层切到 PostgreSQL + Prisma（schema 按你文档的 users/tools/notes/workflow_steps/assets/tags/bookmarks 扩展）。


# check DB files: 

cd /Users/danielsmith/Documents/1-RL/ASU/research/77workflowAItools

# 查看所有表
sqlite3 backend/src/data/app.db ".tables"

# 查看某张表结构
sqlite3 backend/src/data/app.db ".schema users"

# 查看用户数据（示例）
sqlite3 backend/src/data/app.db "SELECT id, email, username, created_at FROM users;"

# 更易读的表格输出（交互式）
sqlite3 backend/src/data/app.db
# 进入后执行：
.headers on
.mode column
.tables
SELECT * FROM users LIMIT 20;