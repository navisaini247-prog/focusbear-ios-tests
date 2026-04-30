#!/usr/bin/env node

/**
 * Compares non-English locale files to English (en.js) and fails if any keys are
 * missing in a locale or extra (not in English). Used locally and in CI
 * (.github/workflows/compare_localization_keys.yml).
 *
 * Usage: node scripts/check-translation-keys.js
 */

const en = require("../src/localization/en").default;

/** @type {readonly { fileId: string; label: string }[]} */
const LOCALES = [
  { fileId: "es", label: "Spanish (es.js)" },
  { fileId: "de", label: "German (de.js)" },
  { fileId: "ja", label: "Japanese (ja.js)" },
  { fileId: "vi", label: "Vietnamese (vi.js)" },
  { fileId: "zh-CN", label: "Simplified Chinese (zh-CN.js)" },
  { fileId: "zh-TW", label: "Traditional Chinese (zh-TW.js)" },
];

function loadLocale(fileId) {
  return require(`../src/localization/${fileId}`).default;
}

/**
 * Recursively get all keys from an object with dot notation
 * @param {object} obj - The object to extract keys from
 * @param {string} prefix - The current key prefix
 * @returns {string[]} - Array of dot-notation keys
 */
function getAllKeys(obj, prefix = "") {
  let keys = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (value !== null && typeof value === "object" && !Array.isArray(value)) {
        keys = keys.concat(getAllKeys(value, fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }

  return keys;
}

/**
 * Find keys that exist in source but not in target
 * @param {string[]} sourceKeys - Keys from source language
 * @param {string[]} targetKeys - Keys from target language
 * @returns {string[]} - Missing keys
 */
function findMissingKeys(sourceKeys, targetKeys) {
  const targetSet = new Set(targetKeys);
  return sourceKeys.filter((key) => !targetSet.has(key));
}

/**
 * Find keys that exist in target but not in source (extra keys)
 * @param {string[]} sourceKeys - Keys from source language
 * @param {string[]} targetKeys - Keys from target language
 * @returns {string[]} - Extra keys
 */
function findExtraKeys(sourceKeys, targetKeys) {
  const sourceSet = new Set(sourceKeys);
  return targetKeys.filter((key) => !sourceSet.has(key));
}

const enKeys = getAllKeys(en);

/** Load each locale once and cache extracted keys */
const localeKeySets = LOCALES.map(({ fileId, label }) => ({
  fileId,
  label,
  keys: getAllKeys(loadLocale(fileId)),
}));

console.log("=".repeat(60));
console.log("=".repeat(60));
console.log();

console.log("Summary:");
console.log(`  English (en.js):  ${enKeys.length} keys`);
for (const { label, keys } of localeKeySets) {
  console.log(`  ${label}: ${keys.length} keys`);
}
console.log();

let totalMissing = 0;
let totalExtra = 0;

for (const { label, keys: targetKeys } of localeKeySets) {
  const missing = findMissingKeys(enKeys, targetKeys);
  const extra = findExtraKeys(enKeys, targetKeys);

  totalMissing += missing.length;
  totalExtra += extra.length;

  console.log("-".repeat(60));
  console.log(`${label} compared to English:`);
  console.log("-".repeat(60));

  if (missing.length === 0) {
    console.log(`  No missing keys found in ${label}.`);
  } else {
    console.log(`  Missing ${missing.length} keys:`);
    missing.forEach((key) => console.log(`    - ${key}`));
  }

  if (extra.length > 0) {
    console.log();
    console.log(`  Extra ${extra.length} keys (present in ${label} but not in English):`);
    extra.forEach((key) => console.log(`    + ${key}`));
  }

  console.log();
}

console.log("=".repeat(60));

if (totalMissing > 0 || totalExtra > 0) {
  const parts = [];
  if (totalMissing > 0) {
    parts.push(`${totalMissing} missing translation key(s)`);
  }
  if (totalExtra > 0) {
    parts.push(`${totalExtra} extra key(s) not in English`);
  }
  console.log(`RESULT: Found ${parts.join(" and ")}.`);
  process.exit(1);
}

console.log("RESULT: All translation keys match English (no missing or extra keys).");
process.exit(0);
