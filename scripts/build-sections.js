const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const $RefParser = require("@apidevtools/json-schema-ref-parser");

const root = process.cwd();
const spotYamlPath = path.join(root, "api", "spot.yaml");
const buildDir = path.join(root, "build");
const manifestPath = path.join(buildDir, "sections-manifest.json");
const searchIndexPath = path.join(buildDir, "sections-search-index.json");

function out(message) {
  process.stdout.write(message + "\n");
}

function err(message) {
  process.stderr.write(message + "\n");
}

if (!fs.existsSync(spotYamlPath)) {
  err("Missing api/spot.yaml");
  process.exit(1);
}

const fullSpec = yaml.load(fs.readFileSync(spotYamlPath, "utf8"));
const tagGroups = fullSpec["x-tagGroups"] || [];
const allTags = fullSpec.tags || [];

function toId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

fs.mkdirSync(buildDir, { recursive: true });
const buildApiDir = path.join(buildDir, "api");
fs.mkdirSync(buildApiDir, { recursive: true });

const sections = [];
const searchIndex = [];
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "options", "head", "trace"];

function toTagHash(tagName) {
  if (!tagName) return "";
  return "#tag/" + encodeURIComponent(tagName.replace(/\s+/g, "-"));
}

(async function() {
  for (const group of tagGroups) {
    const groupName = group.name;
    const groupTags = group.tags || [];
    const folderPatterns = group["x-folders"] || [];

    if (groupTags.length === 0 || folderPatterns.length === 0) {
      err("Warning: x-tagGroup '" + groupName + "' missing tags or x-folders - skipping");
      continue;
    }

    // Filter paths matching this group's folders
    const filteredPaths = {};
    Object.entries(fullSpec.paths || {}).forEach(function([pathKey, pathValue]) {
      if (pathValue.$ref) {
        const matchesGroup = folderPatterns.some(function(folder) {
          return pathValue.$ref.includes(folder);
        });
        if (matchesGroup) filteredPaths[pathKey] = pathValue;
      }
    });

    const pathCount = Object.keys(filteredPaths).length;
    if (pathCount === 0) {
      err("Warning: x-tagGroup '" + groupName + "' has no matching paths - skipping");
      continue;
    }

    const sectionId = toId(groupName);
    const filteredTags = allTags.filter(function(tag) { return groupTags.includes(tag.name); });

    const sectionSpec = {
      openapi: fullSpec.openapi,
      info: Object.assign({}, fullSpec.info, { title: "Spot by Flexera API - " + groupName }),
      servers: fullSpec.servers,
      security: fullSpec.security,
      components: fullSpec.components,
      tags: filteredTags,
      paths: filteredPaths
    };

    // Write unbundled YAML directly in api/ so $refs resolve correctly
    const tmpYamlPath = path.join(root, "api", "_tmp_spot-" + sectionId + ".yaml");
    fs.writeFileSync(tmpYamlPath, yaml.dump(sectionSpec, { lineWidth: -1 }), "utf8");

    // Dereference all $refs inline so no internal $ref pointers are created.
    // This avoids the "Invalid reference token: allOf" error in ReDoc that occurs
    // when bundlers create internal refs like #/paths/~1foo/get/responses/.../allOf/0
    const bundledPath = path.join(buildApiDir, "spot-" + sectionId + ".yaml");
    try {
      const dereffed = await $RefParser.dereference(tmpYamlPath);

      Object.entries(dereffed.paths || {}).forEach(function([apiPath, pathItem]) {
        if (!pathItem || typeof pathItem !== "object") return;
        HTTP_METHODS.forEach(function(method) {
          const operation = pathItem[method];
          if (!operation || typeof operation !== "object") return;
          const operationId = operation.operationId || "";
          const tags = Array.isArray(operation.tags) ? operation.tags : [];
          const summary = operation.summary || operation.description || "";
          const hash = operationId ? "#operation/" + encodeURIComponent(operationId) : toTagHash(tags[0] || "");
          searchIndex.push({
            sectionId: sectionId,
            sectionTitle: groupName,
            method: method.toUpperCase(),
            path: apiPath,
            operationId: operationId,
            summary: summary,
            tags: tags,
            hash: hash
          });
        });
      });

      fs.writeFileSync(bundledPath, yaml.dump(dereffed, { lineWidth: -1 }), "utf8");
      const sizeKB = Math.round(fs.statSync(bundledPath).size / 1024);
      out("Created spot-" + sectionId + ".yaml (" + pathCount + " paths, " + sizeKB + " KB dereferenced)");
    } catch (caughtErr) {
      err("Dereference failed for " + sectionId + ": " + caughtErr.message);
      fs.copyFileSync(tmpYamlPath, bundledPath);
      out("Created spot-" + sectionId + ".yaml (" + pathCount + " paths, unbundled fallback)");
    }

    // Cleanup tmp file
    fs.unlinkSync(tmpYamlPath);

    sections.push({ id: sectionId, title: groupName });
  }

  // Create manifest
  const manifest = { defaultSection: sections[0] ? sections[0].id : "", sections: sections };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  out("Created " + manifestPath);

  fs.writeFileSync(searchIndexPath, JSON.stringify(searchIndex, null, 2), "utf8");
  out("Created " + searchIndexPath);
})();
