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
    $('#download-mobile').setAttribute('aria-label', language === 'zh' ? '保存个人简介' : 'Download bio');
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

  function downloadBio() {
    const bio = ["李泽翰 / LI ZEHAN", "视觉设计与数据可视化作品集 / VISUAL & DATA DESIGN PORTFOLIO", "", "求职方向 / DESIGN OPPORTUNITIES", "主方向：视觉设计、品牌与运营视觉 / Visual design, brand & campaign visuals", "同时关注：数据可视化、信息设计 / Data visualisation & information design", "", "个人定位 / PROFILE", "UAL 平面媒体设计本科毕业，现就读数据可视化设计硕士，全学程担任专业学生代表，连接学生与课程团队。在英参与校企合作设计命题，积累跨文化项目沟通与协作经验。将文化研究与信息思维结合，实践覆盖文化视觉、社媒传播、信息出版及商业展会宣传物设计支持。", "A UAL BA(Hons) Graphic and Media Design graduate, now studying MA Design for Data Visualisation and representing students throughout the MA programme, connecting students with the course team. UK industry briefs have developed my cross-cultural project communication and collaboration. I combine cultural research with information design across cultural visuals, social content, publications and promotional design support for brand exhibitions.", "", "设计方法与项目经验 / APPROACH & EXPERIENCE", "以研究形成概念，以图形系统建立识别，再将同一套视觉语言延展至传播与文创载体。", "Research-led concepts, consistent graphic systems and applications across communication and merchandise.", "参与 UAL 与 Chatham House（英国皇家国际事务研究所）、Soapbox、GOOD Agency、Beyond Words Studio 及 Ember 的行业合作命题，积累研究梳理、信息设计、传播视觉、社交媒体设计与项目汇报经验。", "Experience through UAL industry briefs with Chatham House (the Royal Institute of International Affairs), Soapbox, GOOD Agency, Beyond Words Studio and Ember, covering research synthesis, information design, campaign visuals, social-media design and presentation.", "", "个人优势 / PERSONAL STRENGTHS", "文化洞察，转化为成套视觉：从旅行观察、建筑与纹样中提炼文化线索，建立可重复使用的符号、配色与构图规则，并延展至海报、图案与文创应用提案。", "Cultural insight, translated into a visual system: I turn observations of architecture, patterns and place into repeatable symbols, colour and composition rules, then develop them across posters, patterns and merchandise concepts.", "研究梳理，让复杂内容易读：结合平面媒体与数据可视化训练，梳理资料、建立信息层级，并通过图表、地图与版式组织阅读顺序，让研究内容形成清晰的视觉叙事。", "Research that makes complex content readable: Combining graphic-media and data-visualisation training, I structure research, establish information hierarchies and use charts, maps and layout to build a clear visual narrative.", "跨文化沟通与多方协作：在 UAL 与 GOOD Agency、Chatham House（英国皇家国际事务研究所）× Soapbox、Ember 及 Beyond Words Studio 的校企合作设计命题中，积累英语项目沟通与汇报经验。硕士全学程担任专业学生代表，收集整理同学意见、参与课程会议，作为学生与课程负责人及导师之间的沟通桥梁，清晰传达学习需求与建议。", "Cross-cultural communication & stakeholder collaboration: UAL industry briefs with GOOD Agency, Chatham House (the Royal Institute of International Affairs) × Soapbox, Ember and Beyond Words Studio have developed my English-language project communication and presentation experience. As a student representative throughout my MA programme, I gather and organise student feedback, attend course meetings and act as a communication bridge between students, the Course Leader and tutors, clearly conveying learning needs and suggestions.", "围绕受众，组织系列传播内容：在 Islander 中负责数据研究、概念策划、社媒设计与汇报；在 GOOD Agency 合作命题中探索角色插画与传播应用，积累从内容概念到系列视觉表达的实践。", "Audience-focused content across a visual series: For Islander, I handled data research, concept development, social-media design and presentation. A GOOD Agency brief added character illustration and campaign applications to my practice in developing concepts into a visual series.", "理解场景，也参与协作与沟通：在卡司通协助团队参与比亚迪成都车展宣传物设计，在 BA Project 画廊参与宣传设计、布展、作品介绍与运营支持，积累商业项目协作及直接面向观众的沟通经验。", "Design informed by delivery and audience contact: At KASTONE, I assisted the team with BYD Chengdu Motor Show promotional design. At BA Project Art Gallery, I supported promotional design, exhibition setup, artwork introductions and operations, gaining experience in teamwork and audience communication.", "", "实习经历 / INTERNSHIP EXPERIENCE", "深圳市卡司通智慧科技开发有限公司 / KASTONE", "平面设计助理（实习） / Graphic Design Assistant (Intern)", "2025.08.04 — 2025.09.04", "协助公司项目团队参与比亚迪成都车展相关宣传物设计，积累汽车品牌展会传播场景下的平面设计与团队协作经验。", "Assisted KASTONE’s project team with promotional graphic design for BYD at the Chengdu Motor Show, gaining experience in automotive exhibition communication and company-team collaboration.", "", "BA Project 画廊 / BA Project Art Gallery", "设计助理及销售人员（实习） / Design Assistant & Salesperson (Intern)", "2023.08.19 — 2023.09.21", "协助展览宣传物设计与排版；参与布展、活动策划与执行；为访客介绍作品并提供销售服务；协助画廊日常运营。", "Supported exhibition promotional design and layout, exhibition setup and event delivery, artwork introductions and sales services, and daily gallery operations.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/#experience", "", "代表项目 / SELECTED WORK", "Exploration of rice trade — UAL × Chatham House × Soapbox 行业命题：研究梳理、数据可视化与信息编排。", "Research synthesis, data visualisation and editorial design for a UAL × Chatham House × Soapbox industry brief.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/work", "ONE KIDNEY CAN — GOOD Agency 本科合作命题：传播概念、角色插画、系列视觉及场景应用提案。", "Campaign concept, character illustration and cross-media application proposals for an undergraduate brief with GOOD Agency.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/good-agency", "Sea has an end. Memory does not. — 里斯本丸纪念主题：网页视觉与交互呈现、信息海报及卡片设计。", "Web visuals and interaction, information posters and cards for a Lisbon Maru memorial project.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/lisbon-maru", "Islander — UAL × Beyond Words Studio 团队项目；本人负责数据研究、概念策划、社媒设计与汇报。团队：Ying Sun、Zehan Li、Kailin Zhou。", "My role: data research, concept development, social-media design and presentation. Team: Ying Sun, Zehan Li and Kailin Zhou. UAL × Beyond Words Studio industry brief.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/islander", "Design for Istanbul — 自主城市文化视觉探索：概念策划、文化符号、图形系统、系列海报、图案及文创应用提案。", "Self-directed cultural visual identity exploration: concept, symbols, graphic system, posters, patterns and merchandise application proposals.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/istanbul", "", "EMBERS — The Methane Gap — UAL × Ember 行业合作项目：个人研究章节（第6–7页），围绕煤矿甲烷与废弃设施组织图表及跨页信息。", "A UAL × Ember industry collaboration. My research chapter (pp. 6–7) explores coal mine methane and abandoned facilities through charts and editorial information design.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/ember", "", "Memory Mapping — 个人记忆可视化：信息梳理、六级色彩编码，以及时间与地理双视角的信息海报。", "Personal memory visualisation: information structure, a six-level colour key and complementary chronological and geographical posters.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/memory", "", "kami coffee — 独立完成的纯 AIGC 虚构咖啡品牌概念：品牌设定、生成方向、图像筛选与系列内容组织，覆盖标识、产品、门店与传播视觉。", "An independently created, fully AI-generated fictional coffee-brand concept: brand concept, generation direction, image selection and series organisation across identity, products, storefronts and campaign visuals.", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site/kami-coffee", "", "教育经历 / EDUCATION", "University of the Arts London / 伦敦艺术大学", "BA(Hons) Graphic and Media Design / 2022.09 — 2025.06（已毕业 / Graduated）", "MA Design for Data Visualisation / 2025.09 — 2026.12（在读，预计2026年12月毕业 / In progress, expected December 2026）", "硕士专业学生代表 / MA course student representative", "2025.09 — 至今；任期覆盖整个硕士学程 / September 2025 — present; role spans the MA programme", "收集并整理同学反馈，参与课程会议，作为学生与课程负责人（Course Leader）、导师之间的沟通桥梁，清晰传达学习需求与建议。", "Gather and organise student feedback, attend course meetings and act as a communication bridge between students, the Course Leader and tutors, clearly conveying learning needs and suggestions.", "", "能力与工具 / CAPABILITIES & TOOLS", "视觉设计与版式、品牌与传播视觉、文化符号、信息图表、数据分析与研究、AI 辅助网页原型。", "Visual design and layout; brand and campaign visuals; cultural symbols; infographics; data analysis and research; AI-assisted web prototyping.", "Adobe Illustrator · Adobe Photoshop · AIGC · Vibe Coding · Codex · WorkBuddy", "", "语言 / LANGUAGES", "普通话 / Mandarin — 母语 / Native", "英语 / English — 学习、写作与项目沟通 / Study, writing & project communication", "粤语 / Cantonese — 日常交流 / Everyday communication", "", "创作兴趣 / CREATIVE INTEREST", "AI 音乐制作 / AI music production", "", "基本资料 / PERSONAL DETAILS", "2003.07.22 · 男 / Male · 中国 / Chinese", "", "联系方式 / CONTACT", "+86 13590303906", "+44 7536345069", "Lzh_0630@QQ.COM", "Zehanl023@gmail.com", "https://li-zehan-design-portfolio.gsmgwt7ywg.chatgpt.site"].join('\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', bio], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = '李泽翰-个人简介.txt'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(language === 'zh' ? '个人简介已下载' : 'Personal bio downloaded');
  }
  $('#download-profile').addEventListener('click', downloadBio);
  $('#download-mobile').addEventListener('click', downloadBio);
  $('#year').textContent = String(new Date().getFullYear());
  function openLinkedSection() {
    if (location.hash && document.getElementById(location.hash.slice(1))) goToSection(location.hash.slice(1));
  }
  if (document.readyState === 'complete') openLinkedSection();
  else window.addEventListener('load', openLinkedSection, { once: true });
})();
