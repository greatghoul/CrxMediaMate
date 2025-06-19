// gallery.js - 使用 Preact 实现的沙雕图片库主组件

import { html, render, useState, useEffect } from './preact.js';
import { IndexedDBService } from './indexedDBService.js';

// 工具栏组件
const Toolbar = ({ onAdd, onFilter, onSearch, selectedCount, onDeleteSelected }) => {
  return html`
    <div class="toolbar">
      <div class="row">
        <div class="col-md-6">
          <div class="bulk-actions">
            <button 
              class="btn btn-primary" 
              onClick=${onAdd}
            >
              <i class="bi bi-plus"></i> 添加图片
            </button>
            <button 
              class="btn btn-danger" 
              disabled=${selectedCount === 0}
              onClick=${onDeleteSelected}
            >
              删除选中 (${selectedCount})
            </button>
          </div>
        </div>
        <div class="col-md-6">
          <div class="d-flex justify-content-end">
            <div class="input-group" style="max-width: 300px;">
              <input 
                type="text" 
                class="form-control" 
                placeholder="搜索描述..." 
                onChange=${e => onSearch(e.target.value)}
              />
              <select 
                class="form-select" 
                onChange=${e => onFilter(e.target.value)}
              >
                <option value="all">全部图片</option>
                <option value="published">已发布</option>
                <option value="unpublished">未发布</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// 图片卡片组件
const ImageCard = ({ image, selected, onSelect, onEdit }) => {
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
  
  return html`
    <div class="col-md-3 col-sm-6 mb-4">
      <div class=${`image-card ${selected ? 'selected' : ''}`} onClick=${handleCardClick}>
        ${selected && html`
          <div class="card-selected-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
            </svg>
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
            <small class="text-muted">
              ${new Date(image.createdAt).toLocaleDateString()}
            </small>
          </div>
        </div>
      </div>
    </div>
  `;
};

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
    <div class="row">
      ${images.map(image => html`
        <${ImageCard} 
          key=${image.id}
          image=${image}
          selected=${selectedImages.has(image.id)}
          onSelect=${onSelect}
          onEdit=${onEdit}
        />
      `)}
    </div>
  `;
};

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

// 主应用组件
function App() {
  // 状态
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // 加载图片数据
  useEffect(() => {
    loadImages();
  }, [filter, searchTerm]);
  
  // 加载图片数据函数
  const loadImages = async () => {
    setLoading(true);
    try {
      // 构建过滤条件
      const filterOptions = { search: searchTerm };
      
      if (filter === 'published') {
        filterOptions.published = true;
      } else if (filter === 'unpublished') {
        filterOptions.published = false;
      }
      
      const imageData = await IndexedDBService.getAllImages(filterOptions);
      setImages(imageData);
    } catch (error) {
      console.error('Failed to load images:', error);
      alert('加载图片失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理图片选择
  const handleImageSelect = (id, isSelected) => {
    setSelectedImages(prevSelected => {
      const newSelected = new Set(prevSelected);
      
      if (isSelected) {
        newSelected.add(id);
      } else {
        newSelected.delete(id);
      }
      
      return newSelected;
    });
  };
  
  // 清除所有选择
  const clearSelection = () => {
    setSelectedImages(new Set());
  };
  
  // 处理编辑图片
  const handleEdit = async (id) => {
    try {
      const image = await IndexedDBService.getImage(id);
      setCurrentImage(image);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to get image for editing:', error);
      alert('获取图片信息失败: ' + error.message);
    }
  };
  
  // 处理保存图片
  const handleSave = async (imageData) => {
    try {
      if (imageData.id) {
        // 更新现有图片
        const { id, published, caption } = imageData;
        await IndexedDBService.updateImage(id, { 
          published, 
          caption,
          imageData: imageData.imageData
        });
      } else {
        // 添加新图片
        await IndexedDBService.addImage(
          imageData.imageData,
          imageData.caption,
          imageData.published
        );
      }
      
      // 重新加载图片
      loadImages();
    } catch (error) {
      console.error('Failed to save image:', error);
      alert('保存图片失败: ' + error.message);
    }
  };
  
  // 处理批量删除
  const handleBulkDelete = async () => {
    try {
      await IndexedDBService.bulkDelete(Array.from(selectedImages));
      clearSelection();
      setDeleteModalOpen(false);
      loadImages();
    } catch (error) {
      console.error('Failed to delete images:', error);
      alert('删除图片失败: ' + error.message);
    }
  };
  
  // 处理过滤变化
  const handleFilterChange = (value) => {
    setFilter(value);
    clearSelection();
  };
  
  // 处理搜索
  const handleSearch = (term) => {
    setSearchTerm(term);
    clearSelection();
  };
  
  // 渲染组件
  return html`
    <div class="container">
      <header class="page-header">
        <h1>沙雕图 - 图片库</h1>
        <p class="text-muted">管理你收集的沙雕图片</p>
      </header>
      
      <${Toolbar}
        onAdd=${() => { setCurrentImage(null); setModalOpen(true); }}
        onFilter=${handleFilterChange}
        onSearch=${handleSearch}
        selectedCount=${selectedImages.size}
        onDeleteSelected=${() => setDeleteModalOpen(true)}
      />
      
      <${ImageGrid}
        images=${images}
        selectedImages=${selectedImages}
        onSelect=${handleImageSelect}
        onEdit=${handleEdit}
        loading=${loading}
      />
      
      <${ImageModal}
        isOpen=${isModalOpen}
        image=${currentImage}
        onClose=${() => setModalOpen(false)}
        onSave=${handleSave}
      />
      
      <${DeleteConfirmModal}
        isOpen=${isDeleteModalOpen}
        selectedCount=${selectedImages.size}
        onClose=${() => setDeleteModalOpen(false)}
        onConfirm=${handleBulkDelete}
      />
    </div>
  `;
}

// 渲染应用
render(html`<${App} />`, document.getElementById('app'));
