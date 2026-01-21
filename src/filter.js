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
            !line.includes(`'`) &&
            !line.includes(`2`)
        ) {
            filtered_lines.push(line.toLowerCase())
        }
    }

    console.log(`words: ${filtered_lines.length}`);
    filtered_lines = JSON.stringify(filtered_lines);

    fs.writeFileSync('./data/words.json', filtered_lines)
    
} catch (err) {
    console.error(err);
}
