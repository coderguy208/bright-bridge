const keyFor = (userId) => `brightbridge.demo.checkins.${userId}`
const listeners = new Map()
export function localDateKey(date = new Date()) { return date.toISOString().slice(0, 10) }
function entries(userId) { try { return JSON.parse(localStorage.getItem(keyFor(userId)) || '[]') } catch { return [] } }
export function getTodayEntry(userId) { return entries(userId).find((entry) => entry.date === localDateKey()) || null }
export function saveTodayEntry(userId, entry) { const list = entries(userId).filter((item) => item.date !== entry.date); const saved = { ...entry, date: entry.date || localDateKey() }; localStorage.setItem(keyFor(userId), JSON.stringify([saved, ...list])); listeners.get(userId)?.forEach((listener) => listener(saved)); return saved }
export function getRecentEntries(userId) { return entries(userId) }
export function subscribeToCheckins(userId, listener) { const subscriptions = listeners.get(userId) || new Set(); subscriptions.add(listener); listeners.set(userId, subscriptions); return () => { subscriptions.delete(listener); if (!subscriptions.size) listeners.delete(userId) } }
