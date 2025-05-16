// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {  // Create a context menu item that appears when right-clicking on an image
  chrome.contextMenus.create({
    id: "saveImageWithNote",
    title: "收集沙雕图",
    contexts: ["image"]
  });
});

// Add listener for context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveImageWithNote") {
    // Open a popup window when the context menu item is clicked
    const imageUrl = info.srcUrl;
    
    // Open a new popup window
    chrome.windows.create({
      url: `popup.html?imageUrl=${encodeURIComponent(imageUrl)}`,
      type: "popup",
      width: 500,
      height: 600
    });
  }
});
