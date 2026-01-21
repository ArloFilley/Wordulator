function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function count(word, char) {
    let count = 0;
    for (let letter of word) {
        if (letter === char) { count++ }
    }
    
    return count
}

module.exports = { getRandomInt, count }