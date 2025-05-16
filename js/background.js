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
  if (request.action === "postToNotion") {
    postToNotion(request.data)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error("Error posting to Notion:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  }
});

// Import settings from external file
import { notionToken, imgbbApiKey } from './settings.js';

// Function to post data to Notion
async function postToNotion(data) {
  return new Promise(async (resolve, reject) => {
    // Use imported tokens instead of getting from storage
    if (!notionToken) {
      reject(new Error("Notion API token not found. Please check your settings.js file."));
      return;
    }
    
    if (!imgbbApiKey) {
      reject(new Error("ImgBB API key not found. Please check your settings.js file."));
      return;
    }
    
    try {
      // Download the image first
      const imageResponse = await fetch(data.imageUrl);
      const imageBlob = await imageResponse.blob();
      
      // Get file name from URL or use default
      let fileName = "image.jpg";
      try {
        const url = new URL(data.imageUrl);
        const pathSegments = url.pathname.split('/');
        if (pathSegments.length > 0 && pathSegments[pathSegments.length - 1]) {
          fileName = pathSegments[pathSegments.length - 1];
        }
      } catch (e) {
        console.log("Could not parse filename from URL, using default");
      }
      
      // Convert the image blob to base64
      const base64Image = await blobToBase64(imageBlob);
      const base64Data = base64Image.split(',')[1]; // Remove the data:image/jpeg;base64, prefix
      
      // Upload to ImgBB first
      const imgbbResponse = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: new URLSearchParams({
          key: imgbbApiKey,
          image: base64Data,
          name: fileName
        })
      });
      
      if (!imgbbResponse.ok) {
        throw new Error(`Failed to upload to ImgBB: ${await imgbbResponse.text()}`);
      }
      
      const imgbbData = await imgbbResponse.json();
      if (!imgbbData.success) {
        throw new Error(`ImgBB upload failed: ${imgbbData.error?.message || 'Unknown error'}`);
      }
      
      const imageUrl = imgbbData.data.url;
      
      // Now create the Notion page with all properties including the image
      const response = await fetch(`https://api.notion.com/v1/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          parent: { database_id: data.databaseId },
          properties: {
            "描述": {
              type: "title",
              title: [
                {
                  type: "text",
                  text: { content: data.note }
                }
              ]
            },
            "状态": {
              type: "select",
              select: {
                name: "未发布"
              }
            },
            "图片": {
              "files": [
                {
                  "name": fileName,
                  "type": "external",
                  "external": {
                    "url": imageUrl
                  }
                }
              ]
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        reject(new Error(`Notion API error: ${JSON.stringify(errorData)}`));
        return;
      }
      
      console.log("Successfully uploaded image and created page in Notion");
      resolve();
      
    } catch (error) {
      console.error("Error posting to Notion:", error);
      reject(error);
    }
  });
}

// Helper function to convert Blob to Base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
