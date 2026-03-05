#!/usr/bin/env node

/**
 * 环境变量配置脚本
 * 快速创建 .env.local 文件
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# 远程API配置
# Remote API Configuration

# API基础地址 / API Base URL
VITE_REMOTE_API_BASE_URL=https://tbnx.plus7.plus/

# API密钥 / API Key
VITE_REMOTE_API_KEY=sk-wOAmGmUMNFVsosjkCm68Fg2wJE7ctTPZMx8q3EozUiT49zFi

# 默认模型 / Default Model
# 可选: deepseek-chat, deepseek-r1, deepseek-r1-250528, deepseek-reasoner, 
#       deepseek-reasoner-all, deepseek-v3, deepseek-v3-250324
VITE_REMOTE_API_MODEL=deepseek-chat

# 默认引擎模式 / Default Engine Mode
# 选项: "browser" | "remote"
VITE_DEFAULT_ENGINE=remote
`;

const envPath = path.join(__dirname, ".env.local");

if (fs.existsSync(envPath)) {
  console.log("⚠️  .env.local 文件已存在");
  console.log("如果要重新创建，请先删除现有文件：");
  console.log("  rm .env.local");
  process.exit(0);
}

try {
  fs.writeFileSync(envPath, envContent);
  console.log("✅ 成功创建 .env.local 文件");
  console.log("📝 配置内容：");
  console.log(envContent);
  console.log("🚀 请重启开发服务器：npm run dev");
} catch (error) {
  console.error("❌ 创建文件失败：", error.message);
  process.exit(1);
}
