(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const sections = ['profile', 'experience', 'skills', 'education', 'languages'];
  const names = { zh: ['个人介绍', '实习经历', '设计能力与工具', '教育经历', '语言能力'], en: ['Profile', 'Internships', 'Capabilities & tools', 'Education', 'Languages'] };
  let language = 'zh';
  let currentSection = 0;
  let toastTimer;
  let saved = false;
  try { saved = localStorage.getItem('zehan-saved-profile') === 'true'; } catch {}
  const translations = $$('[data-en]').map(element => ({ element, zh: element.innerHTML, en: element.dataset.en }));

  const portrait = $('#portrait-motion');
  const portraitReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let portraitInView = false;
  let portraitPaused = false;
  function updatePortraitMotion() {
    const reduced = portraitReducedMotion.matches;
    document.body.classList.toggle('portrait-is-playing', portraitInView && !document.hidden && !portraitPaused && !reduced);
    document.body.classList.toggle('portrait-is-paused', portraitPaused);
    portrait.disabled = reduced;
    const label = reduced
      ? (language === 'zh' ? '个人照片' : 'Portrait')
      : language === 'zh'
        ? (portraitPaused ? '继续头像旋转' : '暂停头像旋转')
        : (portraitPaused ? 'Resume portrait rotation' : 'Pause portrait rotation');
    portrait.setAttribute('aria-label', label);
    portrait.title = label;
    portrait.setAttribute('aria-pressed', String(portraitPaused));
  }
  const portraitObserver = new IntersectionObserver(([entry]) => {
    portraitInView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
    updatePortraitMotion();
  }, { threshold: 0.25 });
  portraitObserver.observe(portrait);
  portrait.addEventListener('click', () => {
    portraitPaused = !portraitPaused;
    updatePortraitMotion();
  });
  document.addEventListener('visibilitychange', updatePortraitMotion);
  portraitReducedMotion.addEventListener('change', updatePortraitMotion);
  updatePortraitMotion();

  function toast(message) {
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
  }
  function updateSave() {
    for (const id of ['#save-profile', '#footer-save']) {
      $(id).setAttribute('aria-pressed', String(saved));
      $(`${id} use`).setAttribute('href', saved ? '#i-check' : '#i-plus');
    }
    $('#save-profile span').textContent = language === 'zh' ? (saved ? '已收藏' : '收藏作品集') : (saved ? 'Saved' : 'Save portfolio');
    $('#footer-save').style.color = saved ? 'var(--green)' : '';
  }
  function toggleSave() {
    saved = !saved;
    try { localStorage.setItem('zehan-saved-profile', String(saved)); } catch {}
    updateSave();
    toast(language === 'zh' ? (saved ? '已在此浏览器收藏作品集' : '已取消收藏') : (saved ? 'Portfolio saved in this browser' : 'Portfolio removed from saved items'));
  }
  $('#save-profile').addEventListener('click', toggleSave);
  $('#footer-save').addEventListener('click', toggleSave);
  updateSave();

  function updateSection(index) {
    currentSection = index;
    $$('[data-section]').forEach(link => {
      const active = link.dataset.section === sections[index];
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    const activeItem = $('.collection-nav .collection-item.active');
    const indicator = $('.collection-nav .equalizer');
    if (activeItem && indicator && indicator.parentElement !== activeItem) activeItem.appendChild(indicator);
    $('#reading-title').textContent = names[language][index];
    $('#section-number').textContent = String(index + 1).padStart(2, '0');
    $('#progress-fill').style.width = `${(index + 1) / sections.length * 100}%`;
    $('#previous-section').disabled = index === 0;
    $('#next-section').setAttribute('aria-label', language === 'zh' ? (index === sections.length - 1 ? '回到个人档案' : '浏览下一节') : (index === sections.length - 1 ? 'Back to profile' : 'Next section'));
  }
  function goToSection(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    const index = sections.indexOf(id);
    if (index >= 0) updateSection(index);
    history.replaceState(null, '', `#${id}`);
  }
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    if (document.getElementById(id)) { event.preventDefault(); goToSection(id); }
  }));
  $$('.filter-pill').forEach(button => button.addEventListener('click', () => {
    $$('.filter-pill').forEach(filter => {
      const selected = filter === button;
      filter.classList.toggle('active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    $$('.album-grid .featured-work-card').forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
    });
  }));
  $('#explore').addEventListener('click', () => { location.href = './work.html'; });
  $('#previous-section').addEventListener('click', () => goToSection(sections[Math.max(0, currentSection - 1)]));
  $('#next-section').addEventListener('click', () => goToSection(sections[(currentSection + 1) % sections.length]));
  $('#last-section').addEventListener('click', () => goToSection('languages'));
  const panel = $('#main');
  function trackReading() {
    const threshold = matchMedia('(max-width:767px)').matches ? 150 : panel.getBoundingClientRect().top + 150;
    let active = 0;
    sections.forEach((id, index) => { if (document.getElementById(id).getBoundingClientRect().top <= threshold) active = index; });
    updateSection(active);
  }
  let scrollScheduled = false;
  function onScroll() {
    if (!scrollScheduled) requestAnimationFrame(() => { trackReading(); scrollScheduled = false; });
    scrollScheduled = true;
  }
  panel.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateSection(0);

  async function copyText(text, success) {
    try {
      await navigator.clipboard.writeText(text);
      toast(success);
    } catch {
      const input = document.createElement('textarea');
      input.value = text; input.style.position = 'fixed'; input.style.opacity = '0';
      document.body.appendChild(input); input.select();
      const copied = document.execCommand('copy'); input.remove();
      toast(copied ? success : (language === 'zh' ? `请复制：${text}` : `Copy: ${text}`));
    }
  }
  $('#share-profile').addEventListener('click', () => copyText(location.href.split('#')[0], language === 'zh' ? '作品集链接已复制' : 'Portfolio link copied'));
  $$('.copy-button').forEach(button => button.addEventListener('click', () => copyText(button.dataset.copy, language === 'zh' ? '联系方式已复制' : 'Contact copied')));

  $('#language-toggle').addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    translations.forEach(({ element, zh, en }) => {
      if (language === 'zh') element.innerHTML = zh;
      else if (element.id === 'profile-name') element.innerHTML = 'Li Zehan<span class="name-period">.</span>';
      else element.textContent = en.replace(/\\n/g, ' ');
    });
    $('#language-toggle').innerHTML = `${language === 'zh' ? 'EN' : '中文'} <svg><use href="#i-globe"/></svg>`;
    $('#language-toggle').setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换中文');
    $('#search').placeholder = language === 'zh' ? '搜索作品、能力或联系方式' : 'Search work, skills or contact';
    $('#search').setAttribute('aria-label', language === 'zh' ? '搜索个人档案' : 'Search profile');
    $('#explore').setAttribute('aria-label', language === 'zh' ? '浏览作品' : 'Explore work');
    $('#share-profile').setAttribute('aria-label', language === 'zh' ? '分享档案' : 'Share profile');
    $('#download-mobile').setAttribute('aria-label', language === 'zh' ? '下载作品集 PDF' : 'Download portfolio PDF');
    $('#footer-save').setAttribute('aria-label', language === 'zh' ? '收藏个人档案' : 'Save portfolio');
    $('#previous-section').setAttribute('aria-label', language === 'zh' ? '上一节' : 'Previous section');
    $('#last-section').setAttribute('aria-label', language === 'zh' ? '跳至语言能力' : 'Go to languages');
    $$('.copy-button').forEach(button => button.setAttribute('aria-label', `${language === 'zh' ? '复制' : 'Copy'} ${button.dataset.copy}`));
    document.title = language === 'zh' ? '李泽翰｜视觉设计与数据可视化作品集' : 'Li Zehan | Visual & Data Design Portfolio';
    updateSave(); updateSection(currentSection); updatePortraitMotion(); renderSearch();
  });

  const searchEntries = [
    { id: 'kami-coffee', zh: 'kami coffee · 纯 AIGC 品牌概念', en: 'kami coffee · Fully AI-generated brand concept', keywords: '作品 项目 咖啡 标识 品牌 门店 包装 社媒 海报 周边 独立 aigc ai kami coffee brand identity store poster packaging independent' },
    { id: 'strengths', zh: '个人优势 · 文化、研究与跨文化协作', en: 'Personal strengths · Culture, research & cross-cultural collaboration', keywords: '优势 特点 长处 特长 个人能力 文化 符号 研究 信息 传播 协作 受众 英国 跨国 跨文化 学生代表 strengths value culture research audience teamwork international cross-cultural representative' },
    { id: 'experience', zh: '实习经历 · 卡司通 / BA Project 画廊', en: 'Internships · KASTONE / BA Project Art Gallery', keywords: '实习 工作 经历 卡司通 比亚迪 成都 车展 宣传 画廊 展览 布展 销售 experience internship kastone byd chengdu motor show ba project gallery exhibition design sales' },
    { id: 'memory', zh: 'Memory Mapping · 香港一日体感记录', en: 'Memory Mapping · A day in Hong Kong', keywords: '作品 项目 个人 记忆 香港 时间 地图 体感 色彩 编码 海报 memory hong kong journey timeline map colour visualisation' },
    { id: 'ember', zh: 'EMBERS · Ember 能源研究合作', en: 'EMBERS · Ember energy research collaboration', keywords: '作品 项目 合作 能源 研究 煤矿 甲烷 出版物 ember embers energy coal methane publication' },
    { id: 'istanbul', zh: 'Design for Istanbul · 城市文化视觉设计', en: 'Design for Istanbul · Cultural visual design', keywords: '作品 项目 伊斯坦布尔 文化 符号 品牌 视觉 海报 图案 文创 帆布袋 钥匙扣 istanbul culture symbols identity poster pattern tote keyring' },
    { id: 'islander', zh: 'Islander · Beyond Words Studio 商业合作', en: 'Islander · Beyond Words Studio collaboration', keywords: '作品 项目 商业 合作 岛屿 生物 多样性 社交 研究 策划 物种 beyond words studio islander biodiversity red list iucn social instagram' },
    { id: 'lisbon-maru', zh: '里斯本丸纪念设计 · Sea has an end', en: 'Lisbon Maru · Sea has an end. Memory does not.', keywords: '作品 项目 里斯本丸 历史 纪念 和平 海报 卡片 数据 网页 lisbon maru memory peace memorial history poster cards interactive website' },
    { id: 'good-agency', zh: 'ONE KIDNEY CAN · GOOD Agency 公益传播', en: 'ONE KIDNEY CAN · GOOD Agency campaign', keywords: '作品 项目 公益 肾脏 捐赠 插画 海报 品牌 慈善 角色 kidney donation campaign illustration good agency poster social' },
    { id: 'work', zh: '虚拟水贸易 · 我的作品', en: 'Exploration of rice trade · Selected works', keywords: '作品 项目 水 虚拟水 大米 巴基斯坦 中国 贸易 出版物 work project virtual water rice trade pakistan china chatham' },
    { id: 'profile', zh: '李泽翰 · 视觉设计与信息设计', en: 'Li Zehan · Visual & information design', keywords: '李泽翰 泽翰 个人 档案 关于 男 中国 2003 7 22 birthday nationality profile zehan' },
    { id: 'education', zh: '平面媒体设计 · 本科', en: 'BA(Hons) Graphic and Media Design', keywords: '教育 本科 平面 媒体 伦敦 艺术 大学 ual bachelor ba hons graphic and media design 2022 2025' },
    { id: 'education', zh: '数据可视化设计 · 硕士', en: 'Design for Data Visualisation · MA', keywords: '教育 硕士 数据 可视化 伦敦 艺术 大学 ual master design for data visualisation visualization 2025 2026' },
    { id: 'skills', zh: '设计能力 · 视觉、信息与 AI', en: 'Creative toolkit · Design, data & AI', keywords: '技能 平面 品牌 文化 符号 数据 可视化 分析 网页 设计 音乐 ai aigc illustrator photoshop vibe coding codex workbuddy graphic brand cultural symbol visualisation visualization analyst web music skills tools' },
    { id: 'languages', zh: '普通话 · 英语 · 粤语', en: 'Mandarin · English · Cantonese', keywords: '语言 普通话 英语 粤语 language mandarin chinese english cantonese' },
    { id: 'contact', zh: '电话与邮箱 · 联系方式', en: 'Phone & email · Contact', keywords: '联系 电话 邮箱 contact phone email 13590303906 7536345069 qq gmail' }
  ];
  function renderSearch() {
    const query = $('#search').value.trim().toLowerCase();
    const results = $('#search-results');
    results.replaceChildren();
    if (!query) { results.hidden = true; return; }
    const matches = searchEntries.filter(entry => `${entry.zh} ${entry.en} ${entry.keywords}`.toLowerCase().includes(query));
    if (!matches.length) {
      const empty = document.createElement('div'); empty.className = 'search-empty';
      empty.textContent = language === 'zh' ? '没有找到，试试「教育」或「联系方式」' : 'No results. Try “education” or “contact”.';
      results.appendChild(empty);
    }
    matches.forEach(entry => {
      const link = document.createElement('a'); link.className = 'search-result'; link.href = entry.id === 'work' ? './work.html' : entry.id === 'good-agency' ? './good-agency.html' : entry.id === 'lisbon-maru' ? './lisbon-maru.html' : entry.id === 'islander' ? './islander.html' : entry.id === 'istanbul' ? './istanbul.html' : entry.id === 'ember' ? './ember.html' : entry.id === 'memory' ? './memory.html' : entry.id === 'kami-coffee' ? './kami-coffee.html' : `#${entry.id}`; link.textContent = entry[language];
      link.addEventListener('click', event => { if (['work', 'good-agency', 'lisbon-maru', 'islander', 'istanbul', 'ember', 'memory', 'kami-coffee'].includes(entry.id)) return; event.preventDefault(); goToSection(entry.id); results.hidden = true; $('#search').value = ''; $('#search').blur(); });
      results.appendChild(link);
    });
    results.hidden = false;
  }
  $('#search').addEventListener('input', renderSearch);
  $('#search').addEventListener('focus', renderSearch);
  $('#search').addEventListener('keydown', event => {
    if (event.key === 'Escape') { $('#search-results').hidden = true; $('#search').blur(); }
    if (event.key === 'Enter') { const result = $('.search-result'); if (result) result.click(); }
    if (event.key === 'ArrowDown') { const result = $('.search-result'); if (result) { event.preventDefault(); result.focus(); } }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.search-wrap')) $('#search-results').hidden = true; });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) ) { event.preventDefault(); $('#search').focus(); }
    if (event.key === 'Escape') $('#search-results').hidden = true;
  });

  $('#year').textContent = String(new Date().getFullYear());
  function openLinkedSection() {
    if (location.hash && document.getElementById(location.hash.slice(1))) goToSection(location.hash.slice(1));
  }
  if (document.readyState === 'complete') openLinkedSection();
  else window.addEventListener('load', openLinkedSection, { once: true });
})();
