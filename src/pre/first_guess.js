/** Precompute an array of high score & entropy guesses */
const fs = require('fs');

const { calculateGuessEntropy } = require('../lib/entropy.js');
const { pfHeuristicScore } = require('../lib/heuristic.js');


try {
    const args = process.argv.slice(2);
    const words_file           = fs.existsSync(args[0]) ? args[0]                   : () => { throw "Words File Not Found" };
    const pos_freq_file        = fs.existsSync(args[1]) ? args[1]                   : () => { throw "Positional Frequencies File Not Found" };
    const feedback_matrix_file = fs.existsSync(args[2]) ? args[2]                   : () => { throw "Feedback Matrix File Not Found" };
    const guesses              = args[3] > 0            ? Number.parseInt(args[3])  : () => { throw "Write Dir Not Found" };
    const write_dir            = fs.existsSync(args[4]) ? args[4]                   : () => { throw "Feedback Matrix File Not Found" };

    const pos_freq = JSON.parse(fs.readFileSync(pos_freq_file));
    const feedback_matrix = new Uint8Array(fs.readFileSync(feedback_matrix_file));
    const words = JSON.parse(fs.readFileSync(words_file));
    const word_index = new Map();
    words.forEach((w, i) => word_index.set(w, i));

    let scores = new Array(words.length);
    for (let g in words) {
        const guess = words[g];
        const s = calculateGuessEntropy(guess, words, feedback_matrix, word_index) + pfHeuristicScore(guess, 0, pos_freq, words.length);
        scores[g] = { word: guess, score: s };  
    }

    scores.sort((a, b) => b.score - a.score);
    const s = scores.slice(0, guesses);
    fs.writeFileSync(`${write_dir}/first_guesses.json`, JSON.stringify(s, null, 4));
} catch (err) {
    console.error(err);
}


