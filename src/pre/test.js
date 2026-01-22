/** Precomuputes Frequencies of Letters in Words */
const fs = require('node:fs');

const { randomInt } = require('../lib/lib.js')


try {
    const args = process.argv.slice(2);
    const words_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Words File Not Found" };
    const write_dir  = fs.existsSync(args[1]) ? args[1] : () => { throw "Write Dir Not Found" };
    const test_num    = args[2] > 0 ? Number.parseInt(args[2])  : () => { throw "Number of Tests Not Found/Specified" };

    const words = JSON.parse(fs.readFileSync(words_file));
    const wl = words.length;
    const test_words = new Array(test_num);

    for (let i=0; i<test_num; i++) {
        test_words[i] = words[randomInt(wl)]
    }

    fs.writeFileSync(`${write_dir}/tests.json`, JSON.stringify(test_words, null, 4));
    console.log(`Tests Written to ${write_dir}/tests.json`);
} catch (err) {
    console.error(err);
}