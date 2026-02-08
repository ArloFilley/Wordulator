const GREEN = "2";
const YELLOW = "1";
const INACTIVE = 0;
const ACTIVE = 1;
const SET = 2;



const click = new Audio("/audio/click.wav");
click.volume = 1;
click.currentTime = 0;

const best_guesses = new Array(6);
let current_row = 0;

window.addEventListener("load", () => {
    loadSFX();
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
                // Pop Animation
                cell.classList.add("cell-pop");
                setTimeout(() => { cell.classList.remove("cell-pop") }, 200)

                // Click Noise
                playClick();
                
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

    setInterval(getCurrentGuess, 1000);
});

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
    fetch('/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
}

async function getCurrentGuess() {
    const res = await fetch('/current_guess');
    const data = await res.json();
    const guess = data.guess.toUpperCase();

    document.getElementById('best-guess').textContent = `Current Best Guess: ${guess}`

    return;
}