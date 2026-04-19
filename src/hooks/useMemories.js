import { useState, useEffect, useCallback } from "react";
import { openDB } from "idb";

const DB_NAME = "deep_chat_db";
const MEMORIES_STORE = "memories";
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(MEMORIES_STORE)) {
          const store = db.createObjectStore(MEMORIES_STORE, { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("chats")) {
          const chatStore = db.createObjectStore("chats", { keyPath: "id" });
          chatStore.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function useMemories() {
  const [memories, setMemories] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const db = await getDB();
      const all = await db.getAll(MEMORIES_STORE);
      setMemories(all.sort((a, b) => b.createdAt - a.createdAt));
      setLoaded(true);
    })();
  }, []);

  const addMemory = useCallback(async (content, source = "auto") => {
    const mem = { id: genId(), content, source, createdAt: Date.now() };
    const db = await getDB();
    await db.put(MEMORIES_STORE, mem);
    setMemories((prev) => [mem, ...prev]);
    return mem;
  }, []);

  const updateMemory = useCallback(async (id, content) => {
    const db = await getDB();
    const existing = await db.get(MEMORIES_STORE, id);
    if (!existing) return;
    const updated = { ...existing, content };
    await db.put(MEMORIES_STORE, updated);
    setMemories((prev) => prev.map((m) => (m.id === id ? updated : m)));
  }, []);

  const removeMemory = useCallback(async (id) => {
    const db = await getDB();
    await db.delete(MEMORIES_STORE, id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    const db = await getDB();
    await db.clear(MEMORIES_STORE);
    setMemories([]);
  }, []);

  const memosText = memories.map((m) => m.content).join("\n");

  return { memories, loaded, addMemory, updateMemory, removeMemory, clearAll, memosText };
}
