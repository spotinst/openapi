const fs = require("fs");
const json = JSON.parse(fs.readFileSync("build/openapi.json"));

let count = 0;
const refs = [];

function check(obj, depth = 0) {
  if (depth > 50) return; // prevent stack overflow
  if (!obj || typeof obj !== "object") return;

  if (obj.$ref && obj.$ref.includes("/properties")) {
    refs.push(obj.$ref);
    count++;
  }

  Object.values(obj).forEach((v) => check(v, depth + 1));
}

check(json);

console.log(`Found ${count} broken $ref tokens with /properties:`);
refs.slice(0, 10).forEach((ref) => {
  console.log("  ", ref);
});

if (count > 10) {
  console.log(`  ... and ${count - 10} more`);
}

