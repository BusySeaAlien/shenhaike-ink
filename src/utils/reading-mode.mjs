export const READING_MODE_STORAGE_KEY = "ink:reading-mode";

export const READING_MODES = Object.freeze({
	PAGED: "paged",
	SCROLL: "scroll",
});

const MOBILE_MAX_WIDTH = 767;
const INTERACTIVE_SELECTOR =
	"a, button, input, select, textarea, summary, label, pre, code, .expressive-code, [contenteditable]";
const TEXT_ENTRY_SELECTOR = "input, select, textarea, [contenteditable]";

export const PAGE_TURN = Object.freeze({
	PREVIOUS: -1,
	NONE: 0,
	NEXT: 1,
});

const PAGE_TURN_KEYS = Object.freeze({
	ArrowUp: PAGE_TURN.PREVIOUS,
	ArrowLeft: PAGE_TURN.PREVIOUS,
	PageUp: PAGE_TURN.PREVIOUS,
	ArrowDown: PAGE_TURN.NEXT,
	ArrowRight: PAGE_TURN.NEXT,
	PageDown: PAGE_TURN.NEXT,
});

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

	return Math.max(
		1,
		Math.ceil((scrollWidth + pageGap) / (pageWidth + pageGap)),
	);
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

export function canStartReadingGesture(target) {
	return Boolean(
		target &&
			typeof target.closest === "function" &&
			!target.closest("img") &&
			!isInteractiveReadingTarget(target),
	);
}

/**
 * Narrower than {@link isInteractiveReadingTarget}: only controls that consume
 * arrow keys themselves. A focused button or link must keep paging, since the
 * reader lands on the mode switch right before pressing a key.
 */
export function isTextEntryTarget(target) {
	return Boolean(
		target &&
			typeof target.closest === "function" &&
			target.closest(TEXT_ENTRY_SELECTOR),
	);
}

/**
 * Maps a pointer position to a page turn. The reading column keeps a dead zone
 * around its centre; anything outside the column's left or right edge inherits
 * the nearest side, so the page margins stay clickable.
 */
export function resolvePageTurnFromPosition(clientX, bounds, edgeRatio = 0.3) {
	if (
		!Number.isFinite(clientX) ||
		!bounds ||
		!Number.isFinite(bounds.left) ||
		!Number.isFinite(bounds.width) ||
		bounds.width <= 0
	) {
		return PAGE_TURN.NONE;
	}

	if (clientX <= bounds.left + bounds.width * edgeRatio) {
		return PAGE_TURN.PREVIOUS;
	}

	if (clientX >= bounds.left + bounds.width * (1 - edgeRatio)) {
		return PAGE_TURN.NEXT;
	}

	return PAGE_TURN.NONE;
}

export function resolvePageTurnFromKey(key) {
	const turn = PAGE_TURN_KEYS[key];
	return typeof turn === "number" ? turn : PAGE_TURN.NONE;
}

/**
 * Resolves a requested page turn. `blocked` marks a turn the reader asked for
 * that could not move, meaning they are already at the first or last page.
 *
 * A request that lands back on the current page is not blocked: measurements and
 * mode switches call `goToPage(currentPage)` internally and must stay silent.
 */
export function resolvePageTurn(currentPage, requestedPage, pageCount) {
	const settled = clampPageIndex(currentPage, pageCount);
	if (!Number.isFinite(requestedPage)) {
		return { page: settled, blocked: false };
	}

	const page = clampPageIndex(requestedPage, pageCount);
	return {
		page,
		blocked: page === settled && Math.floor(requestedPage) !== settled,
	};
}
