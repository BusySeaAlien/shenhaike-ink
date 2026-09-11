export const READING_MODE_STORAGE_KEY = "ink:reading-mode";

export const READING_MODES = Object.freeze({
	PAGED: "paged",
	SCROLL: "scroll",
});

const MOBILE_MAX_WIDTH = 767;
const INTERACTIVE_SELECTOR =
	"a, button, input, select, textarea, summary, label, pre, code, .expressive-code, [contenteditable]";

export function resolveReadingMode(storedMode, viewportWidth) {
	if (
		storedMode === READING_MODES.PAGED ||
		storedMode === READING_MODES.SCROLL
	) {
		return storedMode;
	}

	return viewportWidth <= MOBILE_MAX_WIDTH
		? READING_MODES.PAGED
		: READING_MODES.SCROLL;
}

export function getPageCount(scrollWidth, pageWidth, pageGap = 0) {
	if (
		!Number.isFinite(scrollWidth) ||
		!Number.isFinite(pageWidth) ||
		!Number.isFinite(pageGap) ||
		pageWidth <= 0
	) {
		return 1;
	}

	return Math.max(1, Math.ceil((scrollWidth + pageGap) / (pageWidth + pageGap)));
}

export function clampPageIndex(index, pageCount) {
	const lastIndex = Math.max(0, Math.floor(pageCount) - 1);
	return Math.min(Math.max(0, Math.floor(index) || 0), lastIndex);
}

export function isInteractiveReadingTarget(target) {
	return Boolean(
		target &&
			typeof target.closest === "function" &&
			target.closest(INTERACTIVE_SELECTOR),
	);
}
