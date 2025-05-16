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
    
    // Save image and note to clipboard
    saveToClipboard(imageUrl, note)      .then(() => {
        // Show success message
        statusMessage.textContent = "沙雕图已保存到剪贴板！";
        statusMessage.className = "status-message success";
        statusMessage.style.display = "block";
        
        // Store in Chrome storage for history (optional)
        chrome.storage.local.get({imageHistory: []}, function(result) {
          const history = result.imageHistory;
          history.push({
            imageUrl: imageUrl,
            note: note,
            date: new Date().toISOString()
          });
          
          // Keep only the last 50 entries
          if (history.length > 50) {
            history.shift();
          }
          
          chrome.storage.local.set({imageHistory: history});
        });
        
        // Close the window after 2 seconds
        setTimeout(() => {
          window.close();
        }, 2000);
      })      .catch(error => {
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
});
