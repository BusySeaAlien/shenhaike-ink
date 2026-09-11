# Ink Reading Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add persistent paged and scrolling reading modes to Ink article pages, defaulting to paged on viewports up to 767px and scrolling on larger viewports.

**Architecture:** Keep the existing Markdown DOM and wrap it in a reading viewport controlled by one Astro component. A pure JavaScript utility module owns mode validation and page calculations; the component owns browser state, CSS-column pagination, input handling, and Swup-safe lifecycle management.

**Tech Stack:** Astro 5, TypeScript browser scripts, CSS Columns, Node.js built-in test runner, Swup, existing Tailwind/global CSS.

## Global Constraints

- Render one Markdown source, one URL, and one article DOM; do not duplicate or split the content tree.
- Use `767px` as the default-mode breakpoint: viewport widths up to 767px default to `paged`, larger widths default to `scroll`.
- Persist only explicit user choices using `localStorage`; a saved valid choice always overrides the device default.
- Preserve the current scroll-mode layout, PhotoSwipe behavior, Pagefind markup, heading IDs, mobile TOC, license card, and adjacent-post navigation.
- Use the existing low-contrast Ink variables and editorial styling; add no dependency or new visual system.
- JavaScript failure or unsupported CSS Columns must leave the normal scrolling article readable.
- Do not push or deploy.

---

## File Map

- Create `src/utils/reading-mode.mjs`: pure mode, pagination, and interaction-target helpers.
- Create `src/utils/reading-mode.test.mjs`: Node tests for all pure behavior.
- Create `src/components/ReadingMode.astro`: accessible controls, paged viewport, and Swup-safe browser controller.
- Create `src/components/reading-mode.contract.test.mjs`: source-level integration checks for required markup, route wiring, and paged CSS selectors.
- Modify `src/pages/posts/[...slug].astro`: render the component around the existing single Markdown node.
- Modify `src/styles/shenhaike.css`: restrained controls, CSS-column pages, break rules, and no-JS fallback.

### Task 1: Reading-mode domain logic

**Files:**
- Create: `src/utils/reading-mode.mjs`
- Test: `src/utils/reading-mode.test.mjs`

**Interfaces:**
- Consumes: mode strings, viewport width, scroll metrics, page index, and an event target.
- Produces: `READING_MODE_STORAGE_KEY`, `READING_MODES`, `resolveReadingMode(storedMode, viewportWidth)`, `getPageCount(scrollWidth, pageWidth)`, `clampPageIndex(index, pageCount)`, and `isInteractiveReadingTarget(target)`.

- [ ] **Step 1: Write failing mode-resolution tests**

Create `src/utils/reading-mode.test.mjs` with Node assertions proving that valid saved modes win, missing or invalid values use the 767px breakpoint, and the boundary itself is paged.

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPageIndex,
  getPageCount,
  isInteractiveReadingTarget,
  resolveReadingMode,
} from "./reading-mode.mjs";

test("saved reading mode overrides the viewport default", () => {
  assert.equal(resolveReadingMode("scroll", 375), "scroll");
  assert.equal(resolveReadingMode("paged", 1440), "paged");
});

test("missing or invalid preference uses the 767px breakpoint", () => {
  assert.equal(resolveReadingMode(null, 767), "paged");
  assert.equal(resolveReadingMode(null, 768), "scroll");
  assert.equal(resolveReadingMode("unknown", 375), "paged");
});

test("page count is rounded up and never below one", () => {
  assert.equal(getPageCount(0, 720), 1);
  assert.equal(getPageCount(720, 720), 1);
  assert.equal(getPageCount(721, 720), 2);
});

test("page index is clamped to the available range", () => {
  assert.equal(clampPageIndex(-2, 5), 0);
  assert.equal(clampPageIndex(3, 5), 3);
  assert.equal(clampPageIndex(8, 5), 4);
  assert.equal(clampPageIndex(8, 0), 0);
});

test("interactive descendants do not trigger reading-surface navigation", () => {
  const link = { closest: (selector) => selector.includes("a") ? link : null };
  const paragraph = { closest: () => null };
  assert.equal(isInteractiveReadingTarget(link), true);
  assert.equal(isInteractiveReadingTarget(paragraph), false);
  assert.equal(isInteractiveReadingTarget(null), false);
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test src/utils/reading-mode.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `reading-mode.mjs`.

- [ ] **Step 3: Implement the pure helpers**

Create `src/utils/reading-mode.mjs` with frozen mode values, the namespaced key `ink:reading-mode`, numeric guards for page calculations, and `closest()` matching for `a`, `button`, `input`, `select`, `textarea`, `summary`, `label`, `pre`, `code`, `.expressive-code`, and `[contenteditable]`.

```js
export const READING_MODE_STORAGE_KEY = "ink:reading-mode";
export const READING_MODES = Object.freeze({ PAGED: "paged", SCROLL: "scroll" });
const MOBILE_MAX_WIDTH = 767;
const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, summary, label, pre, code, .expressive-code, [contenteditable]";

export function resolveReadingMode(storedMode, viewportWidth) {
  if (storedMode === READING_MODES.PAGED || storedMode === READING_MODES.SCROLL) return storedMode;
  return viewportWidth <= MOBILE_MAX_WIDTH ? READING_MODES.PAGED : READING_MODES.SCROLL;
}

export function getPageCount(scrollWidth, pageWidth) {
  if (!Number.isFinite(scrollWidth) || !Number.isFinite(pageWidth) || pageWidth <= 0) return 1;
  return Math.max(1, Math.ceil(scrollWidth / pageWidth));
}

export function clampPageIndex(index, pageCount) {
  const lastIndex = Math.max(0, Math.floor(pageCount) - 1);
  return Math.min(Math.max(0, Math.floor(index) || 0), lastIndex);
}

export function isInteractiveReadingTarget(target) {
  return Boolean(target && typeof target.closest === "function" && target.closest(INTERACTIVE_SELECTOR));
}
```

- [ ] **Step 4: Run unit tests and verify GREEN**

Run: `node --test src/utils/reading-mode.test.mjs src/utils/reading-stats.test.mjs`

Expected: 9 tests pass, 0 fail.

- [ ] **Step 5: Commit the domain logic**

```powershell
git add -- src/utils/reading-mode.mjs src/utils/reading-mode.test.mjs
git commit -m "test: define Ink reading mode behavior"
```

### Task 2: Accessible reading-mode component and article integration

**Files:**
- Create: `src/components/ReadingMode.astro`
- Create: `src/components/reading-mode.contract.test.mjs`
- Modify: `src/pages/posts/[...slug].astro`

**Interfaces:**
- Consumes: the Task 1 exports and one child slot containing the existing `Markdown` component.
- Produces: `.reading-mode`, `[data-reading-viewport]`, `[data-reading-content]`, mode buttons, previous/next hit areas, and `[data-page-status]`.

- [ ] **Step 1: Write a failing component integration contract**

Create `src/components/reading-mode.contract.test.mjs`. Read the component and article route as UTF-8 and assert that the component exposes its mode buttons, viewport, content wrapper, hit areas, and page status, while the route imports `ReadingMode` and wraps exactly one existing `Markdown` block.

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("article route renders one Markdown body inside accessible reading controls", async () => {
  const component = await readFile(new URL("./ReadingMode.astro", import.meta.url), "utf8");
  const route = await readFile(new URL("../pages/posts/[...slug].astro", import.meta.url), "utf8");
  for (const marker of ["data-reading-viewport", "data-reading-content", "data-reading-mode=", "data-page-status", "aria-pressed"]) {
    assert.match(component, new RegExp(marker));
  }
  assert.match(route, /import ReadingMode/);
  assert.equal((route.match(/<Markdown\b/g) ?? []).length, 1);
  assert.match(route, /<ReadingMode>[\s\S]*<Markdown\b[\s\S]*<\/Markdown>[\s\S]*<\/ReadingMode>/);
});
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test src/components/reading-mode.contract.test.mjs`

Expected: FAIL with `ENOENT` for `ReadingMode.astro`.

- [ ] **Step 3: Build `ReadingMode.astro` markup**

Create semantic markup with a hidden-until-initialized root, a `role="group"` labelled “阅读模式”, two buttons labelled “分页” and “滚动”, a viewport wrapping `<slot />`, two pagination hit-area buttons with accessible previous/next labels, and a polite page-status output. The hit areas must be absent from the tab order because keyboard navigation is handled on the viewport.

- [ ] **Step 4: Add the browser controller**

Implement an idempotent `initReadingMode()` that:

1. Cleans any previous instance with an `AbortController` stored on `window` under a typed private property.
2. Reads `localStorage` in `try/catch`, resolves the mode, and detects CSS Columns support.
3. Applies `data-mode`, button `aria-pressed`, hit-area visibility, and page-status text.
4. Saves only mode-button clicks.
5. Computes page width from the viewport, page count from content `scrollWidth`, and horizontal position from the clamped index.
6. Recalculates via `ResizeObserver`, image `load` events, `document.fonts.ready`, and `window.resize`.
7. Handles left/right hit-area clicks without intercepting selection, links, controls, code blocks, or images.
8. Handles horizontal pointer gestures only when horizontal travel exceeds 48px and is greater than vertical travel.
9. Handles ArrowLeft/ArrowRight and PageUp/PageDown while focus is inside the viewport and not in an editable control.
10. Routes same-page heading anchors to the column containing the target heading.
11. Initializes on first execution and again on Swup `page:view` without duplicate handlers.

Use `scrollTo({ left, behavior })` for page movement. Set `behavior` to `auto` when `prefers-reduced-motion: reduce` matches and `smooth` otherwise.

- [ ] **Step 5: Wrap only the Markdown body**

In `src/pages/posts/[...slug].astro`, import `ReadingMode` and replace the direct Markdown block with:

```astro
<ReadingMode>
  <Markdown class={`mb-6 markdown-content onload-animation ${["小说", "随笔"].includes(entry.data.category || "") ? "literary-content" : ""}`}>
    <Content />
  </Markdown>
</ReadingMode>
```

Keep the mobile TOC before the component and the license card after it.

- [ ] **Step 6: Run static checks**

Run: `pnpm check`

Expected: exit code 0 with 0 errors.

- [ ] **Step 7: Commit component integration**

```powershell
git add -- src/components/ReadingMode.astro src/components/reading-mode.contract.test.mjs src/pages/posts/[...slug].astro
git commit -m "feat: add persistent article reading modes"
```

### Task 3: Paged layout and restrained styling

**Files:**
- Modify: `src/styles/shenhaike.css`
- Modify: `src/components/ReadingMode.astro`
- Test: `src/components/reading-mode.contract.test.mjs`

**Interfaces:**
- Consumes: Task 2 data attributes and CSS variables.
- Produces: readable no-JS scroll fallback and stable `.reading-mode[data-mode="paged"]` column layout.

- [ ] **Step 1: Write the failing paged-style contract**

Extend `src/components/reading-mode.contract.test.mjs` with a test that reads `shenhaike.css` and requires the paged-mode root, column properties, viewport hit areas, reduced-motion handling, and fragmentation selectors.

```js
test("paged reading CSS defines columns, navigation surfaces, and fragmentation rules", async () => {
  const css = await readFile(new URL("../styles/shenhaike.css", import.meta.url), "utf8");
  for (const marker of [
    '.reading-mode[data-mode="paged"]',
    "column-width:",
    "column-gap:",
    "column-fill:",
    ".reading-page-hit-area",
    "break-inside: avoid",
    "prefers-reduced-motion: reduce",
  ]) assert.ok(css.includes(marker), `missing CSS marker: ${marker}`);
});
```

- [ ] **Step 2: Run the contract and verify RED**

Run: `node --test src/components/reading-mode.contract.test.mjs`

Expected: the markup contract passes and the CSS contract FAILS with `missing CSS marker`.

- [ ] **Step 3: Establish the no-JS and scroll baseline**

Keep the root transparent to layout before initialization. Hide controls and hit areas until `[data-ready="true"]`; ensure scroll mode adds no fixed height, transform, horizontal scrollbar, or altered Markdown margins.

- [ ] **Step 4: Style the mode selector**

Use a compact inline-flex control above the body with `--line-divider`, `--btn-regular-bg`, `--primary`, 13–14px interface text, rounded corners no larger than the existing 8px radius, visible focus outlines, and at least 40px button height on touch widths.

- [ ] **Step 5: Implement paged columns**

Set the paged viewport height to a clamped viewport-relative value with a minimum of 24rem on larger screens and a mobile-safe `calc(100svh - ...)`. Give the Markdown content `height: 100%`, `column-width: var(--reading-page-width)`, `column-gap: var(--reading-page-gap)`, `column-fill: auto`, and a width that allows the browser to generate horizontal columns. Reset its existing bottom margin inside the viewport.

- [ ] **Step 6: Add fragmentation and overflow rules**

Apply `break-inside: avoid` to headings, figure, blockquote, list items, tables, `.expressive-code`, and formula containers, but allow paragraphs to split. Limit images to the available page height with `max-height: calc(var(--reading-page-height) - 2rem)` and `object-fit: contain`. Keep code, tables, and formulas horizontally scrollable rather than clipped.

- [ ] **Step 7: Style interaction surfaces and status**

Position left/right hit-area buttons over the outer 30% of the viewport, leaving the middle 40% empty. Make their resting state visually transparent, reveal a subtle directional cue on hover/focus, and disable them at the first/last page. Place the page counter below the viewport using subdued interface text.

- [ ] **Step 8: Run checks and build**

Run:

```powershell
node --test src/components/reading-mode.contract.test.mjs src/utils/reading-mode.test.mjs src/utils/reading-stats.test.mjs
pnpm check
pnpm build
git diff --check
```

Expected: every command exits 0; Node reports 11 tests passing; Astro reports 0 errors; the production build and Pagefind indexing complete.

- [ ] **Step 9: Commit paged styling**

```powershell
git add -- src/components/ReadingMode.astro src/components/reading-mode.contract.test.mjs src/styles/shenhaike.css
git commit -m "style: add ebook-like paged article layout"
```

### Task 4: Browser behavior and regression verification

**Files:**
- Modify if evidence requires a correction: `src/components/ReadingMode.astro`
- Modify if evidence requires a correction: `src/styles/shenhaike.css`
- Modify if evidence requires a correction: `src/utils/reading-mode.test.mjs`

**Interfaces:**
- Consumes: completed article page behavior.
- Produces: verified behavior at 375px and 1440px with no known interaction regression.

- [ ] **Step 1: Start the production preview**

Run `pnpm preview --host 127.0.0.1` in a reusable terminal session after the successful build. Record the exact local URL from Astro output.

- [ ] **Step 2: Verify the 375px first-visit path**

Open an article with storage cleared at 375px. Confirm paged mode is selected, total pages are at least one, the document has no unintended horizontal overflow, and text is neither clipped nor duplicated.

- [ ] **Step 3: Verify page navigation and exclusions**

Confirm right/left hit areas, a horizontal swipe, Arrow keys, and PageUp/PageDown change exactly one page. Confirm middle-area clicks, text selection, links, code-copy controls, images/PhotoSwipe, and first/last-page boundaries do not cause unintended flips.

- [ ] **Step 4: Verify persistence and desktop default**

Select scroll on mobile, reload, and confirm scroll remains selected. Clear storage, open at 1440px, and confirm scroll is the default. Select paged, reload, and confirm paged remains selected.

- [ ] **Step 5: Verify complex Markdown and navigation lifecycle**

Inspect headings, quotes, lists, images, code, formulas or tables when present, directory anchors, license card, and adjacent-post links. Navigate between both available posts through Swup and confirm one input causes one response after each transition.

- [ ] **Step 6: Verify accessibility and reduced motion**

Confirm button names and pressed states in the accessibility tree, keyboard focus visibility, polite page updates, dark mode contrast, and immediate page movement under reduced motion.

- [ ] **Step 7: Correct only reproduced failures using TDD**

For pure-logic failures, add a failing Node test before changing `reading-mode.mjs`. For DOM/layout failures, document the exact viewport and reproduction, make the smallest component or CSS correction, then repeat the affected browser step and the complete verification commands.

- [ ] **Step 8: Run final verification**

Run:

```powershell
node --test src/utils/*.test.mjs
pnpm check
pnpm build
git diff --check
git status --short
```

Expected: all tests pass, Astro reports 0 errors, build/Pagefind complete, diff check exits 0, and status contains only intentional implementation or plan changes.

- [ ] **Step 9: Commit verified corrections if any**

If browser verification required changes:

```powershell
git add -- src/components/ReadingMode.astro src/styles/shenhaike.css src/utils/reading-mode.mjs src/utils/reading-mode.test.mjs
git commit -m "fix: harden paged reading interactions"
```

If no correction was needed, do not create an empty commit.
