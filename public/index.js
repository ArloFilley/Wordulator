const GREEN = "2";
const YELLOW = "1";

const best_guesses = new Array(6);
let current_row = 0;

window.addEventListener("load", () => {
    document.querySelectorAll('.cell').forEach((cell, index) => {
        cell.addEventListener('click', () => {
            let state = parseInt(cell.dataset.state);
            state = (state + 1) % 3;  // cycle 0 → 1 → 2 → 0
            cell.dataset.state = state;
        });
    });

    document.querySelectorAll('.row')[0].querySelectorAll('.cell')[0].focus();

    document.querySelectorAll('.row').forEach(row => {
        const cells = row.querySelectorAll('.cell');

        cells.forEach((cell, index) => {
            cell.addEventListener('input', () => {
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
            data.yellow += '.';
        } else if (cell.dataset.state === YELLOW) {
            data.yellow += cell.value;
            data.green += '.';
        } else {
            data.green += '.';
            data.yellow += '.';
        }
    });

    return data;
}

function sendRowFeedback() {
    const data = getRowFeedback(current_row);
    fetch('/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    current_row += 1;
    document.querySelectorAll('.row')[current_row].querySelectorAll('.cell')[0].focus();
}

async function getCurrentGuess() {
    const res = await fetch('/current_guess');
    const data = await res.json();
    const guess = data.guess.toUpperCase();

    document.getElementById('best-guess').textContent = `Current Best Guess: ${guess}`

    return;
}