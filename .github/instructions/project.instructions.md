---
applyTo: '**'
---

## GIT 命令相关

1. 当我说 commit, 我的意思是在一行命令中完成 git add 和 git commit
2. commit message 需要简明扼要，一句话描述基本改动即可，使用中文
3. 当我说 push, 我的意思是 git push
4. 当我说 merge, 我的意思是合并当前分支到 master, 使用 --no-ff 参数
  
## Preact 相关

1. preact 是一个 standalone package, 包含了所有的依赖，可以直接从 preact 引入所有方法
   ```js
   import { html, render, useState, useEffect } from './preact.js';
   ```
2. 总是使用 html 来创建模板，比如 html`<div class="foo">...</div>`
