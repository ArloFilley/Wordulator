// Imports
const path = require("node:path");

const {
  calculatePosFreq,
  pfHeuristicScore: posFreqScore,
  createOverlap,
  overlapScore,
} = require(path.join(__dirname, "../lib/heuristic.js"));

const {
  calculateGuessEntropy: entropyScore,
  separationScore,
  patternDiversityScore,
  minmaxScore,
  loadFeedbackMatrix,
  genEntropyTable,
} = require(path.join(__dirname, "../lib/entropy.js"));

// State
const fbm = loadFeedbackMatrix(
  path.join(__dirname, "../../data/proc/feedback_matrix.bin"),
);
