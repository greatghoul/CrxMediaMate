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
  // Form submission handler
  document.getElementById('saveForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const note = document.getElementById('note').value.trim();
    const statusMessage = document.getElementById('statusMessage');
    const saveButton = document.getElementById('saveButton');
    
    // Disable button during submission
    saveButton.disabled = true;    // Show initial status message
    statusMessage.textContent = "上传图片中...";
    statusMessage.className = "status-message info";
    statusMessage.style.display = "block";
    
    // Post to Notion database
    postToNotion(imageUrl, note, statusMessage)      .then(() => {
        // Show success message with animation
        statusMessage.style.display = "none"; // Reset for new animation
        setTimeout(() => {
          statusMessage.textContent = "沙雕图已发布到Notion！";
          statusMessage.className = "status-message success";
          statusMessage.style.display = "block";
          
          // Apply a subtle bounce effect to the success message
          // statusMessage.style.animation = "fade-in 0.5s ease-in-out";
          
          // Close the window after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        }, 100);
      })      .catch(error => {
        // Show error message
        console.error("Notion发布失败:", error);
        statusMessage.textContent = "发布到Notion失败: " + error.message;
        statusMessage.className = "status-message error";
        statusMessage.style.display = "block";
        
        // Re-enable button on error
        saveButton.disabled = false;
      });
  });
  // Function to post to Notion database
  async function postToNotion(imageUrl, note, statusMessage) {
    const NOTION_DATABASE_ID = "1f55931b1ae380af993eeac13b7bed02";
    
    try {
      // Update status to show progress
      statusMessage.textContent = "上传图片中...";
        // We'll need to use background.js as a proxy to make the Notion API call
      // because of CORS restrictions in popup.js
      
      // Set up a message listener for progress updates
      const messageListener = (message) => {
        if (message && message.progress) {
          statusMessage.textContent = message.progress;
        }
      };
      
      // Add the listener for progress updates
      chrome.runtime.onMessage.addListener(messageListener);
      
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: "postToNotion",
          data: {
            databaseId: NOTION_DATABASE_ID,
            imageUrl: imageUrl,
            note: note
          }
        }, response => {
          // Remove the message listener when we're done
          chrome.runtime.onMessage.removeListener(messageListener);
          
          if (response && response.success) {
            resolve();
          } else {
            reject(new Error(response && response.error || "Failed to post to Notion"));
          }
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
});
