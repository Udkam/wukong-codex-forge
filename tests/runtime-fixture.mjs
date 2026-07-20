export const runtimeFixtureHtml = String.raw`
  <style>
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #1f1f1f; color: #d4d4d4; font: 14px/1.45 "Segoe UI", "Microsoft YaHei UI", sans-serif; }
    button, textarea { font: inherit; color: inherit; }
    button { border: 1px solid transparent; background: transparent; }
    header { height: 36px; display: flex; align-items: center; gap: 24px; padding: 0 14px; border-bottom: 1px solid #303030; background: #191c1e; color: #aaa; }
    header .back { color: #6f7476; }
    header .window-title { margin-left: auto; color: #777; font-size: 12px; }
    .shell { height: calc(100% - 36px); display: grid; grid-template-columns: 218px minmax(0, 1fr) 248px; }
    nav { min-width: 0; padding: 9px 7px 12px; overflow: hidden; border-right: 1px solid #2c3030; background: #1a1f1f; }
    .codex-name { display: flex; align-items: center; justify-content: space-between; padding: 5px 7px 12px; font-weight: 700; }
    nav button { width: 100%; min-height: 34px; padding: 6px 9px; border-radius: 7px; text-align: left; }
    nav button span { display: inline-block; width: 23px; color: #a4aaa6; }
    nav .section { margin: 18px 8px 6px; color: #696d6b; font-size: 12px; font-weight: 600; }
    [role="tree"] { height: 610px; overflow: hidden; }
    [role="treeitem"] { min-height: 31px; padding: 6px 10px 6px 29px; border: 1px solid transparent; border-radius: 7px; color: #b7bab8; white-space: nowrap; }
    [role="treeitem"][aria-selected="true"] { background: #303332; color: #e0e0df; }
    main { position: relative; min-width: 0; overflow: hidden; background: #1f1f1f; }
    .task-top { height: 48px; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #2b2b2b; color: #bfc1bf; }
    .task-top .actions { margin-left: auto; display: flex; gap: 7px; }
    .task-top button { min-height: 30px; padding: 4px 9px; border-color: #353535; border-radius: 7px; }
    .landing-native { width: min(660px, calc(100% - 100px)); margin: 142px auto 0; text-align: center; }
    .landing-native small { color: #b6a071; letter-spacing: .12em; }
    .landing-native h1 { margin: 12px 0 8px; font-size: 31px; font-weight: 600; }
    .landing-native p { color: #aaa; }
    [data-thread-find-target="conversation"] { width: min(760px, calc(100% - 76px)); margin: 62px auto 150px; }
    [data-virtualized-turn-content] { margin-bottom: 19px; padding: 15px 18px; border: 1px solid #333; border-radius: 13px; background: #262626; }
    [data-user-message-bubble] { margin-left: auto; width: fit-content; max-width: 72%; padding: 10px 13px; border-radius: 15px; background: #2d2d2d; }
    [data-local-conversation-final-assistant] { padding: 12px 16px; }
    pre { margin: 10px 0 2px; padding: 12px; border: 1px solid #383838; border-radius: 7px; background: #171717; }
    form { position: absolute; right: 34px; bottom: 20px; left: 34px; min-height: 96px; padding: 11px 13px 8px; border: 1px solid #414141; border-radius: 17px; background: #2c2c2c; box-shadow: 0 12px 34px rgba(0,0,0,.24); }
    textarea { width: 100%; height: 48px; resize: none; border: 0; outline: 0; background: transparent; }
    [role="toolbar"] { display: flex; align-items: center; gap: 8px; }
    [role="toolbar"] button { min-width: 28px; min-height: 28px; border-radius: 7px; }
    [role="toolbar"] .send { margin-left: auto; border-radius: 50%; background: #d8d8d8; color: #333; }
    aside { min-width: 0; padding: 46px 12px 12px; border-left: 1px solid #2c2c2c; background: #1f1f1f; }
    .env-card { padding: 14px; border: 1px solid #363636; border-radius: 18px; background: #2d2d2d; }
    .env-card h2 { margin: 0 0 13px; color: #aaa; font-size: 14px; }
    .env-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #3b3b3b; }
    .env-row:last-child { border: 0; }
    .muted { color: #7d7d7d; }
  </style>
  <header data-native-slot="topbar">
    <span>▣</span><span class="back">←　→</span><span>文件</span><span>编辑</span><span>视图</span><span>帮助</span>
    <span class="window-title">Codex</span>
  </header>
  <div class="shell">
    <nav aria-label="Codex navigation" data-native-slot="sidebar">
      <div class="codex-name"><b>Codex⌄</b><span>⌕</span></div>
      <button aria-label="New chat" data-native-slot="new-task"><span>□</span>新建任务</button>
      <button><span>◎</span>插件</button>
      <p class="section">置顶</p>
      <button><span>◌</span>每日通知与时事汇总</button>
      <p class="section">项目</p>
      <div role="tree" aria-label="项目">
        <div role="treeitem">▱　wukong-codex-forge</div>
        <div role="treeitem" aria-selected="true">重设计黑神话悟空主题</div>
        <div role="treeitem">▱　reproduction-temple-run</div>
        <div role="treeitem">接管 Temple 总控并归档修复</div>
        <div role="treeitem">▱　reproduction-tetris</div>
        <div role="treeitem">Tetris总控</div>
      </div>
    </nav>
    <main role="main" data-native-slot="workspace" data-vscode-context='{"chatgpt.supportsNewChatMenu": true}'>
      <div class="task-top"><span>▱　重设计黑神话悟空主题　···</span><div class="actions"><button>打开位置⌄</button><button>☷</button></div></div>
      <section class="landing-native">
        <small>新建任务</small>
        <h1>今天想处理什么？</h1>
        <p>描述目标，Codex 会在当前项目中开始工作。</p>
      </section>
      <form data-thread-find-composer="true" data-native-slot="composer">
        <textarea aria-label="Message composer" placeholder="随心输入"></textarea>
        <div role="toolbar"><button>＋</button><button>工具</button><button class="send" type="submit" aria-label="发送">↑</button></div>
      </form>
    </main>
    <aside role="complementary" aria-label="环境信息" data-native-slot="right-panel">
      <div class="env-card"><h2>环境信息　＋</h2><div class="env-row"><span>▣　变更</span><span class="muted">+0 -0</span></div><div class="env-row"><span>▱　本地</span><span>⌄</span></div><div class="env-row"><span>⌘　main</span><span>⌄</span></div><div class="env-row"><span>◉　比较分支</span><span>↗</span></div></div>
    </aside>
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
    <div data-virtualized-turn-content>
      <div data-local-conversation-user-anchor><div data-user-message-bubble>不要只换颜色，要替换背景、侧栏按钮和输入框样式。</div></div>
    </div>
    <div data-virtualized-turn-content data-local-conversation-final-assistant="true">
      <p>已切换为日照宣纸运行时样式，并保持原生三栏结构。</p>
      <pre><code>surface: thread\nlayout: native\nstyle: wukong</code></pre>
    </div>`;
  document.querySelector('main').insertBefore(conversation, document.querySelector('form'));
});
