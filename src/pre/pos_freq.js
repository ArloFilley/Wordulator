/** Precomuputes Frequencies of Letters in Words */
const fs = require('node:fs');

const { calculatePosFreq } = require('../lib/heuristic.js')


try {
    const args = process.argv.slice(2);
    const words_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Words File Not Found" };
    const write_dir  = fs.existsSync(args[1]) ? args[1] : () => { throw "Write Dir Not Found" };

    let words = JSON.parse(fs.readFileSync(words_file));

    let positional_frequencies = calculatePosFreq(words)

    fs.writeFileSync(`${write_dir}/pos_freq.json`, JSON.stringify(positional_frequencies, null, 4));
    console.log(`Positional Frequencies Written to ${write_dir}/pos_freq.json`);
} catch (err) {
    console.error(err);
}