/*
  Progress tracking foundation. No chapter can be completed yet (there is no
  chapter content), so this always reports zero today — but the storage shape
  and API are ready for when chapters ship: a chapter page will eventually
  call `markComplete(chapterId)`.
*/

const STORAGE_KEY = 'physicsbook:progress';

function readCompletedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? new Set(ids) : new Set();
  } catch {
    return new Set();
  }
}

function writeCompletedIds(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function isComplete(chapterId) {
  return readCompletedIds().has(chapterId);
}

export function markComplete(chapterId) {
  const ids = readCompletedIds();
  ids.add(chapterId);
  writeCompletedIds(ids);
}

export function markIncomplete(chapterId) {
  const ids = readCompletedIds();
  ids.delete(chapterId);
  writeCompletedIds(ids);
}

/**
 * @param {{id: string}[]} chapters
 * @returns {{ total: number, completed: number, percent: number }}
 */
export function computeStats(chapters) {
  const completedIds = readCompletedIds();
  const total = chapters.length;
  const completed = chapters.filter((chapter) => completedIds.has(chapter.id)).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, completed, percent };
}
