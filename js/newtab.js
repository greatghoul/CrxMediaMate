const dynamicContent = document.getElementById('dynamicContent');
const refreshButton = document.getElementById('refreshButton');
const copyButton = document.getElementById('copyButton');
const publishedButton = document.getElementById('publishedButton');

let articleContent = '';
let records = [];

// Fetch records from Notion database
const queryRecords = async () => {
  try {
    dynamicContent.innerHTML = '<div class="loading">正在加载内容，请稍候...</div>';
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "queryRecords" },
        (response) => resolve(response)
      );
    });
    if (!response.success) throw new Error(response.error || '获取数据失败');
    records = response.records;
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

// Generate article from records
const generateArticle = (records) => {
  if (!records || records.length === 0) {
    dynamicContent.innerHTML = '<div class="error">没有找到待发布的记录。</div>';
    return;
  }

  const articleContainer = document.createElement('div');
  articleContainer.className = 'article-container';

  const startEncouragingP = document.createElement('p');
  startEncouragingP.textContent = '搞笑图，让生活充满欢乐！每天看一看搞笑图，心情愉快一整天。';
  startEncouragingP.style.marginBottom = '20px';
  articleContainer.appendChild(startEncouragingP);

  records.forEach((record, index) => {
    const formattedIndex = String(index + 1).padStart(2, '0');

    const articleItem = document.createElement('div');
    articleItem.className = 'article-item';

    const articleDescription = document.createElement('h1');
    articleDescription.className = 'article-description';
    articleDescription.textContent = `${formattedIndex}. ${record.fields.note}`;

    const articleImage = document.createElement('img');
    articleImage.className = 'article-image';
    articleImage.src = record.fields.image[0].url;
    articleImage.alt = record.fields.note;

    articleItem.appendChild(articleDescription);
    articleItem.appendChild(articleImage);
    articleContainer.appendChild(articleItem);
  });

  const endEncouragingP = document.createElement('p');
  endEncouragingP.textContent = '搞笑图不仅能带给我们欢笑，还能帮助我们减轻压力，放松身心。赶紧收藏并分享这些有趣的搞笑图吧！';
  endEncouragingP.style.marginTop = '20px';
  articleContainer.appendChild(endEncouragingP);

  dynamicContent.innerHTML = '';
  dynamicContent.appendChild(articleContainer);
};

// Select all article content for copying
const selectAllArticleContent = () => {
  const articleContainer = document.querySelector('.article-container');
  if (!articleContainer) return;
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(articleContainer);
  selection.removeAllRanges();
  selection.addRange(range);
};

// Mark pages as published
const markPagesAsPublished = async () => {
  if (!records || records.length === 0) return;
  try {
    publishedButton.disabled = true;
    publishedButton.textContent = "正在更新...";
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "finishRecords",
          recordIds: records.map(record => record.id)
        },
        (response) => resolve(response)
      );
    });
    if (!response.success) throw new Error(response.error || '更新状态失败');
    queryRecords();
  } catch (error) {
    console.error("Error marking pages as published:", error);
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error';
    errorMessage.innerHTML = `<p><strong>更新状态失败：</strong> ${error.message}</p>`;
    dynamicContent.insertBefore(errorMessage, dynamicContent.firstChild);
    setTimeout(() => {
      if (errorMessage.parentNode === dynamicContent) {
        dynamicContent.removeChild(errorMessage);
      }
    }, 5000);
  } finally {
    publishedButton.disabled = false;
    publishedButton.textContent = "发布完成";
  }
};

// Event listeners
refreshButton.addEventListener('click', queryRecords);
copyButton.addEventListener('click', selectAllArticleContent);
publishedButton.addEventListener('click', markPagesAsPublished);

// Initial fetch
queryRecords();
