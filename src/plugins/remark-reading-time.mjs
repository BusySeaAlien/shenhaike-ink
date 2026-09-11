// biome-ignore lint/suspicious/noShadowRestrictedNames: <toString from mdast-util-to-string>
import { toString } from "mdast-util-to-string";
import { getChineseReadingStats } from "../utils/reading-stats.mjs";

export function remarkReadingTime() {
	return (tree, { data }) => {
		const body = {
			...tree,
			children: tree.children.filter(
				(node) => node.type !== "yaml" && node.type !== "toml",
			),
		};
		const readingStats = getChineseReadingStats(toString(body));
		data.astro.frontmatter.minutes = readingStats.minutes;
		data.astro.frontmatter.words = readingStats.words;
	};
}
