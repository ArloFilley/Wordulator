const DURATION_MS = 2000;
const WORDLE_GREEN = '#538D4E';
const WORDLE_YELLOW = '#B59F3B';
const other_colors = ['#F3C237', '#d7e200', '#f33737', '#37f340']

function customConfetti() {
    confetti({
        particleCount: 25,
        spread: 90,
        angle: 270, // 0° is East - Bearing 90 | Rotates CCW
        origin: { x: 0.5, y: -0.2 }, // TOP-CENTER
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
    confetti({
        particleCount: 25,
        spread: 90,
        angle: 315, // 0° is East - Bearing 90 | Rotates CCW
        origin: { x: 0, y: -0.2 }, // TOP-LEFT
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
    confetti({
        particleCount: 25,
        spread: 90,
        angle: 225, // 0° is East - Bearing 90 | Rotates CCW
        origin: { x: 1, y: -0.2 }, // TOP-RIGHT
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
    confetti({
        particleCount: 25,
        spread: 90,
        angle: -270, // 0° is East - Bearing 90 | Rotates CCW
        origin: { x: 0.5, y: 1.2 }, // BOTTOM-CENTER
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
    confetti({
        particleCount: 25,
        spread: 90,
        angle: -315, // 0° is East - Bearing 90 | Rotates CCW
        origin: { x: 0, y: 1.2 }, // BOTTOM-LEFT
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
    confetti({
        particleCount: 25,
        spread: 90,
        angle: -225, // 0° is East - Bearing 90 | Rotates CCW
        origin: { x: 1, y: 1.2 }, // BOTTOM-RIGHT
        colors: [WORDLE_GREEN, WORDLE_YELLOW, ...other_colors],
    });
}