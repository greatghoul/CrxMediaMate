// DeleteConfirmModal.js - 删除确认对话框组件

import { html } from './preact.js';

// 删除确认对话框
const DeleteConfirmModal = ({ isOpen, selectedCount, onClose, onConfirm }) => {
  if (!isOpen) return null;
  
  return html`
    <div class="modal show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">确认删除</h5>
            <button type="button" class="btn-close" aria-label="Close" onClick=${onClose}></button>
          </div>
          <div class="modal-body">
            <p>你确定要删除选中的 ${selectedCount} 张图片吗？此操作无法撤销。</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>取消</button>
            <button type="button" class="btn btn-danger" onClick=${onConfirm}>确认删除</button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </div>
  `;
};

export default DeleteConfirmModal;
