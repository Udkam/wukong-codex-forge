export const runtimeFixtureHtml = String.raw`
  <style>
    :root {
      --spacing: 4px;
      --height-toolbar: 46px;
      --height-toolbar-sm: 36px;
      --thread-content-max-width: 48rem;
      --padding-toolbar: 16px;
      --radius-3xl: 25px;
      --radius-token-composer-single-line: 22px;
      --color-token-main-surface-primary: #181818;
      --color-token-side-bar-background: #1c2020;
      --color-token-dropdown-background: #2a2a29;
      --color-token-input-background: #2b2b2a;
      --color-token-foreground: #d8d8d5;
      --color-token-text-secondary: #a5a6a3;
      --color-token-text-tertiary: #7f817e;
      --color-token-border: rgba(255, 255, 255, .08);
    }

    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; }
    body {
      background: var(--color-token-main-surface-primary);
      color: var(--color-token-foreground);
      font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei UI", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    button, [contenteditable] { font: inherit; color: inherit; }
    button { border: 0; background: transparent; }
    .icon {
      width: 16px;
      height: 16px;
      flex: 0 0 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.45;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    #root, .app-window { width: 100%; height: 100%; }
    .app-window { display: flex; flex-direction: column; background: #181818; }

    .application-menu {
      position: relative;
      z-index: 60;
      display: flex;
      height: var(--height-toolbar-sm);
      flex: 0 0 var(--height-toolbar-sm);
      align-items: center;
      gap: 23px;
      padding: 0 13px;
      background: #191d1f;
      color: #a3a6a6;
      box-shadow: inset 0 -1px rgba(255, 255, 255, .035);
    }
    .application-menu .history { display: flex; gap: 13px; color: #6d7374; }
    .application-menu .window-controls { margin-left: auto; display: flex; align-items: center; gap: 28px; color: #c7c9c8; }
    .application-menu .window-controls .icon { width: 14px; height: 14px; }

    .app-shell {
      position: relative;
      isolation: isolate;
      display: flex;
      width: 100%;
      min-height: 0;
      flex: 1;
    }

    .app-shell-left-panel {
      position: relative;
      display: flex;
      width: 275px;
      min-width: 275px;
      min-height: 0;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-token-side-bar-background);
      box-shadow: inset -1px 0 rgba(255, 255, 255, .045);
    }
    .sidebar-header {
      display: flex;
      height: var(--height-toolbar);
      flex: 0 0 var(--height-toolbar);
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      color: #d2d4d2;
      font-weight: 650;
    }
    .sidebar-header .brand { display: inline-flex; align-items: center; gap: 3px; }
    .sidebar-header .icon { color: #969b99; }
    .sidebar-scroll {
      min-height: 0;
      flex: 1;
      overflow: hidden;
      padding: 3px 7px 72px;
    }
    .sidebar-nav { height: 100%; }
    .sidebar-row,
    [role="treeitem"] {
      position: relative;
      display: flex;
      width: 100%;
      min-height: 34px;
      align-items: center;
      gap: 8px;
      padding: 6px 9px;
      border-radius: 8px;
      color: #b9bcba;
      text-align: left;
      white-space: nowrap;
    }
    .sidebar-row:hover, [role="treeitem"]:hover { background: rgba(255, 255, 255, .04); }
    .sidebar-row .icon, [role="treeitem"] .icon { color: #999f9c; }
    .sidebar-section {
      margin: 18px 8px 6px;
      color: #6e7370;
      font-size: 12px;
      font-weight: 600;
    }
    [role="tree"] { overflow: hidden; }
    [role="treeitem"] { min-height: 31px; padding: 5px 9px 5px 30px; border-radius: 8px; }
    [role="treeitem"].project-root { padding-left: 9px; color: #c4c6c3; font-weight: 560; }
    [role="treeitem"][aria-selected="true"] { background: #303332; color: #e1e2df; }
    .sidebar-footer {
      position: absolute;
      inset: auto 0 0;
      display: flex;
      height: 43px;
      align-items: center;
      gap: 9px;
      padding: 0 15px;
      background: linear-gradient(transparent, #1c2020 28%);
      color: #c6c8c5;
      box-shadow: inset 0 1px rgba(255, 255, 255, .035);
    }
    .avatar { width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #68a4c8, #d59c5d 58%, #8c6aa3); }
    .sidebar-footer .help { margin-left: auto; color: #767c79; }

    .main-surface {
      position: relative;
      isolation: isolate;
      display: flex;
      min-width: 0;
      min-height: 0;
      flex: 1;
      flex-direction: column;
      overflow: hidden;
      background: var(--color-token-main-surface-primary);
    }
    .app-thread-header {
      position: absolute;
      inset: 0 0 auto;
      z-index: 30;
      display: grid;
      height: var(--height-toolbar);
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 16px;
      padding: 0 var(--padding-toolbar);
      background: #1d1d1d;
      box-shadow: inset 0 -1px rgba(255, 255, 255, .045);
    }
    .thread-heading { display: flex; min-width: 0; align-items: center; gap: 8px; color: #bec1be; }
    .thread-heading .title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .thread-actions { display: flex; align-items: center; gap: 6px; }
    .toolbar-button {
      display: inline-flex;
      min-height: 30px;
      align-items: center;
      justify-content: center;
      gap: 5px;
      padding: 4px 8px;
      border-radius: 9px;
      color: #bfc1be;
    }
    .toolbar-button:hover { background: rgba(255, 255, 255, .055); }

    .app-shell-main-content-viewport {
      position: relative;
      display: flex;
      min-width: 0;
      min-height: 0;
      flex: 1;
      flex-direction: column;
    }
    .app-shell-main-content-frame {
      position: relative;
      display: flex;
      min-height: 0;
      flex: 1;
      flex-direction: column;
      margin-top: var(--height-toolbar);
    }
    .main-content-stack, .route-host { position: relative; width: 100%; height: 100%; min-height: 0; }
    .app-shell-main-content-top-fade {
      pointer-events: none;
      position: absolute;
      inset: 0 0 auto;
      z-index: 20;
      height: 16px;
      background: linear-gradient(#181818, transparent);
      opacity: 0;
    }

    .landing-native {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 0 32px 138px;
      text-align: center;
    }
    .landing-hero { width: min(100%, var(--thread-content-max-width)); min-width: 0; padding-inline: 20px; }
    .landing-hero small { color: #94958f; letter-spacing: .08em; }
    .landing-hero h1 { margin: 13px 0 8px; color: #e2e2df; font-size: 30px; line-height: 1.25; font-weight: 420; }
    .landing-hero p { margin: 0; color: #9c9e9a; }

    [data-thread-find-target="conversation"] {
      width: min(100%, var(--thread-content-max-width));
      height: 100%;
      margin: 0 auto;
      overflow: hidden;
      padding: 32px var(--padding-toolbar) 164px;
    }
    .conversation-status {
      display: flex;
      align-items: center;
      gap: 7px;
      margin: 72px 0 14px;
      padding-bottom: 9px;
      border-bottom: 1px solid rgba(255, 255, 255, .08);
      color: #8e908c;
      font-size: 13px;
    }
    [data-virtualized-turn-content] { margin-bottom: 18px; }
    [data-local-conversation-user-anchor] { display: flex; justify-content: flex-end; }
    [data-user-message-bubble] {
      width: fit-content;
      max-width: 72%;
      padding: 9px 13px;
      border-radius: 20px;
      background: #292a28;
      color: #dddeda;
    }
    [data-local-conversation-final-assistant] { display: flex; flex-direction: column; gap: 0; color: #d1d2ce; }
    [data-local-conversation-final-assistant] p { margin: 0 0 12px; }
    pre {
      margin: 3px 0 2px;
      overflow: hidden;
      padding: 12px 14px;
      border: .5px solid rgba(255, 255, 255, .1);
      border-radius: 10px;
      background: #242524;
      color: #cfd2ce;
      font: 13px/1.55 ui-monospace, "SFMono-Regular", Consolas, monospace;
    }

    .composer-area {
      pointer-events: none;
      position: absolute;
      inset: auto 50% 12px auto;
      z-index: 35;
      width: min(768px, calc(100% - 32px));
      padding-inline: var(--padding-toolbar);
      transform: translateX(50%);
    }
    [data-codex-composer-root] { width: 100%; }
    .composer-surface-chrome {
      pointer-events: auto;
      position: relative;
      display: flex;
      width: 100%;
      min-height: 96px;
      flex-direction: column;
      overflow: hidden;
      border-radius: var(--radius-3xl);
      background: var(--color-token-input-background);
      box-shadow: 0 0 0 .5px rgba(255, 255, 255, .085), 0 10px 24px rgba(0, 0, 0, .2);
    }
    .composer-input-wrap { min-height: 54px; padding: 12px 14px 4px; }
    .ProseMirror {
      min-height: 36px;
      outline: 0;
      color: #dbdcd8;
      white-space: pre-wrap;
    }
    .ProseMirror:empty::before { content: attr(data-placeholder); color: #777a76; }
    .composer-footer {
      display: grid;
      min-height: 38px;
      grid-template-columns: auto auto minmax(0, 1fr) auto auto;
      align-items: center;
      gap: 5px;
      padding: 0 8px 8px;
    }
    .composer-footer button {
      display: inline-flex;
      min-width: 30px;
      min-height: 30px;
      align-items: center;
      justify-content: center;
      gap: 5px;
      border-radius: 9px;
      color: #bfc1bd;
    }
    .composer-footer button:hover { background: rgba(255, 255, 255, .055); }
    .composer-footer .access { color: #d07a32; }
    .composer-footer .model { margin-left: auto; color: #b3b5b1; }
    .composer-footer .send {
      min-width: 32px;
      width: 32px;
      height: 32px;
      margin-left: 3px;
      border-radius: 50%;
      background: #c8cac6;
      color: #4a4b48;
    }

    .thread-summary-layer {
      pointer-events: none;
      position: absolute;
      inset: 12px 0 12px auto;
      z-index: 40;
      width: 316px;
    }
    [data-pip-obstacle="thread-summary-panel"] {
      pointer-events: auto;
      display: flex;
      max-height: 100%;
      padding-right: 16px;
    }
    .summary-panel-card {
      display: flex;
      width: 300px;
      max-height: 100%;
      flex-direction: column;
      overflow: hidden;
      padding: 11px 14px 9px;
      border-radius: var(--radius-3xl);
      background: var(--color-token-dropdown-background);
      box-shadow: 0 12px 30px rgba(0, 0, 0, .22), 0 0 0 .5px rgba(255, 255, 255, .075);
    }
    .summary-heading { display: flex; align-items: center; margin: 0 0 5px; color: #969894; font-size: 14px; font-weight: 550; }
    .summary-heading button { margin-left: auto; color: #858985; }
    .summary-row {
      display: flex;
      min-height: 42px;
      align-items: center;
      gap: 9px;
      border-bottom: .5px solid rgba(255, 255, 255, .1);
      color: #d2d3cf;
    }
    .summary-row:last-child { border: 0; }
    .summary-row .meta { margin-left: auto; color: #777b78; }
  </style>

  <div id="root" class="electron-dark" data-codex-window-type="electron">
    <div class="app-window">
      <header class="application-menu" data-native-slot="topbar">
        <svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="2.5" y="2.5" width="11" height="11" rx="2"/><path d="M6.5 2.5v11"/></svg>
        <span class="history"><svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m9.5 3.5-4.5 4.5 4.5 4.5M5 8h8"/></svg><svg class="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="m6.5 3.5 4.5 4.5-4.5 4.5M11 8H3"/></svg></span>
        <span>文件</span><span>编辑</span><span>视图</span><span>帮助</span>
        <span class="window-controls"><svg class="icon" viewBox="0 0 16 16"><path d="M3 8h10"/></svg><svg class="icon" viewBox="0 0 16 16"><rect x="4" y="3" width="8" height="8" rx="1"/><path d="M2.5 5.5h7v8h-7z"/></svg><svg class="icon" viewBox="0 0 16 16"><path d="m4 4 8 8M12 4l-8 8"/></svg></span>
      </header>

      <div class="app-shell">
        <aside class="app-shell-left-panel" data-native-slot="sidebar">
          <div class="sidebar-header"><span class="brand">Codex <svg class="icon" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3"/></svg></span><svg class="icon" viewBox="0 0 16 16"><circle cx="7" cy="7" r="4"/><path d="m10 10 3 3"/></svg></div>
          <div class="sidebar-scroll">
            <nav class="sidebar-nav" aria-label="Codex navigation">
              <button class="sidebar-row" aria-label="新建任务" data-native-slot="new-task"><svg class="icon" viewBox="0 0 16 16"><path d="M3 12.5h3l7-7-3-3-7 7v3Z"/><path d="m8.8 3.7 3 3"/></svg>新建任务</button>
              <button class="sidebar-row"><svg class="icon" viewBox="0 0 16 16"><path d="M5 2.5 3 5l2 2.5M11 2.5 13 5l-2 2.5M3 11h10"/></svg>拉取请求</button>
              <button class="sidebar-row"><svg class="icon" viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="4" height="4" rx="1"/><rect x="9.5" y="2.5" width="4" height="4" rx="1"/><rect x="2.5" y="9.5" width="4" height="4" rx="1"/><rect x="9.5" y="9.5" width="4" height="4" rx="1"/></svg>站点</button>
              <button class="sidebar-row"><svg class="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/><path d="M8 5v3l2 1.5"/></svg>已安排</button>
              <button class="sidebar-row"><svg class="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/><path d="M8 1.8v3M8 11.2v3M1.8 8h3M11.2 8h3"/></svg>插件</button>
              <p class="sidebar-section">置顶</p>
              <button class="sidebar-row"><svg class="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/><path d="M8 5v3l2 1.5"/></svg>每日通知与时事汇总</button>
              <button class="sidebar-row"><svg class="icon" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/><path d="M8 5v3l2 1.5"/></svg>磁盘审计</button>
              <p class="sidebar-section">项目</p>
              <div role="tree" aria-label="项目">
                <div role="treeitem" class="project-root"><svg class="icon" viewBox="0 0 16 16"><path d="M2 4.5h4l1.2 1.5H14v6.5H2z"/></svg>wukong-codex-forge</div>
                <div role="treeitem" aria-selected="true" data-native-slot="project-active">重设计黑神话悟空主题</div>
                <div role="treeitem" class="project-root"><svg class="icon" viewBox="0 0 16 16"><path d="M2 4.5h4l1.2 1.5H14v6.5H2z"/></svg>reproduction-temple-run</div>
                <div role="treeitem">接管 Temple 总控并归档修复</div>
                <div role="treeitem" class="project-root"><svg class="icon" viewBox="0 0 16 16"><path d="M2 4.5h4l1.2 1.5H14v6.5H2z"/></svg>reproduction-tetris</div>
                <div role="treeitem">Tetris总控</div>
              </div>
            </nav>
          </div>
          <div class="sidebar-footer"><span class="avatar"></span><span>4cer</span><svg class="icon help" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5"/><path d="M6.8 6.2A1.5 1.5 0 0 1 8.2 5c1 0 1.8.6 1.8 1.5 0 1.3-2 1.4-2 2.7M8 11.8h.01"/></svg></div>
        </aside>

        <main class="main-surface" role="main" data-native-slot="workspace">
          <div class="app-thread-header app-header-tint" data-native-slot="taskbar">
            <div class="thread-heading"><svg class="icon" viewBox="0 0 16 16"><path d="M2 4.5h4l1.2 1.5H14v6.5H2z"/></svg><span class="title">重设计黑神话悟空主题</span><span>···</span></div>
            <div class="thread-actions"><button class="toolbar-button">打开位置<svg class="icon" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3"/></svg></button><button class="toolbar-button" aria-label="视图设置"><svg class="icon" viewBox="0 0 16 16"><path d="M3 4h10M3 8h10M3 12h10"/><circle cx="6" cy="4" r="1" fill="currentColor"/><circle cx="10" cy="8" r="1" fill="currentColor"/><circle cx="7" cy="12" r="1" fill="currentColor"/></svg></button></div>
          </div>

          <div class="app-shell-main-content-viewport" data-app-shell-main-content-layout="thread-edge-scroll">
            <div class="app-shell-main-content-frame">
              <div class="main-content-stack">
                <div class="app-shell-main-content-top-fade" data-app-shell-main-content-top-fade="hidden"></div>
                <div class="route-host" data-vscode-context='{"chatgpt.supportsNewChatMenu": true}'>
                  <section class="landing-native">
                    <div class="landing-hero">
                      <small>新建任务</small>
                      <h1>今天想处理什么？</h1>
                      <p>描述目标，Codex 会在当前项目中开始工作。</p>
                    </div>
                  </section>

                  <div class="thread-summary-layer" data-native-slot="right-panel">
                    <div data-pip-obstacle="thread-summary-panel">
                      <section class="summary-panel-card" data-native-slot="right-card">
                        <h2 class="summary-heading">环境信息<button aria-label="添加"><svg class="icon" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg></button></h2>
                        <div class="summary-row"><svg class="icon" viewBox="0 0 16 16"><rect x="3" y="2.5" width="10" height="11" rx="1.5"/><path d="M6 6h4M6 9h4"/></svg><span>变更</span><span class="meta">+0 -0</span></div>
                        <div class="summary-row"><svg class="icon" viewBox="0 0 16 16"><rect x="2.5" y="3" width="11" height="8" rx="1.5"/><path d="M5 13h6"/></svg><span>本地</span><svg class="icon meta" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3"/></svg></div>
                        <div class="summary-row"><svg class="icon" viewBox="0 0 16 16"><circle cx="4" cy="3.5" r="1.5"/><circle cx="4" cy="12.5" r="1.5"/><circle cx="12" cy="6" r="1.5"/><path d="M4 5v6M5.5 4.2C9 4.5 8 6 10.5 6"/></svg><b>main</b><svg class="icon meta" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3"/></svg></div>
                        <div class="summary-row"><svg class="icon" viewBox="0 0 16 16"><circle cx="5" cy="8" r="2"/><circle cx="11" cy="8" r="2"/><path d="M7 8h2"/></svg><span>比较分支</span><svg class="icon meta" viewBox="0 0 16 16"><path d="M5 11 11 5M7 5h4v4"/></svg></div>
                      </section>
                    </div>
                  </div>

                  <div class="composer-area" data-thread-find-composer="true">
                    <div data-codex-composer-root>
                      <div class="composer-surface-chrome composer-native" data-codex-composer data-native-slot="composer">
                        <div class="composer-input-wrap"><div class="ProseMirror" contenteditable="true" role="textbox" aria-label="Message composer" data-placeholder="随心输入"></div></div>
                        <div class="composer-footer" role="toolbar">
                          <button aria-label="添加"><svg class="icon" viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg></button>
                          <button class="access">完全访问</button>
                          <button class="model">5.6 Sol 极高<svg class="icon" viewBox="0 0 16 16"><path d="m5 6 3 3 3-3"/></svg></button>
                          <button aria-label="语音输入"><svg class="icon" viewBox="0 0 16 16"><rect x="5.5" y="2.5" width="5" height="7" rx="2.5"/><path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2"/></svg></button>
                          <button class="send" type="submit" aria-label="发送"><svg class="icon" viewBox="0 0 16 16"><path d="M8 13V3M4.5 6.5 8 3l3.5 3.5"/></svg></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
`;

export const geometry = page => page.evaluate(() => Object.fromEntries(
  [...document.querySelectorAll('[data-native-slot]')].map(element => {
    const rect = element.getBoundingClientRect();
    return [element.dataset.nativeSlot, [rect.x, rect.y, rect.width, rect.height]];
  })
));

export const enterThreadState = page => page.evaluate(() => {
  document.querySelector('.landing-native')?.remove();
  const conversation = document.createElement('section');
  conversation.setAttribute('data-thread-find-target', 'conversation');
  conversation.innerHTML = `
    <div class="conversation-status"><span>已处理 2m 18s</span><span>›</span></div>
    <div data-virtualized-turn-content>
      <div data-local-conversation-user-anchor><div data-user-message-bubble>请检查当前实现。</div></div>
    </div>
    <div class="flex flex-col gap-0" data-local-conversation-final-assistant="true" data-virtualized-turn-content>
      <p>我会保留原始内容、布局和组件尺寸，只进行必要的主题样式处理。</p>
      <pre><code>surface: thread\nlayout: native\nstyle: wukong</code></pre>
    </div>`;
  document.querySelector('.route-host').insertBefore(conversation, document.querySelector('.thread-summary-layer'));
  const readRect = selector => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return [rect.x, rect.y, rect.width, rect.height];
  };
  return {
    text: conversation.innerText,
    geometry: {
      userBubble: readRect('[data-user-message-bubble]'),
      assistantAnswer: readRect('[data-local-conversation-final-assistant]'),
      codeBlock: readRect('pre')
    }
  };
});

export const conversationText = page => page.evaluate(() =>
  document.querySelector('[data-thread-find-target="conversation"]')?.innerText || ''
);

export const conversationGeometry = page => page.evaluate(() => Object.fromEntries(
  [
    ['userBubble', '[data-user-message-bubble]'],
    ['assistantAnswer', '[data-local-conversation-final-assistant]'],
    ['codeBlock', 'pre']
  ].map(([key, selector]) => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return [key, [rect.x, rect.y, rect.width, rect.height]];
  })
));
