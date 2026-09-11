const CHINESE_READING_SPEED = 300;
const HAN_CHARACTER_PATTERN = /\p{Script=Han}/gu;

export function getChineseReadingStats(text) {
	const words = text.match(HAN_CHARACTER_PATTERN)?.length ?? 0;

	return {
		words,
		minutes: Math.max(1, Math.round(words / CHINESE_READING_SPEED)),
	};
}
