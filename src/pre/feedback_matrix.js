/** Precomputes a frequency matrix for a given set of words */
const fs = require('fs');

const { entropyFeedback } = require('../lib/entropy.js');


try {
    const args = process.argv.slice(2);
    const words_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Words File Not Found" };
    const write_dir  = fs.existsSync(args[1]) ? args[1] : () => { throw "Write Dir Not Found" };
    
    const words = JSON.parse(fs.readFileSync(words_file));
    const matrix = new Uint8Array(words.length**2);
    const wl = words.length;
    
    for (let gi=0; gi < wl; gi++) {
        const guess = words[gi];

        for (let ai; ai < wl; ai++) {
            const answer = words[ai];
            const pattern = entropyFeedback(guess, answer);
            matrix[gi * wl + ai] = pattern;
        }

        if (gi % 100 === 0) {
            console.log(`Computed ${gi}/${words.length}`);
        }
    }

    fs.writeFileSync(`${write_dir}/feedback_matrix.bin`, matrix);
    console.log(`Feedback matrix written to ${write_dir}/feedback_matrix.bin`);
} catch (err) {
    console.error(err);
}

