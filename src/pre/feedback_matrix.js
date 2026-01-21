/** Precomputes a frequency matrix for a given set of words */
const fs = require('fs');

const { entropyFeedback, encodePattern } = require('../lib/entropy.js');


try {
    const args = process.argv.slice(2);
    const words_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Words File Not Found" };
    const write_dir  = fs.existsSync(args[1]) ? args[1] : () => { throw "Write Dir Not Found" };
    
    const words = JSON.parse(fs.readFileSync(words_file));
    const matrix = new Uint8Array(words.length**2);
    
    for (const guess_idx in words) {
        const guess = words[guess_idx];

        for (const answer_idx in words) {
            const answer = words[answer_idx];
            const pattern = entropyFeedback(guess, answer);
            matrix[guess_idx * words.length + answer_idx] = encodePattern(pattern);
        }

        if (guess_idx % 100 === 0) {
            console.log(`Computed ${guess_idx}/${words.length}`);
        }
    }

    fs.writeFileSync(`${write_dir}/feedback_matrix.bin`, matrix);
    console.log(`Feedback matrix written to ${write_dir}/feedback_matrix.bin`);
} catch (err) {
    console.error(err);
}

