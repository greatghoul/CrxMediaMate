// ImageGrid.js - 图片网格组件

import { html } from './preact.js';
import ImageCard from './ImageCard.js';

// 图片网格组件
const ImageGrid = ({ images, selectedImages, onSelect, onEdit, loading }) => {
  if (loading) {
    return html`
      <div class="loading-container">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">加载中...</span>
        </div>
        <p>加载图片中...</p>
      </div>
    `;
  }
  
  if (images.length === 0) {
    return html`
      <div class="empty-state">
        <h4>暂无图片</h4>
        <p>点击"添加图片"按钮开始创建你的图片库</p>
      </div>
    `;
  }
  
  return html`
    <div class="row image-grid">
      ${images.map(image => {
        const isSelected = selectedImages.includes(image.id);
        const selectionOrder = isSelected ? selectedImages.indexOf(image.id) + 1 : 0;
        
        return html`
          <${ImageCard} 
            key=${image.id}
            image=${image}
            selected=${isSelected}
            selectionOrder=${selectionOrder}
            onSelect=${onSelect}
            onEdit=${onEdit}
          />
        `;
      })}
    </div>
  `;
};

export default ImageGrid;
