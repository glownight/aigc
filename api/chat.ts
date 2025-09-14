// Vercel Serverless Function: /api/chat
// 将来自前端的 messages 代理到算力平台（suanli.cn）的 Chat Completions API
// 注意：不要在前端暴露密钥，请在 Vercel 项目环境变量中设置 SUANLI_API_KEY

const UPSTREAM_URL = 'https://api.suanli.cn/v1/chat/completions'
const DEFAULT_MODEL = 'free:Qwen3-30B-A3B'

export default async function handler(req: any, res: any) {
  // 允许 CORS（便于预览/本地调试），部署到同域后浏览器不会走 CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const apiKey = process.env.SUANLI_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Missing SUANLI_API_KEY on server' })
    return
  }

  try {
    const { messages, stream = false, model } = req.body || {}
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid body: messages must be an array' })
      return
    }

    // 仅透传必要字段
    const payload = {
      model: model || DEFAULT_MODEL,
      messages,
      // 先返回非流式，前端已按非流式处理
      stream: Boolean(stream && false),
    }

    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const text = await upstream.text()
    const status = upstream.status

    // 尝试解析为 JSON，失败则按文本返回
    try {
      const json = JSON.parse(text)
      res.status(status).json(json)
    } catch {
      res.status(status).send(text)
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Upstream error' })
  }
}