import { atom } from 'jotai';

export const MAX_COMPOSERS = 3;

export interface ComposerData {
  id: string;
  isMinimized: boolean;
  isFullscreen: boolean;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  threadId?: string;
  shouldBump?: boolean;
}

// Base atom: array of composer IDs (for rendering list)
export const composerIdsAtom = atom<string[]>([]);

// Derived atom: check if max composers reached
export const canOpenComposerAtom = atom(
  (get) => get(composerIdsAtom).length < MAX_COMPOSERS,
);

// Map atom: stores actual composer data by ID
export const composersMapAtom = atom<Map<string, ComposerData>>(new Map());

// Derived atom: get all composers as array
export const composersAtom = atom((get) => {
  const ids = get(composerIdsAtom);
  const map = get(composersMapAtom);
  return ids.map((id) => map.get(id)).filter(Boolean) as ComposerData[];
});

// Action atom: open new composer (respects max limit, focuses existing if same threadId)
export const openComposerAtom = atom(
  null,
  (get, set, initialData?: Partial<Omit<ComposerData, 'id'>>) => {
    const map = get(composersMapAtom);

    // If threadId is provided, check for existing composer with same threadId
    if (initialData?.threadId) {
      for (const [id, composer] of map) {
        if (composer.threadId === initialData.threadId) {
          // Focus existing composer and update with new data
          const updatedMap = new Map(map);
          updatedMap.set(id, {
            ...composer,
            ...initialData,
            isMinimized: false,
            shouldBump: true,
          });
          set(composersMapAtom, updatedMap);
          return;
        }
      }
    }

    if (get(composerIdsAtom).length >= MAX_COMPOSERS) {
      return;
    }

    const id = crypto.randomUUID();
    const newComposer: ComposerData = {
      id,
      isMinimized: false,
      isFullscreen: false,
      to: [],
      cc: [],
      bcc: [],
      subject: '',
      content: '',
      ...initialData,
    };

    const newMap = new Map(map);
    newMap.set(id, newComposer);
    set(composersMapAtom, newMap);
    set(composerIdsAtom, [...get(composerIdsAtom), id]);
  },
);

// Action atom: close composer
export const closeComposerAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(composersMapAtom));
  map.delete(id);
  set(composersMapAtom, map);
  set(
    composerIdsAtom,
    get(composerIdsAtom).filter((i) => i !== id),
  );
});

// Action atom: update composer
export const updateComposerAtom = atom(
  null,
  (
    get,
    set,
    { id, updates }: { id: string; updates: Partial<ComposerData> },
  ) => {
    const map = new Map(get(composersMapAtom));
    const current = map.get(id);
    if (current) {
      map.set(id, { ...current, ...updates });
      set(composersMapAtom, map);
    }
  },
);

// Action atom: toggle minimize (reads current state, avoids stale closure)
export const toggleMinimizeAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(composersMapAtom));
  const current = map.get(id);
  if (current) {
    map.set(id, { ...current, isMinimized: !current.isMinimized });
    set(composersMapAtom, map);
  }
});

// Action atom: toggle fullscreen mode
export const toggleFullscreenAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(composersMapAtom));
  const current = map.get(id);
  if (current) {
    map.set(id, {
      ...current,
      isFullscreen: !current.isFullscreen,
      isMinimized: false,
    });
    set(composersMapAtom, map);
  }
});

// Action atom: clear bump animation flag
export const clearBumpAtom = atom(null, (get, set, id: string) => {
  const map = new Map(get(composersMapAtom));
  const current = map.get(id);
  if (current) {
    map.set(id, { ...current, shouldBump: false });
    set(composersMapAtom, map);
  }
});

// Selector atom factory: get single composer by ID
export const composerAtomFamily = (id: string) =>
  atom((get) => get(composersMapAtom).get(id));
