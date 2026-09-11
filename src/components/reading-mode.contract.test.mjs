import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("article route renders one Markdown body inside accessible reading controls", async () => {
	const component = await readFile(
		new URL("./ReadingMode.astro", import.meta.url),
		"utf8",
	);
	const route = await readFile(
		new URL("../pages/posts/[...slug].astro", import.meta.url),
		"utf8",
	);

	for (const marker of [
		"data-reading-viewport",
		"data-reading-content",
		"data-reading-mode=",
		"data-page-status",
		"aria-pressed",
		"viewport.tabIndex = paged ? 0 : -1",
		"cleanupReadingMode",
		'"content:replace"',
	]) {
		assert.ok(component.includes(marker), `missing component marker: ${marker}`);
	}

	assert.match(route, /import ReadingMode/);
	assert.equal((route.match(/<Markdown\b/g) ?? []).length, 1);
	assert.match(
		route,
		/<ReadingMode>[\s\S]*<Markdown\b[\s\S]*<\/Markdown>[\s\S]*<\/ReadingMode>/,
	);
});

test("paged reading CSS defines columns, navigation surfaces, and fragmentation rules", async () => {
	const css = await readFile(
		new URL("../styles/shenhaike.css", import.meta.url),
		"utf8",
	);

	for (const marker of [
		'.reading-mode[data-mode="paged"]',
		"column-width:",
		"column-gap:",
		"column-fill:",
		".reading-page-hit-area",
		"break-inside: avoid",
		"prefers-reduced-motion: reduce",
	]) {
		assert.ok(css.includes(marker), `missing CSS marker: ${marker}`);
	}
	assert.doesNotMatch(css, /\.custom-md > :is\([^)]*\bul\b/);
});
