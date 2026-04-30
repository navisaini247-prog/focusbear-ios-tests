const fs = require("fs");
const path = require("path");

const APPLY = process.argv.includes("--apply");
const TESTIDS_JSON_PATH = path.resolve("script/codemods/testids.json");

let testIdsStore = {};

try {
  if (fs.existsSync(TESTIDS_JSON_PATH)) {
    testIdsStore = JSON.parse(fs.readFileSync(TESTIDS_JSON_PATH, "utf8"));
  }
} catch (e) {
  console.warn("Could not read existing testids.json:", e.message);
}

function getExistingProp(openingEl, propName) {
  return openingEl.attributes?.find((a) => a.type === "JSXAttribute" && a.name && a.name.name === propName);
}

function getStringPropValue(openingEl, propName) {
  const attr = getExistingProp(openingEl, propName);
  if (!attr) return null;
  if (!attr.value) return "";
  if (attr.value.type === "StringLiteral" || attr.value.type === "Literal") {
    return attr.value.value;
  }
  return null;
}

function recordId(filePath, id) {
  const key = path.relative(process.cwd(), filePath);
  testIdsStore[key] = testIdsStore[key] || [];
  if (!testIdsStore[key].includes(id)) {
    testIdsStore[key].push(id);
  }
}

process.on("exit", () => {
  const sortedTestIdsStore = {};
  Object.keys(testIdsStore)
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))
    .forEach((key) => {
      sortedTestIdsStore[key] = testIdsStore[key];
    });

  if (APPLY) {
    try {
      if (Object.keys(sortedTestIdsStore).length > 0) {
        fs.mkdirSync(path.dirname(TESTIDS_JSON_PATH), { recursive: true });
        fs.writeFileSync(TESTIDS_JSON_PATH, JSON.stringify(sortedTestIdsStore, null, 2));
        console.log("Collected testIDs written to:", TESTIDS_JSON_PATH);
      } else {
        console.log("ℹNo test IDs found to write.");
      }
    } catch (e) {
      console.error("Failed to write testids.json:", e);
    }
  } else {
    const total = Object.values(sortedTestIdsStore).reduce((a, b) => a + b.length, 0);
    console.log(`Dry run: found ${total} testIDs across ${Object.keys(sortedTestIdsStore).length} files.`);
  }
});

module.exports = function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  root.find(j.JSXOpeningElement).forEach((p) => {
    const openingEl = p.node;
    const val = getStringPropValue(openingEl, "testID");

    if (val && /^test:id\//.test(val)) {
      recordId(file.path, val);
    }
  });

  root
    .find(j.ObjectProperty, {
      key: { type: "Identifier", name: "tabBarButtonTestID" },
      value: { type: "StringLiteral" },
    })
    .forEach((path) => {
      recordId(file.path, path.node.value.value);
    });

  return null;
};
