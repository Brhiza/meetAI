import { useState, useEffect, useCallback, useRef } from "react";
import { getAllChats, saveChat, deleteChatFromDB, clearAllChats, loadSetting, saveSetting } from "../services/db";

const ACTIVE_KEY = "deep_active_chat";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function createChat(title) {
  const now = Date.now();
  return {
    id: generateId(),
    title: title || "新对话",
    messages: [],
    mode: "fast",
    pinned: false,
    createdAt: now,
    updatedAt: now,
  };
}

function sortChats(list) {
  return [...list].sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });
}

export function useChats() {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(new Set());

  useEffect(() => {
    (async () => {
      const all = await getAllChats();
      const savedActive = await loadSetting(ACTIVE_KEY);
      const sorted = sortChats(all);
      setChats(sorted);
      if (savedActive && sorted.find((c) => c.id === savedActive)) {
        setActiveId(savedActive);
      } else if (sorted.length > 0) {
        setActiveId(sorted[0].id);
      }
      setLoaded(true);
    })();
  }, []);

  const activeChat = chats.find((c) => c.id === activeId) || null;

  const persistChat = useCallback(async (chat) => {
    if (savingRef.current.has(chat.id)) return;
    savingRef.current.add(chat.id);
    try {
      await saveChat(chat);
    } finally {
      savingRef.current.delete(chat.id);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    for (const chat of chats) {
      persistChat(chat);
    }
  }, [chats, loaded, persistChat]);

  useEffect(() => {
    if (!loaded) return;
    saveSetting(ACTIVE_KEY, activeId);
  }, [activeId, loaded]);

  const newChat = useCallback((title) => {
    const chat = createChat(title);
    setChats((prev) => sortChats([chat, ...prev]));
    setActiveId(chat.id);
    saveChat(chat);
    return chat;
  }, []);

  const selectChat = useCallback((id) => {
    setActiveId(id);
  }, []);

  const deleteChat = useCallback(
    (id) => {
      setChats((prev) => {
        const next = prev.filter((c) => c.id !== id);
        if (activeId === id) {
          const newActive = next.length > 0 ? next[0].id : null;
          setActiveId(newActive);
        }
        return next;
      });
      deleteChatFromDB(id);
    },
    [activeId]
  );

  const updateChat = useCallback((id, updater) => {
    setChats((prev) => {
      const next = prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...updater(c), updatedAt: Date.now() };
        persistChat(updated);
        return updated;
      });
      return sortChats(next);
    });
  }, [persistChat]);

  const addMessage = useCallback(
    (chatId, role, content) => {
      const id = generateId();
      updateChat(chatId, (c) => ({
        ...c,
        messages: [...c.messages, { role, content, id, createdAt: Date.now() }],
      }));
      return id;
    },
    [updateChat]
  );

  const markMessage = useCallback(
    (chatId, msgId, patch) => {
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === msgId ? { ...m, ...patch } : m)),
      }));
    },
    [updateChat]
  );

  const updateLastAssistant = useCallback(
    (chatId, content) => {
      updateChat(chatId, (c) => {
        const msgs = [...c.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === "assistant") {
          msgs[lastIdx] = { ...msgs[lastIdx], content };
        }
        return { ...c, messages: msgs };
      });
    },
    [updateChat]
  );

  const setChatMode = useCallback(
    (chatId, mode) => {
      updateChat(chatId, (c) => ({ ...c, mode }));
    },
    [updateChat]
  );

  const setChatTitle = useCallback(
    (chatId, title) => {
      updateChat(chatId, (c) => ({ ...c, title }));
    },
    [updateChat]
  );

  const clearAll = useCallback(async () => {
    setChats([]);
    setActiveId(null);
    await clearAllChats();
  }, []);

  const deleteMessage = useCallback(
    (chatId, msgId) => {
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== msgId),
      }));
    },
    [updateChat]
  );

  const editMessage = useCallback(
    (chatId, msgId, content) => {
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) => (m.id === msgId ? { ...m, content } : m)),
      }));
    },
    [updateChat]
  );

  const truncateAfter = useCallback(
    (chatId, msgId) => {
      updateChat(chatId, (c) => {
        const idx = c.messages.findIndex((m) => m.id === msgId);
        if (idx < 0) return c;
        return { ...c, messages: c.messages.slice(0, idx + 1) };
      });
    },
    [updateChat]
  );

  const togglePinChat = useCallback(
    (chatId) => {
      updateChat(chatId, (c) => ({ ...c, pinned: !c.pinned }));
    },
    [updateChat]
  );

  const updateChatSummary = useCallback(
    (chatId, summary) => {
      updateChat(chatId, (c) => ({ ...c, summary }));
    },
    [updateChat]
  );

  const exportChats = useCallback(() => {
    return {
      version: 1,
      exportedAt: Date.now(),
      chats,
    };
  }, [chats]);

  const importChats = useCallback(async (payload) => {
    if (!payload || !Array.isArray(payload.chats)) return 0;
    const existingIds = new Set(chats.map((c) => c.id));
    const incoming = payload.chats
      .filter((c) => c && c.id && Array.isArray(c.messages))
      .map((c) => ({
        pinned: false,
        updatedAt: c.createdAt || Date.now(),
        ...c,
        id: existingIds.has(c.id) ? `${c.id}_${generateId()}` : c.id,
      }));
    if (incoming.length === 0) return 0;
    for (const chat of incoming) await saveChat(chat);
    setChats((prev) => sortChats([...incoming, ...prev]));
    return incoming.length;
  }, [chats]);

  return {
    chats,
    activeId,
    activeChat,
    loaded,
    newChat,
    selectChat,
    deleteChat,
    addMessage,
    updateLastAssistant,
    setChatMode,
    setChatTitle,
    deleteMessage,
    editMessage,
    markMessage,
    truncateAfter,
    togglePinChat,
    updateChatSummary,
    exportChats,
    importChats,
    clearAll,
  };
}
