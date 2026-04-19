import { openDB } from "idb";

const DB_NAME = "deep_chat_db";
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("chats")) {
          const store = db.createObjectStore("chats", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "key" });
        }
        if (!db.objectStoreNames.contains("memories")) {
          const memStore = db.createObjectStore("memories", { keyPath: "id" });
          memStore.createIndex("createdAt", "createdAt");
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllChats() {
  const db = await getDB();
  const all = await db.getAllFromIndex("chats", "createdAt");
  return all.reverse();
}

export async function saveChat(chat) {
  const db = await getDB();
  await db.put("chats", chat);
}

export async function deleteChatFromDB(id) {
  const db = await getDB();
  await db.delete("chats", id);
}

export async function clearAllChats() {
  const db = await getDB();
  await db.clear("chats");
}

export async function loadSetting(key) {
  const db = await getDB();
  const row = await db.get("settings", key);
  return row ? row.value : null;
}

export async function saveSetting(key, value) {
  const db = await getDB();
  await db.put("settings", { key, value });
}
