/**
 * Cube State Manager
 * Manages the 54-sticker Rubik's Cube state, validation, and format conversions.
 * 
 * Face order: U (Up/White), R (Right/Red), F (Front/Green), D (Down/Yellow), L (Left/Orange), B (Back/Blue)
 * Each face has 9 stickers indexed 0-8 (row-major, top-left to bottom-right when looking at face):
 *   0 1 2
 *   3 4 5
 *   6 7 8
 */

const CubeState = (() => {
    // Default color mapping
    const DEFAULT_COLORS = {
        U: '#FFFFFF', // White
        R: '#B71234', // Red
        F: '#009B48', // Green
        D: '#FFD500', // Yellow
        L: '#FF5800', // Orange
        B: '#0046AD', // Blue
    };

    const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];
    const FACE_INDICES = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };

    // Create a solved cube state
    function createSolved() {
        const state = {};
        FACE_NAMES.forEach(face => {
            state[face] = new Array(9).fill(face);
        });
        return state;
    }

    // Create an empty cube (all gray/unset)
    function createEmpty() {
        const state = {};
        FACE_NAMES.forEach(face => {
            state[face] = new Array(9).fill(null);
        });
        // Center stickers are always fixed
        FACE_NAMES.forEach(face => {
            state[face][4] = face;
        });
        return state;
    }

    // Deep clone a state
    function clone(state) {
        const copy = {};
        FACE_NAMES.forEach(face => {
            copy[face] = [...state[face]];
        });
        return copy;
    }

    // Validate that a cube state is physically valid (correct number of each color)
    function validate(state) {
        const errors = [];
        const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };

        // Check all stickers are filled
        for (const face of FACE_NAMES) {
            for (let i = 0; i < 9; i++) {
                if (!state[face][i]) {
                    errors.push(`Face ${face}, sticker ${i} is not set`);
                } else {
                    counts[state[face][i]]++;
                }
            }
        }

        if (errors.length > 0) {
            return { valid: false, errors };
        }

        // Check each color appears exactly 9 times
        for (const face of FACE_NAMES) {
            if (counts[face] !== 9) {
                errors.push(`Color ${face} appears ${counts[face]} times (expected 9)`);
            }
        }

        // Check center stickers match their face
        for (const face of FACE_NAMES) {
            if (state[face][4] !== face) {
                errors.push(`Center of ${face} face should be ${face}, got ${state[face][4]}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Convert cube state to the solver's input format.
     * The solver expects a string of edge and corner pieces described by their face colors.
     * Format: 12 edges (3 chars each) + 8 corners (4 chars each)
     * 
     * Edges: UF, UR, UB, UL, DF, DR, DB, DL, FR, FL, BR, BL
     * Corners: UFR, URB, UBL, ULF, DRF, DFL, DLB, DBR
     */
    function toSolverFormat(state) {
        // Edge definitions: [face1, sticker1, face2, sticker2]
        const edges = [
            ['U', 7, 'F', 1], // UF
            ['U', 5, 'R', 1], // UR
            ['U', 1, 'B', 1], // UB
            ['U', 3, 'L', 1], // UL
            ['D', 1, 'F', 7], // DF
            ['D', 5, 'R', 7], // DR
            ['D', 7, 'B', 7], // DB
            ['D', 3, 'L', 7], // DL
            ['F', 5, 'R', 3], // FR
            ['F', 3, 'L', 5], // FL
            ['B', 3, 'R', 5], // BR
            ['B', 5, 'L', 3], // BL
        ];

        // Corner definitions: [face1, sticker1, face2, sticker2, face3, sticker3]
        const corners = [
            ['U', 8, 'F', 2, 'R', 0], // UFR
            ['U', 2, 'R', 2, 'B', 0], // URB
            ['U', 0, 'B', 2, 'L', 0], // UBL
            ['U', 6, 'L', 2, 'F', 0], // ULF
            ['D', 2, 'R', 6, 'F', 8], // DRF
            ['D', 0, 'F', 6, 'L', 8], // DFL
            ['D', 6, 'L', 6, 'B', 8], // DLB
            ['D', 8, 'B', 6, 'R', 8], // DBR
        ];

        let result = '';

        // Edges: each edge is 3 chars: color1 + color2 + color1
        for (const [f1, s1, f2, s2] of edges) {
            const c1 = state[f1][s1];
            const c2 = state[f2][s2];
            result += c1 + c2 + ' ';
        }

        // Corners: each corner is 4 chars: color1 + color2 + color3 + color1
        for (const [f1, s1, f2, s2, f3, s3] of corners) {
            const c1 = state[f1][s1];
            const c2 = state[f2][s2];
            const c3 = state[f3][s3];
            result += c1 + c2 + c3 + ' ';
        }

        return result.trim();
    }

    /**
     * Apply a single move to the cube state.
     * Moves: U, U', U2, D, D', D2, F, F', F2, B, B', B2, R, R', R2, L, L', L2
     */
    function applyMove(state, move) {
        const s = clone(state);
        const face = move[0];
        const modifier = move.length > 1 ? move[1] : '';

        let times = 1;
        if (modifier === "'") times = 3;
        if (modifier === "2") times = 2;

        for (let t = 0; t < times; t++) {
            rotateFaceCW(s, face);
        }

        return s;
    }

    // Rotate face stickers clockwise (just the face itself)
    function rotateFaceCW(state, face) {
        const f = state[face];
        const temp = [f[0], f[1], f[2], f[3], f[4], f[5], f[6], f[7], f[8]];
        f[0] = temp[6]; f[1] = temp[3]; f[2] = temp[0];
        f[3] = temp[7]; /* f[4] center */ f[5] = temp[1];
        f[6] = temp[8]; f[7] = temp[5]; f[8] = temp[2];

        // Rotate adjacent edges
        rotateAdjacentEdges(state, face);
    }

    // Rotate the edge stickers adjacent to a face (clockwise)
    function rotateAdjacentEdges(state, face) {
        // Define which stickers move for each face rotation (CW)
        // [face, index] groups of 3, cycled: group0 -> group1 -> group2 -> group3 -> group0
        const adjacency = {
            U: [
                ['F', 0], ['F', 1], ['F', 2],
                ['L', 0], ['L', 1], ['L', 2],
                ['B', 0], ['B', 1], ['B', 2],
                ['R', 0], ['R', 1], ['R', 2],
            ],
            D: [
                ['F', 6], ['F', 7], ['F', 8],
                ['R', 6], ['R', 7], ['R', 8],
                ['B', 6], ['B', 7], ['B', 8],
                ['L', 6], ['L', 7], ['L', 8],
            ],
            F: [
                ['U', 6], ['U', 7], ['U', 8],
                ['R', 0], ['R', 3], ['R', 6],
                ['D', 2], ['D', 1], ['D', 0],
                ['L', 8], ['L', 5], ['L', 2],
            ],
            B: [
                ['U', 2], ['U', 1], ['U', 0],
                ['L', 0], ['L', 3], ['L', 6],
                ['D', 6], ['D', 7], ['D', 8],
                ['R', 8], ['R', 5], ['R', 2],
            ],
            R: [
                ['U', 2], ['U', 5], ['U', 8],
                ['B', 6], ['B', 3], ['B', 0],
                ['D', 2], ['D', 5], ['D', 8],
                ['F', 2], ['F', 5], ['F', 8],
            ],
            L: [
                ['U', 0], ['U', 3], ['U', 6],
                ['F', 0], ['F', 3], ['F', 6],
                ['D', 0], ['D', 3], ['D', 6],
                ['B', 8], ['B', 5], ['B', 2],
            ],
        };

        const adj = adjacency[face];
        // Save the last group (indices 9-11)
        const saved = [
            state[adj[9][0]][adj[9][1]],
            state[adj[10][0]][adj[10][1]],
            state[adj[11][0]][adj[11][1]],
        ];

        // Shift groups: 3->2->1->0, then saved->3
        for (let g = 3; g > 0; g--) {
            for (let i = 0; i < 3; i++) {
                const src = adj[(g - 1) * 3 + i];
                const dst = adj[g * 3 + i];
                state[dst[0]][dst[1]] = state[src[0]][src[1]];
            }
        }
        // Put saved into first group
        state[adj[0][0]][adj[0][1]] = saved[0];
        state[adj[1][0]][adj[1][1]] = saved[1];
        state[adj[2][0]][adj[2][1]] = saved[2];
    }

    /**
     * Apply a sequence of moves (space-separated string) to the cube state.
     */
    function applyMoves(state, movesStr) {
        if (!movesStr || !movesStr.trim()) return state;
        let s = clone(state);
        const moves = parseMoves(movesStr);
        for (const move of moves) {
            s = applyMove(s, move);
        }
        return s;
    }

    /**
     * Parse a move string like "R U R' U2 F2" into an array of moves.
     */
    function parseMoves(movesStr) {
        const moves = [];
        const tokens = movesStr.trim().split(/\s+/);
        for (const token of tokens) {
            if (!token) continue;
            moves.push(token);
        }
        return moves;
    }

    /**
     * Get the color hex for a sticker value
     */
    function getColor(value, colorMap) {
        const colors = colorMap || DEFAULT_COLORS;
        return colors[value] || '#333333';
    }

    /**
     * Check if cube is solved
     */
    function isSolved(state) {
        for (const face of FACE_NAMES) {
            for (let i = 0; i < 9; i++) {
                if (state[face][i] !== face) return false;
            }
        }
        return true;
    }

    return {
        DEFAULT_COLORS,
        FACE_NAMES,
        FACE_INDICES,
        createSolved,
        createEmpty,
        clone,
        validate,
        toSolverFormat,
        applyMove,
        applyMoves,
        parseMoves,
        getColor,
        isSolved,
    };
})();
