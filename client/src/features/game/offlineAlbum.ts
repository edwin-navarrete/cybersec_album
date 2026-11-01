/*
    Offline mode, per album.

    Saving to the API is best effort: the player must be able to keep playing
    and reach the completed album even if saving fails, and the failure can be
    investigated later. So:

    - A failed save is retried (only when it can be transient).
    - If it keeps failing, the album goes offline: from then on nothing else is
      sent to the API for that album, and its records (stickers and answers) live
      in localStorage, so an accidental refresh does not lose the progress.
    - The API keeps the history it had up to the first failure, which is a
      consistent (just older) state. Nothing is reconciled automatically.
    - Team albums are shared by several browsers, so they never go offline:
      a failed save is raised to the player instead.
*/

const flagKey = (albumId: string) => `offline:${albumId}`
const dataKey = (albumId: string, entrypoint: string) => `offline:${albumId}:${entrypoint}`

// What a DAO exposes so its album records can be kept in localStorage
export interface AlbumDao {
    db: any[]
    loaded: boolean
    entrypoint: string
}
const sources = new Map<string, AlbumDao>()

// Pauses before each retry of a save that failed in a way that may be transient
export const retryDelays = { ms: [300, 900] }

// The DAOs that hold album records register here so they can be persisted together
export function registerSource(dao: AlbumDao) {
    sources.set(dao.entrypoint, dao)
}

export function isOffline(albumId?: string | null): boolean {
    if (!albumId) return false
    try {
        return localStorage.getItem(flagKey(albumId)) !== null
    } catch {
        return false
    }
}

// Only solo albums can go offline, see above
export function canGoOffline(): boolean {
    try {
        return !localStorage.getItem("groupId")
    } catch {
        return true
    }
}

function describe(error: any) {
    return { status: error?.response?.status ?? null, message: String(error?.message ?? error) }
}

// Persist the records of the album held by every registered DAO
export function persist(albumId: string) {
    sources.forEach((dao, entrypoint) => {
        try {
            // A DAO not read yet must take what is stored before it is written back
            loadInto(dao, albumId)
            const records = dao.db.filter(r => r.albumId === albumId)
            localStorage.setItem(dataKey(albumId, entrypoint), JSON.stringify(records))
        } catch (error) {
            console.error("Unable to keep the album offline", error)
        }
    })
}

export function load(albumId: string, entrypoint: string): any[] {
    try {
        return JSON.parse(localStorage.getItem(dataKey(albumId, entrypoint)) ?? "[]")
    } catch {
        return []
    }
}

/*
    For an album that went offline, put its records from localStorage into the DAO,
    once and before any read or write (the first write would otherwise replace
    what was stored). Returns whether the album is offline.
*/
export function loadInto(dao: AlbumDao, albumId?: string): boolean {
    if (!albumId || !isOffline(albumId)) return false
    if (!dao.loaded) {
        dao.db = load(albumId, dao.entrypoint)
        dao.loaded = true
    }
    return true
}

export function goOffline(albumId: string, error: unknown) {
    const reason = { since: Date.now(), ...describe(error) }
    console.warn("Saving failed, the album continues offline", albumId, reason)
    // First keep what is in memory, then flag the album: once flagged, DAOs read from storage.
    // What is in memory is now the reference, so no DAO has to be read again.
    persist(albumId)
    sources.forEach(dao => { dao.loaded = true })
    try {
        localStorage.setItem(flagKey(albumId), JSON.stringify(reason))
    } catch (e) {
        console.error("Unable to flag the album as offline", e)
    }
}

/*
    What to do when saving an album record failed for good:
    a solo album continues offline, a team album raises the error.
*/
export function handleSaveFailure(albumId: string, error: unknown) {
    if (!canGoOffline()) throw error
    goOffline(albumId, error)
}

// Network failures and server errors may be transient, client errors are not
export function isRetryable(error: any): boolean {
    const status = error?.response?.status
    return status === undefined || status === null || status >= 500 || status === 408 || status === 429
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function withRetry<T>(request: () => Promise<T>): Promise<T> {
    const delays = retryDelays.ms
    for (let attempt = 0; ; attempt++) {
        try {
            return await request()
        } catch (error) {
            if (attempt >= delays.length || !isRetryable(error)) throw error
            await sleep(delays[attempt])
        }
    }
}
