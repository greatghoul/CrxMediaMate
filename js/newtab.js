document.addEventListener('DOMContentLoaded', function() {
  const dynamicContent = document.getElementById('dynamicContent');
  const refreshButton = document.getElementById('refreshButton');
  const copyButton = document.getElementById('copyButton');
  
  let articleContent = '';
  let records = [];
  
  // Function to fetch records from Notion database
  const fetchNotionRecords = async () => {
    try {
      dynamicContent.innerHTML = '<div class="loading">正在加载内容，请稍候...</div>';
      
      // Send a message to background.js to query Notion
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: "queryNotionRecords" },
          (response) => resolve(response)
        );
      });
      
      if (!response.success) {
        throw new Error(response.error || '获取数据失败');
      }
      
      // Store the records
      records = response.records;
      
      // Generate article content
      generateArticle(records);
      
    } catch (error) {
      console.error("Error fetching Notion records:", error);
      dynamicContent.innerHTML = `
        <div class="error">
          <p><strong>获取数据失败：</strong> ${error.message}</p>
          <p>请检查您的网络连接和Notion API Token是否设置正确。</p>
        </div>
      `;
    }
  };
    // Function to generate article from records
  const generateArticle = (records) => {
    if (!records || records.length === 0) {
      dynamicContent.innerHTML = '<div class="error">没有找到待发布的记录。</div>';
      articleContent = '';
      return;
    }
    
    // Create the article container
    const articleContainer = document.createElement('div');
    articleContainer.className = 'article-container';
      // Add encouraging text at the beginning as regular paragraph
    const startEncouragingP = document.createElement('p');
    startEncouragingP.textContent = '沙雕图，让生活充满欢乐！每天看一看沙雕图，心情愉快一整天。';
    startEncouragingP.style.marginBottom = '20px';
    articleContainer.appendChild(startEncouragingP);
    
    // Build the article content
    articleContent = '沙雕图，让生活充满欢乐！每天看一看沙雕图，心情愉快一整天。\n\n';
    let articleHtml = '';
    
    records.forEach((record, index) => {
      // Format the index number with leading zero if needed
      const formattedIndex = String(index + 1).padStart(2, '0');
      
      // Create the text content for this record
      const recordContent = `${formattedIndex}. ${record.description}\n\n[图片${index + 1}]\n\n`;
      articleContent += recordContent;
        // Create the HTML for this record
      const articleItem = document.createElement('div');
      articleItem.className = 'article-item';
      
      const articleDescription = document.createElement('h1');
      articleDescription.className = 'article-description';
      articleDescription.textContent = `${formattedIndex}. ${record.description}`;
      
      const articleImage = document.createElement('img');
      articleImage.className = 'article-image';
      articleImage.src = record.imageUrl;
      articleImage.alt = record.description;
      
      articleItem.appendChild(articleDescription);
      articleItem.appendChild(articleImage);
      articleContainer.appendChild(articleItem);
    });    // Add encouraging text at the end as regular paragraph
    const endEncouragingP = document.createElement('p');
    endEncouragingP.textContent = '沙雕图不仅能带给我们欢笑，还能帮助我们减轻压力，放松身心。赶紧收藏并分享这些有趣的沙雕图吧！';
    endEncouragingP.style.marginTop = '20px';
    articleContainer.appendChild(endEncouragingP);
    
    // Add ending text to article content
    articleContent += '\n沙雕图不仅能带给我们欢笑，还能帮助我们减轻压力，放松身心。赶紧收藏并分享这些有趣的沙雕图吧！';
    
    // Clear the dynamic content and append the article
    dynamicContent.innerHTML = '';
    dynamicContent.appendChild(articleContainer);
    
    // Fade in animation
    let opacity = 0;
    articleContainer.style.opacity = opacity;
    
    const fadeIn = setInterval(() => {
      opacity += 0.05;
      articleContainer.style.opacity = opacity;
      
      if (opacity >= 1) {
        clearInterval(fadeIn);
      }
    }, 50);
  };  // Select all article content for copying
  const selectAllArticleContent = () => {
    const articleContainer = document.querySelector('.article-container');
    
    if (!articleContainer) {
      return;
    }
    
    // Create a selection range
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Select the article container
    range.selectNodeContents(articleContainer);
    selection.removeAllRanges();
    selection.addRange(range);
    
  };
  
  // Add event listeners
  refreshButton.addEventListener('click', fetchNotionRecords);
  copyButton.addEventListener('click', selectAllArticleContent);
  
  // Initial fetch
  fetchNotionRecords();
});
