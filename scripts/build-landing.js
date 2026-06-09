const fs = require("fs");
const path = require("path");

const root = process.cwd();
const buildDir = path.join(root, "build");
const manifestPath = path.join(buildDir, "sections-manifest.json");
const searchIndexPath = path.join(buildDir, "sections-search-index.json");
const targetHtml = path.join(buildDir, "index.html");

function out(message) {
  process.stdout.write(message + "\n");
}

function err(message) {
  process.stderr.write(message + "\n");
}

// Copy logo to build folder
fs.mkdirSync(buildDir, { recursive: true });
const logoSrc = path.join(root, "flexera-spot.png");
const logoDest = path.join(buildDir, "flexera-spot.png");
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, logoDest);
}

if (!fs.existsSync(manifestPath)) {
  err(`Missing ${manifestPath}. Run 'yarn build:sections' first.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const searchIndex = fs.existsSync(searchIndexPath)
  ? JSON.parse(fs.readFileSync(searchIndexPath, "utf8"))
  : [];

function renderHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Spot by Flexera API Reference</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; }

      /* ReDoc full page */
      #docs-container { width: 100%; height: 100vh; overflow: auto; }

      /* Hide ReDoc's own logo div completely */
      #docs-container .menu-content > div:first-child { display: none !important; }

      /* Our injected controls inside ReDoc sidebar */
      #our-controls {
        padding: 16px 16px 8px 16px;
        background: #fff;
        border-bottom: 1px solid #dfe5ed;
      }
      #our-controls .logo { display: block; text-decoration: none; margin-bottom: 12px; }
      #our-controls .logo img { width: 100%; max-width: 200px; height: auto; object-fit: contain; }
      #our-controls select {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #dfe5ed;
        border-radius: 6px;
        font-size: 13px;
        color: #1e2a3a;
        background: #f5f7fb;
        cursor: pointer;
      }
      #our-controls select:focus { outline: none; border-color: #0086ff; background: #fff; }
      #our-controls .search-wrap { position: relative; margin-bottom: 10px; }
      #our-controls input[type="search"] {
        width: 100%;
        padding: 8px 10px;
        border: 1px solid #dfe5ed;
        border-radius: 6px;
        font-size: 13px;
        color: #1e2a3a;
        background: #fff;
      }
      #our-controls input[type="search"]:focus { outline: none; border-color: #0086ff; }
      #global-search-results {
        display: none;
        position: absolute;
        top: 36px;
        left: 0;
        right: 0;
        max-height: 280px;
        overflow: auto;
        border: 1px solid #dfe5ed;
        border-radius: 6px;
        background: #fff;
        box-shadow: 0 6px 20px rgba(20, 34, 66, 0.12);
        z-index: 20;
      }
      #global-search-results .item {
        width: 100%;
        border: 0;
        border-bottom: 1px solid #eef2f6;
        background: #fff;
        text-align: left;
        padding: 8px 10px;
        cursor: pointer;
      }
      #global-search-results .item:hover { background: #f5f9ff; }
      #global-search-results .item:last-child { border-bottom: 0; }
      #global-search-results .title { display: block; font-size: 12px; color: #1e2a3a; }
      #global-search-results .meta { display: block; font-size: 11px; color: #5e6b7a; margin-top: 2px; }
      #global-search-results .empty { padding: 10px; font-size: 12px; color: #5e6b7a; }

      /* Hover state */
      #docs-container .menu-content li:not(.active) > label:hover,
      #docs-container .menu-content li:not(.active) > label:hover * {
        background-color: #f0f4f8 !important;
        color: #1e2a3a !important;
      }
      /* Active/selected state */
      #docs-container .menu-content label.active,
      #docs-container .menu-content li.active > label {
        background-color: #e6f2ff !important;
        color: #0086ff !important;
        font-weight: 600 !important;
        border-left: 3px solid #0086ff !important;
      }
      #docs-container .menu-content li.active > label:hover,
      #docs-container .menu-content li.active > label:hover * {
        background-color: #e6f2ff !important;
        color: #0086ff !important;
      }
      #docs-container .menu-content li.active > label,
      #docs-container .menu-content li.active > label *,
      #docs-container .menu-content li.active > label a,
      #docs-container .menu-content li.active > label a:visited,
      #docs-container .menu-content li.active > label span {
        color: #0086ff !important;
      }
      /* Keep menu interactions snappy */
      #docs-container .menu-content label,
      #docs-container .menu-content a,
      #docs-container .menu-content li {
        transition: none !important;
        animation: none !important;
      }
    </style>
  </head>
  <body>
    <div id="docs-container">
      <p style="padding:40px;color:#5e6b7a;">Loading documentation...</p>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
    <script>
      const container = document.getElementById("docs-container");
      const sections = ${JSON.stringify(manifest.sections)};
      const globalOperations = ${JSON.stringify(searchIndex)};
      const operationToSection = new Map(
        globalOperations
          .filter(function(op) { return op && op.operationId && op.sectionId; })
          .map(function(op) { return [String(op.operationId).toLowerCase(), op.sectionId]; })
      );
      let currentSection = null;
      let blockHashChange = false;
      let observer = null;
      let currentSearchMatches = [];
      let pendingSearchTarget = null;

      function syncSectionSelect() {
        const sel = document.getElementById('section-select');
        if (sel && currentSection) sel.value = currentSection;
      }

      function getSectionFromUrl() {
        const params = new URLSearchParams(window.location.search || "");
        const section = params.get("section");
        if (!section) return null;
        return sections.some(function(s) { return s.id === section; }) ? section : null;
      }

      function setSectionInUrl(sectionId) {
        if (!sectionId) return;
        const url = new URL(window.location.href);
        url.searchParams.set("section", sectionId);
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }

      function setActiveMenuNode() {
        // Keep native ReDoc active-state handling (style + unselect logic) via real clicks only.
        return true;
      }

      function simulateUserClick(el) {
        if (!el) return false;
        const events = ['mousedown', 'mouseup', 'click'];
        events.forEach(function(type) {
          el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        });
        if (typeof el.click === 'function') el.click();
        if (typeof el.focus === 'function') {
          try {
            el.focus({ preventScroll: true });
          } catch (e) {
            el.focus();
          }
        }
        return true;
      }

      function scrollSidebarToNode(node) {
        if (!node) return false;
        const sidebar = container.querySelector('.menu-content');
        if (!sidebar) return false;
        const scroller = sidebar.querySelector('.scrollbar-container') || sidebar;
        const target = node.closest('li') || node;
        const sRect = scroller.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const delta = (tRect.top - sRect.top) - ((sRect.height / 2) - (tRect.height / 2));
        scroller.scrollTop = Math.max(0, scroller.scrollTop + delta);
        return true;
      }

      function normalizeText(value) {
        return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
      }

      // Find a sidebar link by hash value and click it (same as user clicking manually).
      function clickSidebarLink(hash) {
        if (!hash) return false;
        const sidebar = container.querySelector('.menu-content');
        if (!sidebar) return false;
        const decoded = decodeURIComponent(hash);
        const links = Array.prototype.slice.call(sidebar.querySelectorAll('a[href]'));
        const match = links.find(function(a) {
          const href = a.getAttribute('href') || '';
          return (
            href === hash ||
            decodeURIComponent(href) === decoded ||
            href.endsWith(hash) ||
            decodeURIComponent(href).endsWith(decoded)
          );
        });
        if (!match) return false;
        scrollSidebarToNode(match);
        simulateUserClick(match);
        setTimeout(function() { scrollSidebarToNode(match); }, 40);
        return true;
      }

      function clickSidebarByText(text, exactOnly) {
        if (!text) return false;
        const sidebar = container.querySelector('.menu-content');
        if (!sidebar) return false;
        const target = normalizeText(text);
        const clickables = Array.prototype.slice.call(sidebar.querySelectorAll('a, label, button'))
          .filter(function(el) { return !el.closest('#our-controls'); });

        let match = clickables.find(function(el) {
          return normalizeText(el.textContent) === target;
        });
        if (!match && !exactOnly) {
          match = clickables.find(function(el) {
            const current = normalizeText(el.textContent);
            return current && (current.includes(target) || target.includes(current));
          });
        }
        if (!match) return false;
        scrollSidebarToNode(match);
        simulateUserClick(match);
        setTimeout(function() { scrollSidebarToNode(match); }, 40);
        return true;
      }

      // Navigate to a search result:
      //   Primary: set window.location.hash so ReDoc navigates natively.
      //   Then also attempt to click the DOM link for sidebar highlighting.
      function activateSidebarItem(item) {
        if (!item) return;
        const tags = Array.isArray(item.tags) ? item.tags : [];
        const tagHash = toTagHash(tags[0] || '');
        const opHash  = getOperationHash(item);

        // Step 1 - navigate to the operation hash so content and sidebar respond.
        if (opHash && window.location.hash !== opHash) {
          window.location.hash = opHash;
        }

        // Step 2 - if the tag group needs expanding, click the tag link first.
        const tagName = tags[0] || '';
        if (tagHash) clickSidebarLink(tagHash);
        if (tagName) clickSidebarByText(tagName, true);

        // Step 3 - click the operation link with retries so sidebar item is highlighted.
        function tryClickOp(attemptsLeft) {
          if (attemptsLeft <= 0) return;
          const clicked =
            clickSidebarLink(opHash) ||
            clickSidebarByText(item.summary, true) ||
            clickSidebarByText(item.summary, false) ||
            clickSidebarByText(item.operationId, true) ||
            clickSidebarByText(item.operationId, false);
          if (!clicked) {
            setTimeout(function() { tryClickOp(attemptsLeft - 1); }, 60);
          }
        }
        setTimeout(function() { tryClickOp(6); }, 50);
      }

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function toTagHash(tagName) {
        if (!tagName) return "";
        return "#tag/" + encodeURIComponent(String(tagName).replace(/\\s+/g, "-"));
      }

      function getOperationHash(item) {
        if (!item) return '';
        if (item.hash) return item.hash;
        if (item.operationId) return '#operation/' + encodeURIComponent(item.operationId);
        const tags = Array.isArray(item.tags) ? item.tags : [];
        return toTagHash(tags[0] || '');
      }

      function goToSearchResult(item) {
        if (!item || !item.sectionId) return;
        hideSearchResults();
        const input = document.getElementById('global-search');
        if (input) input.value = '';
        pendingSearchTarget = item;
        const sel = document.getElementById('section-select');
        if (sel) sel.value = item.sectionId;
        setSectionInUrl(item.sectionId);
        if (item.sectionId !== currentSection) {
          loadSection(item.sectionId);   // activateSidebarItem called after render
        } else {
          activateSidebarItem(item);     // already on the right section
          pendingSearchTarget = null;
        }
      }

      function hideSearchResults() {
        const results = document.getElementById("global-search-results");
        if (!results) return;
        results.style.display = "none";
        results.innerHTML = "";
        currentSearchMatches = [];
      }

      function renderSearchResults(query) {
        const results = document.getElementById("global-search-results");
        if (!results) return;
        const q = String(query || "").trim();
        if (!q) {
          hideSearchResults();
          return;
        }
        const matches = findMatches(q);
        currentSearchMatches = matches;
        if (!matches.length) {
          results.innerHTML = '<div class="empty">No results</div>';
          results.style.display = "block";
          return;
        }
        results.innerHTML = matches.map(function(item, idx) {
          const title = item.summary || item.operationId || item.path || "Operation";
          const methodPath = ((item.method || "").toUpperCase() + " " + (item.path || "")).trim();
          return (
            '<button type="button" class="item" data-search-index="' + idx + '">' +
              '<span class="title">' + escapeHtml(title) + '</span>' +
              '<span class="meta">' + escapeHtml(item.sectionTitle || item.sectionId) + ' - ' + escapeHtml(methodPath) + '</span>' +
            '</button>'
          );
        }).join("");
        results.style.display = "block";
      }


      function buildControls() {
        const div = document.createElement('div');
        div.id = 'our-controls';
        div.innerHTML =
          '<a class="logo" href="#"><img src="./flexera-spot.png" alt="Spot by Flexera"/></a>' +
          '<div class="search-wrap">' +
            '<input id="global-search" type="search" placeholder="Search all sections..." autocomplete="off" />' +
            '<div id="global-search-results"></div>' +
          '</div>' +
          '<select id="section-select">' +
          sections.map(function(s) {
            return '<option value="' + s.id + '"' + (s.id === currentSection ? ' selected' : '') + '>' + s.title + '</option>';
          }).join('') +
          '</select>';
        div.querySelector('select').addEventListener('change', function() {
          if (!this.value) return;
          setSectionInUrl(this.value);
          if (this.value !== currentSection) loadSection(this.value);
        });
        const searchInput = div.querySelector('#global-search');
        const searchResults = div.querySelector('#global-search-results');
        searchInput.addEventListener('input', function() {
          renderSearchResults(this.value);
        });
        searchInput.addEventListener('focus', function() {
          renderSearchResults(this.value);
        });
        searchInput.addEventListener('keydown', function(event) {
          if (event.key === 'Escape') hideSearchResults();
        });
        searchInput.addEventListener('blur', function() {
          setTimeout(hideSearchResults, 120);
        });
        searchResults.addEventListener('mousedown', function(event) {
          const el = event.target.closest('[data-search-index]');
          if (!el) return;
          const idx = Number(el.getAttribute('data-search-index'));
          if (!Number.isInteger(idx) || idx < 0 || idx >= currentSearchMatches.length) return;
          goToSearchResult(currentSearchMatches[idx]);
        });
        return div;
      }

      function injectControls() {
        const sidebar = container.querySelector('.menu-content');
        if (!sidebar) return false;
        // Remove old one if present
        const old = document.getElementById('our-controls');
        if (old) old.remove();
        // Insert before the search element (children[1] = search, children[0] = hidden logo)
        const insertBefore = sidebar.children[1] || sidebar.firstChild;
        sidebar.insertBefore(buildControls(), insertBefore);
        return true;
      }

      function watchSidebar() {
        if (observer) observer.disconnect();
        observer = new MutationObserver(function() {
          // Re-inject if our controls were removed by React re-render
          if (!document.getElementById('our-controls')) {
            injectControls();
          }
        });
        observer.observe(container, { childList: true, subtree: true });
      }

      function getSectionFromHash() {
        const hash = window.location.hash;
        if (!hash) return null;
        const operationMatch = hash.match(/#operation\\/([^\\/?#]+)/i);
        if (operationMatch && operationMatch[1]) {
          const operationId = decodeURIComponent(operationMatch[1]).toLowerCase();
          if (operationToSection.has(operationId)) return operationToSection.get(operationId);
        }
        const tagMatch = hash.match(/#tag\\/([^\\/]+)/i);
        if (!tagMatch) return null;
        const tagName = tagMatch[1].toLowerCase();
        const sorted = sections.slice().sort((a, b) => b.title.length - a.title.length);
        for (const section of sorted) {
          const id = section.id.toLowerCase();
          const titled = section.title.toLowerCase().replace(/\\s+/g, '-');
          if (tagName === id || tagName === titled) return section.id;
          if (tagName.startsWith(id + '-') || tagName.startsWith(titled + '-')) return section.id;
        }
        return null;
      }

      function findMatches(query) {
        const q = String(query || "").trim().toLowerCase();
        if (!q) return [];
        const matches = [];
        for (const item of globalOperations) {
          if (!item || !item.sectionId) continue;
          const haystack = [
            item.summary,
            item.operationId,
            item.path,
            item.method,
            item.sectionTitle,
            (Array.isArray(item.tags) ? item.tags.join(" ") : "")
          ].join(" ").toLowerCase();
          if (!haystack.includes(q)) continue;
          let score = 0;
          if (String(item.operationId || "").toLowerCase().includes(q)) score += 3;
          if (String(item.summary || "").toLowerCase().includes(q)) score += 2;
          if (String(item.path || "").toLowerCase().includes(q)) score += 1;
          matches.push({ item: item, score: score });
        }
        return matches
          .sort(function(a, b) { return b.score - a.score; })
          .slice(0, 20)
          .map(function(entry) { return entry.item; });
      }

      function loadSection(sectionId) {
        if (!sectionId) return;
        if (currentSection === sectionId) {
          syncSectionSelect();
          if (pendingSearchTarget) {
            var t = pendingSearchTarget;
            pendingSearchTarget = null;
            activateSidebarItem(t);
          }
          return;
        }
        currentSection = sectionId;
        setSectionInUrl(sectionId);
        syncSectionSelect();
        container.innerHTML = "<p style='padding:40px;color:#5e6b7a;'>Loading " + sectionId + " documentation...</p>";
        blockHashChange = true;
        watchSidebar();
        Redoc.init("./api/spot-" + sectionId + ".yaml", {
          hideHostname: true,
          hideDownloadButton: true,
          menuToggle: true,
          expandSingleSchemaField: true,
          sortPropsAlphabetically: true,
          generatedPayloadSamplesMaxDepth: 3,
          theme: { colors: { primary: { main: "#0086ff" } } }
        }, container, function() {
          injectControls();
          syncSectionSelect();
          blockHashChange = false;
          if (pendingSearchTarget) {
            var t = pendingSearchTarget;
            pendingSearchTarget = null;
            activateSidebarItem(t);
          }
        });
      }

      window.addEventListener("hashchange", function() {
        if (blockHashChange) return;
        const sectionFromUrl = getSectionFromUrl();
        // Only switch section if URL param explicitly says a different section.
        // Do NOT switch based on hash alone — that causes loops with activateSidebarItem.
        if (sectionFromUrl && sectionFromUrl !== currentSection) {
          loadSection(sectionFromUrl);
          return;
        }
        syncSectionSelect();
      });

      const fromUrl = getSectionFromUrl();
      const fromHash = getSectionFromHash();
      const first = fromUrl || fromHash || (sections.length ? sections[0].id : null);
      if (first) loadSection(first);
    </script>
  </body>
</html>`;
}

fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(targetHtml, renderHtml(), "utf8");
out(`Created ${targetHtml}`);

