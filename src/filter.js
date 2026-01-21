const fs = require('node:fs');

try {
    const data = fs.readFileSync('./data/words.txt', 'utf8');
    let lines = data.split('\n');
    let filtered_lines = []

    for (let line of lines){
        if (line.length === 5 && 
            !line.includes('-') &&
            !line.includes(',') &&
            !line.includes('.') &&
            !line.includes('/') &&
            !line.includes(`'`)
        ) {
            filtered_lines.push(line.toLowerCase())
        }
    }

    filtered_lines = JSON.stringify(filtered_lines);

    fs.writeFileSync('./filtered_long_words.json', filtered_lines)
    console.log(filtered_lines.length);
} catch (err) {
    console.error(err);
}
