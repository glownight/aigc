import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.tsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { startPerformanceMonitoring } from "./utils/performance";
import "./index.css";

// 启动性能监控
startPerformanceMonitoring();

// 注册 Service Worker
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// 开发环境去掉 StrictMode，避免 React 在 dev 下的双重初始化导致模型被重复创建，缩短首次就绪时间
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/chat/:sessionId" element={<App />} />
      </Routes>
    </BrowserRouter>
  </ErrorBoundary>
  // </React.StrictMode>
);
