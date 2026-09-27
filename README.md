# Chitosan-based CO2 capture demo model

This is a low-detail, parametric process-flow assembly intended for web dashboard use.
The source uses millimetres, with X along the main process flow, Y across the skid, and
Z vertical. Vertical vessel axes are Z; the horizontal CO2 receiver axis is X. The
skid is 15,000 x 4,000 mm. Change the constants near the top of
`src/chitosan_co2_capture.py`, then run that file with the project `.venv` Python to
regenerate the exports.

## Files

- `STEP/chitosan_co2_capture.step` — editable solid model.
- `GLB/chitosan_co2_capture.glb` — web/Three.js mesh export.
- `layouts/top_view.png` and `layouts/front_view.png` — orthographic layout checks.
- `src/chitosan_co2_capture.py` — parametric source and named components.

The GLB contains named mesh nodes and parent groups (`main_gas_pipe`, `adsorber`,
`adsorbent_bed`, `regeneration`, `co2_pipe`, `co2_tank`, `treated_gas_pipe`, and
`stack`) for Three.js selection and animation.

The simplified system is a visual demonstration rather than process engineering
design. Pipe centre-lines and equipment sizes are layout assumptions; pressure,
flow, wall thickness, supports, instrumentation, and design codes are not modeled.
