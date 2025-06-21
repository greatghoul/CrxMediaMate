// Import IndexedDBService
import { IndexedDBService } from './indexedDBService.js';

const urlParams = new URLSearchParams(window.location.search);
const imageUrl = urlParams.get('imageUrl');
const previewImage = document.getElementById('preview');    
const noteInput = document.getElementById('note');
const statusMessage = document.getElementById('statusMessage');
const saveButton = document.getElementById('saveButton');

function showMessage(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = "block";
}

// 更新未发布的图片数量显示
async function showUnpublishedCount() {
  try {
    const count = await IndexedDBService.getUnpublishedCount();
    showMessage(`未发布图片数量: ${count}`, 'info');
  } catch (error) {
    showMessage('获取未发布图片数量失败:', 'error');
  }
}

function createRecord() {
  const note = noteInput.value.trim();
  const imageUrl = previewImage.src;

  if (!imageUrl) {
    showMessage("没有可用的图片", "error");
    return;
  }

  if (!note) {
    showMessage("请填写备注信息", "error");
    return;
  }
  // Disable button during submission
  saveButton.disabled = true;
  // Show initial status message
  showMessage("正在保存...", "info");
  chrome.runtime.sendMessage({
    action: "saveToGallery",
    data: { note, imageUrl }
  }, response => {    if (response && response.success) {
      showMessage('图片已保存', 'success');
      setTimeout(() => window.close(), 2000);
    } else {
      // Show error message
      console.error("创建记录失败:", response.error);
      showMessage("创建记录失败: " + response.error, "error");      
      saveButton.disabled = false;
    }
  });
}

// init
previewImage.src = imageUrl;
saveButton.addEventListener('click', createRecord);

// 页面加载时更新未发布图片数量
showUnpublishedCount();
