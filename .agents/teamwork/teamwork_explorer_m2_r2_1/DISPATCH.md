# M2-r2 Explorer 1: Event Pass-Through & Top Viewport Dead-Zone Remediation Plan

Read:
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_challenger_m2_2\handoff.md`

Defect to investigate:
In `src/index.css`, `.nav-inner` has `pointer-events: auto` and `width: 100%`, which creates a 55,040 px² dead-zone across the top of the viewport (y: 0..40px) outside the centered nav pill where mouse drag and wheel events are intercepted by `.nav-inner` and blocked from reaching the 3D canvas. Also, outside clicks in this zone fail to dismiss the dropdown.

Your task:
1. Formulate the exact CSS and component changes in `src/index.css` and `src/components/TopNav.tsx` so:
   - `.nav-inner` has `pointer-events: none; width: 100%;`
   - `.nav-center` has `pointer-events: auto;`
   - `.nav-bg` and `.nav-dropdown` have `pointer-events: auto;`
   - Full 100% pass-through of drag, wheel, and click events to canvas outside `.nav-center` and outside `.nav-dropdown`.
2. Document exact diff and verification method.

Write your report to:
`C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_1\handoff.md`
Maintain your heartbeat in `progress.md`.

## 2026-10-29T02:04:43Z
From: 769b646f-c552-41bc-9868-9a381d080792
Priority: MESSAGE_PRIORITY_HIGH
Content:
You are teamwork_explorer_m2_r2_1.
Your working directory is: C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_1
Your parent is orchestrator (conv ID: 769b646f-c552-41bc-9868-9a381d080792).

MANDATORY: You MUST read the original request at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md
Also read your task instructions at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_1\DISPATCH.md
Also read Challenger 2 handoff report at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_challenger_m2_2\handoff.md

Your task is to plan the exact CSS and component changes to resolve the top viewport event interception dead-zone:
- In src/index.css, change .nav-inner to pointer-events: none
- Give .nav-center pointer-events: auto
- Ensure .nav-bg and .nav-dropdown have pointer-events: auto
- Ensure mouse drag, wheel, and click pass cleanly to the 3D canvas outside the nav pill.

Maintain heartbeat in C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_1\progress.md.
Write handoff report to:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m2_r2_1\handoff.md
Send a message to your parent when done.
