document.addEventListener('DOMContentLoaded', function() {
  // Get image URL from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const imageUrl = urlParams.get('imageUrl');
  const previewImg = document.getElementById('preview');
  // Set the image src if available
  if (imageUrl) {
    previewImg.src = imageUrl;
  } else {
    previewImg.alt = "没有可用的图片";
    document.getElementById('saveButton').disabled = true;
  }
  
  // Add event listener for the new tab button
  document.getElementById('openNewTabButton').addEventListener('click', function() {
    const message = document.getElementById('note').value.trim() || 'Hello World!';
    const newTabUrl = chrome.runtime.getURL("newtab.html") + `?message=${encodeURIComponent(message)}`;
    chrome.tabs.create({ url: newTabUrl });
  });
  
  // Form submission handler
  document.getElementById('saveForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const note = document.getElementById('note').value.trim();
    const statusMessage = document.getElementById('statusMessage');
    
    // Save image and note to clipboard
    saveToClipboard(imageUrl, note)
      .then(() => {
        // Show success message
        statusMessage.textContent = "沙雕图已保存到剪贴板！";
        statusMessage.className = "status-message success";
        statusMessage.style.display = "block";
        
        // Post to Notion database
        postToNotion(imageUrl, note)
          .then(() => {
            statusMessage.textContent = "沙雕图已保存到剪贴板并发布到Notion！";

            // Close the window after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          })
          .catch(error => {
            console.error("Notion发布失败:", error);
            statusMessage.textContent = "已保存到剪贴板，但Notion发布失败";
          });
        

      })
      .catch(error => {
        // Show error message
        statusMessage.textContent = "错误: " + error.message;
        statusMessage.className = "status-message error";
        statusMessage.style.display = "block";
      });
  });
  
  // Function to save image and note to clipboard
  async function saveToClipboard(imageUrl, note) {
    try {
      // Create a combined data structure with both image URL and note
      const clipboardData = {
        imageUrl: imageUrl,
        note: note
      };
      
      // Convert to a string for clipboard
      const clipboardText = JSON.stringify(clipboardData);
      
      // Write to clipboard
      await navigator.clipboard.writeText(clipboardText);
      
      // Optionally, you can also try to copy the image itself to clipboard
      // This is more complex and might require additional permissions
      // For now, we're just writing the text data
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  // Function to post to Notion database
  async function postToNotion(imageUrl, note) {
    const NOTION_DATABASE_ID = "1f55931b1ae380af993eeac13b7bed02";
    
    try {
      // We'll need to use background.js as a proxy to make the Notion API call
      // because of CORS restrictions in popup.js
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "postToNotion",
          data: {
            databaseId: NOTION_DATABASE_ID,
            imageUrl: imageUrl,
            note: note
          }
        }, response => {
          if (response.success) {
            resolve();
          } else {
            reject(new Error(response.error || "Failed to post to Notion"));
          }
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
});
