// gallery.js - 使用 Preact 实现的沙雕图片库主组件

import { html, render, useState, useEffect } from './preact.js';
import { IndexedDBService } from './indexedDBService.js';
import VideoModal from './VideoModal.js';

// 工具栏组件
const Toolbar = ({ onAdd, onFilter, onSearch, selectedCount, onDeleteSelected, onGenerateArticle, onGenerateVideo, onBatchPublish, onBatchUnpublish, filter }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  // 关闭下拉菜单
  const closeDropdown = () => {
    setDropdownOpen(false);
  };
  
  // 处理批量操作项点击
  const handleBatchAction = (action) => {
    closeDropdown();
    action();
  };
  
  return html`
    <div class="toolbar fixed-top">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-md-3">
            <h4 class="mb-0">沙雕图 - 图片库</h4>
          </div>
          <div class="col-md-4">
            <div class="bulk-actions">              <button 
                class="btn btn-primary" 
                onClick=${onAdd}
              >
                <i class="bi bi-plus"></i> 添加图片
              </button>
              <div class="custom-dropdown d-inline-block">
                <button 
                  class="btn btn-secondary" 
                  type="button"
                  disabled=${selectedCount === 0}
                  onClick=${toggleDropdown}
                >
                  批量操作 ${dropdownOpen ? '▲' : '▼'}
                </button>
                ${dropdownOpen && html`
                  <div class="custom-dropdown-menu">
                    <button class="dropdown-item" onClick=${() => handleBatchAction(onBatchPublish)}>标记为已发布</button>
                    <button class="dropdown-item" onClick=${() => handleBatchAction(onBatchUnpublish)}>标记为未发布</button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item text-danger" onClick=${() => handleBatchAction(onDeleteSelected)}>删除</button>
                  </div>
                `}
              </div>              <button 
                class="btn btn-success" 
                disabled=${selectedCount === 0}
                onClick=${onGenerateArticle}
              >
                生成文章
              </button>
              <button 
                class="btn btn-info ms-2" 
                disabled=${selectedCount === 0}
                onClick=${onGenerateVideo}
              >
                生成视频
              </button>
            </div>
          </div>
          <div class="col-md-5">
            <div class="d-flex justify-content-end">
              <div class="input-group" style="max-width: 300px;">
                <input 
                  type="text" 
                  class="form-control" 
                  placeholder="搜索描述..." 
                  onChange=${e => onSearch(e.target.value)}
                />                <select 
                  class="form-select" 
                  onChange=${e => onFilter(e.target.value)}
                  value=${filter}
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
    </div>
  `;
};

// 选择控制组件
const SelectionControls = ({ onSelectAll, onDeselectAll, selectedCount, totalCount }) => {
  return html`
    <div class="selection-controls">
      <button 
        class="btn-icon select-all"
        onClick=${onSelectAll}
        disabled=${totalCount === 0 || selectedCount === totalCount}
        title="全选"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 2.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5V2.5zm2 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7z"/>
          <path d="M3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-10a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm4 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
          <path fill-rule="evenodd" d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>
        <span>全选</span>
      </button>
      <button 
        class="btn-icon deselect-all" 
        onClick=${onDeselectAll}
        disabled=${selectedCount === 0}
        title="取消全选"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M2 2.5a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5V2.5zm2 1a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7z"/>
          <path d="M3 12.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-10a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm4 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 4a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
          <path fill-rule="evenodd" d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
        <span>取消全选</span>
      </button>
      ${selectedCount > 0 && html`
        <div class="selection-info">已选中 ${selectedCount} 张图片</div>
      `}
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
  
  return html`
    <div class="col-xl-2 col-lg-3 col-md-4 col-sm-6 col-xs-12 mb-4">
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
            <small class=${isToday() ? "text-success fw-bold" : "text-muted"}>
              ${isToday() ? '今天' : formatDate()}
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
    <div class="row image-grid">
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

// 文章生成模态框
const ArticleModal = ({ isOpen, images, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [loading, setLoading] = useState(true);

  // 当图片数组变化时生成文章
  useEffect(() => {
    if (isOpen && images && images.length > 0) {
      generateArticleContent();
    }
  }, [isOpen, images]);

  // 将Blob转换为Data URI
  const convertBlobToDataUri = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };
  
  // 根据选中图片生成文章
  const generateArticleContent = async () => {
    if (!images || images.length === 0) {
      setArticleContent('');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let content = '';
    
    // 添加开头鼓励性段落
    content += '<p>搞笑图，让生活充满欢乐！每天看一看搞笑图，心情愉快一整天。</p>';
    
    // 添加每个图片及其描述
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const formattedIndex = String(i + 1).padStart(2, '0');
      content += `<h1>${formattedIndex}. ${image.caption}</h1>`;
      
      // 将图片数据转换为 data URI
      const dataUri = await convertBlobToDataUri(image.imageData);
      content += `<img src="${dataUri}" alt="${image.caption}" />`;
    }
    
    // 添加结尾鼓励性段落
    content += '<p>搞笑图不仅能带给我们欢笑，还能帮助我们减轻压力，放松身心。赶紧收藏并分享这些有趣的搞笑图吧！</p>';
    
    setArticleContent(content);
    setLoading(false);
  };
    // 复制文章内容
  const handleCopy = () => {
    const articleContainer = document.querySelector('.article-container');
    if (!articleContainer) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(articleContainer);
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    } finally {
      selection.removeAllRanges();
    }
  };
  
  if (!isOpen) return null;
  
  return html`
    <div class="modal show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">生成的文章内容</h5>
            <button type="button" class="btn-close" aria-label="Close" onClick=${onClose}></button>
          </div>
          <div class="modal-body">
            ${loading ? html`
              <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">生成文章中...</span>
                </div>
                <p class="mt-2">正在生成文章，请稍候...</p>
              </div>
            ` : html`
              <div class="article-container" dangerouslySetInnerHTML=${{ __html: articleContent }}></div>
            `}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>关闭</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              onClick=${handleCopy}
              disabled=${loading || !articleContent}
            >
              ${copied ? '已复制!' : '复制内容'}
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
function App() {  // 状态
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [filter, setFilter] = useState('unpublished');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isArticleModalOpen, setArticleModalOpen] = useState(false);
  const [isVideoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedImageObjects, setSelectedImageObjects] = useState([]);
  
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
  
  // 全选当前显示的所有图片
  const selectAll = () => {
    const newSelected = new Set(selectedImages);
    
    // 将当前过滤后显示的所有图片ID添加到选择集合中
    images.forEach(image => {
      newSelected.add(image.id);
    });
    
    setSelectedImages(newSelected);
  };
  
  // 取消全选当前显示的所有图片
  const deselectAll = () => {
    const newSelected = new Set(selectedImages);
    
    // 从选择集合中移除当前过滤后显示的所有图片ID
    images.forEach(image => {
      newSelected.delete(image.id);
    });
    
    setSelectedImages(newSelected);
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
  
  // 处理批量标记为已发布
  const handleBatchPublish = async () => {
    try {
      const selectedIds = Array.from(selectedImages);
      for (const id of selectedIds) {
        await IndexedDBService.updateImage(id, { published: true });
      }
      loadImages();
    } catch (error) {
      console.error('Failed to update images:', error);
      alert('更新图片状态失败: ' + error.message);
    }
  };
  
  // 处理批量标记为未发布
  const handleBatchUnpublish = async () => {
    try {
      const selectedIds = Array.from(selectedImages);
      for (const id of selectedIds) {
        await IndexedDBService.updateImage(id, { published: false });
      }
      loadImages();
    } catch (error) {
      console.error('Failed to update images:', error);
      alert('更新图片状态失败: ' + error.message);
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
  
  // 处理生成文章
  const handleGenerateArticle = async () => {
    if (selectedImages.size === 0) return;
    
    try {
      // 获取所有选中图片的详细信息
      const selectedIds = Array.from(selectedImages);
      const imageObjects = [];
      
      for (const id of selectedIds) {
        const image = await IndexedDBService.getImage(id);
        imageObjects.push(image);
      }
      
      // 按创建时间排序
      imageObjects.sort((a, b) => a.createdAt - b.createdAt);
      
      // 设置选中的图片对象并打开文章模态框
      setSelectedImageObjects(imageObjects);
      setArticleModalOpen(true);
    } catch (error) {
      console.error('Failed to generate article:', error);
      alert('生成文章失败: ' + error.message);
    }
  };
  
  const handleGenerateVideo = async () => {
    if (selectedImages.size === 0) return;
    
    try {
      // 获取所有选中图片的详细信息
      const selectedIds = Array.from(selectedImages);
      const imageObjects = [];
      
      for (const id of selectedIds) {
        const image = await IndexedDBService.getImage(id);
        imageObjects.push(image);
      }
      
      // 按创建时间排序
      imageObjects.sort((a, b) => a.createdAt - b.createdAt);
      
      // 设置选中的图片对象并打开视频模态框
      setSelectedImageObjects(imageObjects);
      setVideoModalOpen(true);
    } catch (error) {
      console.error('Failed to generate video:', error);
      alert('生成视频失败: ' + error.message);
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
    clearSelection();  };    // 渲染组件
  return html`
    <div class="gallery-container">      <${Toolbar}
          onAdd=${() => { setCurrentImage(null); setModalOpen(true); }}
          onFilter=${handleFilterChange}
          onSearch=${handleSearch}
          selectedCount=${selectedImages.size}
          onDeleteSelected=${() => setDeleteModalOpen(true)}
          onGenerateArticle=${handleGenerateArticle}
          onGenerateVideo=${handleGenerateVideo}
          onBatchPublish=${handleBatchPublish}
          onBatchUnpublish=${handleBatchUnpublish}
          filter=${filter}
        />
      
      <div class="container content-container">
        <${SelectionControls}
          onSelectAll=${selectAll}
          onDeselectAll=${deselectAll}
          selectedCount=${selectedImages.size}
          totalCount=${images.length}
        />
        
        <${ImageGrid}
          images=${images}
          selectedImages=${selectedImages}
          onSelect=${handleImageSelect}
          onEdit=${handleEdit}
          loading=${loading}
        />
      </div>
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
      
      <${ArticleModal}
        isOpen=${isArticleModalOpen}
        images=${selectedImageObjects}
        onClose=${() => setArticleModalOpen(false)}
      />
      <${VideoModal}
        isOpen=${isVideoModalOpen}
        images=${selectedImageObjects}
        onClose=${() => setVideoModalOpen(false)}
      />
    </div>
  `;
}

// 渲染应用
render(html`<${App} />`, document.getElementById('app'));
