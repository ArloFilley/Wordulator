/** Filters words down to a valid list based on a given length and preset character set */
const fs = require('node:fs');

try {
    const args = process.argv.slice(2);
    const read_file = fs.existsSync(args[0]) ? args[0] : () => { throw "Read File Not Found" };
    const write_file = args[1];
    const desired_word_length = typeof(args[2]) === Number ? args[2] : 5;

    const data = fs.readFileSync(read_file, 'utf8');
    const words = data.split('\n');

    const valid_words = new Array(0);
    const valid_chars = new Array(25);
    for (let i = 97; i <= 122; i++) {
        valid_chars.push(String.fromCharCode(i));
    }

    for (let word of words) {
        word = word.toLowerCase();
        let word_is_valid = (word.length === desired_word_length);

        for (const letter of word) {
            if (!word_is_valid) break;
            word_is_valid = word_is_valid && valid_chars.includes(letter);
        }

        if (word_is_valid) valid_words.push(word);
    }

    fs.writeFileSync(`${write_file}`, JSON.stringify(valid_words, null, 4));
    console.log(`Wrote ${valid_words.length} Valid Words to ${write_file}`);
    process.exit(0)
} catch (err) {
    console.error(err);
}
