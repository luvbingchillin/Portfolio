# Milestone 1: White Background & Visual Harmony

## Objective
Implement Milestone 1 from `PROJECT.md`:
Switch primary page background to `#ffffff`, calibrate 3D scene lighting and white exponential fog, invert CSS design tokens, remove dark radial gradient vignette, and update base UI controls and preloader for crisp contrast.

## Scope & File Ownership
- Exclusively owns:
  - `src/App.tsx` (background styling, vignette removal/replacement)
  - `src/index.css` (design tokens, background & text colors, contrast classes)
  - `src/components/LibraryScene.tsx` (fog `0xffffff`, ambient light `0xfdfbf7, 0.85`, key light calibration)
  - `src/components/Preloader.tsx` (light background adaptation)
- Preserves:
  - Zero object allocations in `tick()` RAF loop (`LibraryScene.tsx`).
  - Existing CSS token names (`--bg-library`, `--gold-foil`, `--text-primary`) in `src/index.css`.
  - All 182 existing test assertions must continue to pass cleanly.

## Key References
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_1\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_2\handoff.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_3\handoff.md`
