import type { IncomingMessage, ServerResponse } from "node:http";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv, type Plugin } from "vite";
import {
  createUpstreamChatRequest,
  getChatProxyDefaults,
  writeProxyResultToNodeResponse,
} from "./server/chatProxy";

const normalizeId = (id: string) => id.replace(/\\/g, "/");
const { proxyEndpoint } = getChatProxyDefaults();

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    req.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });

    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function writeJson(
  res: ServerResponse,
  statusCode: number,
  body: Record<string, string>,
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function createChatProxyMiddleware(env: Record<string, string>) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    const pathname = req.url?.split("?")[0] || "";
    if (pathname !== proxyEndpoint) {
      next();
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      writeJson(res, 405, { error: "Method Not Allowed" });
      return;
    }

    let body: unknown;
    try {
      body = await readJsonBody(req);
    } catch {
      writeJson(res, 400, { error: "Invalid JSON body" });
      return;
    }

    try {
      const result = await createUpstreamChatRequest(body, req.headers, {
        ...process.env,
        ...env,
      });
      await writeProxyResultToNodeResponse(res, result);
    } catch (error) {
      next(error);
    }
  };
}

function chatProxyPlugin(env: Record<string, string>): Plugin {
  const middleware = createChatProxyMiddleware(env);

  return {
    name: "chat-proxy-middleware",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === "production";
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react({
        jsxRuntime: "automatic",
      }),
      chatProxyPlugin(env),
      isProd &&
        (visualizer({
          filename: "./dist/stats.html",
          open: false,
          gzipSize: true,
          brotliSize: true,
        }) as Plugin),
    ].filter(Boolean),

    build: {
      target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
      outDir: "dist",
      cssCodeSplit: true,
      modulePreload: false,
      sourcemap: !isProd,
      chunkSizeWarningLimit: 1000,
      minify: isProd ? "terser" : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: false,
              drop_debugger: true,
              dead_code: true,
              conditionals: true,
              booleans: true,
              if_return: true,
              join_vars: true,
              unused: true,
            },
            mangle: {
              safari10: true,
            },
            format: {
              comments: false,
            },
          }
        : undefined,
      rollupOptions: {
        output: {
          manualChunks: (rawId) => {
            const id = normalizeId(rawId);

            if (
              id.includes("/node_modules/react-router/") ||
              id.includes("/node_modules/react-router-dom/")
            ) {
              return "router";
            }

            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "react-core";
            }

            if (id.includes("/node_modules/framer-motion/")) {
              return "framer-motion";
            }

            if (
              id.includes("/node_modules/react-markdown/") ||
              id.includes("/node_modules/remark-") ||
              id.includes("/node_modules/rehype-") ||
              id.includes("/node_modules/mdast-") ||
              id.includes("/node_modules/micromark/")
            ) {
              return "markdown";
            }

            if (id.includes("/node_modules/highlight.js/")) {
              return "highlight";
            }

            if (id.includes("/node_modules/three/")) {
              return "three-bg";
            }

            if (id.includes("/node_modules/")) {
              return "vendor";
            }

            return undefined;
          },
          chunkFileNames: isProd ? "js/[name]-[hash].js" : "js/[name].js",
          entryFileNames: isProd ? "js/[name]-[hash].js" : "js/[name].js",
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split(".");
            const ext = info?.[info.length - 1];

            if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name || "")) {
              return "images/[name]-[hash][extname]";
            }

            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name || "")) {
              return "fonts/[name]-[hash][extname]";
            }

            if (ext === "css") {
              return "css/[name]-[hash][extname]";
            }

            return "assets/[name]-[hash][extname]";
          },
        },
        treeshake: {
          moduleSideEffects: "no-external",
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },
      reportCompressedSize: false,
      cssMinify: true,
    },

    server: {
      port: 5177,
      strictPort: false,
      fs: {
        strict: false,
      },
      hmr: {
        overlay: false,
      },
      headers: {
        "Cross-Origin-Embedder-Policy": "require-corp",
        "Cross-Origin-Opener-Policy": "same-origin",
      },
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "react/jsx-runtime",
        "react-markdown",
        "remark-gfm",
        "rehype-highlight",
      ],
      force: false,
    },

    resolve: {
      alias: {
        "@": "/src",
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"],
    },

    envPrefix: "VITE_",

    preview: {
      port: 5180,
      strictPort: false,
    },

    esbuild: {
      drop: isProd ? ["debugger"] : [],
      legalComments: "none",
    },
  };
});
