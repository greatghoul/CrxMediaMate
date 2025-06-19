// IndexedDB 服务模块 - 处理图片数据的增删改查

const DB_NAME = 'shadiaoPicsDB';
const DB_VERSION = 1;
const STORE_NAME = 'pictures';

// 生成唯一ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// 打开数据库连接
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('published', 'published', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('publishedAt', 'publishedAt', { unique: false });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 获取所有图片
const getAllImages = async (filter = {}) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      let results = request.result;
      
      // 应用过滤条件
      if (filter.published === true) {
        results = results.filter(img => img.published === true);
      } else if (filter.published === false) {
        results = results.filter(img => img.published !== true);
      }
      
      // 应用搜索条件
      if (filter.search) {
        const search = filter.search.toLowerCase();
        results = results.filter(img => 
          img.caption && img.caption.toLowerCase().includes(search)
        );
      }
      
      // 应用排序
      results.sort((a, b) => {
        // 默认按创建时间降序排列
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      resolve(results);
    };
    
    request.onerror = () => reject(request.error);
  });
};

// 获取单个图片
const getImage = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 添加新图片
const addImage = async (imageData, caption, published = false) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const now = new Date();
    const newImage = {
      id: generateId(),
      imageData,
      caption,
      published,
      createdAt: now,
      updatedAt: now,
      publishedAt: published ? now : null
    };
    
    const request = store.add(newImage);
    
    request.onsuccess = () => resolve(newImage);
    request.onerror = () => reject(request.error);
  });
};

// 更新现有图片
const updateImage = async (id, updates) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // 先获取现有数据
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const image = getRequest.result;
      if (!image) {
        reject(new Error('Image not found'));
        return;
      }
      
      // 合并更新
      const updatedImage = {
        ...image,
        ...updates,
        updatedAt: new Date()
      };
      
      // 如果发布状态改变了，更新publishedAt
      if (updates.published === true && !image.published) {
        updatedImage.publishedAt = new Date();
      }
      
      // 更新记录
      const updateRequest = store.put(updatedImage);
      updateRequest.onsuccess = () => resolve(updatedImage);
      updateRequest.onerror = () => reject(updateRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// 删除图片
const deleteImage = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// 批量删除
const bulkDelete = async (ids) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    let completed = 0;
    let errors = [];
    
    for (const id of ids) {
      const request = store.delete(id);
      
      request.onsuccess = () => {
        completed++;
        if (completed === ids.length) {
          if (errors.length === 0) {
            resolve(true);
          } else {
            reject(new Error(`Failed to delete some images: ${errors.join(', ')}`));
          }
        }
      };
      
      request.onerror = (event) => {
        errors.push(id);
        completed++;
        if (completed === ids.length) {
          reject(new Error(`Failed to delete some images: ${errors.join(', ')}`));
        }
      };
    }
    
    // 如果没有ID要删除，直接返回
    if (ids.length === 0) {
      resolve(true);
    }
  });
};

// 查询图片
const queryImages = async (criteria = {}) => {
  return getAllImages(criteria);
};

// 导出所有方法
export const IndexedDBService = {
  openDB,
  getAllImages,
  getImage,
  addImage,
  updateImage,
  deleteImage,
  bulkDelete,
  queryImages
};

export default IndexedDBService;
