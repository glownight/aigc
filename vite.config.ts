import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        // 手动分块，将大型依赖分离
        manualChunks: (id) => {
          // React 核心库 - 高优先级，首先加载
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-core';
          }
          // 路由库 - 中等优先级
          if (id.includes('react-router')) {
            return 'router';
          }
          // Markdown 相关 - 按需加载
          if (id.includes('react-markdown') || id.includes('remark') || id.includes('rehype')) {
            return 'markdown';
          }
          // 代码高亮 - 按需加载
          if (id.includes('highlight.js')) {
            return 'highlight';
          }
          // WebLLM - 最低优先级，延迟加载
          if (id.includes('@mlc-ai/web-llm')) {
            return 'webllm';
          }
          // 其他 node_modules 的大型库
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // 设置更小的 chunk 大小警告阈值
        chunkFileNames: () => {
          return `js/[name]-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 设置chunk大小限制
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（仅在开发模式）
    sourcemap: false,
    // 压缩配置
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console.log
        drop_debugger: true
      }
    }
  },
  // 开发服务器优化
  server: {
    // 预构建优化
    fs: {
      strict: false
    },
    // 热更新优化
    hmr: {
      overlay: false
    }
  },
  // 依赖优化
  optimizeDeps: {
    // 预构建必要的库
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'react/jsx-runtime'
    ],
    // 排除大型库，延迟加载
    exclude: ['@mlc-ai/web-llm']
  }
})
