import assert from "node:assert/strict";
import test from "node:test";
import {
	canStartReadingGesture,
	clampPageIndex,
	getPageCount,
	isInteractiveReadingTarget,
	resolveReadingMode,
} from "./reading-mode.mjs";

test("saved reading mode overrides the viewport default", () => {
	assert.equal(resolveReadingMode("scroll", 375), "scroll");
	assert.equal(resolveReadingMode("paged", 1440), "paged");
});

test("swipe gestures start only on non-interactive reading content", () => {
	const image = { closest: (selector) => (selector.includes("img") ? image : null) };
	const link = { closest: (selector) => (selector.includes("a") ? link : null) };
	const paragraph = { closest: () => null };

	assert.equal(canStartReadingGesture(image), false);
	assert.equal(canStartReadingGesture(link), false);
	assert.equal(canStartReadingGesture(paragraph), true);
	assert.equal(canStartReadingGesture(null), false);
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
	assert.equal(getPageCount(1464, 720, 24), 2);
});

test("page index is clamped to the available range", () => {
	assert.equal(clampPageIndex(-2, 5), 0);
	assert.equal(clampPageIndex(3, 5), 3);
	assert.equal(clampPageIndex(8, 5), 4);
	assert.equal(clampPageIndex(8, 0), 0);
});

test("interactive descendants do not trigger reading-surface navigation", () => {
	const link = { closest: (selector) => (selector.includes("a") ? link : null) };
	const paragraph = { closest: () => null };

	assert.equal(isInteractiveReadingTarget(link), true);
	assert.equal(isInteractiveReadingTarget(paragraph), false);
	assert.equal(isInteractiveReadingTarget(null), false);
});
