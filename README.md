# AIGC Enterprise Split Architecture

本项目已升级为前后端分离架构：

- `src/`：前端（Vite + React + TypeScript）
- `backend/`：后端（Node.js + Express + TypeScript）

## 架构目标

- 前端不保存、不传递上游模型 API Key
- 后端作为统一 AI 网关，集中处理安全与治理能力
- 支持流式响应（SSE）

## 后端企业级能力

- 配置强校验（`zod`）
- 结构化日志（`pino` + `pino-http`）
- CORS 白名单
- 统一限流（`express-rate-limit`）
- 安全头（`helmet`）
- 可选内部 token 校验（`x-internal-token`）
- 健康检查：`/health`、`/health/ready`

## 快速启动

### 1) 启动后端

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 2) 启动前端

```bash
# 回到项目根目录
npm install
npm run setup:env
npm run dev
```

默认前端会连接 `http://localhost:3001`。

## 前端环境变量

`setup-env.js` 生成：

- `VITE_REMOTE_API_BASE_URL`：后端网关地址
- `VITE_REMOTE_API_MODEL`：默认模型
- `VITE_DEFAULT_ENGINE`：`browser` 或 `remote`

## 网关接口

- `POST /api/chat`

请求示例：

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "stream": true
}
```
