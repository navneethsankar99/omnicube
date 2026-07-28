/**
 * Two-Phase Rubik's Cube Solver
 * Adapted from the original Fridrich Solver APK (assets/Two-phase_solver/solver.js)
 * by Bodor Gergely. This is a Kociemba two-phase algorithm implementation.
 * 
 * Wrapped in a module pattern for clean web integration.
 */

const Solver = (() => {
    // === State Variables ===
    var names = ["UFU", "URU", "UBU", "ULU", "DFD", "DRD", "DBD", "DLD", "FRF", "FLF", "BRB", "BLB",
                 "UFRUF", "URBUR", "UBLUB", "ULFUL", "DRFDR", "DFLDF", "DLBDL", "DBRDB"];

    var co_trans, eo_trans, ud1_trans, cp_trans, ep_trans, ud2_trans;
    var co_prune, eo_prune, ud1_prune, cp_prune, ep_prune, ud2_prune;

    var co = make_array(8);
    var eo = make_array(12);
    var cp = make_array(8);
    var ep = make_array(12);

    var co_coord, eo_coord, ud1_coord;
    var cp_coord, ep_coord, ud2_coord;

    var phase_1_moves = make_array(12);
    var phase_2_moves = make_array(18);

    var initialized = false;

    var c_cycles = [
        [0, 1, 2, 3], // U
        [4, 5, 6, 7], // D
        [0, 3, 5, 4], // F
        [1, 7, 6, 2], // B
        [0, 4, 7, 1], // R
        [2, 6, 5, 3], // L
    ];
    var e_cycles = [
        [0, 1, 2, 3],   // U
        [4, 7, 6, 5],   // D
        [0, 9, 4, 8],   // F
        [2, 10, 6, 11], // B
        [1, 8, 5, 10],  // R
        [3, 11, 7, 9],  // L
    ];
    var c_twists = [
        [0, 0, 0, 0], // U
        [0, 0, 0, 0], // D
        [2, 1, 2, 1], // F
        [1, 2, 1, 2], // B
        [1, 2, 1, 2], // R
        [1, 2, 1, 2], // L
    ];
    var e_twists = [
        [0, 0, 0, 0], // U
        [0, 0, 0, 0], // D
        [1, 1, 1, 1], // F
        [1, 1, 1, 1], // B
        [0, 0, 0, 0], // R
        [0, 0, 0, 0], // L
    ];

    // === Helper Functions ===
    function make_array(len) {
        var array = new Array();
        array.length = len;
        return array;
    }

    function move_pieces(perm, orie, cycle, twist, mod) {
        var otmp, ptmp, i;
        ptmp = perm[cycle[0]];
        otmp = orie[cycle[0]];
        for (i = 0; i < 3; i++) {
            orie[cycle[i]] = (orie[cycle[i + 1]] + twist[i + 1]) % mod;
            perm[cycle[i]] = perm[cycle[i + 1]];
        }
        orie[cycle[3]] = (otmp + twist[0]) % mod;
        perm[cycle[3]] = ptmp;
    }

    function do_move(mv) {
        var i, face;
        face = Math.floor(mv / 3);
        for (i = 0; i < (mv % 3) + 1; i++) {
            move_pieces(cp, co, c_cycles[face], c_twists[face], 3);
            move_pieces(ep, eo, e_cycles[face], e_twists[face], 2);
        }
    }

    function fact(n) {
        var i;
        for (i = 1; n > 1; n--)
            i *= n;
        return i;
    }

    function choose(n, k) {
        return fact(n) / (fact(k) * fact(n - k));
    }

    function set_eo_coord(coord) {
        var i;
        eo[11] = 0;
        for (i = 10; i >= 0; i--, coord >>= 1) {
            eo[i] = coord & 1;
            eo[11] ^= eo[i];
        }
    }

    function get_eo_coord() {
        var i, coord;
        for (i = coord = 0; i < 11; i++, coord <<= 1)
            coord |= eo[i];
        return coord >> 1;
    }

    function set_co_coord(coord) {
        var i, p = 729;
        co[7] = 0;
        for (i = 6; i >= 0; i--, p = Math.floor(p / 3)) {
            co[i] = Math.floor(coord / p);
            coord -= co[i] * p;
            co[7] = (co[7] + 3 - co[i]) % 3;
        }
    }

    function get_co_coord() {
        var i, p, coord;
        for (i = coord = 0, p = 1; i < 7; i++, p *= 3)
            coord += co[i] * p;
        return coord;
    }

    function set_ud1_coord(coord) {
        var i, j;
        for (i = 0; i < 12; i++)
            ep[i] = 0;
        for (i = 11, j = 4; i >= 0 && j; i--) {
            if (coord >= choose(i, j - 1)) {
                coord -= choose(i, j - 1);
            } else {
                ep[i] = 8;
                j--;
            }
        }
    }

    function get_ud1_coord() {
        var i, j = 0, coord = 0;
        for (i = 0; i < 12; i++) {
            if (ep[i] > 7)
                j++;
            if (j && ep[i] < 8)
                coord += choose(i, j - 1);
        }
        return coord;
    }

    function set_p_coord(perm, start, len, coord) {
        var val = 0o76543210;
        var p = fact(len);
        var i;
        for (i = 0; i < len; i++) {
            p /= (len - i);
            var v = 3 * Math.floor(coord / p);
            coord %= p;
            perm[start + ((val >> v) & 0o7)] = i;
            var m = (1 << v) - 1;
            val = (val & m) + ((val >> 3) & ~m);
        }
    }

    function get_p_coord(iperm, start, len) {
        var perm = new Array(8);
        var r = 0;
        var val = 0o76543210;
        var i;
        var m = len - 1;
        for (i = 0; i < len; i++)
            perm[iperm[start + i] & m] = i;
        for (i = 0; i + 1 < len; i++) {
            var v = 3 * perm[i];
            r = (len - i) * r + ((val >> v) & 0o7);
            val -= 0o11111110 << v;
        }
        return r;
    }

    function set_cp_coord(coord)  { set_p_coord(cp, 0, 8, coord); }
    function set_ep_coord(coord)  { set_p_coord(ep, 0, 8, coord); }
    function set_ud2_coord(coord) { set_p_coord(ep, 8, 4, coord); }

    function get_cp_coord()  { return get_p_coord(cp, 0, 8); }
    function get_ep_coord()  { return get_p_coord(ep, 0, 8); }
    function get_ud2_coord() { return get_p_coord(ep, 8, 4); }

    function get_bits(perm) {
        var r = 0;
        var i;
        for (i = 0; i < 7; i++)
            r |= (perm[i] & 4) << i;
        return r >> 2;
    }

    // === Transition Table Initialization ===
    function init_trans2(group, tran_table, len, set_coord, get_coord, perm) {
        var i, j, k, b, t, klim;
        var base = new Array(128);
        for (i = 0; i < len; i += 24) {
            set_coord(i);
            b = get_bits(perm);
            if (base[b] == undefined) {
                base[b] = i;
                klim = 24;
            } else {
                klim = 1;
            }
            b = base[b] * 6;
            for (k = 0; k < klim; k++) {
                for (j = 0; j < 6; j++) {
                    set_coord(i + k);
                    if (group && j >= 2) {
                        do_move(j * 3 + 1);
                    } else {
                        do_move(j * 3);
                    }
                    tran_table[(i + k) * 6 + j] = get_coord();
                }
            }
            for (j = 0; j < 6; j++) {
                t = tran_table[i * 6 + j] - tran_table[b + j];
                for (k = klim; k < 24; k++)
                    tran_table[(i + k) * 6 + j] = t + tran_table[b + k * 6 + j];
            }
        }
    }

    function init_trans(group, tran_table, len, set_coord, get_coord) {
        var i, j;
        for (i = 0; i < len; i++) {
            for (j = 0; j < 6; j++) {
                if (tran_table[i * 6 + j] == undefined) {
                    var start = i;
                    var face = j;
                    set_coord(start);
                    while (tran_table[start * 6 + face] == undefined) {
                        if (group && face >= 2)
                            do_move(3 * face + 1);
                        else
                            do_move(3 * face);
                        var newpos = get_coord();
                        tran_table[start * 6 + face] = newpos;
                        if (len == 40320) {
                            tran_table[(len - 1 - start) * 6 + face] = len - 1 - newpos;
                        }
                        start = newpos;
                        face = 0;
                        while (face < 5 && tran_table[start * 6 + face] != undefined) {
                            face++;
                        }
                    }
                }
            }
        }
    }

    function init_trans_tables() {
        init_trans(0, eo_trans, 2048, set_eo_coord, get_eo_coord);
        init_trans(0, co_trans, 2187, set_co_coord, get_co_coord);
        init_trans(0, ud1_trans, 495, set_ud1_coord, get_ud1_coord);

        init_trans2(1, ep_trans, 40320, set_ep_coord, get_ep_coord, ep);
        init_trans2(1, cp_trans, 40320, set_cp_coord, get_cp_coord, cp);
        init_trans(1, ud2_trans, 24, set_ud2_coord, get_ud2_coord);
    }

    // === Pruning Table Initialization ===
    function init_prune(group, coord, prune_table, tran_table, mdepth, depth, last) {
        var i, mv;
        if (depth == mdepth)
            return;
        prune_table[coord] = depth;
        for (mv = 0; mv < 18; mv += 3) {
            var thisface = mv / 3;
            if (thisface == last || ((last & 1) == 0 && thisface == last + 1))
                continue;
            var coord2 = coord;
            for (i = 0; i < 3; i++) {
                if (group && mv >= 6 && i)
                    break;
                coord2 = tran_table[coord2 * 6 + thisface];
                if (!(prune_table[coord2] <= depth + 1))
                    init_prune(group, coord2, prune_table, tran_table, mdepth, depth + 1, thisface);
            }
        }
    }

    function init_prune2(group, prune_table, tran_table, mdepth) {
        var i;
        for (i = prune_table.length - 1; i >= 0; i--) {
            prune_table[i] = mdepth;
        }
        init_prune(group, 0, prune_table, tran_table, mdepth - 1, 0, 18);
    }

    function init_prune_tables() {
        init_prune2(0, eo_prune, eo_trans, 8);
        init_prune2(0, co_prune, co_trans, 7);
        init_prune2(0, ud1_prune, ud1_trans, 6);

        init_prune2(1, ep_prune, ep_trans, 9);
        init_prune2(1, cp_prune, cp_trans, 14);
        init_prune2(1, ud2_prune, ud2_trans, 5);
    }

    // === Phase 1 & 2 Search ===
    function phase_1(eo_c, co_c, ud1_c, depth, last) {
        var face, i;
        if (depth == 0)
            return (eo_c == 0 && co_c == 0 && ud1_c == 0);
        depth--;
        for (face = 0; face < 6; face++) {
            if (face == last || (face == last + 1 && (last & 1) == 0))
                continue;
            var eo_c2 = eo_c;
            var co_c2 = co_c;
            var ud1_c2 = ud1_c;
            for (i = 0; i < 3; i++) {
                eo_c2 = eo_trans[eo_c2 * 6 + face];
                co_c2 = co_trans[co_c2 * 6 + face];
                ud1_c2 = ud1_trans[ud1_c2 * 6 + face];
                if (co_prune[co_c2] <= depth &&
                    eo_prune[eo_c2] <= depth &&
                    ud1_prune[ud1_c2] <= depth &&
                    phase_1(eo_c2, co_c2, ud1_c2, depth, face)) {
                    phase_1_moves[depth] = 3 * face + i;
                    return 1;
                }
            }
        }
        return 0;
    }

    function phase_2(ep_c, cp_c, ud2_c, depth, last) {
        var mv, face, i;
        if (depth == 0)
            return (ep_c == 0 && cp_c == 0 && ud2_c == 0);
        depth--;
        for (face = 0; face < 6; face++) {
            if (face == last || (face == last + 1 && (last & 1) == 0))
                continue;
            var ep_c2 = ep_c;
            var cp_c2 = cp_c;
            var ud2_c2 = ud2_c;
            for (i = 0; i < 3; i++) {
                ep_c2 = ep_trans[ep_c2 * 6 + face];
                cp_c2 = cp_trans[cp_c2 * 6 + face];
                ud2_c2 = ud2_trans[ud2_c2 * 6 + face];
                if (ep_prune[ep_c2] <= depth &&
                    cp_prune[cp_c2] <= depth &&
                    ud2_prune[ud2_c2] <= depth &&
                    phase_2(ep_c2, cp_c2, ud2_c2, depth, face)) {
                    phase_2_moves[depth] = 3 * face + (face >= 2 ? 1 : i);
                    return 1;
                }
                if (face >= 2)
                    break;
            }
        }
        return 0;
    }

    function set_cube(cube) {
        var i, j, p, t;
        for (i = 0; i < 12; i++) {
            p = cube.substring(i * 3, i * 3 + 2);
            for (j = 0; j < 12; j++) {
                if ((t = names[j].indexOf(p)) != -1) {
                    ep[i] = j;
                    eo[i] = t;
                }
            }
        }
        for (i = 0; i < 8; i++) {
            p = cube.substring((12 * 3) + (i * 4), (12 * 3) + (i * 4) + 3);
            for (j = 0; j < 8; j++) {
                if ((t = names[j + 12].indexOf(p)) != -1) {
                    cp[i] = j;
                    co[i] = t;
                }
            }
        }
        co_coord = get_co_coord();
        eo_coord = get_eo_coord();
        ud1_coord = get_ud1_coord();
    }

    function print_move(mv) {
        var faces = ["U", "D", "F", "B", "R", "L"];
        var num = ["", "2", "'"];
        if (mv == undefined) return "";
        return faces[Math.floor(mv / 3)] + num[mv % 3] + " ";
    }

    // === Public API ===
    function init() {
        if (initialized) return Promise.resolve();

        return new Promise((resolve) => {
            co_trans = make_array(2187 * 6);
            eo_trans = make_array(2048 * 6);
            ud1_trans = make_array(495 * 6);
            cp_trans = make_array(40320 * 6);
            ep_trans = make_array(40320 * 6);
            ud2_trans = make_array(24 * 6);

            co_prune = make_array(2187);
            eo_prune = make_array(2048);
            ud1_prune = make_array(495);
            cp_prune = make_array(40320);
            ep_prune = make_array(40320);
            ud2_prune = make_array(24);

            // Use setTimeout to allow UI to show loading state
            setTimeout(() => {
                init_trans_tables();
                init_prune_tables();
                initialized = true;
                resolve();
            }, 50);
        });
    }

    function solve(pos, invert) {
        phase_1_moves = make_array(12);
        phase_2_moves = make_array(18);
        set_cube(pos);
        var i, sol = "";

        for (i = 0; phase_1(eo_coord, co_coord, ud1_coord, i, 6) == 0; i++) { }
        for (i = 11; i > -1; i--)
            if (phase_1_moves[i] != undefined)
                do_move(phase_1_moves[i]);

        ep_coord = get_ep_coord();
        cp_coord = get_cp_coord();
        ud2_coord = get_ud2_coord();

        for (i = 0; phase_2(ep_coord, cp_coord, ud2_coord, i, 18) == 0; i++) { }

        if (invert) {
            for (i = 0; i < 18; i++)
                if (phase_2_moves[i] != undefined)
                    sol += print_move(phase_2_moves[i] + 2 - 2 * (phase_2_moves[i] % 3));
            for (i = 0; i < 12; i++)
                if (phase_1_moves[i] != undefined)
                    sol += print_move(phase_1_moves[i] + 2 - 2 * (phase_1_moves[i] % 3));
        } else {
            for (i = 11; i > -1; i--)
                sol += print_move(phase_1_moves[i]);
            for (i = 17; i > -1; i--)
                sol += print_move(phase_2_moves[i]);
        }
        return sol.trim();
    }

    function isInitialized() {
        return initialized;
    }

    return {
        init,
        solve,
        isInitialized,
    };
})();
