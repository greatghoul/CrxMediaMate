// IndexedDB 服务模块 - 处理图片数据的增删改查

const DB_NAME = 'shadiaoPicsDB';
const DB_VERSION = 2; // 升级版本号触发数据库升级
const STORE_NAME = 'pictures';

// 图片状态枚举
const ImageState = {
  PENDING: 'pending',
  PUBLISHED: 'published'
};

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
      const oldVersion = event.oldVersion;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // 创建新的存储对象
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('state', 'state', { unique: false }); // 新的状态索引
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('publishedAt', 'publishedAt', { unique: false });
      } else if (oldVersion < 2) {
        // 版本 1 升级到版本 2: 添加 state 索引并删除旧的 published 索引
        const transaction = event.target.transaction;
        const store = transaction.objectStore(STORE_NAME);
        
        // 如果有旧的 published 索引，删除它
        if (store.indexNames.contains('published')) {
          store.deleteIndex('published');
        }
        
        // 创建新的 state 索引
        if (!store.indexNames.contains('state')) {
          store.createIndex('state', 'state', { unique: false });
        }
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 初始化数据库
const initDB = async () => {
  await openDB();
  return true;
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
      if (filter.published === true || filter.state === ImageState.PUBLISHED) {
        // 优先使用 state 字段，兼容旧的 published 字段
        results = results.filter(img => 
          img.state === ImageState.PUBLISHED || 
          (img.state === undefined && img.published === true)
        );
      } else if (filter.published === false || filter.state === ImageState.PENDING) {
        // 优先使用 state 字段，兼容旧的 published 字段
        results = results.filter(img => 
          img.state === ImageState.PENDING || 
          (img.state === undefined && img.published !== true)
        );
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
    const state = published ? ImageState.PUBLISHED : ImageState.PENDING;
    
    const newImage = {
      id: generateId(),
      imageData,
      caption,
      state,                // 使用新的 state 枚举
      published,            // 保持兼容性
      createdAt: now,
      updatedAt: now,
      publishedAt: state === ImageState.PUBLISHED ? now : null
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
        // 处理状态变更
      if ('published' in updates) {
        updates.state = updates.published ? ImageState.PUBLISHED : ImageState.PENDING;
      }
      
      // 合并更新
      const updatedImage = {
        ...image,
        ...updates,
        updatedAt: new Date()
      };
      
      // 如果发布状态改变了，更新publishedAt
      if ((updates.published === true && !image.published) || 
          (updates.state === ImageState.PUBLISHED && image.state !== ImageState.PUBLISHED)) {
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

// 获取未发布图片的数量
const getUnpublishedCount = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    try {
      // 尝试使用新的 state 索引
      if (store.indexNames.contains('state')) {
        const index = store.index('state');
        const request = index.count(ImageState.PENDING);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => reject(request.error);
      } else {
        // 兼容旧版本：获取所有记录然后过滤
        const request = store.getAll();
        
        request.onsuccess = () => {
          const results = request.result;
          const pendingCount = results.filter(img => 
            img.state === ImageState.PENDING || 
            (img.state === undefined && img.published !== true)
          ).length;
          resolve(pendingCount);
        };
        
        request.onerror = () => reject(request.error);
      }
    } catch (error) {
      console.error('获取待处理图片数量出错:', error);
      // 出错时回退到安全方法
      const request = store.getAll();
      
      request.onsuccess = () => {
        const results = request.result;
        const pendingCount = results.filter(img => 
          img.state === ImageState.PENDING || 
          (img.state === undefined && img.published !== true)
        ).length;
        resolve(pendingCount);
      };
      
      request.onerror = () => reject(request.error);
    }
  });
};

// 导出所有方法
export const IndexedDBService = {
  ImageState,  // 导出状态枚举
  openDB,
  initDB,      // 导出初始化函数
  getAllImages,
  getImage,
  addImage,
  updateImage,
  deleteImage,
  bulkDelete,
  queryImages,
  getUnpublishedCount,
};

export default IndexedDBService;
