/** Precompute an array of high score & entropy guesses */
const fs = require('fs');

const { calculateGuessEntropy, genEntropyTable } = require('../lib/entropy.js');
const words = require('../../data/filter/words.json')


try {
    const feedback_matrix = new Uint8Array(fs.readFileSync('./data/proc/feedback_matrix.bin'));
    const word_index = new Map();
    words.forEach((w, i) => word_index.set(w, i));
    const word_indecies = words.map((_, i) => i);

    let fgi = word_index.get('tares')
    const ppw = Array.from({ length: 243 }, () => []);
    const row = feedback_matrix.subarray(fgi * words.length, (fgi+1) * words.length);
    for (let i=0; i < words.length ; i++) {
        const pattern = row[i];
        ppw[pattern].push(words);
    }

    const ent_table      = genEntropyTable(words.length);
    const second_guesses = new Uint16Array(243).fill(0);
    for (let p = 0; p < 243; p++) {
        const pw = ppw[p];
        if (pw.length <= 1) continue; // No possible guesses

        let best_entropy = -Infinity;
        let best_guess = -1;

        for (let gi = 0; gi < words.length; gi++) {
            const ent = calculateGuessEntropy(gi, pw, feedback_matrix, word_indecies, ent_table);

            if (ent > best_entropy) {
                best_entropy = ent;
                best_guess = gi;
            }
        }

        second_guesses[p] = best_guess;
    }
    
    fs.writeFileSync(`./data/proc/second_guesses.bin`, second_guesses);
    console.log(`Wrote second guesses to ./data/proc/second_guesses.json`)
} catch (err) {
    console.error(err);
}