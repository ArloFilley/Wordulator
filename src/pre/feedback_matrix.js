/** Precomputes a frequency matrix for a given set of words */
const fs = require('fs');

const { entropyFeedback } = require('../lib/entropy.js');

try {
    const args = process.argv.slice(2);
    const words_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Words File Not Found" };
    const write_file  = args[1];
    
    const words = JSON.parse(fs.readFileSync(words_file));
    const matrix = new Uint8Array(words.length**2);
    const wl = words.length;
    
    for (let gi=0; gi < wl; gi++) {
        const guess = words[gi];

        for (let ai = 0; ai < wl; ai++) {
            const answer = words[ai];
            const pattern = entropyFeedback(guess, answer);
            matrix[gi * wl + ai] = pattern;
        }

        if (gi % 1000 === 0) {
            console.log(`Computed ${gi}/${words.length}`);
        }
    }

    fs.writeFileSync(`${write_file}`, matrix);
    console.log(`Feedback matrix written to ${write_file}`);
    process.exit(0);
} catch (err) {
    console.error(err);
}

