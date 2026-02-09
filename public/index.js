const GREEN = "2";
const YELLOW = "1";
const GREY = "0";
const INACTIVE = 0;
const ACTIVE = 1;
const SET = 2;

const best_guesses = new Array(6);
const wordulator_guesses = new Array(6);
let current_row = 0;
let GAME_ID = genGameID(16);
let PLAY_MODE = "AUTO";
let total_guesses = 0;
let answers_left = [];

window.addEventListener("load", onFirstLoad);

async function onFirstLoad() {
    startNewGame();
    document.getElementById('game-id').textContent = `GAMEID: ${GAME_ID}`
    await loadSFX();
    document.querySelectorAll('.cell').forEach((cell, _index) => {
        cell.addEventListener("mousedown", e => {
            e.preventDefault(); // stops focus from clicking on cells
        });

        cell.addEventListener('click', () => {
            let state = parseInt(cell.dataset.state);
            if (parseInt(cell.dataset.active) !== ACTIVE) return;
            state = (state + 1) % 3;  // cycle 0 → 1 → 2 → 0
            cell.dataset.state = state;
        });
    });

    document.querySelectorAll('.row')[0].querySelectorAll('.cell')[0].focus();

    document.querySelectorAll('.row').forEach(row => {
        const cells = row.querySelectorAll('.cell');

        cells.forEach((cell, index) => {
            cell.addEventListener('input', () => {
                cell.classList.add("cell-pop"); // Pop Animation
                playClick(); // Click Sound
                setTimeout(() => { cell.classList.remove("cell-pop") }, 200) // Animation Cleanup
                // move focus to next cell if exists
                if (cell.value.length === 1 && index < cells.length - 1) {
                    cells[index + 1].focus();
                }
            });

            // handle backspace: jump back to previous cell if empty
            cell.addEventListener('keydown', e => {
                if (e.key === 'Backspace' && cell.value === '' && index > 0) {
                    cells[index - 1].focus();
                }
            });
        });
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            sendRowFeedback();
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'ArrowUp') {
            changeRowState(1);
        } else if (e.key === 'ArrowDown') {
            changeRowState(-1);
        }
    });

    if (PLAY_MODE === "AUTO") getCurrentGuess();
}

function getRowFeedback(rowIndex) {
    let greens = 0;
    const rows = document.querySelectorAll('.row');
    const row = rows[rowIndex];
    const cells = row.querySelectorAll('.cell');
    const data = {
        guess: "",
        green: "",
        yellow: ""
    }

    cells.forEach(cell => {
        data.guess += cell.value;
        if (cell.dataset.state === GREEN) {
            data.green += cell.value;
            greens += 1;
            data.yellow += '.';
        } else if (cell.dataset.state === YELLOW) {
            data.yellow += cell.value;
            data.green += '.';
        } else {
            data.green += '.';
            data.yellow += '.';
        }
    });

    return { is_solved: greens === cells.length, data };
}

function sendRowFeedback() {
    const { is_solved, data } = getRowFeedback(current_row);
    fetch(`/guess/${GAME_ID}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (is_solved) { 
        setTimeout(customConfetti, 0); 
        setTimeout(playWinSound, 200);
        setTimeout(playBalloonPopSound, 10); 
        return; 
    }

    const rows = document.querySelectorAll('.row');
    
    // Set The Row That's Been Sent
    const set_row = rows[current_row];
    const set_cells = set_row.querySelectorAll('.cell');
    for (let i = 0; i < set_cells.length; i++) set_cells[i].dataset.active = SET;

    // Update The Row We Care About
    current_row += 1;
    
    // Set New Row To Be Active
    const now_active_row = rows[current_row];
    const now_active_cells = now_active_row.querySelectorAll('.cell');
    for (let i = 0; i < now_active_cells.length; i++) now_active_cells[i].dataset.active = ACTIVE;

    // Focus On First Cell in New Row
    document.querySelectorAll('.row')[current_row].querySelectorAll('.cell')[0].focus();

    setTimeout(getCurrentGuess, 800);
}

function changeMode() {
    let button = document.getElementById('mode');

    if (button.dataset.state !== "AUTO") {
        button.textContent = "Disable Auto Mode";
        button.dataset.state = "AUTO";
        PLAY_MODE = "AUTO"
        getCurrentGuess();
    } else {
        button.textContent = "Enable Auto Mode";
        button.dataset.state = "MANUAL";
        PLAY_MODE = "MANUAL"
    }
}

async function getCurrentGuess() {
    const res = await fetch(`/current_guess/${GAME_ID}`)
    const data = await res.json();
    const guess = data.guess.toUpperCase();
    total_guesses = data.guess_no;
    answers_left.push(data.answers_left);

    document.getElementById('best-guess').textContent = `Current Best Guess: ${guess}`

    if (PLAY_MODE === "AUTO") {
        const guess = data.guess.toLowerCase();
        const rows = document.querySelectorAll('.row');
        const row = rows[current_row];
        const cells = row.querySelectorAll('.cell');
        for (let i = 0; i < cells.length; i++) {
            setTimeout((cell, char) => { 
                cell.value = char;
                cell.classList.add("cell-pop");
                playClick();
                cell.focus();
                setTimeout(() => { cell.classList.remove("cell-pop") }, 200)
            }, 100 * i, cells[i], guess[i]);
        }
    }

    return;
}

async function changeRowState(direction) {
    const rows = document.querySelectorAll('.row');
    const row = rows[current_row];
    const cells = row.querySelectorAll('.cell');
    const current_state = parseInt(cells[0].dataset.state);
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        let state = parseInt(cell.dataset.state);
        state = (current_state + direction) % 3;  // cycle 0 → 1 → 2 → 0
        cell.dataset.state = state;
    }

    return;
}

async function startNewGame() {
    try {
        const res = await fetch('/start_new_game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: GAME_ID })
        });
        if (!res.ok) throw "Failed To Start New Game";
    } catch (e) {
        console.log(`UH OH SPAGHETTIO: ${err}`);
    }
}


function genGameID(N) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxzy0123456789*&';
    let result = '!';

    for (let i = 0; i < N; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }

    console.log(`GAME_ID: ${result}`)
    return result;
}

function shareResult() {
    let share_text = '!!!!GET WORDULATED!!!!\n'
    share_text += `ONLY ${total_guesses}/6 Guesses Required`;
    share_text += '\n\n';

    share_text += '- No - Guess Breakdown - Answers Left -\n';
    const rows = document.querySelectorAll('.row');
    for (let i = 0; i < total_guesses; i++) {
        share_text += `  #${i} : `
        const row = rows[i];
        const cells = row.querySelectorAll('.cell');
        for (let j = 0; j < 5; j++) {
            const cell = cells[j];
            switch (cell.dataset.state) {
                case GREEN:  share_text += '🟩'; break;
                case YELLOW: share_text += '🟨'; break;
                case GREY:   share_text += '⬛'; break;
                default:     share_text += '🟪'; break;
            }
        }
        share_text += `      : ${answers_left[i]}`;
        share_text += '\n';
    }

    share_text += '\n';
    share_text += 'read ya later';
    console.log(share_text);
    navigator.clipboard.writeText(share_text);
    alert("results copied to clipboard");
}