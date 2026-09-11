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
	]) {
		assert.match(component, new RegExp(marker));
	}

	assert.match(route, /import ReadingMode/);
	assert.equal((route.match(/<Markdown\b/g) ?? []).length, 1);
	assert.match(
		route,
		/<ReadingMode>[\s\S]*<Markdown\b[\s\S]*<\/Markdown>[\s\S]*<\/ReadingMode>/,
	);
});
