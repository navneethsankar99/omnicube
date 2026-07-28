/**
 * 3D Cube Renderer using CSS 3D Transforms
 * Renders an interactive 3D Rubik's Cube and a 2D net for color input.
 */

const CubeRenderer = (() => {
    const COLORS = CubeState.DEFAULT_COLORS;

    /**
     * Render a 3D cube in a container element
     */
    function render3D(container, state, size = 200) {
        container.innerHTML = '';
        const scene = document.createElement('div');
        scene.className = 'cube-scene';
        scene.style.width = size + 'px';
        scene.style.height = size + 'px';

        const cube = document.createElement('div');
        cube.className = 'cube-3d';
        cube.id = 'cube3d';

        const faceMap = {
            'F': 'front',
            'B': 'back',
            'R': 'right',
            'L': 'left',
            'U': 'top',
            'D': 'bottom',
        };

        const faceSize = size;
        const half = faceSize / 2;

        for (const [faceName, cssClass] of Object.entries(faceMap)) {
            const face = document.createElement('div');
            face.className = `cube-face-3d ${cssClass}`;

            // Adjust transform for this size
            const transforms = {
                'front': `translateZ(${half}px)`,
                'back': `rotateY(180deg) translateZ(${half}px)`,
                'right': `rotateY(90deg) translateZ(${half}px)`,
                'left': `rotateY(-90deg) translateZ(${half}px)`,
                'top': `rotateX(90deg) translateZ(${half}px)`,
                'bottom': `rotateX(-90deg) translateZ(${half}px)`,
            };
            face.style.transform = transforms[cssClass];

            for (let i = 0; i < 9; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'cube-sticker-3d';
                const color = state[faceName][i];
                sticker.style.backgroundColor = COLORS[color] || '#2a2a3e';
                face.appendChild(sticker);
            }

            cube.appendChild(face);
        }

        scene.appendChild(cube);
        container.appendChild(scene);

        return cube;
    }

    /**
     * Update a 3D cube's colors without rebuilding DOM
     */
    function update3D(cubeEl, state) {
        if (!cubeEl) return;
        const faceOrder = ['F', 'B', 'R', 'L', 'U', 'D'];
        const faces = cubeEl.querySelectorAll('.cube-face-3d');

        faces.forEach((face, fi) => {
            const faceName = faceOrder[fi];
            const stickers = face.querySelectorAll('.cube-sticker-3d');
            stickers.forEach((s, si) => {
                const color = state[faceName][si];
                s.style.backgroundColor = COLORS[color] || '#2a2a3e';
            });
        });
    }

    /**
     * Render a 2D cube net for color input
     */
    function renderNet(container, state, onStickerClick) {
        container.innerHTML = '';
        const net = document.createElement('div');
        net.className = 'cube-net';

        const faceOrder = ['U', 'L', 'F', 'R', 'B', 'D'];

        for (const faceName of faceOrder) {
            const wrapper = document.createElement('div');
            wrapper.className = 'face-wrapper';

            const label = document.createElement('span');
            label.className = 'face-label';
            const faceLabels = { U: 'Up', D: 'Down', F: 'Front', B: 'Back', R: 'Right', L: 'Left' };
            label.textContent = faceLabels[faceName];

            const grid = document.createElement('div');
            grid.className = 'face-grid';
            grid.dataset.face = faceName;

            for (let i = 0; i < 9; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'sticker';
                if (i === 4) sticker.classList.add('center');

                const color = state[faceName][i];
                sticker.dataset.color = color || '';
                sticker.dataset.face = faceName;
                sticker.dataset.index = i;

                if (i !== 4 && onStickerClick) {
                    sticker.addEventListener('click', () => {
                        onStickerClick(faceName, i, sticker);
                    });
                }

                grid.appendChild(sticker);
            }

            wrapper.appendChild(label);
            wrapper.appendChild(grid);
            net.appendChild(wrapper);
        }

        container.appendChild(net);
    }

    /**
     * Update the net stickers without rebuilding
     */
    function updateNet(container, state) {
        const stickers = container.querySelectorAll('.sticker');
        stickers.forEach(s => {
            const face = s.dataset.face;
            const idx = parseInt(s.dataset.index);
            const color = state[face][idx];
            s.dataset.color = color || '';
        });
    }

    /**
     * Render a mini cube net for solution display
     */
    function renderMiniNet(container, state) {
        container.innerHTML = '';
        const net = document.createElement('div');
        net.className = 'mini-cube-net';

        const faceOrder = ['U', 'L', 'F', 'R', 'B', 'D'];

        for (const faceName of faceOrder) {
            const grid = document.createElement('div');
            grid.className = 'mini-face-grid';
            grid.dataset.face = faceName;

            for (let i = 0; i < 9; i++) {
                const sticker = document.createElement('div');
                sticker.className = 'mini-sticker';
                const color = state[faceName][i];
                sticker.dataset.color = color || '';
                grid.appendChild(sticker);
            }

            net.appendChild(grid);
        }

        container.appendChild(net);
    }

    /**
     * Render a color palette for selecting paint color
     */
    function renderPalette(container, selectedColor, onSelect) {
        container.innerHTML = '';
        const palette = document.createElement('div');
        palette.className = 'color-palette';

        const colors = [
            { face: 'U', cssClass: 'c-white', label: 'White' },
            { face: 'R', cssClass: 'c-red', label: 'Red' },
            { face: 'F', cssClass: 'c-green', label: 'Green' },
            { face: 'D', cssClass: 'c-yellow', label: 'Yellow' },
            { face: 'L', cssClass: 'c-orange', label: 'Orange' },
            { face: 'B', cssClass: 'c-blue', label: 'Blue' },
        ];

        colors.forEach(({ face, cssClass, label }) => {
            const btn = document.createElement('button');
            btn.className = `palette-color ${cssClass}`;
            if (face === selectedColor) btn.classList.add('selected');
            btn.title = label;
            btn.setAttribute('aria-label', `Select ${label}`);
            btn.addEventListener('click', () => {
                palette.querySelectorAll('.palette-color').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                onSelect(face);
            });
            palette.appendChild(btn);
        });

        container.appendChild(palette);
    }

    /**
     * Render an OLL diagram (3x3 grid showing oriented stickers)
     */
    function renderOLLDiagram(container, pattern) {
        container.innerHTML = '';
        const grid = document.createElement('div');
        grid.className = 'algo-diagram';

        for (let i = 0; i < 9; i++) {
            const sticker = document.createElement('div');
            sticker.className = 'mini-sticker';
            if (i === 4) {
                sticker.classList.add('filled');
            } else if (pattern[i]) {
                sticker.classList.add('filled');
            } else {
                sticker.classList.add('empty');
            }
            grid.appendChild(sticker);
        }

        container.appendChild(grid);
    }

    /**
     * Enable drag-to-rotate interaction on a 3D cube element
     */
    function enableInteractiveRotation(cubeEl, sceneEl) {
        if (!cubeEl || !sceneEl) return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;
        let currentRotX = -25;
        let currentRotY = -35;

        // Stop CSS float animation when user interacts
        sceneEl.style.cursor = 'grab';

        function onPointerDown(e) {
            isDragging = true;
            startX = e.clientX || (e.touches && e.touches[0].clientX);
            startY = e.clientY || (e.touches && e.touches[0].clientY);
            sceneEl.style.cursor = 'grabbing';
            cubeEl.style.animation = 'none'; // pause auto-float animation
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);

            const deltaX = x - startX;
            const deltaY = y - startY;

            currentRotY += deltaX * 0.5;
            currentRotX -= deltaY * 0.5;

            // Clamp vertical rotation to prevent flipping upside down
            currentRotX = Math.max(-85, Math.min(85, currentRotX));

            cubeEl.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;

            startX = x;
            startY = y;
        }

        function onPointerUp() {
            if (isDragging) {
                isDragging = false;
                sceneEl.style.cursor = 'grab';
            }
        }

        sceneEl.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    return {
        render3D,
        update3D,
        renderNet,
        updateNet,
        renderMiniNet,
        renderPalette,
        renderOLLDiagram,
        enableInteractiveRotation,
    };
})();
