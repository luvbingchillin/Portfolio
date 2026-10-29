# Proposed Patch for `src/components/LibraryUI.tsx`

## Integration Summary
Integrates the new `EditorialInfoSection` component into `src/components/LibraryUI.tsx` at the top-right position of the viewport, preserving all existing bottom shelf controls, keyboard hints, and detail modal triggers.

## Exact Code Diff

```diff
--- a/src/components/LibraryUI.tsx
+++ b/src/components/LibraryUI.tsx
@@ -2,6 +2,7 @@ import type { FC } from 'react';
 import type { ProjectBook } from '../types/book';
 import { BalancedText } from '../utils/textBalance';
 import { TopNav } from './TopNav';
+import { EditorialInfoSection } from './EditorialInfoSection';
 import {
   BookOpen,
   RotateCw,
@@ -58,6 +59,12 @@ export const LibraryUI: FC<LibraryUIProps> = ({
         isModalOpen={isModalOpen}
       />
 
+      {/* 1.5. TOP-RIGHT: A24 Editorial Information Section */}
+      <EditorialInfoSection
+        activeBook={activeBook}
+        curator="Kang Yuchen"
+      />
+
       {/* 2. MIDDLE SECTION: A24 Editorial Catalog Card (Bottom-Left) */}
       <div className="flex items-end justify-between pointer-events-none my-auto">
         <aside className="pointer-events-auto max-w-sm sm:max-w-md bg-white/90 backdrop-blur-md p-6 rounded-sm border border-black/10 shadow-xl text-[#171c1c] space-y-4">
```
