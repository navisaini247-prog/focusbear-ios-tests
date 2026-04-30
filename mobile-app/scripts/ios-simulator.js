#!/usr/bin/env node

const { execSync } = require("child_process");

function getAvailableSimulators() {
  try {
    const output = execSync("xcrun simctl list devices available", { encoding: "utf8" });
    const lines = output.split("\n");
    const simulators = [];

    lines.forEach((line) => {
      const match = line.match(
        /iPhone (?:SE \(\d+(?:st|nd|rd|th) generation\)|\d+(?: Pro Max| Pro| Plus| Max| mini)?)/,
      );
      if (match) {
        simulators.push(match[0]);
      }
    });

    return simulators;
  } catch (error) {
    console.error("Error getting available simulators:", error.message);
    return [];
  }
}

function selectBestSimulator(simulators) {
  // Preferred order of simulators
  const preferred = [
    "iPhone 16 Pro",
    "iPhone 16",
    "iPhone 15 Pro",
    "iPhone 15",
    "iPhone 14 Pro",
    "iPhone 14",
    "iPhone 13 Pro",
    "iPhone 13",
  ];

  // Find the first available preferred simulator
  for (const pref of preferred) {
    if (simulators.includes(pref)) {
      return pref;
    }
  }

  // Fallback to the first available simulator
  return simulators[0] || "iPhone SE (3rd generation)";
}

function main() {
  const scheme = process.argv[2] || "Development";
  const simulators = getAvailableSimulators();

  if (simulators.length === 0) {
    console.error("No iPhone simulators found!");
    process.exit(1);
  }

  const selectedSimulator = selectBestSimulator(simulators);
  console.log(`Available simulators: ${simulators.join(", ")}`);
  console.log(`Selected simulator: ${selectedSimulator}`);
  console.log(`Scheme: ${scheme}`);

  try {
    const command = `npx react-native run-ios --scheme '${scheme}' --simulator '${selectedSimulator}'`;
    console.log(`Running: ${command}`);
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error("Error running iOS app:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { getAvailableSimulators, selectBestSimulator };
