---
name: mediaconvert-design-system
description: Enforces a cross-platform design system (Expo + Next.js) for MediaConvert, including tokens, layout rules, and a single-page state-driven UI for conversion flows.
tags:
  - frontend
  - design-system
  - react-native
  - nextjs
  - tailwind
  - nativewind
---

# MediaConvert Design System Skill

This skill ensures all UI built for MediaConvert is:
- Consistent across mobile (Expo) and web (Next.js)
- Built using a strict token system (colors, spacing, typography)
- Implemented as a **single-page state-driven flow**, not multiple pages
- Compatible with:
  - Native: NativeWind + react-native-reusables
  - Web: Tailwind + shadcn/ui

---

# 1. Core Rule (CRITICAL)

❌ DO NOT create multiple pages for:
- upload
- processing
- result

✅ ALWAYS implement a **single screen** that changes UI based on state:

```ts
type ConversionState =
  | "idle"
  | "uploading"
  | "processing"
  | "completed"
  | "error"

UI must react to this state.

2. UI State Flow (Single Page)
idle
Show file picker
Show format selection (disabled until file selected)
Show convert button (disabled)
uploading
Show loading spinner (centered)
Show "Uploading..." text
Optional: chunk progress
processing
Show progress bar
Show "Converting..." text
Disable all inputs
completed
Show success state
Show download/share button
Show file info
error
Show error message
Show retry button
3. Overlay Usage (Required)

Instead of navigation:

Use Dialogs / Modals for:
Format selection (optional on mobile)
Errors
Confirmations
Use Loading Overlays for:
Uploading
Processing (optional if inline progress exists)
4. Design Tokens (STRICT)
Colors

Only use these:

primary: #2563EB
accent: #22C55E
danger: #EF4444
warning: #F59E0B

bg: #0B0F14
surface: #111827
surface-2: #1F2937
border: #374151
text: #E5E7EB
muted: #9CA3AF

❌ No inline hex usage
❌ No random Tailwind colors

Spacing (STRICT SCALE)

Allowed only:

4, 8, 16, 24, 32, 40

Tailwind equivalents:

p-1, p-2, p-4, p-6, p-8, p-10

❌ No arbitrary spacing like p-3, mt-5

Border Radius
rounded-lg   (12px)
rounded-xl   (16px)
rounded-2xl  (24px DEFAULT)
Typography
h1: text-xl font-semibold
h2: text-lg font-semibold
body: text-base
small: text-sm
caption: text-xs text-muted

Rules:

Max 3 sizes per screen
Use weight before size
5. Layout Rules
Mobile (Expo)

Structure:

[ Header ]

[ Main Card ]

[ Controls ]

[ Status ]

[ Primary Button ]

Rules:

px-4
space-y-4
No nested cards
Web (Next.js)

Centered:

max-w-3xl mx-auto px-4

Structure:

[ Title ]

[ Converter Card ]

[ Info Sections ]

❌ No sidebar
❌ No dashboard layout

6. Core Components (MANDATORY)
Button

Native:

className="bg-primary rounded-2xl py-4 items-center"

Web:

shadcn Button (default, size=lg)
Card
className="bg-surface rounded-2xl p-4"
Progress Bar
className="h-1.5 rounded-full bg-surface-2"

Fill:

bg-warning → bg-accent when complete
Spinner

Use:

Native: ActivityIndicator
Web: shadcn spinner / custom animate-spin
7. Interaction Rules
Buttons must disable during processing
Always show feedback immediately
No silent actions
No dead clicks
8. Native Implementation Rules (Expo)

Stack:

NativeWind
react-native-reusables

Rules:

Use className only
No inline styles
No StyleSheet unless necessary
9. Web Implementation Rules (Next.js)

Stack:

Tailwind
shadcn/ui

Rules:

No custom CSS unless required
Use Tailwind tokens only
Use shadcn primitives
10. GitHub Enforcement (CI Expectations)

Reject code if:

Inline styles are used
Hex colors appear in components
Non-token spacing is used
Multiple pages are created for conversion flow
11. Example UI State Pattern (Reference)
if (state === "idle") return <IdleView />
if (state === "uploading") return <UploadingView />
if (state === "processing") return <ProcessingView />
if (state === "completed") return <CompletedView />
if (state === "error") return <ErrorView />

OR:

<MainCard>
  {state === "idle" && <FilePicker />}
  {state === "uploading" && <Loading />}
  {state === "processing" && <Progress />}
  {state === "completed" && <Result />}
</MainCard>
12. Pages (Updated)
Mobile (Expo)

ONLY:

Converter Screen
Entire flow handled here (state-driven)
Includes:
picker
formats
progress
result
Recent Screen
Last 10 conversions
Web (Next.js)
/
General converter (same state-driven UI)
/convert/[slug]
Same UI, preconfigured format
/blog
/blog/[slug]

❌ DO NOT create:

processing page
result page
upload page
13. Mental Model

Everything is:

ONE screen → MANY states → ZERO navigation

End of Skill

---

# What You Just Did (Important)

You now have:

- A **strict, enforceable design system**
- A **Copilot-aware skill** (not just docs)
- A **state-driven UX architecture** (huge performance + UX win)
- Cross-platform consistency (Expo + Next.js)

---

# If you want next

We can now:

1. :contentReference[oaicite:0]{index=0}
   - `<ConverterCard />`
   - `<ProgressView />`
   - `<FormatGrid />`

2. Or :contentReference[oaicite:1]{index=1}
   - `packages/ui`
   - `packages/tokens`

3. Or :contentReference[oaicite:2]{index=2}

That’s the step that turns this from “guidelines” into something your codebase cannot break.