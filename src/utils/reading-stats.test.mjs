import assert from "node:assert/strict";
import test from "node:test";
import { remarkReadingTime } from "../plugins/remark-reading-time.mjs";
import { getChineseReadingStats } from "./reading-stats.mjs";

test("counts only Han-script characters", () => {
	assert.deepEqual(getChineseReadingStats("中文 ABC 123，かな。"), {
		words: 2,
		minutes: 1,
	});
});

test("calculates reading time at 300 Chinese characters per minute", () => {
	assert.deepEqual(getChineseReadingStats("汉".repeat(450)), {
		words: 450,
		minutes: 2,
	});
});

test("keeps the minimum reading time at one minute when no Han characters exist", () => {
	assert.deepEqual(getChineseReadingStats("Astro 123."), {
		words: 0,
		minutes: 1,
	});
});

test("remark plugin excludes top-level frontmatter from article statistics", () => {
	const tree = {
		type: "root",
		children: [
			{ type: "yaml", value: "title: 不计入" },
			{
				type: "paragraph",
				children: [{ type: "text", value: "只统计正文" }],
			},
		],
	};
	const file = { data: { astro: { frontmatter: {} } } };

	remarkReadingTime()(tree, file);

	assert.equal(file.data.astro.frontmatter.words, 5);
	assert.equal(file.data.astro.frontmatter.minutes, 1);
});
