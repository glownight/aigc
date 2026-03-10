# AIGC Backend (Node.js)

独立 Node.js 后端，负责企业级 API 网关能力：

- 前后端密钥隔离（上游 API Key 仅存在服务端）
- 请求参数校验（zod）
- 结构化日志（pino）
- 限流（express-rate-limit）
- CORS 白名单
- 流式 SSE 透传
- 健康检查接口

## 目录

```txt
backend/
  src/
    config/
    middleware/
    routes/
    services/
    index.ts
```

## 运行

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

默认端口：`3001`

开发环境下默认允许 `localhost` / `127.0.0.1` 任意端口跨域；生产环境请使用 `CORS_ORIGINS` 精确配置前端域名。

## 关键接口

- `GET /health`
- `GET /health/ready`
- `POST /api/chat`

## 生产建议

- `CORS_ORIGINS` 精确到正式前端域名
- 配置 `INTERNAL_API_TOKEN`，并在边界网关/WAF 做二次防护
- 结合反向代理与审计日志做全链路观测
