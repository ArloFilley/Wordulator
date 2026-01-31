#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper to create directories safely
function mkdirSafe(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created ${dirPath}`);
    }
}

function copyFile(projectRoot, src, dest) {
    fs.copyFileSync(path.join(projectRoot, src), path.join(projectRoot, dest));
    console.log(`Copied ./${src} -> ./${dest}`);
};

function runNodeScript(script, args) {
    const result = spawnSync('node', [script, ...args], { stdio: 'inherit' });
    if (result.error) {
        console.error(`Failed to run ${script}:`, result.error);
        process.exit(1);
    }
    if (result.status !== 0) {
        console.error(`${script} exited with code ${result.status}`);
        process.exit(result.status);
    }
};

async function main() {
  const projectRoot = path.join(__dirname, '..');

  // Create Directory Structure
  const dirs = ['data', 'data/filter', 'data/proc', 'data/raw', 'data/test', 'bench']
  console.log("Creating Directory Structure");
  for (const dir of dirs) {
    mkdirSafe(path.join(projectRoot, dir))
    await sleep(200);
  }
  console.log('---|---|---|---|---\n')

  // Copy files
  console.log("Copying Files Into Correct Places");

  copyFile(projectRoot, 'scripts/wordle.txt', 'data/raw/wordle.txt');
  await sleep(200);

  copyFile(projectRoot, 'scripts/solutions.txt', 'data/raw/solutions.txt');
  await sleep(200);
  console.log('---|---|---|---|---\n');

  // Filtering Lists for Valid Words
  console.log("Filtering List For Valid Words");
  runNodeScript('src/pre/filter_words.js', ['data/raw/wordle.txt', 'data/filter/words.json', '5']);
  runNodeScript('src/pre/filter_words.js', ['data/raw/solutions.txt', 'data/filter/solutions.json', '5']);
  console.log('---|---|---|---|---\n');

  // Generate feedback matrix
  console.log("Generating Feedback Matrix");
  console.log("This Step Might Take a While");
  console.log("The Feedback Matrix Can Be Found at data/proc/feedback_matrix.bin. It Takes Up Roughly 200mb For 12k Words");
  runNodeScript('src/pre/feedback_matrix.js', ['data/filter/words.json', 'data/proc/feedback_matrix.bin']);
  console.log('---|---|---|---|---\n');

  // Generate Benchmark Tests
  console.log("Generating Benchmark Tests");
  runNodeScript('src/pre/test.js', ['data/filter/solutions.json', 'data/test/tests.json', '5000']);
  console.log('---|---|---|---|---\n');

  console.log("Everything installed correctly :>");
}

main().catch(err => {
  console.error('Postinstall failed:', err);
  process.exit(1);
});