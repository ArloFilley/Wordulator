/** Precompute an array of high score & entropy guesses */
const fs = require('fs');

const { calculateGuessEntropy, genEntropyTable, loadFeedbackMatrix } = require('../lib/entropy.js');
const { pfHeuristicScore, uniquenessHeuristicScore } = require('../lib/heuristic.js');
const { normalise } = require('../lib/lib.js')

const answers = require('../../data/filter/solution_words.json')
const feedback_matrix = loadFeedbackMatrix('./data/proc/feedback_matrix.bin');

try {
    const args = process.argv.slice(2);
    const words_file           = fs.existsSync(args[0]) ? args[0]                   : () => { throw "Words File Not Found" };
    const pos_freq_file        = fs.existsSync(args[1]) ? args[1]                   : () => { throw "Positional Frequencies File Not Found" };
    const feedback_matrix_file = fs.existsSync(args[2]) ? args[2]                   : () => { throw "Feedback Matrix File Not Found" };
    const amount               = args[3] > 0            ? Number.parseInt(args[3])  : () => { throw "Guess No Not Found" };
    const write_dir            = fs.existsSync(args[4]) ? args[4]                   : () => { throw "Feedback Matrix File Not Found" };

    const pos_freq = JSON.parse(fs.readFileSync(pos_freq_file));
    /** @type string[] */
    const words = JSON.parse(fs.readFileSync(words_file));
    const word_index = new Map();
    words.forEach((w, i) => word_index.set(w, i));
    const answer_indecies = answers.map(v => word_index.get(v));

    let scores = Array.from({ length: words.length }, () => ({ word: '', score: 0 }));
    let ent_scores = new Array(words.length);
    let frq_scores = new Array(words.length);
    let unq_scores = new Array(words.length);
    const ent_table = genEntropyTable(answers.length);
    for (let i=0; i<words.length; i++) {
        const guess = words[i];
        scores[i].word = guess;
        scores[i].score = calculateGuessEntropy(i, words, feedback_matrix, answer_indecies, ent_table);

        if (i % 200 === 0) console.log(`${i}/${words.length}`);
        // frq_scores[i] = pfHeuristicScore(guess, pos_freq);
        // unq_scores[i] = uniquenessHeuristicScore(guess) < 5 ? 0 : 1;
    }

    // ent_scores = normalise(ent_scores);
    // frq_scores = normalise(frq_scores);
    
    // for (let i=0; i<words.length; i++) {
    //     scores[i].score = (ent_scores[i] * 5 + frq_scores[i] * 0.7) * unq_scores[i];
    // }

    scores.sort((a, b) => b.score - a.score);
    const s = scores.slice(0, amount);
    
    fs.writeFileSync(`${write_dir}/first_guesses.json`, JSON.stringify(s, null, 4));
    console.log(`Wrote ${amount} higest guesses to ${write_dir}/first_guesses.json`);
    process.exit(0);
} catch (err) {
    console.error(err);
}