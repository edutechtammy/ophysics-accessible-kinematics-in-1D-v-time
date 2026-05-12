/**
 * simulation.js
 * Kinematics in 1D: Velocity vs. Time Graphs — Accessible Rebuild
 *
 * Architecture:
 *   1. Constants & colour themes
 *   2. Simulation state
 *   3. DOM references
 *   4. Canvas initialisation
 *   5. Coordinate transforms
 *   6. Physics calculations
 *   7. Canvas drawing functions
 *   8. Results table update
 *   9. Screen-reader description & announcements
 *  10. Slider wiring
 *  11. Preset buttons
 *  12. Initialisation
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   1. Constants & Colour Themes
   ═══════════════════════════════════════════════════════════════════════════ */

const CANVAS_W = 620;          // logical CSS pixels
const CANVAS_H = 380;
const SEG_COUNT = 3;            // number of segments (4 velocity points)
const V_AXIS_MIN = -22;          // plot y range (2 m/s breathing room)
const V_AXIS_MAX = 22;

// Canvas padding (logical px)
const PAD = { top: 30, right: 25, bottom: 58, left: 68 };

// Unicode subscripts for visual labels (canvas text)
const SUB = ['₀', '₁', '₂', '₃'];

function buildColours(dark) {
    return dark ? {
        bg: '#1e293b',
        plotBg: '#0f172a',
        grid: '#334155',
        gridMajor: '#475569',
        zeroLine: '#64748b',
        axis: '#f1f5f9',
        axisLabel: '#94a3b8',
        graphLine: '#60a5fa',
        pointFill: '#1e293b',
        pointStroke: '#60a5fa',
        pointLabel: '#e2e8f0',
        posArea: 'rgba(96,165,250,0.22)',
        negArea: 'rgba(251,146,60,0.22)',
        segDivider: '#475569',
        accelLabel: '#94a3b8',
        zeroCross: '#f87171',
    } : {
        bg: '#ffffff',
        plotBg: '#f8fafc',
        grid: '#e2e8f0',
        gridMajor: '#cbd5e1',
        zeroLine: '#94a3b8',
        axis: '#1e293b',
        axisLabel: '#475569',
        graphLine: '#1a56db',
        pointFill: '#ffffff',
        pointStroke: '#1a56db',
        pointLabel: '#1e293b',
        posArea: 'rgba(59,130,246,0.18)',
        negArea: 'rgba(249,115,22,0.18)',
        segDivider: '#cbd5e1',
        accelLabel: '#64748b',
        zeroCross: '#dc2626',
    };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2. Simulation State
   ═══════════════════════════════════════════════════════════════════════════ */

const state = {
    velocities: [0, 8, 8, -4],   // v₀ … v₃  (m/s)
    durations: [3, 2, 3],        // Δt₁ … Δt₃ (s)
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. DOM References
   ═══════════════════════════════════════════════════════════════════════════ */

const canvas = document.getElementById('vtGraph');
const ctx = canvas.getContext('2d');
const resultsBody = document.getElementById('results-body');
const totalDispEl = document.getElementById('total-disp');
const totalDistEl = document.getElementById('total-dist');
const totalTimeEl = document.getElementById('total-time-cell');
const srAnnounce = document.getElementById('sr-announce');
const graphTextDesc = document.getElementById('graph-text-desc');

/* ═══════════════════════════════════════════════════════════════════════════
   4. Canvas Initialisation
   ═══════════════════════════════════════════════════════════════════════════ */

let dpr = 1;

function initCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = CANVAS_W + 'px';
    canvas.style.height = CANVAS_H + 'px';
    ctx.scale(dpr, dpr);
}

/* Re-render when the OS colour scheme changes */
window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => render());

/* ═══════════════════════════════════════════════════════════════════════════
   5. Coordinate Transforms
   ═══════════════════════════════════════════════════════════════════════════ */

function plotBounds() {
    return {
        x: PAD.left,
        y: PAD.top,
        w: CANVAS_W - PAD.left - PAD.right,
        h: CANVAS_H - PAD.top - PAD.bottom,
    };
}

function toX(t, totalTime, p) {
    return p.x + (t / totalTime) * p.w;
}

function toY(v, p) {
    return p.y + ((V_AXIS_MAX - v) / (V_AXIS_MAX - V_AXIS_MIN)) * p.h;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. Physics Calculations
   ═══════════════════════════════════════════════════════════════════════════ */

/** Returns array of cumulative time markers: [0, t1, t2, t3] */
function getTimes() {
    const t = [0];
    for (let i = 0; i < SEG_COUNT; i++) {
        t.push(t[t.length - 1] + state.durations[i]);
    }
    return t;
}

/** Acceleration of segment i (m/s²) */
function getAcceleration(i) {
    return (state.velocities[i + 1] - state.velocities[i]) / state.durations[i];
}

/** Signed displacement of segment i (m) — area of trapezoid */
function getDisplacement(i) {
    return (state.velocities[i] + state.velocities[i + 1]) / 2 * state.durations[i];
}

/** Distance (always ≥ 0) of segment i — handles zero crossings */
function getDistance(i) {
    const v0 = state.velocities[i];
    const v1 = state.velocities[i + 1];
    const dt = state.durations[i];

    // Same sign (or touches zero): one trapezoid
    if (v0 * v1 >= 0) {
        return Math.abs((v0 + v1) / 2 * dt);
    }

    // Zero crossing: split into two triangles
    const tCross = dt * Math.abs(v0) / Math.abs(v1 - v0);
    return (Math.abs(v0) * tCross / 2) + (Math.abs(v1) * (dt - tCross) / 2);
}

function getTotalDisplacement() {
    let sum = 0;
    for (let i = 0; i < SEG_COUNT; i++) sum += getDisplacement(i);
    return sum;
}

function getTotalDistance() {
    let sum = 0;
    for (let i = 0; i < SEG_COUNT; i++) sum += getDistance(i);
    return sum;
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. Canvas Drawing
   ═══════════════════════════════════════════════════════════════════════════ */

/** Choose a "nice" time-axis tick interval given the total time */
function getTimeTick(totalTime) {
    if (totalTime <= 5) return 0.5;
    if (totalTime <= 10) return 1;
    if (totalTime <= 20) return 2;
    return 5;
}

function drawBackground(p, C) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = C.plotBg;
    ctx.fillRect(p.x, p.y, p.w, p.h);
}

function drawGrid(p, totalTime, C) {
    const tickInterval = getTimeTick(totalTime);

    // Horizontal grid lines every 5 m/s
    for (let v = -20; v <= 20; v += 5) {
        const y = toY(v, p);
        ctx.strokeStyle = v === 0 ? C.gridMajor : C.grid;
        ctx.lineWidth = v === 0 ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(p.x, y);
        ctx.lineTo(p.x + p.w, y);
        ctx.stroke();
    }

    // Vertical grid lines at tick interval
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let t = 0; t <= totalTime + 0.001; t += tickInterval) {
        const x = toX(t, totalTime, p);
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + p.h);
        ctx.stroke();
    }
}

function drawZeroReferenceLine(p, C) {
    const y = toY(0, p);
    ctx.strokeStyle = C.zeroLine;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x, y);
    ctx.lineTo(p.x + p.w, y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawSegmentDividers(p, times, totalTime, C) {
    const inner = times.slice(1, -1); // t1, t2 (not 0 or totalTime)
    ctx.strokeStyle = C.segDivider;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (const t of inner) {
        const x = toX(t, totalTime, p);
        ctx.beginPath();
        ctx.moveTo(x, p.y);
        ctx.lineTo(x, p.y + p.h);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

function drawAxes(p, totalTime, C) {
    const tickInterval = getTimeTick(totalTime);

    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;

    // Left (y) border
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y + p.h);
    ctx.stroke();

    // Bottom (x) border
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + p.h);
    ctx.lineTo(p.x + p.w, p.y + p.h);
    ctx.stroke();

    ctx.fillStyle = C.axisLabel;

    // ── Y-axis ticks & labels ──────────────────────────────────────────
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let v = -20; v <= 20; v += 5) {
        const y = toY(v, p);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x - 5, y);
        ctx.lineTo(p.x, y);
        ctx.stroke();
        ctx.fillText(v.toString(), p.x - 9, y);
    }

    // ── X-axis ticks & labels ──────────────────────────────────────────
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeStyle = C.axis;
    ctx.lineWidth = 2;

    for (let t = 0; t <= totalTime + 0.001; t += tickInterval) {
        const x = toX(t, totalTime, p);
        ctx.beginPath();
        ctx.moveTo(x, p.y + p.h);
        ctx.lineTo(x, p.y + p.h + 5);
        ctx.stroke();
        ctx.fillStyle = C.axisLabel;
        ctx.fillText(fmt(t, 1), x, p.y + p.h + 8);
    }

    // ── Axis Titles ────────────────────────────────────────────────────
    ctx.fillStyle = C.axis;
    ctx.font = 'bold 13px system-ui, sans-serif';

    // "Time (s)" — centred under x-axis
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Time (s)', p.x + p.w / 2, CANVAS_H - 4);

    // "Velocity (m/s)" — rotated, centred on y-axis
    ctx.save();
    ctx.translate(13, p.y + p.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Velocity (m/s)', 0, 0);
    ctx.restore();
}

/** Fill a trapezoidal area from (x0,y0)→(x1,y1) down to yBase */
function fillTrap(x0, y0, x1, y1, yBase, color) {
    ctx.beginPath();
    ctx.moveTo(x0, yBase);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x1, yBase);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function drawShading(p, times, totalTime, C) {
    for (let i = 0; i < SEG_COUNT; i++) {
        const t0 = times[i];
        const t1 = times[i + 1];
        const v0 = state.velocities[i];
        const v1 = state.velocities[i + 1];

        const x0 = toX(t0, totalTime, p);
        const x1 = toX(t1, totalTime, p);
        const yV0 = toY(v0, p);
        const yV1 = toY(v1, p);
        const yZero = toY(0, p);

        if (v0 * v1 >= 0) {
            // No sign change — single trapezoid
            const col = (v0 >= 0 && v1 >= 0) ? C.posArea : C.negArea;
            fillTrap(x0, yV0, x1, yV1, yZero, col);
        } else {
            // Sign change — split at zero crossing
            const frac = Math.abs(v0) / Math.abs(v1 - v0);
            const xCross = x0 + frac * (x1 - x0);
            if (v0 > 0) {
                fillTrap(x0, yV0, xCross, yZero, yZero, C.posArea);
                fillTrap(xCross, yZero, x1, yV1, yZero, C.negArea);
            } else {
                fillTrap(x0, yV0, xCross, yZero, yZero, C.negArea);
                fillTrap(xCross, yZero, x1, yV1, yZero, C.posArea);
            }
        }
    }
}

function drawGraphLine(p, times, totalTime, C) {
    ctx.strokeStyle = C.graphLine;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= SEG_COUNT; i++) {
        const x = toX(times[i], totalTime, p);
        const y = toY(state.velocities[i], p);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

/** Dots at zero-crossings within a segment */
function drawZeroCrossings(p, times, totalTime, C) {
    for (let i = 0; i < SEG_COUNT; i++) {
        const v0 = state.velocities[i];
        const v1 = state.velocities[i + 1];
        if (v0 * v1 < 0) {
            const frac = Math.abs(v0) / Math.abs(v1 - v0);
            const tCross = times[i] + frac * state.durations[i];
            const x = toX(tCross, totalTime, p);
            const yZero = toY(0, p);

            ctx.beginPath();
            ctx.arc(x, yZero, 5, 0, Math.PI * 2);
            ctx.fillStyle = C.plotBg;
            ctx.fill();
            ctx.strokeStyle = C.zeroCross;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

/** Labelled control-point circles at each velocity node */
function drawControlPoints(p, times, totalTime, C) {
    ctx.font = 'bold 11px system-ui, sans-serif';

    for (let i = 0; i <= SEG_COUNT; i++) {
        const x = toX(times[i], totalTime, p);
        const y = toY(state.velocities[i], p);

        // Circle
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = C.pointFill;
        ctx.fill();
        ctx.strokeStyle = C.pointStroke;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Label: "v₀ = 0 m/s"
        const label = `v${SUB[i]} = ${fmt(state.velocities[i])} m/s`;

        // Horizontal alignment: left edge → left-align, right edge → right-align
        const nearLeft = (x - p.x) < 50;
        const nearRight = (p.x + p.w - x) < 50;
        if (nearLeft) ctx.textAlign = 'left';
        else if (nearRight) ctx.textAlign = 'right';
        else ctx.textAlign = 'center';

        // Vertical placement: avoid top/bottom edges
        const nearTop = (y - p.y) < 22;
        const labelAbove = !nearTop;
        ctx.textBaseline = labelAbove ? 'bottom' : 'top';
        const labelY = labelAbove ? y - 10 : y + 10;

        ctx.fillStyle = C.pointLabel;
        ctx.fillText(label, x, labelY);
    }
}

/** Small italic acceleration label centred in each segment */
function drawAccelerationLabels(p, times, totalTime, C) {
    ctx.font = 'italic 11px system-ui, sans-serif';
    ctx.fillStyle = C.accelLabel;
    ctx.textAlign = 'center';

    for (let i = 0; i < SEG_COUNT; i++) {
        const tMid = (times[i] + times[i + 1]) / 2;
        const vMid = (state.velocities[i] + state.velocities[i + 1]) / 2;
        const a = getAcceleration(i);

        const x = toX(tMid, totalTime, p);
        let y = toY(vMid, p);

        // Offset label away from the graph line
        const offset = (a >= 0 ? 1 : -1) * 18;
        y = Math.max(p.y + 13, Math.min(p.y + p.h - 8, y + offset));

        ctx.textBaseline = 'middle';
        ctx.fillText(`a = ${fmt(a)} m/s²`, x, y);
    }
}

/** Master render call */
function render() {
    const times = getTimes();
    const totalTime = times[SEG_COUNT];
    const p = plotBounds();
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const C = buildColours(dark);

    drawBackground(p, C);
    drawGrid(p, totalTime, C);
    drawZeroReferenceLine(p, C);
    drawSegmentDividers(p, times, totalTime, C);
    drawAxes(p, totalTime, C);
    drawShading(p, times, totalTime, C);
    drawGraphLine(p, times, totalTime, C);
    drawZeroCrossings(p, times, totalTime, C);
    drawControlPoints(p, times, totalTime, C);
    drawAccelerationLabels(p, times, totalTime, C);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. Results Table Update
   ═══════════════════════════════════════════════════════════════════════════ */

function updateTable() {
    const times = getTimes();
    const totalTime = times[SEG_COUNT];

    resultsBody.innerHTML = '';

    for (let i = 0; i < SEG_COUNT; i++) {
        const v0 = state.velocities[i];
        const v1 = state.velocities[i + 1];
        const t0 = times[i];
        const t1 = times[i + 1];
        const a = getAcceleration(i);
        const d = getDisplacement(i);

        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.setAttribute('scope', 'row');
        th.textContent = `Segment ${i + 1}`;
        tr.appendChild(th);

        [
            `${fmt(t0)} – ${fmt(t1)}`,
            fmt(v0),
            fmt(v1),
            fmt(a),
            fmt(d),
        ].forEach(text => {
            const td = document.createElement('td');
            td.textContent = text;
            tr.appendChild(td);
        });

        resultsBody.appendChild(tr);
    }

    totalDispEl.textContent = fmt(getTotalDisplacement()) + ' m';
    totalDistEl.textContent = fmt(getTotalDistance()) + ' m';
    totalTimeEl.textContent = fmt(totalTime) + ' s';
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. Screen-Reader Descriptions & Announcements
   ═══════════════════════════════════════════════════════════════════════════ */

/** Verbose description of the entire graph — written into aria-describedby target */
function generateFullDescription() {
    const times = getTimes();
    const totalTime = times[SEG_COUNT];
    const parts = [`Velocity versus time graph with ${SEG_COUNT} segments.`];

    for (let i = 0; i < SEG_COUNT; i++) {
        const v0 = state.velocities[i];
        const v1 = state.velocities[i + 1];
        const dt = state.durations[i];
        const t0 = times[i];
        const t1 = times[i + 1];
        const a = getAcceleration(i);
        const d = getDisplacement(i);

        let segText;
        if (Math.abs(a) < 0.001) {
            segText = `Segment ${i + 1}: constant velocity of ${fmt(v0)} meters per second `
                + `from t equals ${fmt(t0)} to ${fmt(t1)} seconds. `
                + `Displacement: ${fmt(d)} meters.`;
        } else {
            const dir = a > 0 ? 'increasing' : 'decreasing';
            segText = `Segment ${i + 1}: velocity ${dir} from ${fmt(v0)} to ${fmt(v1)} meters per second `
                + `over ${fmt(dt)} seconds (t equals ${fmt(t0)} to ${fmt(t1)} seconds). `
                + `Acceleration: ${fmt(a)} meters per second squared. `
                + `Displacement: ${fmt(d)} meters.`;
        }
        parts.push(segText);
    }

    parts.push(
        `Total time: ${fmt(totalTime)} seconds. `
        + `Total displacement: ${fmt(getTotalDisplacement())} meters. `
        + `Total distance traveled: ${fmt(getTotalDistance())} meters.`
    );

    return parts.join(' ');
}

/** Short announcement fired after a slider changes (debounced) */
function generateShortAnnouncement(changedId) {
    const times = getTimes();
    const totalTime = times[SEG_COUNT];

    if (changedId && changedId.match(/^v\d$/)) {
        const idx = parseInt(changedId[1], 10);
        const v = state.velocities[idx];
        return `v${idx} set to ${fmt(v)} meters per second. Total displacement: ${fmt(getTotalDisplacement())} meters.`;
    }

    if (changedId && changedId.match(/^dt\d$/)) {
        const idx = parseInt(changedId[2], 10) - 1;
        const dt = state.durations[idx];
        const a = getAcceleration(idx);
        const d = getDisplacement(idx);
        return `Segment ${idx + 1} duration set to ${fmt(dt)} seconds. `
            + `Acceleration: ${fmt(a)} meters per second squared. `
            + `Displacement: ${fmt(d)} meters.`;
    }

    return `Graph updated. Total displacement: ${fmt(getTotalDisplacement())} meters. `
        + `Total distance: ${fmt(getTotalDistance())} meters.`;
}

let announceTimer = null;

function scheduleAnnouncement(text) {
    clearTimeout(announceTimer);
    announceTimer = setTimeout(() => {
        // Clear first so screen readers re-fire if the text is the same
        srAnnounce.textContent = '';
        requestAnimationFrame(() => {
            srAnnounce.textContent = text;
        });
    }, 750);
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. Master Update
   ═══════════════════════════════════════════════════════════════════════════ */

function updateAll(changedId) {
    render();
    updateTable();

    // Update the canvas accessible description paragraph
    const desc = generateFullDescription();
    graphTextDesc.textContent = desc;

    // Short polite announcement for the change
    if (changedId) {
        scheduleAnnouncement(generateShortAnnouncement(changedId));
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. Slider Wiring
   ═══════════════════════════════════════════════════════════════════════════ */

const SLIDER_CONFIG = [
    { id: 'v0', type: 'velocity', index: 0 },
    { id: 'v1', type: 'velocity', index: 1 },
    { id: 'v2', type: 'velocity', index: 2 },
    { id: 'v3', type: 'velocity', index: 3 },
    { id: 'dt1', type: 'duration', index: 0 },
    { id: 'dt2', type: 'duration', index: 1 },
    { id: 'dt3', type: 'duration', index: 2 },
];

function syncOutputFromState(cfg) {
    const input = document.getElementById(cfg.id);
    const output = document.getElementById(cfg.id + '-out');
    const val = cfg.type === 'velocity'
        ? state.velocities[cfg.index]
        : state.durations[cfg.index];

    input.value = val;
    output.textContent = cfg.type === 'velocity' ? `${fmt(val)} m/s` : `${fmt(val)} s`;

    // Update aria-valuetext for screen readers (spoken unit)
    const spokenVal = val < 0
        ? `negative ${fmt(Math.abs(val))}`
        : fmt(val);
    const spokenUnit = cfg.type === 'velocity' ? 'meters per second' : 'seconds';
    input.setAttribute('aria-valuetext', `${spokenVal} ${spokenUnit}`);
}

function setupSliders() {
    for (const cfg of SLIDER_CONFIG) {
        const input = document.getElementById(cfg.id);
        const output = document.getElementById(cfg.id + '-out');

        // Prime display from initial state
        syncOutputFromState(cfg);

        input.addEventListener('input', () => {
            const val = parseFloat(input.value);

            if (cfg.type === 'velocity') {
                state.velocities[cfg.index] = val;
            } else {
                state.durations[cfg.index] = val;
            }

            // Update the output display
            output.textContent = cfg.type === 'velocity' ? `${fmt(val)} m/s` : `${fmt(val)} s`;

            // Update aria-valuetext
            const spokenVal = val < 0 ? `negative ${fmt(Math.abs(val))}` : fmt(val);
            const spokenUnit = cfg.type === 'velocity' ? 'meters per second' : 'seconds';
            input.setAttribute('aria-valuetext', `${spokenVal} ${spokenUnit}`);

            updateAll(cfg.id);
        });
    }
}

/* ═══════════════════════════════════════════════════════════════════════════
   12. Preset Buttons
   ═══════════════════════════════════════════════════════════════════════════ */

const PRESETS = {
    default: { velocities: [0, 8, 8, -4], durations: [3, 2, 3] },
    constant: { velocities: [6, 6, 6, 6], durations: [3, 3, 3] },
    accelerate: { velocities: [-12, -4, 4, 12], durations: [3, 3, 3] },
    stop: { velocities: [8, 8, 0, -6], durations: [2, 2, 4] },
};

const PRESET_NAMES = {
    default: 'Default scenario',
    constant: 'Constant velocity',
    accelerate: 'Uniform acceleration',
    stop: 'Stop and return',
};

function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.default;
    state.velocities = [...preset.velocities];
    state.durations = [...preset.durations];

    // Sync all sliders & outputs to new state
    for (const cfg of SLIDER_CONFIG) {
        syncOutputFromState(cfg);
    }

    updateAll(null);

    const desc = PRESET_NAMES[name] || name;
    scheduleAnnouncement(
        `Preset applied: ${desc}. ${generateShortAnnouncement(null)}`
    );
}

function setupPresets() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.preset;
            applyPreset(key === 'reset' ? 'default' : key);
        });
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utility: number formatting
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Format a number to `decimals` places, stripping trailing zeros.
 * e.g. fmt(2.6666, 2) → "2.67"   fmt(3.0, 2) → "3"
 */
function fmt(n, decimals = 2) {
    if (Math.abs(n) < 0.00001) return '0';
    return parseFloat(n.toFixed(decimals)).toString();
}

/* ═══════════════════════════════════════════════════════════════════════════
   Initialise
   ═══════════════════════════════════════════════════════════════════════════ */

function init() {
    initCanvas();
    setupSliders();
    setupPresets();
    updateAll(null);
}

document.addEventListener('DOMContentLoaded', init);
