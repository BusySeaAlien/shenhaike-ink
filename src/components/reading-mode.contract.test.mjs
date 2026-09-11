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
		/<ReadingMode\b[\s\S]*<Markdown\b[\s\S]*<\/Markdown>[\s\S]*<\/ReadingMode>/,
	);
	assert.match(component, /class="paged-reading-summary"/);
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

test("paged reading overrides the legacy Markdown width and keeps page-tail navigation reachable", async () => {
	const css = await readFile(
		new URL("../styles/shenhaike.css", import.meta.url),
		"utf8",
	);

	assert.ok(
		css.includes(
			'#post-container .reading-mode[data-mode="paged"] .reading-content > .custom-md',
		),
		"paged Markdown width must outrank the legacy #post-container max-width rule",
	);
	assert.ok(
		css.includes('#post-container:has(.reading-mode[data-mode="paged"])'),
		"paged mode must provide compact article-header spacing",
	);
	assert.doesNotMatch(
		css,
		/(?:html|body):has\(\.reading-mode\[data-mode="paged"\]\)[^{]*\{[^}]*overflow-y:\s*hidden/,
		"paged mode must leave document scrolling available for content after the reader",
	);
});

test("reading controls do not expose an unused data-ready state", async () => {
	const component = await readFile(
		new URL("./ReadingMode.astro", import.meta.url),
		"utf8",
	);

	assert.doesNotMatch(component, /data-ready|dataset\.ready/);
});

test("page turning listens on the document without duplicating viewport bindings", async () => {
	const component = await readFile(
		new URL("./ReadingMode.astro", import.meta.url),
		"utf8",
	);

	for (const marker of [
		'document.addEventListener("click", turnFromSurface, { signal })',
		'document.addEventListener("keydown", handleKeydown, { signal })',
	]) {
		assert.ok(component.includes(marker), `missing document binding: ${marker}`);
	}

	assert.doesNotMatch(
		component,
		/viewport\.addEventListener\(\s*"(?:click|keydown)"/,
		"a duplicate viewport binding would turn two pages per input",
	);
});

test("page turning stands down while the lightbox is open", async () => {
	const component = await readFile(
		new URL("./ReadingMode.astro", import.meta.url),
		"utf8",
	);

	assert.ok(
		component.includes(".pswp--open"),
		"the PhotoSwipe overlay is a detached layer, so page turning must detect it explicitly",
	);
});
