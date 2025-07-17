// 导入 IndexedDB 服务
import { IndexedDBService } from './indexedDBService.js';

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveImage",
    title: "保存图片素材",
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
    // Open popup with the selected image, centered on the screen
    const popupUrl = chrome.runtime.getURL("popup.html") + `?imageUrl=${encodeURIComponent(info.srcUrl)}`;
    // Get the current screen's width and height to center the popup
    chrome.windows.getCurrent({}, (currentWindow) => {
      const width = 500;
      const height = 600;
      // 计算窗口右侧距离 200 像素的位置
      const left = Math.max(0, currentWindow.left + currentWindow.width - width - 200);
      const top = Math.round(currentWindow.top + (currentWindow.height - height) / 2);
      chrome.windows.create({
        url: popupUrl,
        type: "popup",
        width,
        height,
        left,
        top
      });
    });
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
