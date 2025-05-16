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
    return true;  } else if (request.action === "queryNotionRecords") {
    queryNotionRecords()
      .then((records) => {
        sendResponse({ success: true, records });
      })
      .catch(error => {
        console.error("Error querying Notion records:", error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll respond asynchronously
    return true;
  } else if (request.action === "markPagesAsPublished") {
    updateNotionPagesStatus(request.pageIds)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error("Error updating Notion page status:", error);
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

// Function to query records from Notion database
async function queryNotionRecords() {
  return new Promise(async (resolve, reject) => {
    if (!notionToken) {
      reject(new Error("Notion API token not found. Please check your settings.js file."));
      return;
    }
    
    const NOTION_DATABASE_ID = "1f55931b1ae380af993eeac13b7bed02";
    
    try {
      // Query the database for records with status "待发布"
      const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify({
          filter: {
            property: "状态",
            select: {
              equals: "待发布"
            }
          },
          sorts: [
            {
              timestamp: "created_time",
              direction: "ascending"
            }
          ]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        reject(new Error(`Notion API error: ${JSON.stringify(errorData)}`));
        return;
      }
      
      const data = await response.json();
      
      // Extract the relevant info from each record
      const records = data.results.map((page) => {
        // Extract the description (title)
        const description = page.properties["描述"]?.title?.[0]?.text?.content || "无描述";
        
        // Extract the image URL
        const imageFile = page.properties["图片"]?.files?.[0];
        const imageUrl = imageFile?.type === "external" ? imageFile.external.url : null;
        
        return {
          id: page.id,
          description,
          imageUrl
        };
      });
      
      console.log(`Successfully fetched ${records.length} records from Notion`);
      resolve(records);
      
    } catch (error) {
      console.error("Error querying Notion:", error);
      reject(error);
    }
  });
}

// Function to update Notion page status to "已发布"
async function updateNotionPagesStatus(pageIds) {
  return new Promise(async (resolve, reject) => {
    if (!notionToken) {
      reject(new Error("Notion API token not found. Please check your settings.js file."));
      return;
    }
    
    if (!pageIds || !pageIds.length) {
      reject(new Error("No page IDs provided"));
      return;
    }
    
    try {
      // Process all page updates concurrently
      const updatePromises = pageIds.map(async (pageId) => {
        const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${notionToken}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28'
          },
          body: JSON.stringify({
            properties: {
              "状态": {
                type: "select",
                select: {
                  name: "已发布"
                }
              }
            }
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update page ${pageId}: ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      console.log(`Successfully updated ${pageIds.length} pages to "已发布" status`);
      resolve();
      
    } catch (error) {
      console.error("Error updating Notion pages:", error);
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
