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

// 更新标题以显示未发布的图片数量
async function updateTitleWithUnpublishedCount() {
  try {
    const count = await IndexedDBService.getUnpublishedCount();
    console.log('未发布图片数量:', count);
    if (count > 0) {
      document.title = `沙雕图 (${count}张未发布)`;
    } else {
      document.title = "沙雕图";
    }
  } catch (error) {
    console.error('获取未发布图片数量失败:', error);
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
      // Successfully created record in Airtable and local IndexedDB
      showMessage('沙雕图已保存', 'success');
      // Update the count before closing
      updateTitleWithUnpublishedCount();
      setTimeout(() => window.close(), 1500);
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

// 页面加载时更新标题
updateTitleWithUnpublishedCount();
