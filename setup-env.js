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

const envContent = `# codex-for-me server-side proxy configuration
# 当前项目只需要一个 key

OPENAI_API_KEY=clp-your-codex-for-me-key

# Optional overrides
OPENAI_API_BASE_URL=https://api-vip.codex-for.me/v1
OPENAI_DEFAULT_MODEL=gpt-5.3-codex

# Optional browser-side fallback for temporary local testing
# Not recommended for shared environments
# VITE_REMOTE_API_KEY=clp-your-codex-for-me-key
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
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ 创建文件失败：", message);
  process.exit(1);
}
