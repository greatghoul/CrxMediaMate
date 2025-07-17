// ArticleModal.js - 文章生成模态框组件

import { html, useState, useEffect } from './preact.js';
import { articleHeadParagraph, articleTailParagraph } from './settings.js';

// 文章生成模态框
const ArticleModal = ({ isOpen, images, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [articleContent, setArticleContent] = useState('');
  const [loading, setLoading] = useState(true);

  // 当图片数组变化时生成文章
  useEffect(() => {
    if (isOpen && images && images.length > 0) {
      generateArticleContent();
    }
  }, [isOpen, images]);

  // 将Blob转换为Data URI
  const convertBlobToDataUri = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
  };
  
  // 根据选中图片生成文章
  const generateArticleContent = async () => {
    if (!images || images.length === 0) {
      setArticleContent('');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let content = '';
    
    // 添加开头鼓励性段落
    if (articleHeadParagraph) {
      content += articleHeadParagraph;
    }
    // content += ;
    
    // 添加每个图片及其描述
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const formattedIndex = String(i + 1).padStart(2, '0');
      content += `<h1>${formattedIndex}. ${image.caption}</h1>`;
      
      // 将图片数据转换为 data URI
      const dataUri = await convertBlobToDataUri(image.imageData);
      content += `<img src="${dataUri}" alt="${image.caption}" />`;
    }
    
    // 添加结尾鼓励性段落
    if (articleTailParagraph) {
      content += articleTailParagraph;
    }
    
    setArticleContent(content);
    setLoading(false);
  };

  // 复制文章内容
  const handleCopy = () => {
    const articleContainer = document.querySelector('.article-container');
    if (!articleContainer) return;
    
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(articleContainer);
    selection.removeAllRanges();
    selection.addRange(range);
    
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    } finally {
      selection.removeAllRanges();
    }
  };
  
  if (!isOpen) return null;
  
  return html`
    <div class="modal show d-block" tabindex="-1" role="dialog">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">生成的文章内容</h5>
            <button type="button" class="btn-close" aria-label="Close" onClick=${onClose}></button>
          </div>
          <div class="modal-body">
            ${loading ? html`
              <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">生成文章中...</span>
                </div>
                <p class="mt-2">正在生成文章，请稍候...</p>
              </div>
            ` : html`
              <div class="article-container" dangerouslySetInnerHTML=${{ __html: articleContent }}></div>
            `}
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onClick=${onClose}>关闭</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              onClick=${handleCopy}
              disabled=${loading || !articleContent}
            >
              ${copied ? '已复制!' : '复制内容'}
            </button>
          </div>
        </div>
      </div>
      <div class="modal-backdrop show"></div>
    </div>
  `;
};

export default ArticleModal;
