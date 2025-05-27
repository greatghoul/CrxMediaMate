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

// Function to query records from Airtable
async function queryNotionRecords() {
  return new Promise(async (resolve, reject) => {
    if (!airtableToken) {
      reject(new Error("Airtable API token not found. Please check your settings.js file."));
      return;
    }
    
    try {
      // Query the database for records with status "待发布"
      const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=AND({状态}='待发布')&sort[0][field]=createdTime&sort[0][direction]=asc`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json'
        }
      });
        if (!response.ok) {
        const errorData = await response.json();
        reject(new Error(`Airtable API error: ${JSON.stringify(errorData)}`));
        return;
      }
      
      const data = await response.json();
      
      // Extract the relevant info from each record
      const records = data.records.map((record) => {
        console.log(record);
        // Extract the description
        const description = record.fields["描述"] || "无描述";
        
        // Extract the image URL
        const imageUrl = record.fields["图片"]?.[0]?.url || null;
        
        return {
          id: record.id,
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

// Function to update Airtable record status to "已发布"
async function updateNotionPagesStatus(recordIds) {
  return new Promise(async (resolve, reject) => {
    if (!airtableToken) {
      reject(new Error("Airtable API token not found. Please check your settings.js file."));
      return;
    }
    
    if (!recordIds || !recordIds.length) {
      reject(new Error("No record IDs provided"));
      return;
    }
    
    try {
      // Process all record updates concurrently
      const updatePromises = recordIds.map(async (recordId) => {
        const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${recordId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${airtableToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              "状态": "已发布"
            }
          })
        });
          if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update record ${recordId}: ${JSON.stringify(errorData)}`);
        }
        
        return await response.json();
      });
      
      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      console.log(`Successfully updated ${recordIds.length} records to "已发布" status`);
      resolve();
      
    } catch (error) {
      console.error("Error updating Notion pages:", error);
      reject(error);
    }
  });
}
