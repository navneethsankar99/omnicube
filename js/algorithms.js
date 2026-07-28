/**
 * CFOP Algorithm Database
 * Contains F2L, OLL, and PLL algorithms with diagram patterns.
 * 
 * Diagram patterns for OLL/PLL use a 3x3 grid where:
 * - 1 = yellow (oriented/correct)
 * - 0 = not oriented
 * 
 * For PLL, arrows show permutation cycles.
 */

const Algorithms = (() => {

    // ===== OLL Algorithms (57 cases) =====
    // Pattern: 3x3 top face, 1 = yellow facing up, 0 = not
    // basic: true = included in 2-Look OLL (minimum required set)
    // basicGroup: "edges" = Edge Orientation (get the cross), "corners" = Corner Orientation
    const OLL = [
        { id: 1, name: "OLL 1", aka: "Dot", pattern: [0,0,0, 0,1,0, 0,0,0], algo: "R U2 R2 F R F' U2 R' F R F'" },
        { id: 2, name: "OLL 2", aka: "Dot", pattern: [0,0,0, 0,1,0, 0,0,0], algo: "r U r' U2 r U2 R' U2 R U' r'" },
        { id: 3, name: "OLL 3", aka: "Dot", pattern: [0,0,0, 0,1,1, 0,0,0], algo: "r' R2 U R' U r U2 r' U M'" },
        { id: 4, name: "OLL 4", aka: "Dot", pattern: [0,0,0, 1,1,0, 0,0,0], algo: "M U' r U2 r' U' R U' R' M'" },
        { id: 5, name: "OLL 5", aka: "Square", pattern: [0,0,0, 1,1,0, 1,0,0], algo: "l' U2 L U L' U l" },
        { id: 6, name: "OLL 6", aka: "Square", pattern: [0,0,0, 0,1,1, 0,0,1], algo: "r U2 R' U' R U' r'" },
        { id: 7, name: "OLL 7", aka: "Small L", pattern: [0,0,0, 0,1,1, 1,0,0], algo: "r U R' U R U2 r'" },
        { id: 8, name: "OLL 8", aka: "Small L", pattern: [0,0,0, 1,1,0, 0,0,1], algo: "l' U' L U' L' U2 l" },
        { id: 9, name: "OLL 9", aka: "Fish", pattern: [0,1,0, 0,1,1, 1,0,0], algo: "R U R' U' R' F R2 U R' U' F'" },
        { id: 10, name: "OLL 10", aka: "Fish", pattern: [0,1,0, 1,1,0, 0,0,1], algo: "R U R' U R' F R F' R U2 R'" },
        { id: 11, name: "OLL 11", aka: "Small L", pattern: [0,0,1, 0,1,1, 0,0,0], algo: "r' R2 U R' U R U2 R' U M'" },
        { id: 12, name: "OLL 12", aka: "Small L", pattern: [1,0,0, 1,1,0, 0,0,0], algo: "M' R' U' R U' R' U2 R U' M" },
        { id: 13, name: "OLL 13", aka: "Gun", pattern: [0,1,0, 0,1,0, 1,0,1], algo: "F U R U' R2 F' R U R U' R'" },
        { id: 14, name: "OLL 14", aka: "Gun", pattern: [0,1,0, 0,1,0, 1,0,1], algo: "R' F R U R' F' R F U' F'" },
        { id: 15, name: "OLL 15", aka: "Gun", pattern: [0,0,1, 0,1,0, 0,1,1], algo: "l' U' l L' U' L U l' U l" },
        { id: 16, name: "OLL 16", aka: "Gun", pattern: [1,0,0, 0,1,0, 1,1,0], algo: "r U r' R U R' U' r U' r'" },
        { id: 17, name: "OLL 17", aka: "Dot", pattern: [0,0,1, 0,1,0, 1,0,0], algo: "R U R' U R' F R F' U2 R' F R F'" },
        { id: 18, name: "OLL 18", aka: "Dot", pattern: [1,0,0, 0,1,0, 0,0,1], algo: "r U R' U R U2 r2 U' R U' R' U2 r" },
        { id: 19, name: "OLL 19", aka: "Dot", pattern: [0,0,1, 0,1,1, 0,0,1], algo: "r' R U R U R' U' M' R' F R F'" },
        { id: 20, name: "OLL 20", aka: "Dot", pattern: [1,0,0, 1,1,0, 1,0,0], algo: "r U R' U' M2 U R U' R' U' M'" },
        { id: 21, name: "OLL 21", aka: "Cross", pattern: [0,1,0, 1,1,1, 0,1,0], algo: "R U2 R' U' R U R' U' R U' R'", basic: true, basicGroup: "corners" },
        { id: 22, name: "OLL 22", aka: "Cross", pattern: [0,1,0, 1,1,1, 0,1,0], algo: "R U2 R2 U' R2 U' R2 U2 R", basic: true, basicGroup: "corners" },
        { id: 23, name: "OLL 23", aka: "Cross", pattern: [1,1,0, 1,1,1, 0,1,0], algo: "R2 D' R U2 R' D R U2 R", basic: true, basicGroup: "corners" },
        { id: 24, name: "OLL 24", aka: "Cross", pattern: [0,1,1, 1,1,1, 0,1,0], algo: "r U R' U' r' F R F'", basic: true, basicGroup: "corners" },
        { id: 25, name: "OLL 25", aka: "Cross", pattern: [0,1,0, 1,1,1, 0,1,1], algo: "F' r U R' U' r' F R", basic: true, basicGroup: "corners" },
        { id: 26, name: "OLL 26", aka: "Antisune", pattern: [0,1,0, 1,1,1, 1,1,0], algo: "R U2 R' U' R U' R'", basic: true, basicGroup: "corners" },
        { id: 27, name: "OLL 27", aka: "Sune", pattern: [0,1,0, 1,1,1, 0,1,1], algo: "R U R' U R U2 R'", basic: true, basicGroup: "corners" },
        { id: 28, name: "OLL 28", aka: "Arrow", pattern: [0,1,0, 1,1,1, 0,1,0], algo: "r U R' U' r' R U R U' R'" },
        { id: 29, name: "OLL 29", aka: "Fish", pattern: [1,1,0, 1,1,0, 0,1,1], algo: "R U R' U' R U' R' F' U' F R U R'" },
        { id: 30, name: "OLL 30", aka: "Fish", pattern: [0,1,1, 0,1,1, 1,1,0], algo: "F R' F R2 U' R' U' R U R' F2" },
        { id: 31, name: "OLL 31", aka: "P Shape", pattern: [0,1,0, 0,1,1, 1,1,0], algo: "R' U' F U R U' R' F' R" },
        { id: 32, name: "OLL 32", aka: "P Shape", pattern: [0,1,0, 1,1,0, 0,1,1], algo: "L U F' U' L' U L F L'" },
        { id: 33, name: "OLL 33", aka: "T Shape", pattern: [0,1,0, 1,1,0, 0,1,0], algo: "R U R' U' R' F R F'" },
        { id: 34, name: "OLL 34", aka: "C Shape", pattern: [0,0,0, 1,1,1, 0,1,0], algo: "R U R2 U' R' F R U R U' F'" },
        { id: 35, name: "OLL 35", aka: "Fish", pattern: [0,1,1, 0,1,0, 0,1,1], algo: "R U2 R2 F R F' R U2 R'" },
        { id: 36, name: "OLL 36", aka: "W Shape", pattern: [0,1,0, 1,1,0, 1,1,0], algo: "L' U' L U' L' U L U L F' L' F" },
        { id: 37, name: "OLL 37", aka: "Fish", pattern: [1,1,0, 0,1,0, 1,1,0], algo: "F R' F' R U R U' R'" },
        { id: 38, name: "OLL 38", aka: "W Shape", pattern: [0,1,0, 0,1,1, 0,1,1], algo: "R U R' U R U' R' U' R' F R F'" },
        { id: 39, name: "OLL 39", aka: "Big L", pattern: [0,1,0, 0,1,1, 1,0,0], algo: "L F' L' U' L U F U' L'" },
        { id: 40, name: "OLL 40", aka: "Big L", pattern: [0,1,0, 1,1,0, 0,0,1], algo: "R' F R U R' U' F' U R" },
        { id: 41, name: "OLL 41", aka: "Awkward", pattern: [1,1,0, 0,1,1, 0,1,0], algo: "R U R' U R U2 R' F R U R' U' F'" },
        { id: 42, name: "OLL 42", aka: "Awkward", pattern: [0,1,1, 1,1,0, 0,1,0], algo: "R' U' R U' R' U2 R F R U R' U' F'" },
        { id: 43, name: "OLL 43", aka: "P Shape", pattern: [0,1,0, 1,1,0, 0,0,0], algo: "F' U' L' U L F", basic: true, basicGroup: "edges" },
        { id: 44, name: "OLL 44", aka: "P Shape", pattern: [0,1,0, 0,1,1, 0,0,0], algo: "F U R U' R' F'", basic: true, basicGroup: "edges" },
        { id: 45, name: "OLL 45", aka: "Line", pattern: [0,0,0, 1,1,1, 0,0,0], algo: "F R U R' U' F'", basic: true, basicGroup: "edges" },
        { id: 46, name: "OLL 46", aka: "Line", pattern: [0,0,1, 1,1,1, 1,0,0], algo: "R' U' R' F R F' U R" },
        { id: 47, name: "OLL 47", aka: "L Shape", pattern: [1,0,0, 1,1,1, 1,0,0], algo: "R' U' R' F R F' R' F R F' U R" },
        { id: 48, name: "OLL 48", aka: "L Shape", pattern: [0,0,1, 1,1,1, 0,0,1], algo: "F R U R' U' R U R' U' F'" },
        { id: 49, name: "OLL 49", aka: "L Shape", pattern: [1,0,0, 1,1,1, 0,0,1], algo: "r U' r2 U r2 U r2 U' r" },
        { id: 50, name: "OLL 50", aka: "L Shape", pattern: [0,0,1, 1,1,1, 1,0,0], algo: "r' U r2 U' r2 U' r2 U r'" },
        { id: 51, name: "OLL 51", aka: "I Shape", pattern: [0,0,0, 1,1,1, 0,0,0], algo: "F U R U' R' U R U' R' F'" },
        { id: 52, name: "OLL 52", aka: "I Shape", pattern: [0,0,0, 1,1,1, 0,0,0], algo: "R U R' U R U' B U' B' R'" },
        { id: 53, name: "OLL 53", aka: "L Shape", pattern: [1,0,1, 1,1,1, 0,0,0], algo: "l' U2 L U L' U' L U L' U l" },
        { id: 54, name: "OLL 54", aka: "L Shape", pattern: [0,0,0, 1,1,1, 1,0,1], algo: "r U2 R' U' R U R' U' R U' r'" },
        { id: 55, name: "OLL 55", aka: "Highway", pattern: [1,0,0, 1,1,1, 0,0,1], algo: "R U2 R2 U' R U' R' U2 F R F'" },
        { id: 56, name: "OLL 56", aka: "Highway", pattern: [0,0,1, 1,1,1, 1,0,0], algo: "r' U' r U' R' U R U' R' U R r' U r" },
        { id: 57, name: "OLL 57", aka: "H Pattern", pattern: [0,1,0, 1,1,1, 0,1,0], algo: "R U R' U' M' U R U' r'" },
    ];

    // ===== PLL Algorithms (21 cases) =====
    // basic: true = included in 2-Look PLL (minimum required set)
    // basicGroup: "corners" = Corner Permutation, "edges" = Edge Permutation
    const PLL = [
        { id: 1,  name: "Aa Perm", aka: "Adjacent Corner Swap", algo: "x L2 D2 L' U' L D2 L' U L' x'", basic: true, basicGroup: "corners" },
        { id: 2,  name: "Ab Perm", aka: "Adjacent Corner Swap", algo: "x' L2 D2 L U L' D2 L U' L x" },
        { id: 3,  name: "E Perm", aka: "Diagonal Corner Swap", algo: "x' L' U L D' L' U' L D L' U' L D' L' U L D x", basic: true, basicGroup: "corners" },
        { id: 4,  name: "F Perm", aka: "Diagonal", algo: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
        { id: 5,  name: "Ga Perm", aka: "G Permutation", algo: "R2 U R' U R' U' R U' R2 U' D R' U R D'" },
        { id: 6,  name: "Gb Perm", aka: "G Permutation", algo: "R' U' R U D' R2 U R' U R U' R U' R2 D" },
        { id: 7,  name: "Gc Perm", aka: "G Permutation", algo: "R2 U' R U' R U R' U R2 U D' R U' R' D" },
        { id: 8,  name: "Gd Perm", aka: "G Permutation", algo: "R U R' U' D R2 U' R U' R' U R' U R2 D'" },
        { id: 9,  name: "H Perm", aka: "Edges Only", algo: "M2 U M2 U2 M2 U M2", basic: true, basicGroup: "edges" },
        { id: 10, name: "Ja Perm", aka: "Adjacent Swap", algo: "x R2 F R F' R U2 r' U r U2 x'" },
        { id: 11, name: "Jb Perm", aka: "Adjacent Swap", algo: "R U R' F' R U R' U' R' F R2 U' R'" },
        { id: 12, name: "Na Perm", aka: "Diagonal Swap", algo: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
        { id: 13, name: "Nb Perm", aka: "Diagonal Swap", algo: "R' U R U' R' F' U' F R U R' F R' F' R U' R" },
        { id: 14, name: "Ra Perm", aka: "Adjacent", algo: "R U' R' U' R U R D R' U' R D' R' U2 R'" },
        { id: 15, name: "Rb Perm", aka: "Adjacent", algo: "R' U2 R U2 R' F R U R' U' R' F' R2" },
        { id: 16, name: "T Perm", aka: "T Permutation", algo: "R U R' U' R' F R2 U' R' U' R U R' F'" },
        { id: 17, name: "Ua Perm", aka: "Edge 3-Cycle", algo: "M2 U M U2 M' U M2", basic: true, basicGroup: "edges" },
        { id: 18, name: "Ub Perm", aka: "Edge 3-Cycle", algo: "M2 U' M U2 M' U' M2", basic: true, basicGroup: "edges" },
        { id: 19, name: "V Perm", aka: "Diagonal", algo: "R' U R' U' y R' F' R2 U' R' U R' F R F" },
        { id: 20, name: "Y Perm", aka: "Diagonal", algo: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
        { id: 21, name: "Z Perm", aka: "Edges Only", algo: "M' U M2 U M2 U M' U2 M2", basic: true, basicGroup: "edges" },
    ];

    // ===== F2L Algorithms (41 cases) =====
    const F2L = [
        { id: 1,  name: "F2L 1", aka: "Easy", algo: "U R U' R'" },
        { id: 2,  name: "F2L 2", aka: "Easy", algo: "U' F' U F" },
        { id: 3,  name: "F2L 3", aka: "Easy", algo: "F' U F" },
        { id: 4,  name: "F2L 4", aka: "Easy", algo: "R U R'" },
        { id: 5,  name: "F2L 5", aka: "Reverse Easy", algo: "U' R U R' U2 R U' R'" },
        { id: 6,  name: "F2L 6", aka: "Reverse Easy", algo: "U F' U' F U2 F' U F" },
        { id: 7,  name: "F2L 7", aka: "Corner on Top", algo: "U' R U2 R' U2 R U' R'" },
        { id: 8,  name: "F2L 8", aka: "Corner on Top", algo: "U F' U2 F U2 F' U F" },
        { id: 9,  name: "F2L 9", aka: "Corner on Top", algo: "U' R U R' U R U R'" },
        { id: 10, name: "F2L 10", aka: "Corner on Top", algo: "U F' U' F U' F' U' F" },
        { id: 11, name: "F2L 11", aka: "Corner on Top", algo: "U' R U2 R' U R U' R'" },
        { id: 12, name: "F2L 12", aka: "Corner on Top", algo: "U F' U2 F U' F' U F" },
        { id: 13, name: "F2L 13", aka: "Corner in Slot", algo: "R U' R' U R U' R'" },
        { id: 14, name: "F2L 14", aka: "Corner in Slot", algo: "R U R' U' R U R'" },
        { id: 15, name: "F2L 15", aka: "Corner in Slot", algo: "R U2 R' U' R U R'" },
        { id: 16, name: "F2L 16", aka: "Edge in Slot", algo: "R U' R' U R U' R' U R U' R'" },
        { id: 17, name: "F2L 17", aka: "Edge in Slot", algo: "R U R' U2 R U R'" },
        { id: 18, name: "F2L 18", aka: "Edge in Slot", algo: "R U2 R' U R U R'" },
        { id: 19, name: "F2L 19", aka: "Both in Slot", algo: "R U' R' U' R U R' U2 R U' R'" },
        { id: 20, name: "F2L 20", aka: "Both in Slot", algo: "R U' R' U R U2 R' U R U' R'" },
        { id: 21, name: "F2L 21", aka: "Both in Slot", algo: "R U R' U' R U' R' U2 F' U' F" },
        { id: 22, name: "F2L 22", aka: "Corner & Edge", algo: "F' U F U' F' U F" },
        { id: 23, name: "F2L 23", aka: "Corner & Edge", algo: "R U2 R' U' R U' R'" },
        { id: 24, name: "F2L 24", aka: "Connected", algo: "U R U' R' U' F' U F" },
        { id: 25, name: "F2L 25", aka: "Connected", algo: "U' R U R' U R U R' U R U' R'" },
        { id: 26, name: "F2L 26", aka: "Connected", algo: "U R U' R' F R' F' R" },
        { id: 27, name: "F2L 27", aka: "Connected", algo: "R U' R' U R U' R'" },
        { id: 28, name: "F2L 28", aka: "Split Pair", algo: "R U R' U' R U R' U' R U R'" },
        { id: 29, name: "F2L 29", aka: "Split Pair", algo: "R' F R F' R U R' U' R U R'" },
        { id: 30, name: "F2L 30", aka: "Split Pair", algo: "R U' R' U F' U' F" },
        { id: 31, name: "F2L 31", aka: "Separated", algo: "U' R U' R' U R U R'" },
        { id: 32, name: "F2L 32", aka: "Separated", algo: "U' R U R' U R U R'" },
        { id: 33, name: "F2L 33", aka: "Separated", algo: "U' R U2 R' U2 R U R'" },
        { id: 34, name: "F2L 34", aka: "Separated", algo: "U R U' R' U' R U2 R' U' R U R'" },
        { id: 35, name: "F2L 35", aka: "Separated", algo: "U2 R U R' U R U' R'" },
        { id: 36, name: "F2L 36", aka: "Edge Only", algo: "R U R' U' F' U2 F" },
        { id: 37, name: "F2L 37", aka: "Pair Made", algo: "R2 U2 F R2 F' U2 R' U R'" },
        { id: 38, name: "F2L 38", aka: "Wrong Slot", algo: "R U' R' U' R U R' U' R U2 R'" },
        { id: 39, name: "F2L 39", aka: "Wrong Slot", algo: "R U' R' U R U2 R' U R U' R'" },
        { id: 40, name: "F2L 40", aka: "Wrong Slot", algo: "R U R' U' R U' R'" },
        { id: 41, name: "F2L 41", aka: "Wrong Slot", algo: "R U2 R' U' R U2 R' U' R U R'" },
    ];

    // ===== Notation Guide =====
    const NOTATION = [
        { symbol: "R", desc: "Right face clockwise" },
        { symbol: "R'", desc: "Right face counter-clockwise" },
        { symbol: "R2", desc: "Right face 180°" },
        { symbol: "L", desc: "Left face clockwise" },
        { symbol: "L'", desc: "Left face counter-clockwise" },
        { symbol: "L2", desc: "Left face 180°" },
        { symbol: "U", desc: "Top face clockwise" },
        { symbol: "U'", desc: "Top face counter-clockwise" },
        { symbol: "U2", desc: "Top face 180°" },
        { symbol: "D", desc: "Bottom face clockwise" },
        { symbol: "D'", desc: "Bottom face counter-clockwise" },
        { symbol: "D2", desc: "Bottom face 180°" },
        { symbol: "F", desc: "Front face clockwise" },
        { symbol: "F'", desc: "Front face counter-clockwise" },
        { symbol: "F2", desc: "Front face 180°" },
        { symbol: "B", desc: "Back face clockwise" },
        { symbol: "B'", desc: "Back face counter-clockwise" },
        { symbol: "B2", desc: "Back face 180°" },
        { symbol: "M", desc: "Middle slice (follows L)" },
        { symbol: "M'", desc: "Middle slice (follows R)" },
        { symbol: "x", desc: "Rotate cube on R axis" },
        { symbol: "y", desc: "Rotate cube on U axis" },
        { symbol: "z", desc: "Rotate cube on F axis" },
        { symbol: "r", desc: "Wide R (R + M')" },
        { symbol: "l", desc: "Wide L (L + M)" },
    ];

    return {
        OLL,
        PLL,
        F2L,
        NOTATION,
    };
})();
