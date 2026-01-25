const GREEN = 2;
const YELLOW = 1;
const GREY = 0;

const NOT_FIXED = -1;

const BANNED = 1;

class Wordle {
    /** 
     * @param {boolean} known 
     * @param {string} answer 
     */
    constructor(known, answer) {
        // Conditions
        /** @type {Int8Array} */
        this.min_counts = new Int8Array(26);
        /** @type {Int8Array} */
        this.max_counts = new Int8Array(26).fill(5);
        /** 
         * character codes of fixed positions if known | -1 stored if no letter yet fixed
         * @type {Int8Array} 
         */
        this.fixed_positions = new Int8Array(5).fill(-1); 
        /** 
         * 
         * @type {Int8Array} 
         */
        this.banned_positions = new Int8Array(26 * 5); // 0 not banned, 1 banned

        this.known = known;

        // Answer, used for automated feedback
        if (known) {
            this.answer = answer;
            this.answer_letter_counts = new Int8Array(26);
            for (let i = 0; i < 5; i++) {
                const char_code = answer.charCodeAt(i) - 97;
                this.answer_letter_counts[char_code] += 1;
            }
        }
    }

    /**
     * Provides Feedback in the form a 16bit integer:
     *          T  A  R  E  S
     *          2  1  0  0  0
     * 00_00_00_10_01_00_00_00
     * @param {string} guess
     * @param {string} answer
     * @returns {number}
     */
    evaluateGuess(guess) {
        if (!this.known) MELTDOWN("Can't evaluate guess with unkown answer");

        const guess_counts = new Int8Array(26);
        let pattern = 0;

        // Greens
        for (let i = 0; i < 5; i++) {
            const guess_letter = guess.charCodeAt(i) - 97;
            const answer_letter = this.answer.charCodeAt(i) - 97;
            if (guess_letter === answer_letter) {
                pattern = writePatternPosition(pattern, i, GREEN)
                guess_counts[guess_letter] += 1;
            }
        }

        // Yellows
        for (let i = 0; i < 5; i++) {
            const guess_letter = guess.charCodeAt(i) - 97;
            const answer_letter = this.answer.charCodeAt(i) - 97;

            if (guess_letter === answer_letter) continue;
            else if (guess_counts[guess_letter] < this.answer_letter_counts[guess_letter]) {
                pattern = writePatternPosition(pattern, i, YELLOW);
                guess_counts[guess_letter] += 1;
            }
        }

        // Greys are encoded by default. No need to reencode

        return pattern;
    }

    /**
     * @param {string} guess
     * @param {number} pattern
     */
    updateConditions(guess, pattern) {
        const min_counts = new Int8Array(26);
        const max_counts = new Int8Array(26).fill(5);

        // Set Min Using Green & Yellow Input
        for (let word_pos = 0; word_pos < 5; word_pos++) {
            const letter = guess.charCodeAt(word_pos) - 97;
            const letter_colour = readPatternPosition(pattern, word_pos);

            // Update min counts
            if (letter_colour === YELLOW || letter_colour === GREEN) {
                min_counts[letter] += 1;
            }

            // set fixed and banned positions
            if (letter_colour === GREEN) {
                if (this.hasFixedCharacter(word_pos)) {
                    if (this.fixed_positions[word_pos] !== letter) MELTDOWN("Can't fix 2 letters in 1 position");
                } else {
                    this.fixPosition(letter, word_pos);
                }
            } else if (letter_colour === YELLOW) {
                if (this.fixed_positions[word_pos] === letter) {
                    MELTDOWN("Can't fix and ban a letter at same position");
                }
                this.banPosition(letter, word_pos);
            }
        }

        // Set Max Using Grey Input
        for (let word_pos = 0; word_pos < 5; word_pos++) {
            const letter = guess.charCodeAt(word_pos) - 97;
            const letter_colour = readPatternPosition(pattern, word_pos);
            if (letter_colour === GREY) max_counts[letter] = min_counts[letter];
        }

        for (let letter = 0; letter < 26; letter++) {
            if (min_counts[letter] > max_counts[letter]) MELTDOWN("Can't have min count greater than max count for letter");
            this.min_counts[letter] = Math.max(this.min_counts[letter], min_counts[letter]);
            this.max_counts[letter] = Math.min(this.max_counts[letter], max_counts[letter])
            if (this.min_counts[letter] > this.max_counts[letter]) MELTDOWN("Can't have min count greater than max count for letter");
        }
    }

    /**
     * Checks if a word meets conditions with the min, max, fixed, and banned position of characters
     * @param {string} word
     * @returns {boolean}
     */
    meetsConditions(word) {
        const letter_counts = new Int8Array(26);

        for (let i = 0; i < 5; i++) {
            const letter = word.charCodeAt(i) - 97;
            if (this.isBanned(letter, i)) return false;
            letter_counts[letter] += 1;
        }

        for (let i = 0; i < 26; i++) {
            if (letter_counts[i] > this.max_counts[i]) return false;
            if (letter_counts[i] < this.min_counts[i]) return false;
        }

        for (let i = 0; i < 5; i++) {
            const letter = word.charCodeAt(i) - 97;
            if (this.hasFixedCharacter(i) && this.fixed_positions[i] !== letter) return false;
        }

        return true;
    }

    /**
     * Checks if a character code is banned from a position
     * @param {Number} char_code 
     * @param {Number} word_pos 
     */
    isBanned(char_code, word_pos) {
        return this.banned_positions[char_code * 5 + word_pos] === BANNED;
    }

    /** 
     * Bans a character code from appearing at a certain word position
     * @param {Number} char_code 
     * @param {Number} word_pos 
     */
    banPosition(char_code, word_pos) {
        this.banned_positions[char_code * 5 + word_pos] = BANNED;
    }

    /**
     * Checks if the word position has a fixed character code
     * @param {Number} word_pos 
     * @returns 
     */
    hasFixedCharacter(word_pos) {
        return this.fixed_positions[word_pos] !== NOT_FIXED;
    }

    /** 
     * Fixes a character code to a word position
     * @param {Number} char_code 
     * @param {Number} word_pos 
     */
    fixPosition(char_code, word_pos) {
        this.fixed_positions[word_pos] = char_code;
    }
}

/**
 * Reads the two bits that each position i that encode green, yellow, or grey 
 * @param {number} pattern 
 * @param {number} word_pos 
 */
function readPatternPosition(pattern, word_pos) {
    return (pattern >> (word_pos * 2)) & 0b11;
}

/**
 * Writes the two bits that in position i that encode green, yellow, or grey 
 * @param {number} pattern 
 * @param {number} word_pos 
 * @param {number} data 
 * @return {number}
 */
function writePatternPosition(pattern, word_pos, data) {
    return pattern |= data << (word_pos * 2);
}


/**
 * Certainly one of the ways ever of debugging
 * ! WARNING ! LITERRALY SHUTS THE PROGRAM DOWN AFTER SENDING ERROR MESSAGE
 * @param {string} error 
 */
function MELTDOWN(error) {
    console.error(error);
    process.exit(1);
}

/**
 * Returns an encoded pattern based on user input strings
 * @param {string} green 
 * @param {string} yellow 
 * @return {number}
 */
function patternFromUserInput(green, yellow) {
    if (green.length < 5) green = green.padEnd(5, '.')
    if (yellow.length < 5) yellow = yellow.padEnd(5, '.')    

    let pattern = 0;

    for (let i = 0; i < 5; i++) {
        if (green[i] !== '.') pattern = writePatternPosition(pattern, i, GREEN)
        if (yellow[i] !== '.') pattern = writePatternPosition(pattern, i, YELLOW)
        // Greys are encoded by default. No need to reencode
    }

    return pattern;
}

module.exports = { Wordle, patternFromUserInput }