// ImageModal.js - 图片编辑/添加模态框组件

import { html, useState, useEffect } from './preact.js';

// 图片编辑/添加模态框
const ImageModal = ({ isOpen, image, onClose, onSave }) => {
  const [caption, setCaption] = useState('');
  const [imageData, setImageData] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 当模态框打开或图片变化时重置状态
  useEffect(() => {
    if (isOpen) {
      if (image) {
        setCaption(image.caption || '');
        setImageData(image.imageData);
        setImagePreviewUrl(URL.createObjectURL(image.imageData));
        setPublished(image.published || false);
      } else {
        setCaption('');
        setImageData(null);
        setImagePreviewUrl('');
        setPublished(false);
      }
    }
  }, [isOpen, image]);
  
  // 处理文件选择
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const blob = new Blob([reader.result], { type: file.type });
        setImageData(blob);
        setImagePreviewUrl(URL.createObjectURL(blob));
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  // 处理粘贴图片
  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          setImageData(blob);
          setImagePreviewUrl(URL.createObjectURL(blob));
          break;
        }
      }
    }
  };
  
  // 处理URL输入
  const handleUrlChange = async (e) => {
    const url = e.target.value.trim();
    if (url && url.match(/^https?:\/\/.+/)) {
      setLoading(true);
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        setImageData(blob);
        setImagePreviewUrl(URL.createObjectURL(blob));
      } catch (error) {
        console.error('Failed to load image from URL:', error);
        alert('无法从URL加载图片，请检查URL或使用其他方式添加图片');
      } finally {
        setLoading(false);
      }
    }
  };
  
  // 处理保存
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!imageData) {
      alert('请先添加图片');
      return;
    }
    
    onSave({
      id: image ? image.id : null,
      imageData,
      caption,
      published
    });
    
    onClose();
  };
  
  if (!isOpen) return null;
  
  return html`
    <div class="modal show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">${image ? '编辑图片' : '添加新图片'}</h5>
            <button type="button" class="btn-close" aria-label="Close" onClick=${onClose}></button>
          </div>
          <div class="modal-body" onPaste=${handlePaste}>
            <form id="imageForm" onSubmit=${handleSubmit}>
              <div class="mb-3">
                <label class="form-label">图片来源</label>
                <div class="d-flex gap-3">
                  <div class="flex-grow-1">
                    <input 
                      type="file" 
                      class="form-control" 
                      accept="image/*" 
                      onChange=${handleFileChange} 
                    />
                  </div>
                  <div>或</div>
                  <div class="flex-grow-1">
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="输入图片URL" 
                      onBlur=${handleUrlChange} 
                    />
                  </div>
                </div>
                <div class="alert alert-info mt-2">
                  <small>💡 提示：你也可以直接在此弹窗中粘贴图片 (Ctrl+V)</small>
                </div>
              </div>
              
              <div class="preview-container">
                ${loading ? html`
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                  </div>
                ` : imagePreviewUrl ? html`
                  <img src=${imagePreviewUrl} alt="图片预览" />
                ` : html`
                  <div class="text-center text-muted">
                    <i class="bi bi-image" style="font-size: 3rem;"></i>
                    <p>暂无图片预览</p>
                  </div>
                `}
              </div>
              
              <div class="mb-3">
                <label for="caption" class="form-label">图片描述</label>
                <textarea 
                  id="caption" 
                  class="form-control" 
                  rows="3"
                  value=${caption}
                  onChange=${e => setCaption(e.target.value)}
                  placeholder="添加关于这个沙雕图的描述..." 
                  required
                ></textarea>
              </div>
              
              <div class="form-check">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="publishedCheckbox"
                  checked=${published}
                  onChange=${e => setPublished(e.target.checked)}
                />
                <label class="form-check-label" for="publishedCheckbox">
                  标记为已发布
                </label>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>取消</button>
            <button 
              type="submit"
              form="imageForm"
              class="btn btn-primary"
              disabled=${!imageData || !caption.trim()}
            >
              保存
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </div>
  `;
};

export default ImageModal;
