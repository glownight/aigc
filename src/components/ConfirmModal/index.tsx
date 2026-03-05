/**
 * ConfirmModal 组件 - 确认弹窗
 */

import { memo } from "react";
import "./styles.css";

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmModal = memo(function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "确认",
  cancelText = "取消",
}: ConfirmModalProps) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="confirm-content">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn primary" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
});

export default ConfirmModal;
