(() => {
  'use strict';

  const rootElement = document.documentElement;
  const storage = {
    get(key) {
      try { return localStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch (_) { /* private browsing */ }
    }
  };

  const setTheme = (theme) => {
    rootElement.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'dark' ? '#0f1512' : '#f2f6f3';
  };

  const themeButton = document.querySelector('[data-theme-toggle]');
  themeButton?.addEventListener('click', () => {
    const next = rootElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    storage.set('adoc-theme', next);
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  let fontStep = Number(storage.get('adoc-font-step')) || 0;
  const applyFontStep = () => {
    fontStep = Math.round(clamp(fontStep, -0.15, 0.3) * 100) / 100;
    rootElement.style.setProperty('--reader-step', `${fontStep}rem`);
  };
  applyFontStep();

  document.querySelectorAll('[data-font-action]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.dataset.fontAction;
      fontStep = action === 'reset' ? 0 : fontStep + (action === 'up' ? 0.05 : -0.05);
      applyFontStep();
      storage.set('adoc-font-step', String(fontStep));
      window.dispatchEvent(new Event('resize'));
    });
  });

  const progress = document.querySelector('.reading-progress span');
  let progressQueued = false;
  const updateProgress = () => {
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = distance > 0 ? clamp(window.scrollY / distance, 0, 1) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    progressQueued = false;
  };
  window.addEventListener('scroll', () => {
    if (!progressQueued) {
      progressQueued = true;
      requestAnimationFrame(updateProgress);
    }
  }, {passive: true});
  updateProgress();

  const comments = document.querySelector('[data-disqus]');
  const commentsButton = comments?.querySelector('[data-disqus-load]');
  const commentsStatus = comments?.querySelector('[data-disqus-status]');
  if (comments && commentsButton && commentsStatus) {
    let commentsLoaded = false;
    const setCommentsStatus = (message) => { commentsStatus.textContent = message; };
    const loadComments = () => {
      if (commentsLoaded || commentsButton.disabled) return;
      const shortname = comments.dataset.disqusShortname;
      if (!shortname || !/^[a-z0-9-]+$/i.test(shortname)) {
        setCommentsStatus('评论配置无效，暂时无法加载。');
        comments.classList.add('comments-error');
        commentsButton.textContent = '重新加载评论';
        return;
      }

      comments.classList.remove('comments-error');
      commentsButton.disabled = true;
      commentsButton.textContent = '正在加载评论…';
      setCommentsStatus('正在连接 Disqus…');

      const thread = document.createElement('div');
      thread.id = 'disqus_thread';
      comments.append(thread);
      window.disqus_config = function disqusConfig() {
        this.page.url = comments.dataset.disqusUrl;
        this.page.identifier = comments.dataset.disqusIdentifier;
        this.page.title = comments.dataset.disqusTitle;
      };

      const script = document.createElement('script');
      script.async = true;
      script.src = `https://${shortname}.disqus.com/embed.js`;
      script.setAttribute('data-timestamp', String(Date.now()));
      script.addEventListener('load', () => {
        commentsLoaded = true;
        comments.classList.add('comments-loaded');
        commentsButton.hidden = true;
        setCommentsStatus('评论已加载。');
      }, {once: true});
      script.addEventListener('error', () => {
        script.remove();
        thread.remove();
        commentsButton.disabled = false;
        commentsButton.textContent = '重新加载评论';
        comments.classList.add('comments-error');
        setCommentsStatus('无法加载评论服务，请检查网络后重试。');
      }, {once: true});
      document.head.append(script);
    };
    commentsButton.addEventListener('click', loadComments);
  }

  const searchPage = document.querySelector('[data-search-page]');
  const searchForm = searchPage?.querySelector('[data-search-form]');
  const searchInput = searchPage?.querySelector('[data-search-input]');
  const searchStatus = searchPage?.querySelector('[data-search-status]');
  const searchResults = searchPage?.querySelector('[data-search-results]');
  if (searchPage && searchForm && searchInput && searchStatus && searchResults) {
    let index;
    const normalize = (value) => String(value || '').toLowerCase();
    const appendHighlightedText = (element, value, term) => {
      const text = String(value || '');
      const lowerText = normalize(text);
      let offset = 0;
      let match = lowerText.indexOf(term, offset);
      while (match !== -1) {
        element.append(document.createTextNode(text.slice(offset, match)));
        const mark = document.createElement('mark');
        mark.textContent = text.slice(match, match + term.length);
        element.append(mark);
        offset = match + term.length;
        match = lowerText.indexOf(term, offset);
      }
      element.append(document.createTextNode(text.slice(offset)));
    };
    const render = (pages, term) => {
      searchResults.replaceChildren();
      pages.forEach((page) => {
        const card = document.createElement('article');
        card.className = 'page-card';
        const meta = document.createElement('div');
        meta.className = 'card-meta';
        meta.textContent = page.date || '';
        const heading = document.createElement('h2');
        const link = document.createElement('a');
        link.href = page.permalink;
        appendHighlightedText(link, page.title, term);
        heading.append(link);
        card.append(meta, heading);
        if (page.summary) {
          const summary = document.createElement('p');
          appendHighlightedText(summary, page.summary, term);
          card.append(summary);
        }
        searchResults.append(card);
      });
    };
    const loadIndex = async () => {
      if (index) return index;
      const response = await fetch(searchPage.dataset.searchIndex, {headers: {Accept: 'application/json'}});
      if (!response.ok) throw new Error(`search index: ${response.status}`);
      index = await response.json();
      return index;
    };
    const search = async (query) => {
      const term = normalize(query).trim();
      searchResults.replaceChildren();
      if (!term) { searchStatus.textContent = ''; return; }
      searchStatus.textContent = '…';
      try {
        const pages = await loadIndex();
        const matches = pages.filter((page) => [page.title, page.summary, page.content, page.tags, page.categories]
          .some((value) => normalize(Array.isArray(value) ? value.join(' ') : value).includes(term)));
        render(matches, term);
        searchStatus.textContent = matches.length ? '' : '没有匹配的文章。';
      } catch (_) {
        searchStatus.textContent = '搜索索引不可用。';
      }
    };
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const url = new URL(window.location.href);
      if (searchInput.value) url.searchParams.set('q', searchInput.value); else url.searchParams.delete('q');
      history.replaceState(null, '', url);
      search(searchInput.value);
    });
    const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
    searchInput.value = initialQuery;
    if (initialQuery) search(initialQuery);
    else searchInput.focus();
  }

  const article = document.querySelector('[data-article-body]');
  if (!article) return;

  article.querySelectorAll('.listingblock > .content').forEach((container) => {
    const code = container.querySelector('pre code') || container.querySelector('pre');
    if (!code || container.querySelector('.copy-code')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code';
    button.textContent = '复制';
    button.setAttribute('aria-label', '复制代码');
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        button.textContent = '已复制';
      } catch (_) {
        button.textContent = '复制失败';
      }
      setTimeout(() => { button.textContent = '复制'; }, 1400);
    });
    container.append(button);
  });

  const footnoteRefs = new Map();
  article.querySelectorAll('sup.footnote a[href^="#"], sup.footnoteref a[href^="#"]').forEach((link) => {
    const targetId = link.getAttribute('href').slice(1);
    const links = footnoteRefs.get(targetId) || [];
    if (!link.id) link.id = `footnote-ref-${targetId.replace(/^_+/, '')}-${links.length + 1}`;
    link.setAttribute('aria-label', `跳到脚注 ${link.textContent.trim()}`);
    links.push(link);
    footnoteRefs.set(targetId, links);
  });
  article.querySelectorAll('#footnotes .footnote > a:first-child').forEach((link) => {
    link.setAttribute('aria-label', `返回脚注引用 ${link.textContent.trim()}`);
    link.title = '返回正文';
  });
  footnoteRefs.forEach((links, targetId) => {
    if (links.length < 2) return;
    const definition = document.getElementById(targetId);
    if (!definition || definition.querySelector('.footnote-backrefs')) return;
    const backrefs = document.createElement('span');
    backrefs.className = 'footnote-backrefs';
    backrefs.setAttribute('aria-label', '返回脚注引用位置');
    links.forEach((link, index) => {
      const backlink = document.createElement('a');
      backlink.href = `#${link.id}`;
      backlink.textContent = `↩${index + 1}`;
      backlink.title = `返回第 ${index + 1} 处脚注引用`;
      backrefs.append(backlink);
    });
    definition.append(backrefs);
  });

  /* Asciidoctor bibliography links have forward links but no return links.
     Collect every citation and append one backlink per occurrence. */
  const citations = new Map();
  article.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.closest('.bibliography, #footnotes') || link.classList.contains('anchor')) return;
    let id;
    try { id = decodeURIComponent(link.getAttribute('href').slice(1)); } catch (_) { return; }
    const target = document.getElementById(id);
    if (!target || !target.closest('.bibliography')) return;
    const links = citations.get(id) || [];
    if (!link.id) link.id = `cite-${id}-${links.length + 1}`;
    link.setAttribute('aria-label', `跳到参考文献 ${link.textContent.trim()}`);
    links.push(link);
    citations.set(id, links);
  });

  citations.forEach((links, id) => {
    const target = document.getElementById(id);
    const entry = target?.closest('li, .paragraph') || target?.parentElement;
    if (!entry || entry.querySelector('.citation-backrefs')) return;
    const backrefs = document.createElement('span');
    backrefs.className = 'citation-backrefs';
    backrefs.setAttribute('aria-label', '返回引用位置');
    links.forEach((link, index) => {
      const backlink = document.createElement('a');
      backlink.href = `#${link.id}`;
      backlink.textContent = links.length > 1 ? `↩${index + 1}` : '↩';
      backlink.title = links.length > 1 ? `返回第 ${index + 1} 处引用` : '返回引用位置';
      backrefs.append(backlink);
    });
    entry.append(backrefs);
  });

  const tocLinks = [...document.querySelectorAll('.page-toc a[href*="#"], .mobile-toc a[href*="#"]')];
  const headings = [...article.querySelectorAll('h2[id], h3[id], h4[id], h5[id], h6[id]')];
  if ('IntersectionObserver' in window && tocLinks.length && headings.length) {
    const linkMap = new Map();
    tocLinks.forEach((link) => {
      try {
        const url = new URL(link.href, location.href);
        const id = decodeURIComponent(url.hash.slice(1));
        const list = linkMap.get(id) || [];
        list.push(link);
        linkMap.set(id, list);
      } catch (_) { /* ignore malformed user links */ }
    });
    let activeId = '';
    const activate = (id) => {
      if (!id || id === activeId) return;
      activeId = id;
      tocLinks.forEach((link) => link.classList.remove('active'));
      (linkMap.get(id) || []).forEach((link) => link.classList.add('active'));
    };
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) activate(visible[0].target.id);
    }, {rootMargin: '-15% 0px -72% 0px', threshold: [0, 1]});
    headings.forEach((heading) => observer.observe(heading));
  }

  const notes = [...article.querySelectorAll('.sidenote')];
  if (notes.length) {
    document.querySelector('.page-shell')?.classList.add('has-sidenotes');
    notes.forEach((note, index) => {
      const anchor = document.createElement('span');
      anchor.className = 'sidenote-anchor';
      anchor.dataset.sidenote = String(index + 1);
      note.before(anchor);
    });

    const wideScreen = matchMedia('(min-width: 87.5rem)');
    let layoutQueued = false;
    const layoutNotes = () => {
      layoutQueued = false;
      article.style.minHeight = '';
      notes.forEach((note) => {
        note.classList.remove('is-margin-note');
        note.style.top = '';
      });
      if (!wideScreen.matches) return;

      notes.forEach((note) => note.classList.add('is-margin-note'));
      const articleRect = article.getBoundingClientRect();
      const rootStyle = getComputedStyle(rootElement);
      const fontSize = parseFloat(rootStyle.fontSize) || 16;
      const remValue = (name) => (parseFloat(rootStyle.getPropertyValue(name)) || 0) * fontSize;
      const sidenoteGap = remValue('--sidenote-gap');
      let nextTop = 0;
      let furthestBottom = article.scrollHeight;

      notes.forEach((note) => {
        const anchor = note.previousElementSibling;
        const desiredTop = anchor.getBoundingClientRect().top - articleRect.top;
        const top = Math.max(desiredTop, nextTop);
        note.style.top = `${Math.round(top)}px`;
        nextTop = top + note.offsetHeight + sidenoteGap;
        furthestBottom = Math.max(furthestBottom, nextTop);
      });
      article.style.minHeight = `${Math.ceil(furthestBottom)}px`;
    };
    const requestLayout = () => {
      if (!layoutQueued) {
        layoutQueued = true;
        requestAnimationFrame(layoutNotes);
      }
    };
    window.addEventListener('resize', requestLayout, {passive: true});
    window.addEventListener('load', requestLayout, {once: true});
    if ('ResizeObserver' in window) notes.forEach((note) => new ResizeObserver(requestLayout).observe(note));
    requestLayout();
  }
})();
