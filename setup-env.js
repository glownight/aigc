#!/usr/bin/env node

/**
 * 前端环境变量配置脚本
 * 快速创建 .env.local 文件
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Frontend Remote Mode Configuration
# 前端远程模式配置（仅连接后端网关，不存放上游 API 密钥）

# Node 后端网关地址
# 开发环境推荐: http://localhost:3001
# 生产环境可留空走同域，或填写 https://your-api-domain.com
VITE_REMOTE_API_BASE_URL=http://localhost:3001

# 默认模型名称（由后端转发到上游）
VITE_REMOTE_API_MODEL=deepseek-chat

# 默认引擎模式
# 选项: "browser" | "remote"
VITE_DEFAULT_ENGINE=remote
`;

const envPath = path.join(__dirname, ".env.local");

if (fs.existsSync(envPath)) {
  console.log(".env.local 文件已存在");
  console.log("如需重新创建，请先删除：rm .env.local");
  process.exit(0);
}

try {
  fs.writeFileSync(envPath, envContent);
  console.log("成功创建 .env.local 文件");
  console.log("配置内容：");
  console.log(envContent);
  console.log("请重启开发服务器：npm run dev");
} catch (error) {
  console.error("创建文件失败：", error.message);
  process.exit(1);
}
