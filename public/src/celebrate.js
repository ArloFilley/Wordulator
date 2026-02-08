const DURATION_MS = 2000;
const WORDLE_GREEN = '#538D4E';
const WORDLE_YELLOW = '#B59F3B';
const other_colors = ['#F3C237', '#d7e200', '#f33737', '#37f340']

function customConfetti() {
    confetti({
        particleCount: 300,
        spread: 90,
        origin: { y: 0.8 },
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
}