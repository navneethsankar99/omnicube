/**
 * Speedcubing Session & Statistics Manager
 * Handles session history, solve storage in localStorage, WCA Ao5 / Ao12 calculations, +2 / DNF penalties.
 */

const TimerStats = (() => {
    const STORAGE_KEY = 'omnicube_timer_sessions_v1';

    // State structure
    let sessions = {};
    let activeSessionId = 'main';

    function init() {
        loadFromStorage();
        if (!sessions[activeSessionId]) {
            sessions[activeSessionId] = {
                id: 'main',
                name: 'Session 1',
                solves: [],
            };
            saveToStorage();
        }
    }

    function loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                sessions = parsed.sessions || {};
                activeSessionId = parsed.activeSessionId || 'main';
            }
        } catch (e) {
            console.error('Failed to load session history from localStorage', e);
        }
    }

    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                sessions,
                activeSessionId,
            }));
        } catch (e) {
            console.error('Failed to save session history to localStorage', e);
        }
    }

    /**
     * Add a completed solve to the active session
     * @param {number} timeMs Raw solve time in milliseconds
     * @param {string} scramble Scramble string used for the solve
     * @returns {Object} Created solve object
     */
    function addSolve(timeMs, scramble) {
        const solve = {
            id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            rawTime: timeMs,
            penalty: null, // null, '+2', or 'DNF'
            scramble: scramble || '',
            date: new Date().toISOString(),
        };

        if (!sessions[activeSessionId]) {
            sessions[activeSessionId] = { id: activeSessionId, name: 'Session 1', solves: [] };
        }

        sessions[activeSessionId].solves.unshift(solve); // most recent first
        saveToStorage();
        return solve;
    }

    /**
     * Toggle penalty (+2 -> DNF -> none)
     */
    function togglePenalty(solveId, targetPenalty) {
        const solve = getActiveSolves().find(s => s.id === solveId);
        if (!solve) return;

        if (targetPenalty) {
            solve.penalty = solve.penalty === targetPenalty ? null : targetPenalty;
        } else {
            if (solve.penalty === null) solve.penalty = '+2';
            else if (solve.penalty === '+2') solve.penalty = 'DNF';
            else solve.penalty = null;
        }

        saveToStorage();
    }

    function deleteSolve(solveId) {
        const solves = getActiveSolves();
        const idx = solves.findIndex(s => s.id === solveId);
        if (idx !== -1) {
            solves.splice(idx, 1);
            saveToStorage();
        }
    }

    function clearActiveSession() {
        if (sessions[activeSessionId]) {
            sessions[activeSessionId].solves = [];
            saveToStorage();
        }
    }

    function getActiveSolves() {
        return (sessions[activeSessionId] && sessions[activeSessionId].solves) || [];
    }

    function getEffectiveTime(solve) {
        if (solve.penalty === 'DNF') return Infinity;
        if (solve.penalty === '+2') return solve.rawTime + 2000;
        return solve.rawTime;
    }

    /**
     * Format time in milliseconds to clean string format (m:ss.uu or ss.uu)
     */
    function formatTime(timeMs, penalty) {
        if (penalty === 'DNF') return 'DNF';

        let effective = timeMs;
        if (penalty === '+2') effective += 2000;

        if (effective === Infinity || isNaN(effective)) return 'DNF';

        const totalSec = effective / 1000;
        const mins = Math.floor(totalSec / 60);
        const secs = (totalSec % 60).toFixed(2);

        let result = '';
        if (mins > 0) {
            const secFormatted = (totalSec % 60 < 10 ? '0' : '') + secs;
            result = `${mins}:${secFormatted}`;
        } else {
            result = secs;
        }

        if (penalty === '+2') result += '+';
        return result;
    }

    /**
     * Calculate WCA Average of N (AoN)
     * Drops 1 highest and 1 lowest time (or DNF as highest).
     * Returns DNF if > 1 DNF in the set.
     */
    function calculateAoN(solvesSlice, count) {
        if (solvesSlice.length < count) return null;

        const slice = solvesSlice.slice(0, count);
        let dnfCount = 0;

        const times = slice.map(s => {
            const eff = getEffectiveTime(s);
            if (eff === Infinity) dnfCount++;
            return eff;
        });

        if (dnfCount >= 2) return Infinity; // DNF average

        // Sort ascending (Infinity goes to end)
        times.sort((a, b) => a - b);

        // Remove lowest (index 0) and highest (index count-1)
        const trimmed = times.slice(1, count - 1);
        const sum = trimmed.reduce((acc, t) => acc + t, 0);

        return sum / trimmed.length;
    }

    /**
     * Calculate Session Summary Statistics
     */
    function getSummaryStats() {
        const solves = getActiveSolves();
        if (solves.length === 0) {
            return {
                count: 0,
                best: null,
                worst: null,
                mean: null,
                ao5: null,
                ao12: null,
                ao50: null,
            };
        }

        const validSolves = solves.filter(s => s.penalty !== 'DNF');
        const effectiveTimes = validSolves.map(s => getEffectiveTime(s));

        const best = effectiveTimes.length > 0 ? Math.min(...effectiveTimes) : null;
        const worst = effectiveTimes.length > 0 ? Math.max(...effectiveTimes) : null;

        const sum = effectiveTimes.reduce((acc, t) => acc + t, 0);
        const mean = effectiveTimes.length > 0 ? sum / effectiveTimes.length : null;

        const ao5 = calculateAoN(solves, 5);
        const ao12 = calculateAoN(solves, 12);
        const ao50 = calculateAoN(solves, 50);

        return {
            count: solves.length,
            best,
            worst,
            mean,
            ao5,
            ao12,
            ao50,
        };
    }

    /**
     * Get all session definitions
     */
    function getSessionsList() {
        return Object.values(sessions).map(s => ({
            id: s.id,
            name: s.name,
            count: s.solves.length,
        }));
    }

    function createSession(name) {
        const id = 'sess_' + Date.now();
        sessions[id] = {
            id,
            name: name || `Session ${Object.keys(sessions).length + 1}`,
            solves: [],
        };
        activeSessionId = id;
        saveToStorage();
        return id;
    }

    function switchSession(id) {
        if (sessions[id]) {
            activeSessionId = id;
            saveToStorage();
        }
    }

    return {
        init,
        addSolve,
        togglePenalty,
        deleteSolve,
        clearActiveSession,
        getActiveSolves,
        getSummaryStats,
        formatTime,
        getSessionsList,
        createSession,
        switchSession,
        getActiveSessionId: () => activeSessionId,
    };
})();

// Initialize stats module immediately
TimerStats.init();
