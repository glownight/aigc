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
    const { messages, stream = true, model } = req.body || {}
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'Invalid body: messages must be an array' })
      return
    }

    // 启用流式响应以提升响应速度
    const payload = {
      model: model || DEFAULT_MODEL,
      messages,
      stream: Boolean(stream),
    }

    const upstream = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const status = upstream.status

    // 如果是流式响应，直接透传
    if (stream && upstream.body) {
      res.status(status)
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      const reader = upstream.body.getReader()
      const encoder = new TextEncoder()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // 直接透传数据块
          const chunk = decoder.decode(value, { stream: true })
          res.write(chunk)
        }
        res.end()
      } catch (streamErr) {
        console.error('Stream error:', streamErr)
        res.end()
      }
    } else {
      // 非流式响应
      const text = await upstream.text()
      try {
        const json = JSON.parse(text)
        res.status(status).json(json)
      } catch {
        res.status(status).send(text)
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Upstream error' })
  }
}