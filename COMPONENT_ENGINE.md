# Circuvia Component Engine

Components are data-driven in `components.js`.

Each definition contains:
- id
- name
- category
- kind
- pins
- properties

The editor now uses a Wokwi-inspired connection model:
- Pins are attached to the component body instead of a separate pin strip.
- Pin geometry is side-aware (`left`, `right`, `top`, `bottom`).
- Common components have explicit physical-ish pin layouts.
- Unspecified components receive a deterministic two-sided fallback layout.
- Wires use Manhattan routing (horizontal/vertical segments) instead of curved Bézier lines.
- Pin-to-pin connections snap to the actual pin center.
- Duplicate connections are rejected.
- Double-clicking a wire or pin connection removes it.
- Escape cancels an active wire.
- Arrow keys move the selected component; Shift + Arrow moves by 10 px.
- Wire coordinates account for canvas scrolling.

This remains an editor/wiring layer. It does **not** yet execute arbitrary Arduino C++ or solve analog/electrical equations. A real firmware simulator requires a compilation/runtime layer and component electrical models.
