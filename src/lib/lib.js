const readline = require('node:readline/promises');
const { once } = require('events')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function ask(q) {
    let a = await rl.question(q);
    return a.toLowerCase();
}

/**
 * Counts the number of a given character in a word
 * @param {*} word 
 * @param {*} char 
 * @returns 
 */
function count(word, character) {
    let count = 0;
    for (let letter of word) {
        if (letter === character) { count++ }
    }

    return count
}

/**
 * Normalises an array of data
 * @param {number[]} arr 
 * @returns {number[]}
 */
function normalise(arr) {
    const max = Math.max(...arr);
    const min = Math.min(...arr);
    const range = Math.abs(max - min);

    if (range === 0) return arr.map(() => 0);
    return arr.map(v => { return (v - min) / range })
}

function patternToIndex(pattern) {
    let index = 0;
    let multiplier = 1;

    for (let i = 0; i < 5; i++) {
        const twoBits = (pattern >> (i * 2)) & 0b11; 
        index += twoBits * multiplier;
        multiplier *= 3; 
    }

    return index;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomUniform(min, max) {
    return min + Math.random() * (max - min);
}

module.exports = { ask, count, normalise, patternToIndex, randomInt, randomUniform }