import airtable from './airtable.js';

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveImage",
    title: "保存沙雕图",
    contexts: ["image"]
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open a new tab with our newtab.html
  const newTabUrl = chrome.runtime.getURL("newtab.html");
  chrome.tabs.create({ url: newTabUrl });
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
    });
  }
});

// Handle messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "createRecord") {
    createRecord(request.data, sendResponse)    
  } else if (request.action === "queryRecords") {
    queryRecords(sendResponse);
  } else if (request.action === "finishRecords") {
    finishRecords(request.recordIds, sendResponse)    
  }

   return true;
});


async function queryRecords(sendResponse) {
  try {
    const records = await airtable.listRecords();
    sendResponse({ success: true, records });
  } catch (error) {
    console.error("Error querying records:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get base64 part
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function createAttachment(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const contentType = response.headers.get('content-type') || blob.type || "image/png";
    const filename = `image.${contentType.split('/')[1] || 'png'}`
    const file = await blobToBase64(blob);

    return { file, filename, contentType };
  } catch (error) {
    throw new Error("Failed to process image: " + error.message);
  }
}

async function createRecord(data, sendResponse) {
  try {
    const image = await createAttachment(data.imageUrl);  
    const recordId = await airtable.createRecord({ note: data.note });
    await airtable.uploadImage({ recordId, image });
    sendResponse({ success: true });
  } catch (error) {
    console.error("failed to create record: ", error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to update Airtable record status to "已发布"
async function finishRecords(recordIds, sendResponse) {
  try {
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      throw new Error("No record IDs provided");
    }
    
    await airtable.finishRecords(recordIds);
    sendResponse({ success: true });
  } catch (e) {
    console.error('Error finishing records:', e);
    sendResponse({ success: false, error: e.message });
  }
}
