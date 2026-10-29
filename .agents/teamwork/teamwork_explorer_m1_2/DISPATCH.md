# M1 Explorer 2: 3D Scene Fog & Studio Lighting Plan

Read:
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md`
- `C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_survey_2\handoff.md`

Your task:
1. Examine `src/components/LibraryScene.tsx` (lines 115-185, 715-740).
2. Formulate the exact code changes to update `scene.fog` from `0x171c1c, 0.055` to white `0xffffff, 0.032` (or subtle linear fog), adjust ambient lighting to `0xfdfbf7, 0.85`, adjust key light and desk glow for crisp contrast on pure white background.
3. CRITICAL INVARIANT: Verify that no object allocations (`new THREE.*`) or array methods are introduced into `tick()`. All lighting and fog modifications must reside strictly in scene initialization (`useEffect`).
4. Detail the exact line-by-line diff and expected visual behavior.

Write your report to:
`C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\handoff.md`
Maintain your heartbeat in `progress.md`.


## 2026-10-29T01:07:22Z
You are teamwork_explorer_m1_2.
Your working directory is: C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2
Your parent is orchestrator (conv ID: 769b646f-c552-41bc-9868-9a381d080792).

MANDATORY: You MUST read the original request at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\ORIGINAL_REQUEST.md
Also read PROJECT.md at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\PROJECT.md
Also read your task instructions at:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\DISPATCH.md

Your task is to plan the exact code changes for 3D Scene Fog & Studio Lighting in LibraryScene.tsx:
- Update scene.fog to pure white (new THREE.FogExp2(0xffffff, 0.032))
- Adjust ambient lighting to clean studio warm (new THREE.AmbientLight(0xfdfbf7, 0.85))
- Calibrate directional key light and tone mapping exposure for punchy book covers against pure white
- ZERO-ALLOCATION INVARIANT: strictly zero new THREE.* allocations or array methods in tick() RAF loop.

Maintain heartbeat in C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\progress.md.
Write handoff report to:
C:\Users\kangy\Desktop\Portfolio\.agents\teamwork\teamwork_explorer_m1_2\handoff.md
Send a message to your parent when done.
