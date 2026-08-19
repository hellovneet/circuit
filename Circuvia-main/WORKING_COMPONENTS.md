# Circuvia Working Components v5

## Placement
- Click `+` in the component library.
- Drag a component onto the canvas.
- Move a selected component with the mouse or arrow keys.

## Wiring
- Drag from one visible component pin to another.
- Pins are positioned on the component body, similar to a circuit-diagram editor.
- Wires snap to pin centers.
- Wires route horizontally/vertically.
- Duplicate connections are ignored.
- Double-click a wire to remove it.
- Double-click a pin to remove its existing connection.
- Press `Escape` while wiring to cancel.

## Current limitation
The editor now behaves much closer to Wokwi at the diagram-editing level, but `Run` is still a simulation placeholder. Firmware execution, GPIO state propagation, analog values, timing, and electrical validation are separate runtime work.
