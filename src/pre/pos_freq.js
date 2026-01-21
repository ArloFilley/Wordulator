/** Precomuputes Frequencies of Letters in Words */
const fs = require('node:fs');


try {
    const args = process.argv.slice(2);
    const words_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Words File Not Found" };
    const write_dir  = fs.existsSync(args[1]) ? args[1] : () => { throw "Write Dir Not Found" };

    let words = JSON.parse(fs.readFileSync(words_file));

    let positional_frequencies = Array.from({length: 5}, () => ({}));

    for (const word of words) {
        for (let i = 0; i < 5; i++) {
            const char = word[i];
            positional_frequencies[i][char] = (positional_frequencies[i][char] || 0) + 1;
        }
    }

    fs.writeFileSync(`${write_dir}/pos_freq.json`, JSON.stringify(positional_frequencies, null, 4));
    console.log(`Positional Frequencies Written to ${write_dir}/pos_freq.json`);
} catch (err) {
    console.error(err);
}