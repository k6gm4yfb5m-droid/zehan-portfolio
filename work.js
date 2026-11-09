(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const isGoodAgency = document.body.dataset.project === 'good-agency';
  const isLisbonMaru = document.body.dataset.project === 'lisbon-maru';
  const isCoffee = document.body.dataset.project === 'kami-coffee';
  const isMemory = document.body.dataset.project === 'memory';
  const isEmber = document.body.dataset.project === 'ember';
  const isIstanbul = document.body.dataset.project === 'istanbul';
  const isIslander = document.body.dataset.project === 'islander';
  const savedKey = isCoffee ? 'zehan-saved-kami-coffee' : isMemory ? 'zehan-saved-memory' : isEmber ? 'zehan-saved-ember' : isIstanbul ? 'zehan-saved-istanbul' : isIslander ? 'zehan-saved-islander' : isLisbonMaru ? 'zehan-saved-lisbon-maru' : isGoodAgency ? 'zehan-saved-good-agency' : 'zehan-saved-virtual-water';
  const chapters = ['overview', 'process', 'outcomes'];
  const chapterNames = isCoffee
    ? { zh: ['概念与职责', '创作与视觉策略', '系列视觉'], en: ['Concept & role', 'Creation & visual strategy', 'Visual series'] }
    : { zh: ['目标与职责', '设计方法', '交付成果'], en: ['Brief & role', 'Design decisions', 'Deliverables'] };
  const translations = $$('[data-en]').map(element => ({ element, zh: element.innerHTML, en: element.dataset.en }));
  const dialog = $('#image-dialog');
  let language = 'zh', activeChapter = 0, toastTimer, saved = false;
  try { saved = localStorage.getItem(savedKey) === 'true'; } catch {}

  function notify(text) {
    $('#toast').textContent = text;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
  }
  function updateSaved() {
    $('#footer-save').setAttribute('aria-pressed', String(saved));
    $('#footer-save use').setAttribute('href', saved ? '#i-check' : '#i-plus');
    $('#footer-save').style.color = saved ? 'var(--green)' : '';
  }
  $('#footer-save').addEventListener('click', () => {
    saved = !saved;
    try { localStorage.setItem(savedKey, String(saved)); } catch {}
    updateSaved();
    notify(language === 'zh' ? (saved ? '已在此浏览器收藏项目' : '已取消收藏') : (saved ? 'Project saved in this browser' : 'Project removed from saved items'));
  });
  function selectChapter(index) {
    activeChapter = index;
    $$('[data-chapter]').forEach(link => {
      const active = link.dataset.chapter === chapters[index];
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    $('#reading-title').textContent = chapterNames[language][index];
    $('#section-number').textContent = String(index + 1).padStart(2, '0');
    $('#progress-fill').style.width = `${(index + 1) / chapters.length * 100}%`;
    $('#previous-section').disabled = index === 0;
    $('#next-section').setAttribute('aria-label', language === 'zh' ? (index === 2 ? '回到项目概览' : '下一章节') : (index === 2 ? 'Back to overview' : 'Next chapter'));
  }
  function navigate(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    if (chapters.includes(id)) selectChapter(chapters.indexOf(id));
  }
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    if (document.getElementById(id)) { event.preventDefault(); navigate(id); }
  }));
  $('#previous-section').addEventListener('click', () => navigate(chapters[Math.max(0, activeChapter - 1)]));
  $('#next-section').addEventListener('click', () => navigate(chapters[(activeChapter + 1) % chapters.length]));
  $('#last-section').addEventListener('click', () => navigate('outcomes'));
  const panel = $('#main');
  let scrollPending = false;
  function onScroll() {
    if (scrollPending) return;
    scrollPending = true;
    requestAnimationFrame(() => {
      const top = matchMedia('(max-width:767px)').matches ? 170 : panel.getBoundingClientRect().top + 170;
      let index = 0;
      chapters.forEach((id, i) => { if (document.getElementById(id).getBoundingClientRect().top <= top) index = i; });
      selectChapter(index); scrollPending = false;
    });
  }
  panel.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  $$('.gallery-image-button').forEach(button => button.addEventListener('click', () => {
    $('#lightbox-image').src = button.dataset.image;
    $('#lightbox-image').alt = button.querySelector('img').alt;
    $('#lightbox-caption').textContent = button.closest('figure').querySelector('figcaption').textContent;
    dialog.showModal();
  }));
  $('#close-image').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });

  const entries = [
    { zh: 'kami coffee · 纯 AIGC 品牌概念', en: 'kami coffee · Fully AI-generated brand concept', keywords: '咖啡 标识 品牌 门店 包装 社媒 海报 周边 独立 aigc ai kami coffee brand identity store poster packaging independent', href: './kami-coffee.html' },
    { zh: '实习经历 · 卡司通 / BA Project 画廊', en: 'Internships · KASTONE / BA Project Art Gallery', keywords: '实习 工作 经历 卡司通 比亚迪 成都 车展 宣传 画廊 展览 布展 销售 experience internship kastone byd chengdu motor show ba project gallery exhibition design sales', href: './index.html#experience' },
    { zh: 'Memory Mapping · 香港一日体感记录', en: 'Memory Mapping · A day in Hong Kong', keywords: '记忆 香港 时间 地图 体感 色彩 编码 海报 memory hong kong journey timeline map colour visualisation', href: './memory.html' },
    { zh: 'EMBERS · Ember 能源研究合作', en: 'EMBERS · Ember energy research collaboration', keywords: '能源 研究 合作 煤矿 甲烷 出版物 图表 地图 ember embers methane coal energy research publication charts map', href: './ember.html' },
    { zh: 'Design for Istanbul · 城市文化视觉设计', en: 'Design for Istanbul · Cultural visual design', keywords: '伊斯坦布尔 文化 符号 品牌 视觉 图案 海报 文创 帆布袋 钥匙扣 istanbul cultural symbols identity pattern poster tote keyring', href: './istanbul.html' },
    { zh: 'Islander · Beyond Words Studio 商业合作', en: 'Islander · Beyond Words Studio collaboration', keywords: '合作 商业 岛屿 生物 多样性 beyond words studio islander biodiversity red list iucn social instagram', href: './islander.html' },
    { zh: '里斯本丸纪念设计 · Sea has an end', en: 'Lisbon Maru · Sea has an end. Memory does not.', keywords: '里斯本丸 历史 纪念 和平 网页 海报 卡片 lisbon maru memorial memory peace history web print cards', href: './lisbon-maru.html' },
    { zh: 'ONE KIDNEY CAN · GOOD Agency', en: 'ONE KIDNEY CAN · GOOD Agency', keywords: '肾脏 捐赠 公益 角色 插画 海报 kidney donation campaign good agency illustration poster', href: './good-agency.html' },
    { zh: 'Exploration of rice trade · Chatham House', en: 'Exploration of rice trade · Chatham House', keywords: '虚拟水 大米 贸易 chatham house rice water', href: './work.html' },
    { zh: '技能与工具 · 设计、数据与 AI', en: 'Creative toolkit · Design, data & AI', keywords: '技能 工具 平面 品牌 文化 符号 数据 分析 网页 音乐 skills illustrator photoshop aigc vibe coding codex workbuddy ai music', href: './index.html#skills' },
    { zh: '项目概览 · 虚拟水与粮食贸易', en: 'Overview · Virtual water & food trade', keywords: '项目 概览 水 虚拟水 中国 巴基斯坦 大米 贸易 overview rice china pakistan virtual water trade chatham', id: 'overview' },
    { zh: '设计方法 · 从数据到图形', en: 'Approach · From data to design', keywords: '研究 设计 方法 过程 图表 图例 比例 research data process approach infographics', id: 'process' },
    { zh: '成果展示 · 设计册与跨页', en: 'Outcomes · Booklet & spreads', keywords: '成果 照片 图 设计册 跨页 展示 outcomes gallery booklet spreads photos', id: 'outcomes' },
    { zh: '李泽翰 · 个人档案', en: 'Li Zehan · Personal profile', keywords: '李泽翰 个人 教育 语言 联系 profile education languages contact zehan', href: './index.html' }
  ];
  if (isGoodAgency) {
    const chapterEntries = entries.filter(entry => entry.id);
    const labels = [
      ['项目概览 · GOOD Agency 合作', 'Overview · GOOD Agency collaboration', '概览 合作 肾脏 捐赠 overview collaboration kidney donation'],
      ['设计方法 · 从概念到角色', 'Approach · From concept to character', '方法 概念 角色 插画 设计 approach concept character illustration'],
      ['成果展示 · 海报与场景应用', 'Outcomes · Artwork & applications', '成果 海报 广告牌 贴纸 公交站 社交媒体 outcomes poster billboard sticker bus stop social']
    ];
    chapterEntries.forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  if (isLisbonMaru) {
    const labels = [
      ['项目概览 · 里斯本丸纪念设计', 'Overview · Lisbon Maru memorial design', '项目 概览 历史 里斯本丸 纪念 overview lisbon maru memorial history'],
      ['设计方法 · 数据、交互与印刷', 'Approach · Data, interaction & print', '方法 数据 图表 交互 印刷 approach data visualisation interaction print'],
      ['成果展示 · 网站、海报与卡片', 'Outcomes · Website, posters & cards', '成果 网站 海报 卡片 印刷 outcomes website posters cards print']
    ];
    entries.filter(entry => entry.id).forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  if (isIslander) {
    const labels = [
      ['项目概览 · Beyond Words Studio 合作', 'Overview · Beyond Words Studio collaboration', '概览 合作 商业 工作室 职责 团队 overview beyond words studio collaboration role team'],
      ['设计方法 · 研究、策划与社交设计', 'Approach · Research, concept & social design', '方法 草图 研究 策划 社交 设计 汇报 approach sketches research concept social design presentation'],
      ['成果展示 · Islander 系列', 'Outcomes · Islander series', '成果 图 海报 地图 岛屿 物种 biodiversity islander series gallery instagram social map species']
    ];
    entries.filter(entry => entry.id).forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  if (isIstanbul) {
    const labels = [
      ['目标与职责 · 城市文化视觉探索', 'Brief & role · Cultural visual identity', '目标 职责 自主 文化 旅行 城市 视觉 brief role culture travel city identity'],
      ['设计方法 · 符号、系统与应用', 'Design decisions · Symbols, system & applications', '方法 符号 配色 系列 图案 品牌 method symbols palette series pattern identity'],
      ['交付成果 · 海报与文创应用', 'Deliverables · Posters & merchandise concepts', '成果 海报 图案 帆布袋 钥匙扣 文创 outcomes poster pattern tote keyring merchandise']
    ];
    entries.filter(entry => entry.id).forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  if (isEmber) {
    const labels = [
      ['目标与职责 · Ember 行业合作', 'Brief & role · Ember collaboration', '目标 职责 合作 研究 章节 ember research role chapter'],
      ['设计方法 · 图表与跨页信息', 'Design decisions · Charts & editorial hierarchy', '方法 图表 比例 分类 地图 跨页 charts proportions categories map editorial'],
      ['交付成果 · EMBERS 出版物实拍', 'Deliverables · EMBERS publication', '成果 实拍 出版物 embers publication photographs']
    ];
    entries.filter(entry => entry.id).forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  if (isMemory) {
    const labels = [
      ['目标与职责 · 个人记忆可视化', 'Brief & role · Personal memory visualisation', '目标 职责 个人 记忆 体验 memory experience role'],
      ['设计方法 · 色彩编码与双视角叙事', 'Design decisions · Colour encoding & dual perspectives', '方法 色彩 编码 时间 地理 叙事 colour encoding time geography narrative'],
      ['交付成果 · 两幅信息海报', 'Deliverables · Two information posters', '成果 海报 作品 图例 poster outcomes legend']
    ];
    entries.filter(entry => entry.id).forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  if (isCoffee) {
    const labels = [
      ['概念与职责 · 独立 AIGC 品牌创作', 'Concept & role · Independent AIGC brand creation', '概念 职责 独立 品牌 咖啡 aigc brand concept role coffee'],
      ['创作与视觉策略 · 一致性与多触点', 'Creation & strategy · Consistency across touchpoints', '方法 生成 筛选 系列 标识 一致性 process generation selection series identity consistency'],
      ['系列视觉 · kami coffee 九张作品', 'Visual series · Nine kami coffee artworks', '成果 视觉 图片 海报 咖啡杯 帆布袋 门店 gallery images cup tote storefront posters outcomes']
    ];
    entries.filter(entry => entry.id).forEach((entry, i) => { [entry.zh, entry.en, entry.keywords] = labels[i]; });
  }
  function search() {
    const query = $('#search').value.trim().toLowerCase();
    const results = $('#search-results'); results.replaceChildren();
    if (!query) { results.hidden = true; return; }
    const matches = entries.filter(e => `${e.zh} ${e.en} ${e.keywords}`.toLowerCase().includes(query));
    for (const entry of matches) {
      const link = document.createElement('a'); link.className = 'search-result'; link.href = entry.href || `#${entry.id}`; link.textContent = entry[language];
      if (entry.id) link.addEventListener('click', event => { event.preventDefault(); navigate(entry.id); results.hidden = true; $('#search').value = ''; $('#search').blur(); });
      results.appendChild(link);
    }
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'search-empty'; empty.textContent = language === 'zh' ? '没有找到，试试「成果」或「研究」' : 'No results. Try “outcomes” or “research”.'; results.appendChild(empty);
    }
    results.hidden = false;
  }
  $('#search').addEventListener('input', search);
  $('#search').addEventListener('focus', search);
  $('#search').addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('#search-results').hidden = true; $('#search').blur(); }
    if (event.key === 'Enter') $('.search-result')?.click();
    if (event.key === 'ArrowDown' && $('.search-result')) { event.preventDefault(); $('.search-result').focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) $('#search-results').hidden = true; });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && !dialog.open) { event.preventDefault(); $('#search').focus(); }
    if (event.key === 'Escape') $('#search-results').hidden = true;
  });
  $('#language-toggle').addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    translations.forEach(({ element, zh, en }) => { if (language === 'zh') element.innerHTML = zh; else element.textContent = en.replace(/\\n/g, ' '); });
    $('#language-toggle').innerHTML = `${language === 'zh' ? 'EN' : '中文'} <svg><use href="#i-globe"/></svg>`;
    $('#language-toggle').setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换中文');
    $('#search').placeholder = language === 'zh' ? '想了解项目的哪一面？' : 'Explore this project';
    $('#search').setAttribute('aria-label', language === 'zh' ? '搜索项目' : 'Search project');
    $('#close-image').setAttribute('aria-label', language === 'zh' ? '关闭图片' : 'Close image');
    $('#footer-save').setAttribute('aria-label', language === 'zh' ? '收藏项目' : 'Save project');
    $('#last-section').setAttribute('aria-label', language === 'zh' ? '跳至成果展示' : 'Go to outcomes');
    $('#previous-section').setAttribute('aria-label', language === 'zh' ? '上一章节' : 'Previous chapter');
    document.title = isCoffee
      ? (language === 'zh' ? 'kami coffee · 纯 AIGC 品牌概念 — 李泽翰' : 'kami coffee · AIGC Brand Concept — Li Zehan')
      : isMemory
      ? (language === 'zh' ? 'Memory Mapping · 香港一日体感记录 — 李泽翰' : 'Memory Mapping · A Day in Hong Kong — Li Zehan')
      : isEmber
      ? (language === 'zh' ? 'EMBERS · Ember 合作信息设计 — 李泽翰' : 'EMBERS · Ember Information Design — Li Zehan')
      : isIstanbul
      ? (language === 'zh' ? 'Design for Istanbul · 城市文化视觉设计 — 李泽翰' : 'Design for Istanbul · Cultural Visual Design — Li Zehan')
      : isIslander
      ? (language === 'zh' ? 'Islander · Beyond Words Studio — 李泽翰' : 'Islander · Beyond Words Studio — Li Zehan')
      : isLisbonMaru
      ? (language === 'zh' ? '里斯本丸纪念设计 · Sea has an end — 李泽翰' : 'Lisbon Maru · Sea has an end — Li Zehan')
      : isGoodAgency
      ? (language === 'zh' ? 'ONE KIDNEY CAN · GOOD Agency — 李泽翰' : 'ONE KIDNEY CAN · GOOD Agency — Li Zehan')
      : (language === 'zh' ? '作品 · Exploration of rice trade — 李泽翰' : 'Exploration of rice trade — Li Zehan');
    selectChapter(activeChapter); search();
  });
  $('#search').placeholder = '想了解项目的哪一面？';
  $('#search').setAttribute('aria-label', '搜索项目');
  $('#year').textContent = String(new Date().getFullYear());
  updateSaved(); selectChapter(0);
  if (location.hash && document.getElementById(location.hash.slice(1))) setTimeout(() => navigate(location.hash.slice(1)), 50);
})();
