const fs = require("fs");
const path = require("path");

const root = process.cwd();
const buildDir = path.join(root, "build");
const manifestPath = path.join(buildDir, "sections-manifest.json");
const targetHtml = path.join(buildDir, "index.html");

// Copy logo to build folder
fs.mkdirSync(buildDir, { recursive: true });
const logoSrc = path.join(root, "flexera-spot.png");
const logoDest = path.join(buildDir, "flexera-spot.png");
if (fs.existsSync(logoSrc)) {
  fs.copyFileSync(logoSrc, logoDest);
}

if (!fs.existsSync(manifestPath)) {
  console.error(`Missing ${manifestPath}. Run 'yarn build:sections' first.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

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

      /* Hover state */
      #docs-container .menu-content label:hover,
      #docs-container .menu-content li:not(.active) > label:hover {
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
      #docs-container .menu-content li.active > label span { color: #0086ff !important; }
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
      let currentSection = null;
      let blockHashChange = false;
      let observer = null;

      function buildControls() {
        const div = document.createElement('div');
        div.id = 'our-controls';
        div.innerHTML =
          '<a class="logo" href="#"><img src="./flexera-spot.png" alt="Spot by Flexera"/></a>' +
          '<select id="section-select">' +
          sections.map(function(s) {
            return '<option value="' + s.id + '"' + (s.id === currentSection ? ' selected' : '') + '>' + s.title + '</option>';
          }).join('') +
          '</select>';
        div.querySelector('select').addEventListener('change', function() {
          if (this.value && this.value !== currentSection) loadSection(this.value);
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

      function loadSection(sectionId) {
        if (!sectionId || currentSection === sectionId) return;
        currentSection = sectionId;
        // Update select if already injected
        const sel = document.getElementById('section-select');
        if (sel) sel.value = sectionId;
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
          blockHashChange = false;
          injectControls();
        });
      }

      window.addEventListener("hashchange", function() {
        if (blockHashChange) return;
        const section = getSectionFromHash();
        if (section && section !== currentSection) loadSection(section);
      });

      const fromHash = getSectionFromHash();
      const first = fromHash || (sections.length ? sections[0].id : null);
      if (first) loadSection(first);
    </script>
  </body>
</html>`;
}

fs.mkdirSync(buildDir, { recursive: true });
fs.writeFileSync(targetHtml, renderHtml(), "utf8");
console.log(`Created ${targetHtml}`);

