# Kinematics in 1D: Velocity vs. Time Graphs
## An Accessible Interactive Physics Simulation

**Live Demo:** [edutechtammy.github.io/ophysics-accessible-kinematics-in-1D-v-time](https://edutechtammy.github.io/ophysics-accessible-kinematics-in-1D-v-time)
**Original Simulation:** [ophysics.com/k5a.html](https://ophysics.com/k5a.html)
**Institution:** Texas State Technical College

---

## Overview

This project is a ground-up accessible rebuild of the [oPhysics k5a](https://ophysics.com/k5a.html) velocity vs. time graph simulation. The original uses an HTML5 `<canvas>` element with mouse-only drag interactions — one of the most inaccessible interaction patterns on the web.

This rebuild preserves the full physics and visual graph while making every feature operable by keyboard, understandable by screen readers, and usable across a wide range of abilities and assistive technologies. It targets **WCAG 2.1 Level AA** and **Section 508** compliance, both of which are legal requirements for instructional technology used in U.S. post-secondary courses.

---

## What the Simulation Does

The simulation displays a **velocity vs. time (v–t) graph** for an object moving in one dimension. Students can:

- Set four velocity values (v₀ through v₃) from −20 to 20 m/s
- Set three segment durations (Δt₁ through Δt₃) from 0.5 to 10 seconds
- Observe the resulting piecewise-linear graph, including shaded displacement areas
- Read calculated values for acceleration, displacement, and distance per segment
- Read a plain-language narrative describing the shape and meaning of the graph

---

## Accessibility Features

### 🎛️ Keyboard-Accessible Controls

The original simulation used mouse-drag only. Every control in this rebuild is a native `<input type="range">` slider — fully focusable and operable without a mouse.

| Key | Action |
|-----|--------|
| `Tab` / `Shift+Tab` | Move between sliders |
| `←` `→` Arrow Keys | Adjust value by one step (0.5 m/s or 0.5 s) |
| `Page Up` / `Page Down` | Adjust value by a larger increment |
| `Home` / `End` | Jump to minimum or maximum value |

#### Pedagogically Ordered Tab Sequence

Controls are grouped into four semantic `<fieldset>` elements and ordered to match the way the graph is read — **left to right, one segment at a time**:

| Tab Position | Control | Fieldset Group |
|---|---|---|
| 1 | v₀ — initial velocity | Starting Condition |
| 2 | Δt₁ — duration of segment 1 | Segment 1 |
| 3 | v₁ — velocity at end of segment 1 | Segment 1 |
| 4 | Δt₂ — duration of segment 2 | Segment 2 |
| 5 | v₂ — velocity at end of segment 2 | Segment 2 |
| 6 | Δt₃ — duration of segment 3 | Segment 3 |
| 7 | v₃ — final velocity | Segment 3 |

This order matters for two reasons:

**Pedagogically:** It mirrors how a student *builds* a scenario in words — *"The object starts at 0 m/s. Segment 1 lasts 3 s and ends at 8 m/s. Segment 2…"* — rather than forcing them to mentally connect velocity controls on one side of the panel to duration controls on the other.

**For keyboard and screen reader users:** Each segment's two defining parameters — *how long it lasts* and *where the velocity ends up* — sit consecutively in the tab order. A keyboard user adjusting Segment 2 does not have to tab past unrelated controls to reach both sliders that define it. A screen reader announces each `<fieldset>` group name before its controls, so the user always knows which segment they are in.

---

### 🔊 Screen Reader Support

#### `aria-valuetext` on Every Slider
Native range sliders announce just a raw number (e.g., *"8"*). Each slider in this simulation has a dynamic `aria-valuetext` that announces the full value with units and sign language:

> *"negative 4 meters per second"* instead of *"-4"*
> *"3 seconds"* instead of *"3"*

#### Live Announcement Region
A visually hidden `aria-live="polite"` region fires a concise, plain-English update after every slider change (debounced to 750 ms to avoid flooding):

> *"Segment 2 duration set to 4 seconds. Acceleration: −3 meters per second squared. Displacement: 12 meters."*

#### Canvas Text Description
The `<canvas>` element is linked via `aria-describedby` to a hidden paragraph that contains a complete, verbose text description of the entire graph state. It is updated on every change and is also a live region:

> *"Velocity versus time graph with 3 segments. Segment 1: velocity increasing from 0 to 8 meters per second over 3 seconds… Acceleration: 2.67 meters per second squared. Displacement: 12 meters. …Total displacement: 20 meters."*

---

### 📖 Motion Narrative Section

This is the primary feature addressing the core accessibility weakness of interactive graphs: **a screen reader user can hear numbers, but cannot easily "see" the shape of the motion**.

The Motion Narrative translates the visual graph into natural language that conveys what a sighted reader would observe:

#### Overall Summary
A single sentence captures the whole motion at a glance:
> *"Over 8 seconds, the object travels a total distance of 34 m and ends up 12 m backward from where it started. It changes direction 1 time during the motion."*

#### Per-Segment Cards
Each of the three segments gets its own card with:

- **Slope shape language** — *"The graph line slopes downward moderately"* — the exact phrasing a physics instructor would use when describing the graph visually
- **Motion meaning** — *"The object is slowing down in the positive (forward) direction"*
- **Direction reversal detection** — when a segment crosses zero velocity, the narrative names the exact time: *"…momentarily stops, then reverses direction at t = 2.5 s"*
- **Steepness vocabulary** — acceleration magnitude is translated to *gently / moderately / steeply* to convey the visual angle of the line
- **Displacement context** — *"Net displacement: −6 m backward (negative direction)"*

The entire narrative section is an `aria-live="polite"` region, so screen readers re-read updated cards automatically on every slider change without requiring navigation.

---

### 📊 Accessible Data Table

A fully semantic `<table>` alongside the graph provides structured access to all calculated values:

- `<caption>` describes the table's purpose
- `scope="col"` on all column headers
- `scope="row"` on all segment row headers
- `<tfoot>` rows for total displacement, total distance, and total time
- Table updates live as sliders change

---

### 🎨 Visual Accessibility

| Feature | Detail |
|---------|--------|
| **Colour contrast** | All text/background pairs ≥ 4.5:1 (AA). Link text in instructions: 8.1:1 |
| **Links** | Explicit dark colour + underline — not identified by colour alone (WCAG 1.4.1) |
| **Focus ring** | 3 px amber outline on all `:focus-visible` elements (WCAG 2.2 §2.4.11) |
| **Colour + shape** | Graph uses shading colour *and* slope icons — never colour alone |
| **Skip link** | First focusable element jumps directly to `#main` |

---

### 🌗 Dark Mode

A full `prefers-color-scheme: dark` theme is implemented in CSS and applied to the canvas renderer. All colours in dark mode are re-validated for contrast. The canvas re-renders automatically when the OS colour scheme changes.

---

### ♿ Windows High Contrast Mode

A `@media (forced-colors: active)` block ensures buttons, sliders, and table headers remain visible and distinguishable in Windows High Contrast / Forced Colors mode.

---

### 📱 Responsive Design

- CSS Grid layout collapses to a single column below 860 px
- Canvas uses `max-width: 100%` with horizontal scroll fallback
- Table has a horizontal scroll wrapper on small screens
- Base font size is 18 px (increased from browser default 16 px for readability)

---

### 🎭 Reduced Motion

`@media (prefers-reduced-motion: reduce)` disables all CSS transitions and animations for users with vestibular disorders or motion sensitivity.

---

### 🖨️ Print Styles

A `@media print` block hides the controls panel and preset buttons, collapses the layout to a single column, and preserves the graph and data table for printed or PDF handouts.

---

## Presets

Four preset scenarios are available as keyboard-accessible buttons:

| Preset | Description |
|--------|-------------|
| **Default** | Mixed acceleration example |
| **Constant Velocity** | All segments at 6 m/s — flat horizontal line |
| **Uniform Acceleration** | Steady increase from −12 to 12 m/s |
| **Stop and Return** | Object slows, stops, reverses direction |
| **Free Fall** | Object thrown upward at 10 m/s; constant a = −10 m/s² (≈ g) throughout. Reaches peak (v = 0) at t = 1 s, zero-crossing visible, falls to −20 m/s by t = 3 s |

---

## Accessibility Compliance Summary

| Standard | Target Level | Key Criteria Addressed |
|----------|-------------|----------------------|
| WCAG 2.1 | Level AA | 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.4, 1.4.11, 2.1.1, 2.4.2, 2.4.3, 2.4.7, 3.3.2, 4.1.2, 4.1.3 |
| Section 508 | Full | 1194.21, 1194.22 |
| WCAG 2.2 | §2.4.11 Focus Appearance | 3 px focus ring, amber on all backgrounds |

---

## File Structure

```
/
├── index.html          # Semantic HTML: landmarks, ARIA, skip link, sliders, live regions, table
├── css/
│   └── styles.css      # WCAG AA styles: focus, contrast, dark mode, reduced motion, print, HCM
└── js/
    └── simulation.js   # Physics engine, canvas renderer, narrative generator, SR announcements
```

---

## Technology

- **Vanilla HTML, CSS, JavaScript** — no frameworks, no build step, no dependencies
- **HTML5 Canvas** for graph rendering (visual only — all data also in accessible text/table)
- **Native `<input type="range">`** for all interactive controls
- **CSS Custom Properties** for theming
- **HiDPI/Retina support** via `devicePixelRatio` canvas scaling

---

## How to Run Locally

```bash
# Any static file server works, e.g.:
python3 -m http.server 5501
# Then open http://localhost:5501
```

No build process, npm install, or compilation required.

---

## Credits

- **Original simulation:** [oPhysics.com](https://ophysics.com) by Tom Walsh
- **Accessible rebuild:** Developed for Texas State Technical College physics instruction
