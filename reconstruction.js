(function () {
    const TZ = 'Europe/Warsaw';
    const body = document.body;
    const clockEl = document.getElementById('clock');
    const controlsEl = document.getElementById('phaseControls');
    const jpiiEl = document.getElementById('jpiiOverlay');
    const batSignalEl = document.getElementById('batSignal');
    const batBeamEl = document.getElementById('batBeam');
    const starsL1 = document.getElementById('starsL1');
    const starsL2 = document.getElementById('starsL2');
    const starsL3 = document.getElementById('starsL3');
    const bgRoot = document.querySelector('.construction-bg');
    const moleEl = document.querySelector('.mole');
    const groundEl = document.querySelector('.ground');

    // Manual override state
    let manualPhase = null;
    let manualExpires = 0;
    const MANUAL_MS = 30000; // 30 seconds

    // JPII manual trigger
    let jpiiManualExpires = 0;
    const JPII_MANUAL_MS = 60000; // 60 seconds

    // Bat-Signal random window
    let batSignalUntil = 0; // timestamp until when to show

    // Stars & shooting stars
    let starsBuilt = false;
    let nextShootingEarliest = 0;
    let lastMoundX = null;
    let nextMolePopAt = 0; // schedule for surface pop
    let nextMoleNapAt = 0; // timestamp when next nap starts (daytime)
    let moleNapUntil = 0; // timestamp when current nap ends

    // Mole AI state
    const moleState = {
        active: true,
        x: 0, // px from left of bgRoot
        y: 0, // px from bottom of bgRoot
        vx: 0, // px/s
        vy: 0, // px/s
        face: 1, // 1 right, -1 left
        mode: 'walk', // 'walk' | 'run' | 'stop' | 'dig'
        until: 0, // timestamp when to pick next action
        popping: false,
        savedY: 0,
    };

    function clamp(num, min, max) { return Math.min(max, Math.max(min, num)); }

    function pickNextMoleAction(now) {
        // Probability weights (dig less often)
        const r = Math.random();
        let mode;
        if (r < 0.20) mode = 'stop';
        else if (r < 0.70) mode = 'walk';
        else if (r < 0.78) mode = 'dig';
        else mode = 'run';
        const dur = 1000 * (
            mode === 'run' ? (0.8 + Math.random() * 1.2) :
                mode === 'walk' ? (2.2 + Math.random() * 2.2) :
                    mode === 'stop' ? (0.7 + Math.random() * 1.3) : // dig
                        (0.6 + Math.random() * 0.6)
        );
        moleState.mode = mode;
        let speed = 0;
        if (mode === 'run') speed = 140;
        else if (mode === 'walk') speed = 48;
        else if (mode === 'dig') speed = 16;
        else speed = 0;
        if (speed > 0) {
            const ang = Math.random() * Math.PI * 2; // 0..2pi
            const vx = Math.cos(ang) * speed;
            const vy = Math.sin(ang) * speed * 0.6; // less vertical
            moleState.vx = vx;
            moleState.vy = vy;
            if (Math.abs(vx) > 2) moleState.face = vx >= 0 ? -1 : 1;
        } else {
            moleState.vx = 0;
            moleState.vy = 0;
        }
        moleState.until = now + dur;
        if (moleEl) {
            moleEl.classList.remove('run', 'stop', 'dig');
            if (mode === 'run') moleEl.classList.add('run');
            if (mode === 'stop') moleEl.classList.add('stop');
            if (mode === 'dig') moleEl.classList.add('dig');
        }
    }

    function initMole() {
        if (!bgRoot || !moleEl) return;
        const rootRect = bgRoot.getBoundingClientRect();
        const moleRect = moleEl.getBoundingClientRect();
        // place horizontally in the middle of ground with padding margins
        const padding = 24;
        const minX = padding;
        const maxX = rootRect.width - moleRect.width - padding;
        const midX = (rootRect.width - moleRect.width) / 2;
        moleState.x = clamp(midX, minX, maxX);
        moleEl.style.left = `${moleState.x}px`;
        moleState.y = rootRect.bottom - moleRect.bottom; // current bottom in px
        moleState.face = Math.random() < 0.5 ? -1 : 1;
        pickNextMoleAction(Date.now());
        scheduleNextPop();
        scheduleNextNap();
    }

    function scheduleNextNap() {
        // next nap starts in 3 minutes from now; nap lasts 2 minutes
        const now = Date.now();
        nextMoleNapAt = now + 3 * 60 * 1000;
    }

    function updateMole(dtMs) {
        if (!bgRoot || !moleEl) return;
        const now = Date.now();
        const isNight = body.classList.contains('phase-night');
        const napping = (!isNight) && (moleNapUntil && now < moleNapUntil);

        // Handle start/end of nap during daytime
        if (!isNight && !napping && nextMoleNapAt && now >= nextMoleNapAt) {
            // begin nap for 2 minutes
            moleNapUntil = now + 2 * 60 * 1000;
            nextMoleNapAt = 0; // will reschedule after waking
            if (moleEl) moleEl.classList.add('nap');
        } else if (!isNight && napping && now >= moleNapUntil) {
            // wake up
            moleNapUntil = 0;
            scheduleNextNap();
            if (moleEl) moleEl.classList.remove('nap');
        }

        if (!moleState.popping && !napping && now >= moleState.until) pickNextMoleAction(now);

        // bounds within the ground band
        const rootRect = bgRoot.getBoundingClientRect();
        const groundRect = groundEl.getBoundingClientRect();
        const moleRect = moleEl.getBoundingClientRect();
        const padding = 24;
        const minX = padding;
        const maxX = rootRect.width - moleRect.width - padding;
        const groundTopFromBottom = rootRect.bottom - groundRect.top;
        const minY = Math.max(groundTopFromBottom * 0.18, 20); // stay underground but not too deep
        const maxY = groundTopFromBottom - moleRect.height * 0.6; // keep body within soil

        if (!moleState.popping && !napping) {
            // integrate position
            moleState.x = clamp(moleState.x + moleState.vx * (dtMs / 1000), minX, maxX);
            moleState.y = clamp(moleState.y + moleState.vy * (dtMs / 1000), minY, maxY);

            // reflect off walls
            if (moleState.x === minX || moleState.x === maxX) moleState.vx *= -1;
            if (moleState.y === minY || moleState.y === maxY) moleState.vy *= -1;
        }

        // apply position and facing
        if (Math.abs(moleState.vx) > 1) moleState.face = moleState.vx >= 0 ? -1 : 1;
        moleEl.style.left = `${moleState.x}px`;
        moleEl.style.bottom = `${moleState.y}px`;
        moleEl.style.transform = `scaleX(${moleState.face})`;

        // Spawn mounds: only while digging frequently, otherwise rarely
        if (!moleState.popping && !napping && (moleState.mode === 'dig' || moleState.mode === 'walk' || moleState.mode === 'run')) {
            const baseInterval = moleState.mode === 'dig' ? 700 : 2200;
            if (!updateMole._nextMoundAt || now >= updateMole._nextMoundAt) {
                if (moleState.mode === 'dig' || Math.random() < 0.4) {
                    placeMound();
                }
                updateMole._nextMoundAt = now + baseInterval + Math.random() * 500;
            }
        }
    }

    // per-frame updater to drive mole independently of tick cadence
    let rafPrev = 0;
    function rafLoop(ts) {
        if (!rafPrev) rafPrev = ts;
        const dt = ts - rafPrev;
        rafPrev = ts;
        // Only update mole when not night
        const isNight = body.classList.contains('phase-night');
        if (!isNight) {
            const now = Date.now();
            const napping = (moleNapUntil && now < moleNapUntil);
            if (nextMolePopAt && now >= nextMolePopAt && !moleState.popping && !napping) {
                startMolePop();
            }
            updateMole(dt);
        }
        requestAnimationFrame(rafLoop);
    }

    function rand(min, max) { return Math.random() * (max - min) + min; }
    function buildStarsOnce() {
        if (starsBuilt) return;
        const makeLayer = (el, count, spreadX = [0, 100], spreadY = [4, 48], alpha = [0.6, 1]) => {
            if (!el) return;
            const parts = [];
            for (let i = 0; i < count; i++) {
                const x = rand(spreadX[0], spreadX[1]).toFixed(2);
                const y = rand(spreadY[0], spreadY[1]).toFixed(2);
                const a = rand(alpha[0], alpha[1]).toFixed(2);
                parts.push(`${x}vw ${y}vh 0 0 rgba(255,255,255,${a})`);
            }
            el.style.boxShadow = parts.join(',');
        };
        makeLayer(starsL1, 90);
        makeLayer(starsL2, 50);
        makeLayer(starsL3, 24);
        starsBuilt = true;
    }

    function scheduleNextPop() {
        // next pop in 12-28s
        nextMolePopAt = Date.now() + 1000 * (12 + Math.random() * 16);
    }

    function startMolePop() {
        if (!bgRoot || !groundEl || !moleEl) return;
        const root = bgRoot.getBoundingClientRect();
        const ground = groundEl.getBoundingClientRect();
        moleState.popping = true;
        moleState.savedY = moleState.y;
        // target: slightly above ground top
        const groundTopFromBottom = root.bottom - ground.top;
        const targetBottom = groundTopFromBottom + 10; // px
        moleEl.style.bottom = `${targetBottom}px`;

        // burst dirt at the hole
        const moleRect2 = moleEl.getBoundingClientRect();
        const x = moleRect2.left - root.left + moleRect2.width * 0.5;
        const y = groundTopFromBottom + 6;
        spawnBurst(x, y);

        // return underground after a short peek
        setTimeout(() => {
            moleEl.style.bottom = `${moleState.savedY}px`;
            setTimeout(() => {
                moleState.popping = false;
                scheduleNextPop();
            }, 350);
        }, 700);
    }

    function spawnShootingStar() {
        if (!bgRoot) return;
        const el = document.createElement('div');
        el.className = 'shooting-star';
        const startTop = `${rand(6, 26).toFixed(1)}vh`;
        const startLeft = `${rand(-8, 20).toFixed(1)}vw`;
        const tx = `${rand(40, 70).toFixed(1)}vw`;
        const ty = `${rand(10, 26).toFixed(1)}vh`;
        const angle = `${rand(-35, -20).toFixed(0)}deg`;
        const dur = `${rand(0.8, 1.6).toFixed(2)}s`;
        el.style.top = startTop;
        el.style.left = startLeft;
        el.style.setProperty('--tx', tx);
        el.style.setProperty('--ty', ty);
        el.style.setProperty('--angle', angle);
        el.style.setProperty('--dur', dur);
        bgRoot.appendChild(el);
        el.addEventListener('animationend', () => el.remove(), { once: true });
    }

    function placeMound() {
        if (!bgRoot || !moleEl) return;
        const moleRect = moleEl.getBoundingClientRect();
        const rootRect = bgRoot.getBoundingClientRect();
        const x = moleRect.left - rootRect.left + moleRect.width * 0.35; // slightly behind center
        const yBottom = rootRect.bottom - moleRect.bottom + 2; // near mole burrow level
        if (lastMoundX !== null && Math.abs(x - lastMoundX) < 18) return; // avoid over-density
        lastMoundX = x;
        const mound = document.createElement('div');
        mound.className = 'dirt-mound';
        mound.style.left = `${x - 20}px`;
        mound.style.bottom = `${yBottom - 2}px`;
        bgRoot.appendChild(mound);
        mound.addEventListener('animationend', () => mound.remove(), { once: true });
        spawnClods(x, yBottom + 6);
    }

    function spawnClods(x, y) {
        if (!bgRoot) return;
        const n = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < n; i++) {
            const c = document.createElement('div');
            c.className = 'clod';
            const dx = (Math.random() * 26 + 10) * (Math.random() < 0.5 ? -1 : 1);
            const dy = -(Math.random() * 16 + 8);
            const sz = (Math.random() * 3 + 4).toFixed(0) + 'px';
            const dur = (Math.random() * 0.4 + 0.7).toFixed(2) + 's';
            c.style.left = `${x}px`;
            c.style.bottom = `${y}px`;
            c.style.setProperty('--dx', `${dx}px`);
            c.style.setProperty('--dy', `${dy}px`);
            c.style.setProperty('--sz', sz);
            c.style.setProperty('--dur', dur);
            bgRoot.appendChild(c);
            c.addEventListener('animationend', () => c.remove(), { once: true });
        }
    }

    function spawnBurst(x, y) {
        if (!bgRoot) return;
        const count = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
            const c = document.createElement('div');
            c.className = 'clod';
            const ang = (Math.random() * Math.PI) - Math.PI / 2; // around up direction
            const dist = 24 + Math.random() * 26;
            const dx = Math.cos(ang) * dist;
            const dy = Math.sin(ang) * dist - (18 + Math.random() * 20);
            const sz = (Math.random() * 4 + 4).toFixed(0) + 'px';
            const dur = (Math.random() * 0.5 + 0.8).toFixed(2) + 's';
            c.style.left = `${x}px`;
            c.style.bottom = `${y}px`;
            c.style.setProperty('--dx', `${dx}px`);
            c.style.setProperty('--dy', `${dy}px`);
            c.style.setProperty('--sz', sz);
            c.style.setProperty('--dur', dur);
            bgRoot.appendChild(c);
            c.addEventListener('animationend', () => c.remove(), { once: true });
        }
    }

    // Add lamp nodes to cones once
    function ensureConeLamps() {
        document.querySelectorAll('.cone').forEach(c => {
            if (!c.querySelector('.lamp')) {
                const lamp = document.createElement('div');
                lamp.className = 'lamp';
                c.appendChild(lamp);
            }
        });
    }

    function getWarsawParts() {
        const fmt = new Intl.DateTimeFormat('en-GB', {
            timeZone: TZ,
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'short'
        });
        const parts = fmt.formatToParts(new Date());
        const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
        return { h: parseInt(map.hour, 10), m: map.minute, s: map.second, tz: map.timeZoneName || '' };
    }

    function phaseForHour(h) {
        // Approximate daily phases
        if (h >= 5 && h < 8) return 'sunrise';
        if (h >= 8 && h < 19) return 'day';
        if (h >= 19 && h < 22) return 'moonrise';
        return 'night';
    }

    function setPhase(phase) {
        body.classList.remove('phase-day', 'phase-sunrise', 'phase-moonrise', 'phase-night');
        body.classList.add('phase-' + phase);
    }

    function updateActiveControl(phase) {
        if (!controlsEl) return;
        controlsEl.querySelectorAll('button').forEach(btn => {
            btn.classList.toggle('active', !!phase && btn.dataset.phase === phase);
        });
    }

    function setManualPhase(phase) {
        manualPhase = phase;
        manualExpires = Date.now() + MANUAL_MS;
        setPhase(phase);
        updateActiveControl(phase);
    }

    function setJPIIVisible(show) {
        if (!jpiiEl) return;
        jpiiEl.style.display = show ? 'flex' : 'none';
        jpiiEl.setAttribute('aria-hidden', String(!show));
    }

    function setBatSignal(show) {
        if (!batSignalEl) return;
        batSignalEl.classList.toggle('show', !!show);
        batSignalEl.setAttribute('aria-hidden', String(!show));
        if (batBeamEl) batBeamEl.style.display = show ? 'block' : 'none';
    }

    function updateBatBeam() {
        if (!bgRoot || !batSignalEl || !batBeamEl) return;
        if (!batSignalEl.classList.contains('show')) return;
        const root = bgRoot.getBoundingClientRect();
        const sig = batSignalEl.getBoundingClientRect();
        // Choose a ground spotlight origin in front-left area
        const groundTop = root.bottom - (window.innerHeight * 0.24);
        const ox = root.left + root.width * 0.12;
        const oy = groundTop + 6; // slightly above ground top
        const tx = sig.left + sig.width / 2;
        const ty = sig.top + sig.height / 2;
        const dx = tx - ox;
        const dy = ty - oy;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ang = Math.atan2(dy, dx) * 180 / Math.PI;
        const beamH = window.innerHeight * 0.28; // matches 28vh
        batBeamEl.style.left = `${ox}px`;
        batBeamEl.style.top = `${oy - beamH / 2}px`;
        batBeamEl.style.width = `${len}px`;
        batBeamEl.style.transform = `rotate(${ang}deg)`;
    }

    function tick() {
        const t = getWarsawParts();
        const now = Date.now();
        if (manualPhase && now < manualExpires) {
            // Keep manual override active
            setPhase(manualPhase);
        } else {
            // Revert to time-based phase
            manualPhase = null;
            manualExpires = 0;
            const autoPhase = phaseForHour(t.h);
            setPhase(autoPhase);
            updateActiveControl(null);
        }
        if (clockEl) clockEl.textContent = `${String(t.h).padStart(2, '0')}:${t.m}:${t.s} ${t.tz}`;

        // Handle JPII overlay visibility (21:37:00 - 21:37:59 Warsaw time OR manual 60s window)
        const isJpiiMinute = (t.h === 21 && t.m === '37');
        const jpiiManualActive = now < jpiiManualExpires;
        setJPIIVisible(isJpiiMinute || jpiiManualActive);

        // Handle Bat-Signal randomness at night
        const isNight = body.classList.contains('phase-night');
        if (isNight) {
            buildStarsOnce();
            if (now < batSignalUntil) {
                setBatSignal(true);
            } else if (Math.random() < 0.02) { // ~2% chance per second
                batSignalUntil = now + 12000; // show for ~12s
                setBatSignal(true);
            } else {
                setBatSignal(false);
            }

            updateBatBeam();

            // Rare shooting star
            if (now >= nextShootingEarliest && Math.random() < 0.015) { // ~1.5% chance per second
                spawnShootingStar();
                nextShootingEarliest = now + 15000; // at least 15s between
            }
            // Stop mole trail at night (handled by per-frame update)
        } else {
            batSignalUntil = 0;
            setBatSignal(false);
            updateBatBeam();
            // Daytime handled by per-frame mole AI
        }
    }

    if (controlsEl) {
        controlsEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-phase]');
            if (!btn) return;
            const p = btn.dataset.phase;
            setManualPhase(p);
        });
    }

    // Check URL for ?time=2137 to show JPII overlay for 60s
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('time') === '2137') {
            jpiiManualExpires = Date.now() + JPII_MANUAL_MS;
            setJPIIVisible(true);
        }
    } catch (_) { /* no-op */ }

    ensureConeLamps();
    tick();
    setInterval(tick, 1000);
    window.addEventListener('resize', updateBatBeam);
    // Start mole AI loop once
    initMole();
    requestAnimationFrame(rafLoop);
})();