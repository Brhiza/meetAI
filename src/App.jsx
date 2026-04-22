import { useState, useEffect, useRef, useCallback } from "react";
import { useChats } from "./hooks/useChats";
import { useMemories } from "./hooks/useMemories";
import { loadSettings, saveSettings, hasUsableApi } from "./services/settings";
import {
  buildContextMessages,
  parseStreamingInnerVoice,
  streamChatCompletion,
  extractMemories,
  stripMemoryTags,
  REGENERATE_DIRECTIVE,
  generateSummary,
  friendlyErrorMessage,
} from "./services/api";
import { SKINS } from "./services/skins";
import SettingsPage from "./components/SettingsPanel";
import OnboardingModal from "./components/OnboardingModal";
import {
  DefaultSidebar,
  DefaultDesktopView,
  DefaultMobileView,
  DefaultComposer,
} from "./skins/DefaultSkin";
import {
  GenericSidebar,
  GenericDesktopView,
  GenericMobileView,
  GenericComposer,
} from "./skins/GenericSkin";
import {
  DoubaoSidebar,
  DoubaoDesktopView,
  DoubaoMobileView,
  DoubaoComposer,
} from "./skins/DoubaoSkin";
import {
  GeminiDesktopSidebar,
  GeminiMobileSidebar,
  GeminiDesktopView,
  GeminiMobileView,
  GeminiComposer,
} from "./skins/GeminiSkin";
import {
  ClaudeSidebar,
  ClaudeDesktopView,
  ClaudeMobileView,
  ClaudeComposer,
} from "./skins/ClaudeSkin";
import {
  ChatGPTSidebar,
  ChatGPTDesktopView,
  ChatGPTMobileView,
  ChatGPTComposer,
} from "./skins/ChatGPTSkin";
import {
  GrokSidebar,
  GrokDesktopView,
  GrokMobileView,
  GrokComposer,
} from "./skins/GrokSkin";

function App() {
  const {
    chats,
    activeId,
    activeChat,
    loaded: chatsLoaded,
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
  } = useChats();

  const {
    memories,
    loaded: memLoaded,
    addMemory,
    updateMemory,
    removeMemory,
    clearAll: clearMemories,
    memosText,
  } = useMemories();

  const [settings, setSettings] = useState(null);
  const [page, setPage] = useState("chat");
  const [mode, setMode] = useState("fast");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [thinkingTimes, setThinkingTimes] = useState({});
  const thinkingStartRef = useRef(null);
  const lastAssistantIdRef = useRef(null);
  const chatsRef = useRef(chats);
  const abortRef = useRef(null);
  const summarizingRef = useRef(new Set());

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    const selectors = [
      ".conversation-stage",
      ".mobile-chat-area",
      ".claude-mobile-body",
      ".chatgpt-mobile-body",
      ".grok-mobile-body",
      ".gemini-ui-thread-shell",
      ".gemini-ui-mobile-thread",
    ];
    requestAnimationFrame(() => {
      for (const s of selectors) {
        const el = document.querySelector(s);
        if (el) el.scrollTop = el.scrollHeight;
      }
    });
  }, [activeChat?.id]);


  useEffect(() => {
    if (activeChat) {
      setMode(activeChat.mode || "fast");
    }
  }, [activeChat]);

  const handleNewChat = useCallback(() => {
    const chat = newChat();
    setChatMode(chat.id, mode);
    setInputValue("");
    setDrawerOpen(false);
  }, [newChat, mode, setChatMode]);

  const handleModeChange = useCallback((nextMode) => {
    setMode(nextMode);
    if (activeId) {
      setChatMode(activeId, nextMode);
    }
  }, [activeId, setChatMode]);

  const maybeSummarize = useCallback(async (chatId) => {
    if (summarizingRef.current.has(chatId)) return;
    const chat = chatsRef.current.find((c) => c.id === chatId);
    if (!chat) return;
    const total = chat.messages.length;
    if (total < 30) return;
    const covered = chat.summary?.coveredCount || 0;
    if (total - covered < 20) return;

    summarizingRef.current.add(chatId);
    try {
      const newCovered = total - 10;
      const toSummarize = chat.messages.slice(0, newCovered);
      const text = await generateSummary(settings, toSummarize);
      if (text) {
        updateChatSummary(chatId, { text, coveredCount: newCovered, generatedAt: Date.now() });
      }
    } finally {
      summarizingRef.current.delete(chatId);
    }
  }, [settings, updateChatSummary]);

  const runStream = useCallback(
    async (chatId, apiMessages) => {
      let buffer = "";
      let titleUpdated = false;
      thinkingStartRef.current = Date.now();

      const assistantId = addMessage(chatId, "assistant", "");
      lastAssistantIdRef.current = assistantId;

      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      await streamChatCompletion(
        { ...settings },
        apiMessages,
        (chunk) => {
          buffer += chunk;
          const displayBuffer = stripMemoryTags(buffer);
          updateLastAssistant(chatId, displayBuffer);
          if (!titleUpdated && displayBuffer.length > 20) {
            const parsed = parseStreamingInnerVoice(displayBuffer);
            const preview = parsed.reply || parsed.innerVoice || displayBuffer;
            if (preview.length > 0) {
              const currentChat = chatsRef.current.find((c) => c.id === chatId);
              if (!currentChat || currentChat.title === "新对话") {
                setChatTitle(chatId, preview.slice(0, 30).replace(/\n/g, " "));
              }
              titleUpdated = true;
            }
          }
          if (
            displayBuffer.includes("</inner-voice>") &&
            thinkingStartRef.current &&
            !thinkingTimes[assistantId]
          ) {
            const elapsed = Math.round((Date.now() - thinkingStartRef.current) / 1000);
            setThinkingTimes((prev) => ({ ...prev, [assistantId]: elapsed }));
            thinkingStartRef.current = null;
          }
        },
        (info) => {
          const newMemos = extractMemories(buffer);
          for (const mem of newMemos) addMemory(mem, "auto");
          if (info?.aborted) {
            const displayBuffer = stripMemoryTags(buffer);
            updateLastAssistant(chatId, displayBuffer + (displayBuffer ? "\n\n" : "") + "— 已停止");
          }
          setStreaming(false);
          abortRef.current = null;
          setTimeout(() => maybeSummarize(chatId), 200);
        },
        (err) => {
          console.error(err);
          const friendly = friendlyErrorMessage(err);
          const displayBuffer = stripMemoryTags(buffer);
          updateLastAssistant(chatId, displayBuffer ? `${displayBuffer}\n\n⚠️ ${friendly}` : `⚠️ ${friendly}`);
          if (assistantId) markMessage(chatId, assistantId, { error: true });
          setStreaming(false);
          abortRef.current = null;
        },
        controller.signal
      );
    },
    [settings, addMessage, updateLastAssistant, setChatTitle, addMemory, thinkingTimes, maybeSummarize, markMessage]
  );

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || streaming) return;

    if (!hasUsableApi(settings)) {
      setPage("settings");
      return;
    }

    let chatId = activeId;
    if (!chatId) {
      const chat = newChat(text.slice(0, 30));
      chatId = chat.id;
    }

    setChatMode(chatId, mode);
    addMessage(chatId, "user", text);
    setInputValue("");

    const baseChat = chatsRef.current.find((c) => c.id === chatId) || activeChat;
    const msgs = baseChat
      ? [...baseChat.messages, { role: "user", content: text }]
      : [{ role: "user", content: text }];
    const apiMessages = buildContextMessages(msgs, settings, memosText, {
      summary: baseChat?.summary,
    });

    await runStream(chatId, apiMessages);
  }, [
    inputValue,
    streaming,
    settings,
    activeId,
    activeChat,
    mode,
    memosText,
    newChat,
    addMessage,
    setChatMode,
    runStream,
  ]);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const handleRegenerate = useCallback(async () => {
    if (streaming || !activeId || !hasUsableApi(settings)) return;
    const chat = chatsRef.current.find((c) => c.id === activeId);
    if (!chat || chat.messages.length === 0) return;

    let lastAssistantIdx = -1;
    for (let i = chat.messages.length - 1; i >= 0; i--) {
      if (chat.messages[i].role === "assistant") { lastAssistantIdx = i; break; }
    }
    if (lastAssistantIdx === -1) return;

    const lastAssistant = chat.messages[lastAssistantIdx];
    truncateAfter(activeId, lastAssistant.id);

    const contextMessages = chat.messages.slice(0, lastAssistantIdx + 1);
    const apiMessages = buildContextMessages(contextMessages, settings, memosText, {
      summary: chat.summary,
      extraSystem: REGENERATE_DIRECTIVE,
    });
    await runStream(activeId, apiMessages);
  }, [streaming, activeId, settings, memosText, truncateAfter, runStream]);

  const handleEditAndResend = useCallback(async (msgId, newContent) => {
    if (streaming || !activeId || !hasUsableApi(settings)) return;
    const text = (newContent || "").trim();
    if (!text) return;
    const chat = chatsRef.current.find((c) => c.id === activeId);
    if (!chat) return;
    const idx = chat.messages.findIndex((m) => m.id === msgId);
    if (idx < 0 || chat.messages[idx].role !== "user") return;

    editMessage(activeId, msgId, text);
    truncateAfter(activeId, msgId);

    const trimmed = chat.messages.slice(0, idx);
    const nextMsgs = [...trimmed, { role: "user", content: text }];
    const apiMessages = buildContextMessages(nextMsgs, settings, memosText, {
      summary: chat.summary,
    });
    await runStream(activeId, apiMessages);
  }, [streaming, activeId, settings, memosText, editMessage, truncateAfter, runStream]);

  const handleRetryFailed = useCallback(async (assistantMsgId) => {
    if (streaming || !activeId || !hasUsableApi(settings)) return;
    const chat = chatsRef.current.find((c) => c.id === activeId);
    if (!chat) return;
    const idx = chat.messages.findIndex((m) => m.id === assistantMsgId);
    if (idx < 0) return;
    const failed = chat.messages[idx];
    if (failed.role !== "assistant") return;

    const contextMessages = chat.messages.slice(0, idx);
    truncateAfter(activeId, contextMessages[contextMessages.length - 1]?.id);
    const apiMessages = buildContextMessages(contextMessages, settings, memosText, {
      summary: chat.summary,
    });
    await runStream(activeId, apiMessages);
  }, [streaming, activeId, settings, memosText, truncateAfter, runStream]);

  const handleAssistantFeedback = useCallback((msgId, feedback) => {
    if (!activeId) return;
    const chat = chatsRef.current.find((c) => c.id === activeId);
    if (!chat) return;
    const msg = chat.messages.find((item) => item.id === msgId);
    if (!msg || msg.role !== "assistant") return;
    const nextFeedback = msg.feedback === feedback ? null : feedback;
    markMessage(activeId, msgId, { feedback: nextFeedback });
  }, [activeId, markMessage]);

  if (!chatsLoaded || !memLoaded || !settings) {
    return <div className="loading-screen">加载中...</div>;
  }

  if (!settings.onboarded) {
    return (
      <OnboardingModal
        initialSettings={settings}
        onFinish={async (final) => {
          await saveSettings(final);
          setSettings(final);
        }}
      />
    );
  }

  const currentMode = activeChat?.mode || mode;
  const skin = SKINS[settings.skin] || SKINS.deepseek;
  const isDoubao = settings.skin === "doubao";
  const isGemini = settings.skin === "gemini";
  const isDeepSeek = settings.skin === "deepseek";
  const isClaude = settings.skin === "claude";
  const isChatGPT = settings.skin === "chatgpt";
  const isGrok = settings.skin === "grok";
  const isDark = settings.theme === "dark";
  const cssVars = {
    "--bg": isDark ? "#1a1a2e" : isDoubao ? "#fdfdfd" : isGemini ? "#f7f8fc" : isClaude ? "#f4f0e8" : isChatGPT ? "#ffffff" : isGrok ? "#ffffff" : "#ffffff",
    "--sidebar": isDark ? "#16162a" : isDoubao ? "#fafafa" : isGemini ? "#f4f6fb" : isClaude ? "#edeae0" : isChatGPT ? "#f9f9f9" : isGrok ? "#fafafa" : "#f8f8f9",
    "--text": isDark ? "#e2e2ef" : isClaude ? "#2d2723" : isChatGPT ? "#0d0d0d" : isGrok ? "#0a0a0a" : "#202939",
    "--line": isDark ? "#2a2a44" : isDoubao ? "#f2f3f5" : isGemini ? "#e8ebf2" : isClaude ? "#e6dfd0" : isChatGPT ? "#ececec" : isGrok ? "#e5e5e5" : "#f0f1f4",
    "--brand": skin.brand,
    "--brand-soft": skin.brandSoft,
    "--chat-font-size": `${settings.fontSize}px`,
    "--bubble-radius": "18px",
  };
  const logoText = skin.logoText;
  const appShellClassName = `app-shell skin-${settings.skin} theme-${settings.theme}${isGemini && drawerOpen ? " gemini-panel-open" : ""}`;

  if (page === "settings") {
    return (
      <div className="settings-shell" style={cssVars}>
        <SettingsPage
          onBack={() => setPage("chat")}
          onSaved={setSettings}
          memories={memories}
          onAddMemory={addMemory}
          onUpdateMemory={updateMemory}
          onRemoveMemory={removeMemory}
          onClearMemories={clearMemories}
        />
      </div>
    );
  }

  const composerPlaceholder = isGemini
    ? "问问 Gemini"
    : isClaude
    ? "向 Claude 提问..."
    : isChatGPT
    ? "询问任何问题"
    : isGrok
    ? "Ask Grok anything..."
    : `发消息给 ${logoText}...`;
  const sharedSidebarProps = {
    chats,
    activeId,
    onSelect: selectChat,
    onDelete: deleteChat,
    onNewChat: handleNewChat,
    onSettings: () => setPage("settings"),
    onTogglePin: togglePinChat,
    logoText,
    userName: settings.userName,
  };

  const desktopViewProps = {
    chat: activeChat,
    mode: currentMode,
    setMode: handleModeChange,
    thinkingTimes,
    streaming,
    onDeleteMessage: deleteMessage,
    onRegenerate: handleRegenerate,
    onEditUserMessage: handleEditAndResend,
    onRetryFailed: handleRetryFailed,
    onAssistantFeedback: handleAssistantFeedback,
    userName: settings.userName,
    thinkingExpanded: settings.thinkingExpanded,
  };

  const mobileViewProps = {
    chat: activeChat,
    mode: currentMode,
    setDrawerOpen,
    thinkingTimes,
    streaming,
    onDeleteMessage: deleteMessage,
    onRegenerate: handleRegenerate,
    onEditUserMessage: handleEditAndResend,
    onRetryFailed: handleRetryFailed,
    onAssistantFeedback: handleAssistantFeedback,
    userName: settings.userName,
    thinkingExpanded: settings.thinkingExpanded,
  };

  const composerProps = {
    mode: currentMode,
    setMode: handleModeChange,
    onSend: handleSend,
    onStop: handleStop,
    inputValue,
    setInputValue,
    streaming,
    sendKey: settings.sendKey || "enter",
    placeholder: composerPlaceholder,
    hasChat: Boolean(activeChat),
  };

  return (
    <div className={appShellClassName} style={cssVars}>
      {isGemini ? (
        <GeminiDesktopSidebar
          open={drawerOpen}
          chats={chats}
          activeId={activeId}
          onSelect={selectChat}
          onNewChat={handleNewChat}
          onSettings={() => setPage("settings")}
          onToggle={setDrawerOpen}
        />
      ) : isClaude ? (
        <ClaudeSidebar {...sharedSidebarProps} />
      ) : isChatGPT ? (
        <ChatGPTSidebar {...sharedSidebarProps} />
      ) : isGrok ? (
        <GrokSidebar {...sharedSidebarProps} />
      ) : isDoubao ? (
        <DoubaoSidebar {...sharedSidebarProps} />
      ) : isDeepSeek ? (
        <DefaultSidebar {...sharedSidebarProps} />
      ) : (
        <GenericSidebar {...sharedSidebarProps} />
      )}

      {isGemini ? (
        <GeminiMobileSidebar
          open={drawerOpen}
          chats={chats}
          activeId={activeId}
          onSelect={selectChat}
          onNewChat={handleNewChat}
          onSettings={() => setPage("settings")}
          onClose={() => setDrawerOpen(false)}
        />
      ) : isClaude ? (
        <ClaudeSidebar
          {...sharedSidebarProps}
          mobile
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSettings={() => {
            setPage("settings");
            setDrawerOpen(false);
          }}
        />
      ) : isChatGPT ? (
        <ChatGPTSidebar
          {...sharedSidebarProps}
          mobile
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSettings={() => {
            setPage("settings");
            setDrawerOpen(false);
          }}
        />
      ) : isGrok ? (
        <GrokSidebar
          {...sharedSidebarProps}
          mobile
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSettings={() => {
            setPage("settings");
            setDrawerOpen(false);
          }}
        />
      ) : isDoubao ? (
        <DoubaoSidebar
          {...sharedSidebarProps}
          mobile
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSettings={() => {
            setPage("settings");
            setDrawerOpen(false);
          }}
        />
      ) : isDeepSeek ? (
        <DefaultSidebar
          {...sharedSidebarProps}
          mobile
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSettings={() => {
            setPage("settings");
            setDrawerOpen(false);
          }}
        />
      ) : (
        <GenericSidebar
          {...sharedSidebarProps}
          mobile
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSettings={() => {
            setPage("settings");
            setDrawerOpen(false);
          }}
        />
      )}

      <main className="main-panel">
        <div className="desktop-only">
          {isGemini ? (
            <GeminiDesktopView {...desktopViewProps} />
          ) : isClaude ? (
            <ClaudeDesktopView {...desktopViewProps} />
          ) : isChatGPT ? (
            <ChatGPTDesktopView {...desktopViewProps} />
          ) : isGrok ? (
            <GrokDesktopView {...desktopViewProps} />
          ) : isDoubao ? (
            <DoubaoDesktopView {...desktopViewProps} />
          ) : isDeepSeek ? (
            <DefaultDesktopView {...desktopViewProps} />
          ) : (
            <GenericDesktopView {...desktopViewProps} logoText={logoText} />
          )}
        </div>

        <div className="mobile-only">
          {isGemini ? (
            <GeminiMobileView {...mobileViewProps} />
          ) : isClaude ? (
            <ClaudeMobileView {...mobileViewProps} />
          ) : isChatGPT ? (
            <ChatGPTMobileView {...mobileViewProps} setMode={handleModeChange} />
          ) : isGrok ? (
            <GrokMobileView {...mobileViewProps} setMode={handleModeChange} />
          ) : isDoubao ? (
            <DoubaoMobileView {...mobileViewProps} />
          ) : isDeepSeek ? (
            <DefaultMobileView {...mobileViewProps} />
          ) : (
            <GenericMobileView {...mobileViewProps} />
          )}
        </div>

        {isGemini ? (
          <GeminiComposer {...composerProps} />
        ) : isClaude ? (
          <ClaudeComposer {...composerProps} />
        ) : isChatGPT ? (
          <ChatGPTComposer {...composerProps} />
        ) : isGrok ? (
          <GrokComposer {...composerProps} />
        ) : isDoubao ? (
          <DoubaoComposer {...composerProps} />
        ) : isDeepSeek ? (
          <DefaultComposer {...composerProps} />
        ) : (
          <GenericComposer {...composerProps} />
        )}
      </main>
    </div>
  );
}

export default App;
