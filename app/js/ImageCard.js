// ImageCard.js - 图片卡片组件

import { html, useState, useEffect } from './preact.js';

// 图片卡片组件
const ImageCard = ({ image, selected, onSelect, onEdit, selectionOrder }) => {
  const [imageOrientation, setImageOrientation] = useState(null); // 'landscape', 'portrait', 'square'

  const handleCardClick = (e) => {
    // 卡片点击切换选中状态
    onSelect(image.id, !selected);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(image.id);
  };
  
  // 将 Blob 数据转换为 URL
  const imageUrl = URL.createObjectURL(image.imageData);
  
  // 检测图片尺寸和方向
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      if (width > height) {
        setImageOrientation('landscape');
      } else if (height > width) {
        setImageOrientation('portrait');
      } else {
        setImageOrientation('square');
      }
    };
    img.src = imageUrl;
    
    // 清理函数
    return () => {
      URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);
  
  // 检查图片创建日期是否为今天
  const isToday = () => {
    const today = new Date();
    const createdDate = new Date(image.createdAt);
    return (
      createdDate.getDate() === today.getDate() &&
      createdDate.getMonth() === today.getMonth() &&
      createdDate.getFullYear() === today.getFullYear()
    );
  };
  
  // 格式化日期显示
  const formatDate = () => {
    const date = new Date(image.createdAt);
    return date.toLocaleDateString();
  };
  
  // 渲染方向文字标识
  const renderOrientationText = () => {
    if (!imageOrientation) return null;
    
    switch (imageOrientation) {
      case 'landscape':
        return html`
          <span class="badge bg-primary me-1" title="横屏图片">横</span>
        `;
      case 'portrait':
        return html`
          <span class="badge bg-secondary me-1" title="竖屏图片">竖</span>
        `;
      case 'square':
        return html`
          <span class="badge bg-success me-1" title="正方形图片">正</span>
        `;
      default:
        return null;
    }
  };
  
  return html`
    <div class="col-12 col-sm-6 col-md-3 col-lg-3 col-xl-3 mb-4">
      <div class=${`image-card ${selected ? 'selected' : ''}`} onClick=${handleCardClick}>
        ${selected && html`
          <div class="card-selected-icon">
            ${selectionOrder}
          </div>
        `}
        <div class="card-img-container">
          <img src=${imageUrl} alt=${image.caption} />
        </div>
        <div class="card-body">
          <p class="card-title">${image.caption}</p>
          <div class="card-actions">
            <div class="d-flex align-items-center">
              <span class=${`status-badge ${image.published ? 'published' : 'unpublished'}`}>
                ${image.published ? '已发布' : '未发布'}
              </span>
              <span class="edit-icon ms-2" onClick=${handleEditClick} title="编辑图片">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                </svg>
              </span>
            </div>
            <div class="d-flex align-items-center">
              ${renderOrientationText()}
              <small class=${isToday() ? "text-success fw-bold" : "text-muted"}>
                ${isToday() ? '今天' : formatDate()}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default ImageCard;
