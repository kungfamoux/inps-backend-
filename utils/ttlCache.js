/**
 * TTLCache
 *
 * Minimal in-memory cache with per-entry expiry. Used to avoid repeating
 * expensive round-trips (Firebase token verification, DB lookups) on every
 * single request when the same token/user hits the API many times in a
 * short window — the common case for a page loading several endpoints.
 *
 * Not a substitute for a shared cache (Redis etc.) in a multi-instance
 * deployment — each process keeps its own copy. Fine for this app's scale.
 */
class TTLCache {
	constructor({ sweepIntervalMs = 5 * 60 * 1000 } = {}) {
		this.store = new Map();

		const sweeper = setInterval(() => this._sweep(), sweepIntervalMs);
		sweeper.unref?.();
	}

	get(key) {
		const entry = this.store.get(key);
		if (!entry) return undefined;

		if (Date.now() > entry.expiresAt) {
			this.store.delete(key);
			return undefined;
		}

		return entry.value;
	}

	set(key, value, ttlMs) {
		if (ttlMs <= 0) return;
		this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
	}

	delete(key) {
		this.store.delete(key);
	}

	_sweep() {
		const now = Date.now();
		for (const [key, entry] of this.store) {
			if (now > entry.expiresAt) this.store.delete(key);
		}
	}
}

module.exports = { TTLCache };
