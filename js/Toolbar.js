// Toolbar.js - 工具栏组件

import { html, useState } from './preact.js';

// 工具栏组件
const Toolbar = ({ onAdd, onFilter, onSearch, selectedCount, onDeleteSelected, onGenerateArticle, onGenerateVideo, onBatchPublish, onBatchUnpublish, filter }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };
  
  // 关闭下拉菜单
  const closeDropdown = () => {
    setDropdownOpen(false);
  };
  
  // 处理批量操作项点击
  const handleBatchAction = (action) => {
    closeDropdown();
    action();
  };
  
  return html`
    <div class="toolbar fixed-top">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-lg-2 col-md-3">
            <h4 class="mb-0">图片素材管家</h4>
          </div>
          <div class="col-lg-6 col-md-5">
            <div class="bulk-actions">              <button 
                class="btn btn-primary btn-sm" 
                onClick=${onAdd}
              >
                <i class="bi bi-plus"></i> 添加图片
              </button>
              <div class="custom-dropdown d-inline-block">
                <button 
                  class="btn btn-secondary btn-sm" 
                  type="button"
                  disabled=${selectedCount === 0}
                  onClick=${toggleDropdown}
                >
                  批量操作 ${dropdownOpen ? '▲' : '▼'}
                </button>
                ${dropdownOpen && html`
                  <div class="custom-dropdown-menu">
                    <button class="dropdown-item" onClick=${() => handleBatchAction(onBatchPublish)}>标记为已发布</button>
                    <button class="dropdown-item" onClick=${() => handleBatchAction(onBatchUnpublish)}>标记为未发布</button>
                    <div class="dropdown-divider"></div>
                    <button class="dropdown-item text-danger" onClick=${() => handleBatchAction(onDeleteSelected)}>删除</button>
                  </div>
                `}
              </div>              <button 
                class="btn btn-success btn-sm" 
                disabled=${selectedCount === 0}
                onClick=${onGenerateArticle}
              >
                生成文章
              </button>
              <button 
                class="btn btn-info btn-sm" 
                disabled=${selectedCount === 0}
                onClick=${onGenerateVideo}
              >
                生成视频
              </button>
            </div>
          </div>
          <div class="col-lg-4 col-md-4">
            <div class="d-flex justify-content-end">
              <div class="input-group toolbar-search">
                <input 
                  type="text" 
                  class="form-control form-control-sm" 
                  placeholder="搜索描述..." 
                  onChange=${e => onSearch(e.target.value)}
                />                <select 
                  class="form-select form-select-sm" 
                  onChange=${e => onFilter(e.target.value)}
                  value=${filter}
                >
                  <option value="all">全部图片</option>
                  <option value="published">已发布</option>
                  <option value="unpublished">未发布</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

export default Toolbar;
