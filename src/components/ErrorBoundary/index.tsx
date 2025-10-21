/**
 * ErrorBoundary 组件 - 错误边界
 * 捕获子组件的 JavaScript 错误，显示降级 UI
 */

import React, { Component, ReactNode } from "react";
import "./styles.css";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 你同样可以将错误日志上报给服务器
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // 可以在这里添加错误上报逻辑
    // errorReportingService.report(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // 重新加载页面
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义降级 UI，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误 UI
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">哎呀，出错了！</h1>
            <p className="error-message">
              应用遇到了一个意外错误，我们正在努力修复。
            </p>

            {/* 开发环境下显示错误详情 */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="error-details">
                <summary>错误详情</summary>
                <pre className="error-stack">
                  <strong>错误信息：</strong>
                  {this.state.error.toString()}
                  {"\n\n"}
                  <strong>错误堆栈：</strong>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button className="btn primary" onClick={this.handleReset}>
                重新加载
              </button>
              <button
                className="btn ghost"
                onClick={() => (window.location.href = "/")}
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
