// gallery.js - 使用 Preact 实现图片库主组件

import { html, render, useState, useEffect } from './preact.js';
import { IndexedDBService } from './indexedDBService.js';
import VideoModal from './VideoModal.js';
import ArticleModal from './ArticleModal.js';
import ImageCard from './ImageCard.js';
import Toolbar from './Toolbar.js';
import SelectionControls from './SelectionControls.js';
import ImageGrid from './ImageGrid.js';
import ImageModal from './ImageModal.js';
import DeleteConfirmModal from './DeleteConfirmModal.js';

// 主应用组件
function App() {  // 状态
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState([]); // 改用数组来保持选择顺序
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
  
  // 处理图片选择 - 支持按选择顺序
  const handleImageSelect = (id, isSelected) => {
    setSelectedImages(prevSelected => {
      if (isSelected) {
        // 添加到选择列表（如果还没有）
        if (!prevSelected.includes(id)) {
          return [...prevSelected, id];
        }
        return prevSelected;
      } else {
        // 从选择列表中移除
        return prevSelected.filter(selectedId => selectedId !== id);
      }
    });
  };
  
  // 清除所有选择
  const clearSelection = () => {
    setSelectedImages([]);
  };
  
  // 全选当前显示的所有图片
  const selectAll = () => {
    // 将当前过滤后显示的所有图片ID添加到选择列表中（按显示顺序）
    const newSelected = [...selectedImages];
    
    images.forEach(image => {
      if (!newSelected.includes(image.id)) {
        newSelected.push(image.id);
      }
    });
    
    setSelectedImages(newSelected);
  };
  
  // 取消全选当前显示的所有图片
  const deselectAll = () => {
    // 从选择列表中移除当前过滤后显示的所有图片ID
    const currentImageIds = images.map(image => image.id);
    const newSelected = selectedImages.filter(id => !currentImageIds.includes(id));
    
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
      for (const id of selectedImages) { // 直接迭代数组
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
      for (const id of selectedImages) { // 直接迭代数组
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
      await IndexedDBService.bulkDelete(selectedImages); // 直接使用数组
      clearSelection();
      setDeleteModalOpen(false);
      loadImages();
    } catch (error) {
      console.error('Failed to delete images:', error);
      alert('删除图片失败: ' + error.message);
    }
  };
  
  // 处理生成文章 - 按选择顺序
  const handleGenerateArticle = async () => {
    if (selectedImages.length === 0) return;
    
    try {
      // 按选择顺序获取图片的详细信息
      const imageObjects = [];
      
      for (const id of selectedImages) { // 保持选择顺序
        const image = await IndexedDBService.getImage(id);
        imageObjects.push(image);
      }
      
      // 设置选中的图片对象并打开文章模态框
      setSelectedImageObjects(imageObjects);
      setArticleModalOpen(true);
    } catch (error) {
      console.error('Failed to generate article:', error);
      alert('生成文章失败: ' + error.message);
    }
  };
  
  const handleGenerateVideo = async () => {
    if (selectedImages.length === 0) return;
    
    try {
      // 按选择顺序获取图片的详细信息
      const imageObjects = [];
      
      for (const id of selectedImages) { // 保持选择顺序
        const image = await IndexedDBService.getImage(id);
        imageObjects.push(image);
      }
      
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
          selectedCount=${selectedImages.length}
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
          selectedCount=${selectedImages.length}
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
        selectedCount=${selectedImages.length}
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
