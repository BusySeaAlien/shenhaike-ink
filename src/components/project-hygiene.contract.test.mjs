import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const projectFile = (path) => new URL(`../../${path}`, import.meta.url);

test("package metadata exposes the complete test suite", async () => {
	const packageJson = JSON.parse(
		await readFile(projectFile("package.json"), "utf8"),
	);

	assert.equal(packageJson.name, "shenhaike-ink");
	assert.equal(packageJson.scripts.test, "node --test src/**/*.test.mjs");
});

test("CI runs the repository test script", async () => {
	const workflow = await readFile(
		projectFile(".github/workflows/build.yml"),
		"utf8",
	);

	assert.match(workflow, /run:\s*pnpm test/);
});

test("temporary work directories are ignored", async () => {
	const gitignore = await readFile(projectFile(".gitignore"), "utf8");

	assert.match(gitignore, /^tmp\/$/m);
	assert.match(gitignore, /^\.tmp\/$/m);
});
