# M2-r2 Explorer 2: TopNav Hover Pill Concurrency & Multi-Active State Remediation Plan

Read:
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_challenger_m2_2\handoff.md`

Defect to investigate:
In `src/components/TopNav.tsx` line 394:
`const isPillActive = isHovered || isFocused || (hoveredIdx === null && isCurrent);`
When opening the dropdown and hovering over an inactive monograph, BOTH the hovered monograph and the focused monograph (`focusedIndex`) render `scaleY(1)` black pills and revealed years simultaneously, causing a dual-selection visual glitch.

Your task:
1. Examine `src/components/TopNav.tsx` lines 370-420.
2. Formulate the exact state logic fix:
   - When `hoveredIdx !== null`, pointer intent takes complete precedence over keyboard focus. Only the hovered monograph renders the active pill (`isPillActive = isHovered`).
   - When `hoveredIdx === null`, keyboard focus or current monograph activates the pill (`isPillActive = isFocused || (focusedIndex === null && isCurrent)`).
3. Document exact diff and verification method.

Write your report to:
`C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_2\handoff.md`
Maintain your heartbeat in `progress.md`.


## 2026-10-29T02:04:51Z
You are teamwork_explorer_m2_r2_2.
Your working directory is: C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_2
Your parent is orchestrator (conv ID: 769b646f-c552-41bc-9868-9a381d080792).

MANDATORY: You MUST read the original request at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md
Also read your task instructions at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_2\DISPATCH.md
Also read Challenger 2 handoff report at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_challenger_m2_2\handoff.md

Your task is to plan the exact logic fix in src/components/TopNav.tsx for the dual active pill hover concurrency defect:
- In TopNav.tsx line 394, ensure pointer hover intent takes absolute precedence over keyboard focus.
- When hoveredIdx !== null, only isHovered activates the black pill (scaleY: 1) and year reveal.
- When hoveredIdx === null, isFocused or isCurrent activates the pill.

Maintain heartbeat in C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_2\progress.md.
Write handoff report to:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_2\handoff.md
Send a message to your parent when done.
