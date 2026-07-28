/**
 * Main Application Controller
 * Handles routing, view management, and all UI interactions.
 */

const App = (() => {
    // === State ===
    let currentView = 'home';
    let cubeState = CubeState.createEmpty();
    let selectedColor = 'U'; // White by default
    let solverReady = false;
    let solutionData = null; // { moves: [], phases: { cross: [], f2l: [], oll: [], pll: [] } }
    let currentMoveIndex = 0;
    let activeAlgoTab = 'OLL';
    let algoMode = 'basic'; // 'basic' or 'advanced'

    // === DOM refs (set on init) ===
    let views = {};

    // === Router ===
    function navigate(viewName) {
        // Hide current view
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        // Show target view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.add('active');
            // Re-trigger animation
            targetView.style.animation = 'none';
            targetView.offsetHeight; // force reflow
            targetView.style.animation = '';
        }
        // Update desktop nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });
        // Update mobile bottom nav items
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });
        currentView = viewName;

        // View-specific init
        if (viewName === 'input') initInputView();
        if (viewName === 'algorithms') initAlgorithmsView();
        if (viewName === 'timer') initTimerView();
        if (viewName === 'notation') initNotationView();

        // Close mobile nav menu
        document.querySelector('.navbar-nav')?.classList.remove('open');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // === Loading Overlay ===
    function showLoading(text) {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = overlay.querySelector('.loading-text');
        loadingText.textContent = text || 'Loading...';
        overlay.classList.add('active');
    }

    function hideLoading() {
        document.getElementById('loading-overlay').classList.remove('active');
    }

    // === Toasts ===
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // === Home View ===
    function initHomeView() {
        const cubeContainer = document.getElementById('home-cube');
        const stageEl = document.getElementById('hero-cube-stage');
        if (cubeContainer) {
            const solved = CubeState.createSolved();
            const cubeEl = CubeRenderer.render3D(cubeContainer, solved, 190);
            if (stageEl) {
                CubeRenderer.enableInteractiveRotation(cubeEl, stageEl);
            }
        }
    }

    // === Input View ===
    function initInputView() {
        const netContainer = document.getElementById('input-net');
        const paletteContainer = document.getElementById('input-palette');

        CubeRenderer.renderNet(netContainer, cubeState, (face, index, stickerEl) => {
            cubeState[face][index] = selectedColor;
            stickerEl.dataset.color = selectedColor;
        });

        CubeRenderer.renderPalette(paletteContainer, selectedColor, (color) => {
            selectedColor = color;
        });

        // Update mini 3D preview
        updateInputPreview();
    }

    function updateInputPreview() {
        const previewContainer = document.getElementById('input-preview-3d');
        if (previewContainer) {
            CubeRenderer.render3D(previewContainer, cubeState, 140);
        }
    }

    function resetCube() {
        cubeState = CubeState.createEmpty();
        initInputView();
        showToast('Cube reset to empty', 'info');
    }

    function randomScramble() {
        // Generate a random scramble and apply it
        const moves = ['U', 'D', 'F', 'B', 'R', 'L'];
        const mods = ['', "'", '2'];
        let scramble = '';
        let lastFace = '';
        for (let i = 0; i < 20; i++) {
            let face;
            do {
                face = moves[Math.floor(Math.random() * moves.length)];
            } while (face === lastFace);
            lastFace = face;
            scramble += face + mods[Math.floor(Math.random() * mods.length)] + ' ';
        }
        scramble = scramble.trim();

        cubeState = CubeState.applyMoves(CubeState.createSolved(), scramble);
        initInputView();
        showToast(`Scramble: ${scramble}`, 'info');
    }

    async function solveCube() {
        // Validate
        const validation = CubeState.validate(cubeState);
        if (!validation.valid) {
            showToast('Invalid cube: ' + validation.errors[0], 'error');
            return;
        }

        // Initialize solver if needed
        if (!solverReady) {
            showLoading('Initializing solver engine...');
            try {
                await Solver.init();
                solverReady = true;
            } catch (e) {
                hideLoading();
                showToast('Solver initialization failed', 'error');
                return;
            }
        }

        showLoading('Solving cube...');

        // Small delay to let UI update
        await new Promise(r => setTimeout(r, 100));

        try {
            // Convert cube state to solver format
            const solverInput = CubeState.toSolverFormat(cubeState);
            const solution = Solver.solve(solverInput, false);

            if (!solution || solution.trim() === '') {
                hideLoading();
                showToast('Cube is already solved!', 'success');
                return;
            }

            const moves = solution.trim().split(/\s+/);
            solutionData = {
                moves: moves,
                originalState: CubeState.clone(cubeState),
                totalMoves: moves.length,
            };
            currentMoveIndex = -1;

            hideLoading();
            navigate('solve');
            initSolveView();
        } catch (e) {
            hideLoading();
            showToast('Solver error: ' + (e.message || 'Unknown error'), 'error');
        }
    }

    // === Solve View ===
    function initSolveView() {
        if (!solutionData) return;

        const movesContainer = document.getElementById('solve-moves');
        const cubeDisplay = document.getElementById('solve-cube-display');
        const moveCountEl = document.getElementById('solve-move-count');
        const stepCounterEl = document.getElementById('step-counter');

        // Show total move count
        moveCountEl.textContent = `${solutionData.totalMoves} moves`;

        // Render moves as badges
        renderMovesBadges(movesContainer);

        // Set initial state
        currentMoveIndex = -1;
        updateSolveDisplay();
    }

    function renderMovesBadges(container) {
        container.innerHTML = '';
        solutionData.moves.forEach((move, i) => {
            const badge = document.createElement('span');
            badge.className = 'move-badge';
            badge.textContent = move;
            badge.dataset.index = i;
            badge.addEventListener('click', () => {
                goToMove(i);
            });
            container.appendChild(badge);
        });
    }

    function updateSolveDisplay() {
        if (!solutionData) return;

        // Update badges highlighting
        const badges = document.querySelectorAll('#solve-moves .move-badge');
        badges.forEach((badge, i) => {
            badge.classList.remove('highlight', 'past');
            if (i === currentMoveIndex) {
                badge.classList.add('highlight');
            } else if (i < currentMoveIndex) {
                badge.classList.add('past');
            }
        });

        // Update step counter
        const stepCounterEl = document.getElementById('step-counter');
        stepCounterEl.textContent = `${currentMoveIndex + 1} / ${solutionData.totalMoves}`;

        // Compute current cube state by applying moves up to currentMoveIndex
        let currentState = CubeState.clone(solutionData.originalState);
        for (let i = 0; i <= currentMoveIndex; i++) {
            currentState = CubeState.applyMove(currentState, solutionData.moves[i]);
        }

        // Render mini net
        const cubeDisplay = document.getElementById('solve-cube-display');
        CubeRenderer.renderMiniNet(cubeDisplay, currentState);

        // Scroll active badge into view
        const activeBadge = document.querySelector('#solve-moves .move-badge.highlight');
        if (activeBadge) {
            activeBadge.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    }

    function goToMove(index) {
        currentMoveIndex = Math.max(-1, Math.min(index, solutionData.totalMoves - 1));
        updateSolveDisplay();
    }

    function nextMove() {
        if (!solutionData) return;
        if (currentMoveIndex < solutionData.totalMoves - 1) {
            currentMoveIndex++;
            updateSolveDisplay();
        }
    }

    function prevMove() {
        if (!solutionData) return;
        if (currentMoveIndex >= 0) {
            currentMoveIndex--;
            updateSolveDisplay();
        }
    }

    function firstMove() {
        currentMoveIndex = -1;
        updateSolveDisplay();
    }

    function lastMove() {
        if (!solutionData) return;
        currentMoveIndex = solutionData.totalMoves - 1;
        updateSolveDisplay();
    }

    // === Algorithms View ===
    function initAlgorithmsView() {
        updateModeToggle();
        renderAlgoTab(activeAlgoTab);
    }

    function updateModeToggle() {
        const basicBtn = document.getElementById('mode-basic');
        const advancedBtn = document.getElementById('mode-advanced');
        const descEl = document.getElementById('mode-description');
        if (!basicBtn || !advancedBtn) return;

        basicBtn.classList.toggle('active', algoMode === 'basic');
        advancedBtn.classList.toggle('active', algoMode === 'advanced');

        if (descEl) {
            descEl.textContent = algoMode === 'basic' 
                ? 'Basic Mode (2-Look): Shows the minimum 16 essential algorithms (10 OLL + 6 PLL) needed to solve the last layer in 2 steps.'
                : 'Advanced Mode (Full): Complete CFOP algorithm set with all 57 OLL, 21 PLL, and 41 F2L cases.';
        }

        // Update tab counts
        document.querySelectorAll('.algo-tab').forEach(t => {
            const tab = t.dataset.tab;
            let count;
            if (tab === 'OLL') count = algoMode === 'basic' ? Algorithms.OLL.filter(a => a.basic).length : 57;
            else if (tab === 'PLL') count = algoMode === 'basic' ? Algorithms.PLL.filter(a => a.basic).length : 21;
            else if (tab === 'F2L') count = 41;
            t.textContent = `${tab} (${count})`;
        });
    }

    function setAlgoMode(mode) {
        algoMode = mode;
        updateModeToggle();
        renderAlgoTab(activeAlgoTab);
    }

    function renderAlgoTab(tab) {
        activeAlgoTab = tab;

        // Update tab buttons
        document.querySelectorAll('.algo-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        const grid = document.getElementById('algo-grid');
        grid.innerHTML = '';

        let algos;
        if (tab === 'OLL') algos = Algorithms.OLL;
        else if (tab === 'PLL') algos = Algorithms.PLL;
        else if (tab === 'F2L') algos = Algorithms.F2L;
        else return;

        // Filter for basic mode (only OLL/PLL have basic flags)
        const isBasicMode = algoMode === 'basic' && (tab === 'OLL' || tab === 'PLL');
        if (isBasicMode) {
            algos = algos.filter(a => a.basic);
        }

        // Group by basicGroup if in basic mode
        if (isBasicMode) {
            const groups = {};
            algos.forEach(a => {
                const group = a.basicGroup || 'other';
                if (!groups[group]) groups[group] = [];
                groups[group].push(a);
            });

            const groupLabels = {
                edges: tab === 'OLL' ? 'Step 1 — Orient Edges (get the cross)' : 'Step 2 — Permute Edges',
                corners: tab === 'OLL' ? 'Step 2 — Orient Corners' : 'Step 1 — Permute Corners',
            };

            // Render in correct order
            const groupOrder = tab === 'OLL' ? ['edges', 'corners'] : ['corners', 'edges'];

            for (const groupKey of groupOrder) {
                if (!groups[groupKey]) continue;

                // Group header
                const header = document.createElement('div');
                header.className = 'algo-group-header';
                header.textContent = groupLabels[groupKey] || groupKey;
                grid.appendChild(header);

                groups[groupKey].forEach(algo => {
                    grid.appendChild(createAlgoCard(algo, tab));
                });
            }
        } else {
            algos.forEach(algo => {
                grid.appendChild(createAlgoCard(algo, tab));
            });
        }
    }

    function createAlgoCard(algo, tab) {
        const card = document.createElement('div');
        card.className = 'algo-card glass-card';
        if (algo.basic) card.classList.add('algo-basic');

        // Diagram
        const diagram = document.createElement('div');
        if (tab === 'OLL' && algo.pattern) {
            CubeRenderer.renderOLLDiagram(diagram, algo.pattern);
        } else {
            // Simple numbered circle for PLL/F2L
            diagram.className = 'algo-diagram';
            diagram.style.display = 'flex';
            diagram.style.alignItems = 'center';
            diagram.style.justifyContent = 'center';
            diagram.style.background = 'var(--bg-tertiary)';
            diagram.style.borderRadius = '12px';
            diagram.style.fontSize = '1.2rem';
            diagram.style.fontWeight = '800';
            diagram.style.color = 'var(--accent-purple)';
            diagram.textContent = `#${algo.id}`;
        }

        // Info
        const info = document.createElement('div');
        info.className = 'algo-info';

        const name = document.createElement('div');
        name.className = 'algo-name';
        name.textContent = `${algo.name} — ${algo.aka}`;

        const moves = document.createElement('div');
        moves.className = 'algo-moves';
        moves.textContent = algo.algo;

        info.appendChild(name);
        info.appendChild(moves);

        card.appendChild(diagram);
        card.appendChild(info);
        return card;
    }

    // === Notation View ===
    function initNotationView() {
        const grid = document.getElementById('notation-grid');
        grid.innerHTML = '';

        Algorithms.NOTATION.forEach(item => {
            const card = document.createElement('div');
            card.className = 'notation-item glass-card';

            const symbol = document.createElement('div');
            symbol.className = 'notation-symbol';
            symbol.textContent = item.symbol;

            const desc = document.createElement('div');
            desc.className = 'notation-desc';
            desc.textContent = item.desc;

            card.appendChild(symbol);
            card.appendChild(desc);
            grid.appendChild(card);
        });
    }

    // === Timer View ===
    let currentScramble = '';

    function initTimerView() {
        if (!currentScramble) {
            generateNewScramble();
        }

        renderSessionSelect();
        renderTimerStats();
        renderSolvesTable();
    }

    function generateNewScramble() {
        currentScramble = ScrambleGenerator.generate3x3();
        const textEl = document.getElementById('timer-scramble-text');
        if (textEl) textEl.textContent = currentScramble;

        updateScramblePreview();
    }

    function updateScramblePreview() {
        const previewBox = document.getElementById('scramble-preview-box');
        const netContainer = document.getElementById('scramble-preview-net');
        if (!previewBox || !netContainer) return;

        if (!previewBox.classList.contains('hidden')) {
            const scrambledState = CubeState.applyMoves(CubeState.createSolved(), currentScramble);
            CubeRenderer.renderMiniNet(netContainer, scrambledState);
        }
    }

    function toggleScramblePreview() {
        const previewBox = document.getElementById('scramble-preview-box');
        if (!previewBox) return;
        previewBox.classList.toggle('hidden');
        updateScramblePreview();
    }

    function solveCurrentScramble() {
        if (!currentScramble) return;

        // Apply scramble to solved state
        cubeState = CubeState.applyMoves(CubeState.createSolved(), currentScramble);

        // Navigate to input view & show Toast
        navigate('input');
        showToast(`Scramble loaded into solver!`, 'info');

        // Automatically trigger solve
        solveCube();
    }

    function renderSessionSelect() {
        const select = document.getElementById('session-select');
        if (!select) return;

        const sessionsList = TimerStats.getSessionsList();
        const activeId = TimerStats.getActiveSessionId();

        select.innerHTML = '';
        sessionsList.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id;
            opt.textContent = `${s.name} (${s.count})`;
            if (s.id === activeId) opt.selected = true;
            select.appendChild(opt);
        });
    }

    function renderTimerStats() {
        const stats = TimerStats.getSummaryStats();

        const countEl = document.getElementById('stat-count');
        const bestEl = document.getElementById('stat-best');
        const ao5El = document.getElementById('stat-ao5');
        const ao12El = document.getElementById('stat-ao12');
        const meanEl = document.getElementById('stat-mean');

        if (countEl) countEl.textContent = stats.count;
        if (bestEl) bestEl.textContent = stats.best !== null ? TimerStats.formatTime(stats.best) : '—';
        if (ao5El) ao5El.textContent = stats.ao5 !== null ? TimerStats.formatTime(stats.ao5) : '—';
        if (ao12El) ao12El.textContent = stats.ao12 !== null ? TimerStats.formatTime(stats.ao12) : '—';
        if (meanEl) meanEl.textContent = stats.mean !== null ? TimerStats.formatTime(stats.mean) : '—';
    }

    function renderSolvesTable() {
        const tbody = document.getElementById('solves-table-body');
        if (!tbody) return;

        const solves = TimerStats.getActiveSolves();
        tbody.innerHTML = '';

        if (solves.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center text-muted" style="padding: 24px;">No solves in this session yet. Press Spacebar to start timing!</td>`;
            tbody.appendChild(row);
            return;
        }

        solves.forEach((solve, index) => {
            const rowNumber = solves.length - index;
            const row = document.createElement('tr');

            // Calculate rolling Ao5 and Ao12 for this solve point
            const sliceFromSolve = solves.slice(index);
            const rollingAo5 = TimerStats.getSummaryStats().count >= 5 ? TimerStats.formatTime(calculateSliceAoN(sliceFromSolve, 5)) : '—';
            const rollingAo12 = TimerStats.getSummaryStats().count >= 12 ? TimerStats.formatTime(calculateSliceAoN(sliceFromSolve, 12)) : '—';

            const timeFormatted = TimerStats.formatTime(solve.rawTime, solve.penalty);

            row.innerHTML = `
                <td>${rowNumber}</td>
                <td class="mono font-bold ${solve.penalty === 'DNF' ? 'text-danger' : ''}">${timeFormatted}</td>
                <td class="mono text-muted">${rollingAo5}</td>
                <td class="mono text-muted">${rollingAo12}</td>
                <td class="mono text-muted scramble-cell" title="${solve.scramble}">${solve.scramble}</td>
                <td>
                    <div class="action-btn-group">
                        <button class="btn btn-sm ${solve.penalty === '+2' ? 'btn-primary' : 'btn-ghost'}" data-action="penalty-2" data-id="${solve.id}">+2</button>
                        <button class="btn btn-sm ${solve.penalty === 'DNF' ? 'btn-primary' : 'btn-ghost'}" data-action="penalty-dnf" data-id="${solve.id}">DNF</button>
                        <button class="btn btn-sm btn-ghost text-danger" data-action="delete" data-id="${solve.id}">✕</button>
                    </div>
                </td>
            `;

            tbody.appendChild(row);
        });

        // Event delegation for table action buttons
        tbody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const id = btn.dataset.id;

                if (action === 'penalty-2') TimerStats.togglePenalty(id, '+2');
                else if (action === 'penalty-dnf') TimerStats.togglePenalty(id, 'DNF');
                else if (action === 'delete') TimerStats.deleteSolve(id);

                renderSessionSelect();
                renderTimerStats();
                renderSolvesTable();
            });
        });
    }

    function calculateSliceAoN(solvesSlice, count) {
        if (solvesSlice.length < count) return null;
        const slice = solvesSlice.slice(0, count);
        let dnfCount = 0;
        const times = slice.map(s => {
            if (s.penalty === 'DNF') { dnfCount++; return Infinity; }
            return s.penalty === '+2' ? s.rawTime + 2000 : s.rawTime;
        });

        if (dnfCount >= 2) return Infinity;
        times.sort((a, b) => a - b);
        const trimmed = times.slice(1, count - 1);
        const sum = trimmed.reduce((acc, t) => acc + t, 0);
        return sum / trimmed.length;
    }

    // === Keyboard Shortcuts ===
    function handleKeyboard(e) {
        if (currentView === 'solve' && solutionData) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextMove();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevMove();
            } else if (e.key === 'Home') {
                e.preventDefault();
                firstMove();
            } else if (e.key === 'End') {
                e.preventDefault();
                lastMove();
            }
        } else if (currentView === 'timer') {
            if (e.altKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                generateNewScramble();
            }
        }
    }

    // === Initialize ===
    function init() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(link.dataset.view);
            });
        });

        // Mobile nav toggle
        const navToggle = document.getElementById('nav-toggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                document.querySelector('.navbar-nav').classList.toggle('open');
            });
        }

        // Home buttons
        document.getElementById('btn-solve')?.addEventListener('click', () => navigate('input'));
        document.getElementById('btn-learn')?.addEventListener('click', () => navigate('algorithms'));

        // Input controls
        document.getElementById('btn-solve-cube')?.addEventListener('click', solveCube);
        document.getElementById('btn-reset')?.addEventListener('click', resetCube);
        document.getElementById('btn-random')?.addEventListener('click', randomScramble);

        // Solve navigation
        document.getElementById('btn-first')?.addEventListener('click', firstMove);
        document.getElementById('btn-prev')?.addEventListener('click', prevMove);
        document.getElementById('btn-next')?.addEventListener('click', nextMove);
        document.getElementById('btn-last')?.addEventListener('click', lastMove);
        document.getElementById('btn-back-to-input')?.addEventListener('click', () => navigate('input'));

        // Algo tabs
        document.querySelectorAll('.algo-tab').forEach(tab => {
            tab.addEventListener('click', () => renderAlgoTab(tab.dataset.tab));
        });

        // Timer controls
        document.getElementById('btn-next-scramble')?.addEventListener('click', generateNewScramble);
        document.getElementById('btn-timer-preview-toggle')?.addEventListener('click', toggleScramblePreview);
        document.getElementById('btn-timer-solve-scramble')?.addEventListener('click', solveCurrentScramble);

        document.getElementById('session-select')?.addEventListener('change', (e) => {
            TimerStats.switchSession(e.target.value);
            renderTimerStats();
            renderSolvesTable();
        });

        document.getElementById('btn-new-session')?.addEventListener('click', () => {
            const name = prompt('Enter new session name:', `Session ${TimerStats.getSessionsList().length + 1}`);
            if (name) {
                TimerStats.createSession(name);
                renderSessionSelect();
                renderTimerStats();
                renderSolvesTable();
            }
        });

        document.getElementById('btn-clear-session')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all solves in this session?')) {
                TimerStats.clearActiveSession();
                renderSessionSelect();
                renderTimerStats();
                renderSolvesTable();
            }
        });

        document.getElementById('opt-inspection')?.addEventListener('change', (e) => {
            TimerEngine.setConfig({ useInspection: e.target.checked });
        });

        document.getElementById('opt-audio')?.addEventListener('change', (e) => {
            TimerEngine.setConfig({ useAudio: e.target.checked });
        });

        document.getElementById('opt-precision')?.addEventListener('change', (e) => {
            TimerEngine.setConfig({ precision: parseInt(e.target.value) });
        });

        // Initialize Timer Engine
        const digitsEl = document.getElementById('timer-digits');
        const hintEl = document.getElementById('timer-status-hint');

        TimerEngine.init({
            onStateChange: (state) => {
                const container = document.getElementById('timer-touch-area');
                if (!container) return;

                container.classList.remove('state-holding', 'state-ready', 'state-running', 'state-inspection');

                if (state === TimerEngine.STATES.HOLDING) {
                    container.classList.add('state-holding');
                    if (hintEl) hintEl.textContent = 'Hold until green...';
                } else if (state === TimerEngine.STATES.READY) {
                    container.classList.add('state-ready');
                    if (hintEl) hintEl.textContent = 'Release to start!';
                } else if (state === TimerEngine.STATES.INSPECTION) {
                    container.classList.add('state-inspection');
                    if (hintEl) hintEl.textContent = 'Inspection — Hold Space/Tap to start solve';
                } else if (state === TimerEngine.STATES.RUNNING) {
                    container.classList.add('state-running');
                    if (hintEl) hintEl.textContent = 'Press any key / tap to stop';
                } else if (state === TimerEngine.STATES.IDLE || state === TimerEngine.STATES.STOPPED) {
                    if (hintEl) hintEl.textContent = 'Hold SPACE or TAP to start timing';
                }
            },
            onTick: (val, isInspection) => {
                if (digitsEl) {
                    digitsEl.textContent = val;
                }
            },
            onSolveComplete: (timeMs, penalty) => {
                const solve = TimerStats.addSolve(timeMs, currentScramble);

                if (digitsEl) {
                    digitsEl.textContent = TimerStats.formatTime(solve.rawTime, solve.penalty);
                }

                generateNewScramble();
                renderSessionSelect();
                renderTimerStats();
                renderSolvesTable();
            },
        });

        // Mobile Bottom Navigation Links
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(item.dataset.view);
            });
        });

        // Home Hero Buttons
        document.getElementById('btn-timer-hero')?.addEventListener('click', () => navigate('timer'));

        // PWA Installation Handler
        let deferredPrompt;
        const installBtn = document.getElementById('btn-pwa-install');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installBtn) installBtn.classList.remove('hidden');
        });

        installBtn?.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showToast('OmniCube installed successfully!', 'success');
            }
            deferredPrompt = null;
            installBtn.classList.add('hidden');
        });

        // Keyboard
        document.addEventListener('keydown', handleKeyboard);

        // Init home view
        initHomeView();
        navigate('home');

        // Dismiss splash screen smoothly after 1.2s
        setTimeout(() => {
            const splash = document.getElementById('app-splash');
            if (splash) splash.classList.add('hidden');
        }, 1200);

        // Service Worker Registration for PWA Offline Functionality
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').then((reg) => {
                    console.log('OmniCube Service Worker registered:', reg.scope);
                }).catch((err) => {
                    console.error('Service Worker registration failed:', err);
                });
            });
        }

        // Pre-initialize solver in background
        setTimeout(async () => {
            try {
                await Solver.init();
                solverReady = true;
            } catch(e) {
                // Will init on first solve attempt
            }
        }, 1000);
    }

    return { init, navigate };
})();

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
