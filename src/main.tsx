import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// 开发环境去掉 StrictMode，避免 React 在 dev 下的双重初始化导致模型被重复创建，缩短首次就绪时间
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Navigate to="/chat" replace />} />
      <Route path="/chat" element={<App />} />
      <Route path="/chat/:sessionId" element={<App />} />
    </Routes>
  </BrowserRouter>
  // </React.StrictMode>
);
