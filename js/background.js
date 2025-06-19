// 导入 IndexedDB 服务
import { IndexedDBService } from './indexedDBService.js';

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveImage",
    title: "保存沙雕图",
    contexts: ["image"]
  });
});


// 处理点击扩展图标事件
chrome.action.onClicked.addListener((tab) => {
  // 在新标签页中打开图片库
  const galleryUrl = chrome.runtime.getURL("gallery.html");
  chrome.tabs.create({ url: galleryUrl });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveImage") {
    // Open popup with the selected image
    const popupUrl = chrome.runtime.getURL("popup.html") + `?imageUrl=${encodeURIComponent(info.srcUrl)}`;
    chrome.windows.create({
      url: popupUrl,
      type: "popup",
      width: 500,
      height: 600
    });  } else if (info.menuItemId === "openGallery" || info.menuItemId === "galleryMenuItem") {
    // Open gallery page in a new tab
    const galleryUrl = chrome.runtime.getURL("gallery.html");
    chrome.tabs.create({ url: galleryUrl });
  }
});

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveToGallery") {
    console.log("Received request to save image:", request.data);
    // 直接保存到本地 IndexedDB
    saveImageToIndexedDB(request.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error saving to IndexedDB:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
});



// 保存图片到 IndexedDB
async function saveImageToIndexedDB(data) {
  try {
    // 如果传入的是 URL 而不是 Blob，先下载图片
    let imageBlob = data.blob;
    if (!imageBlob && data.imageUrl) {
      const response = await fetch(data.imageUrl);
      imageBlob = await response.blob();
    }
    
    if (!imageBlob) {
      throw new Error("No image data provided");
    }
    
    // 保存到 IndexedDB
    await IndexedDBService.addImage(
      imageBlob,                 // 图片数据
      data.note || "未命名",      // 描述
      false                      // 默认未发布
    );
    
    return true;
  } catch (error) {
    console.error("Error saving to IndexedDB:", error);
    throw error;
  }
}
