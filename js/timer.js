/**
 * Speedcubing Timer Engine
 * High-precision timing engine using performance.now(), Spacebar hold-to-start (300ms threshold),
 * WCA 15-second inspection countdown, audio cues via Web Audio API, and touch support.
 */

const TimerEngine = (() => {
    // Timer States
    const STATES = {
        IDLE: 'IDLE',
        HOLDING: 'HOLDING',
        READY: 'READY',
        INSPECTION: 'INSPECTION',
        RUNNING: 'RUNNING',
        STOPPED: 'STOPPED',
    };

    let currentState = STATES.IDLE;

    // Config options
    let config = {
        holdThresholdMs: 300,
        useInspection: false,
        useAudio: true,
        precision: 2, // 2 = centiseconds (.00), 3 = milliseconds (.000)
    };

    // Timing Variables
    let startTime = 0;
    let stopTime = 0;
    let timerInterval = null;
    let holdTimeout = null;

    // Inspection Variables
    let inspectionStartTime = 0;
    let inspectionInterval = null;
    let inspectionPenalty = null; // null, '+2', 'DNF'
    let audioAlertsPlayed = { 8: false, 12: false };

    // Callbacks
    let onStateChange = null;
    let onTick = null;
    let onSolveComplete = null;

    // Web Audio Synthesizer
    let audioCtx = null;

    function playBeep(freq = 600, durationMs = 150) {
        if (!config.useAudio) return;
        try {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + durationMs / 1000);
        } catch (e) {
            // Audio context blocked or unsupported
        }
    }

    function init(callbacks = {}) {
        onStateChange = callbacks.onStateChange || null;
        onTick = callbacks.onTick || null;
        onSolveComplete = callbacks.onSolveComplete || null;

        bindEvents();
    }

    function setConfig(newConfig) {
        config = { ...config, ...newConfig };
    }

    function setState(newState) {
        currentState = newState;
        if (onStateChange) onStateChange(currentState);
    }

    function bindEvents() {
        // Keyboard controls
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Touch/Pointer controls for mobile
        const timerContainer = document.getElementById('timer-touch-area');
        if (timerContainer) {
            timerContainer.addEventListener('pointerdown', handlePointerDown);
            timerContainer.addEventListener('pointerup', handlePointerUp);
        }
    }

    function isTimerViewActive() {
        const timerView = document.getElementById('view-timer');
        return timerView && timerView.classList.contains('active');
    }

    function handleKeyDown(e) {
        if (!isTimerViewActive()) return;

        // Spacebar key handling
        if (e.code === 'Space') {
            e.preventDefault();
            if (e.repeat) return; // ignore auto-repeat

            if (currentState === STATES.RUNNING) {
                stopTimer();
            } else if (currentState === STATES.IDLE) {
                if (config.useInspection) {
                    startInspection();
                } else {
                    startHolding();
                }
            } else if (currentState === STATES.INSPECTION) {
                startHolding();
            }
        }
    }

    function handleKeyUp(e) {
        if (!isTimerViewActive()) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (currentState === STATES.READY) {
                startSolve();
            } else if (currentState === STATES.HOLDING) {
                // Released before hold time reached
                clearTimeout(holdTimeout);
                if (config.useInspection) {
                    setState(STATES.INSPECTION);
                } else {
                    setState(STATES.IDLE);
                }
            }
        }
    }

    function handlePointerDown(e) {
        if (!isTimerViewActive()) return;
        if (e.target.closest('button, select, input, a, .glass-card, .solve-item')) return;

        if (currentState === STATES.RUNNING) {
            stopTimer();
        } else if (currentState === STATES.IDLE) {
            if (config.useInspection) {
                startInspection();
            } else {
                startHolding();
            }
        } else if (currentState === STATES.INSPECTION) {
            startHolding();
        }
    }

    function handlePointerUp(e) {
        if (!isTimerViewActive()) return;
        if (currentState === STATES.READY) {
            startSolve();
        } else if (currentState === STATES.HOLDING) {
            clearTimeout(holdTimeout);
            if (config.useInspection) {
                setState(STATES.INSPECTION);
            } else {
                setState(STATES.IDLE);
            }
        }
    }

    function startHolding() {
        setState(STATES.HOLDING);

        holdTimeout = setTimeout(() => {
            if (currentState === STATES.HOLDING) {
                playBeep(800, 100);
                setState(STATES.READY);
            }
        }, config.holdThresholdMs);
    }

    function startInspection() {
        if (inspectionInterval) clearInterval(inspectionInterval);
        inspectionStartTime = performance.now();
        inspectionPenalty = null;
        audioAlertsPlayed = { 8: false, 12: false };

        setState(STATES.INSPECTION);

        inspectionInterval = setInterval(() => {
            const elapsedSec = (performance.now() - inspectionStartTime) / 1000;
            const remainingSec = Math.ceil(15 - elapsedSec);

            if (elapsedSec >= 8 && !audioAlertsPlayed[8]) {
                playBeep(500, 200);
                audioAlertsPlayed[8] = true;
            }
            if (elapsedSec >= 12 && !audioAlertsPlayed[12]) {
                playBeep(700, 250);
                audioAlertsPlayed[12] = true;
            }

            if (elapsedSec > 17) {
                inspectionPenalty = 'DNF';
            } else if (elapsedSec > 15) {
                inspectionPenalty = '+2';
            }

            if (onTick) {
                let displayVal = remainingSec > 0 ? remainingSec.toString() : (elapsedSec > 17 ? 'DNF' : '+2');
                onTick(displayVal, true);
            }
        }, 100);
    }

    function startSolve() {
        if (inspectionInterval) clearInterval(inspectionInterval);

        startTime = performance.now();
        setState(STATES.RUNNING);

        timerInterval = setInterval(() => {
            const elapsed = performance.now() - startTime;
            if (onTick) onTick(formatCurrentTime(elapsed), false);
        }, 10); // Update every 10ms
    }

    function stopTimer() {
        stopTime = performance.now();
        const rawElapsed = stopTime - startTime;

        if (timerInterval) clearInterval(timerInterval);

        setState(STATES.STOPPED);
        playBeep(1000, 150);

        const finalTime = Math.round(rawElapsed);

        if (onSolveComplete) {
            onSolveComplete(finalTime, inspectionPenalty);
        }

        // Return to IDLE state shortly
        setTimeout(() => {
            if (currentState === STATES.STOPPED) {
                setState(STATES.IDLE);
            }
        }, 800);
    }

    function formatCurrentTime(ms) {
        const totalSec = ms / 1000;
        const mins = Math.floor(totalSec / 60);
        const secs = (totalSec % 60).toFixed(config.precision);

        if (mins > 0) {
            const secFormatted = (totalSec % 60 < 10 ? '0' : '') + secs;
            return `${mins}:${secFormatted}`;
        }
        return secs;
    }

    return {
        init,
        setConfig,
        getState: () => currentState,
        STATES,
        formatCurrentTime,
    };
})();
