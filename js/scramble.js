/**
 * WCA 3x3 Scramble Generator
 * Generates official-style 3x3 Rubik's Cube scrambles (19-25 moves).
 * Prevents redundant consecutive face turns (e.g. R R, R R') and opposite cancellations (e.g. R L R).
 */

const ScrambleGenerator = (() => {
    const FACES = ['U', 'D', 'F', 'B', 'R', 'L'];
    const MODIFIERS = ['', "'", '2'];

    // Face axis mapping to prevent redundant opposite axis sequences
    const AXIS = {
        'U': 0, 'D': 0, // Y-axis
        'F': 1, 'B': 1, // Z-axis
        'R': 2, 'L': 2, // X-axis
    };

    /**
     * Generate a 3x3 scramble string
     * @param {number} length Number of moves (default 21)
     * @returns {string} Space-separated scramble moves
     */
    function generate3x3(length = 21) {
        const moves = [];
        let lastFace = -1;
        let secondLastFace = -1;

        for (let i = 0; i < length; i++) {
            let faceIdx;

            do {
                faceIdx = Math.floor(Math.random() * FACES.length);
            } while (
                // Don't repeat the exact same face consecutively (e.g., R R)
                faceIdx === lastFace ||
                // Don't repeat face on same axis if middle move is on same axis (e.g. R L R or U D U)
                (secondLastFace !== -1 &&
                 AXIS[FACES[faceIdx]] === AXIS[FACES[lastFace]] &&
                 AXIS[FACES[faceIdx]] === AXIS[FACES[secondLastFace]])
            );

            secondLastFace = lastFace;
            lastFace = faceIdx;

            const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
            moves.push(FACES[faceIdx] + modifier);
        }

        return moves.join(' ');
    }

    return {
        generate3x3,
    };
})();
