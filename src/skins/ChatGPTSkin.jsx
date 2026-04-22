import {
  ChevronDown,
  Library,
  Menu,
  Mic,
  Paperclip,
  Plus,
  Search,
  Settings,
  Sparkles,
  SquarePen,
  ArrowUp,
} from "lucide-react";
import { groupChats, MessageBubble } from "./shared";

function ChatGPTLogo({ size = 20 }) {
  return (
    <svg
      className="chatgpt-logo-svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M22.28 9.82a5.99 5.99 0 0 0-.52-4.92 6.06 6.06 0 0 0-6.53-2.9A6 6 0 0 0 4.98 4.18a5.99 5.99 0 0 0-4 2.9 6.07 6.07 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.93 6.06 6.06 0 0 0 6.53 2.9A6 6 0 0 0 19.02 19.8a5.98 5.98 0 0 0 4-2.9 6.07 6.07 0 0 0-.74-7.09Zm-9.06 12.67a4.5 4.5 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.78.78 0 0 0 .4-.68V11.2l2.02 1.17c.02.01.04.03.05.06v5.58a4.5 4.5 0 0 1-4.5 4.5Zm-9.67-4.14a4.5 4.5 0 0 1-.54-3.03l.14.09 4.79 2.77a.78.78 0 0 0 .78 0l5.85-3.38v2.33a.08.08 0 0 1-.03.06L9.7 20.02a4.5 4.5 0 0 1-6.15-1.67Zm-1.26-10.45a4.5 4.5 0 0 1 2.35-1.98v5.68a.77.77 0 0 0 .39.67l5.83 3.36-2.03 1.17a.08.08 0 0 1-.07 0l-4.84-2.79a4.5 4.5 0 0 1-1.63-6.11Zm16.62 3.87L13.07 8.41l2.02-1.17a.08.08 0 0 1 .07 0l4.84 2.8a4.5 4.5 0 0 1-.68 8.08v-5.67a.78.78 0 0 0-.4-.68Zm2.02-3.04-.14-.09-4.78-2.78a.78.78 0 0 0-.79 0L9.27 9.24V6.91a.08.08 0 0 1 .03-.06L14.14 4a4.5 4.5 0 0 1 6.7 4.64ZM8.17 13.47l-2.02-1.17a.08.08 0 0 1-.05-.06V6.67a4.5 4.5 0 0 1 7.38-3.46l-.14.08-4.78 2.76a.78.78 0 0 0-.4.68Zm1.1-2.37L11.88 9.6l2.6 1.5v3l-2.6 1.5-2.61-1.5Z" />
    </svg>
  );
}

function getModelLabel(mode) {
  return mode === "expert" ? "ChatGPT o3" : "ChatGPT 4o";
}

function ChatGPTModelPill({ mode, setMode }) {
  const label = getModelLabel(mode);
  const next = mode === "expert" ? "fast" : "expert";
  return (
    <button
      className="chatgpt-model-pill"
      onClick={() => setMode(next)}
      aria-label="切换模型"
    >
      <span className="chatgpt-model-label">{label}</span>
      <ChevronDown className="mini-icon" strokeWidth={1.8} />
    </button>
  );
}

function ChatGPTSidebarInner({
  chats,
  activeId,
  onSelect,
  onNewChat,
  onSettings,
  onAfterSelect,
  userName,
}) {
  const groups = groupChats(chats);

  return (
    <>
      <div className="chatgpt-sidebar-head">
        <button className="chatgpt-side-icon" aria-label="折叠侧栏">
          <ChatGPTLogo size={22} />
        </button>
        <div className="chatgpt-sidebar-head-right">
          <button
            className="chatgpt-side-icon"
            aria-label="搜索"
          >
            <Search className="mini-icon" strokeWidth={1.8} />
          </button>
          <button
            className="chatgpt-side-icon"
            onClick={onNewChat}
            aria-label="新对话"
          >
            <SquarePen className="mini-icon" strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <button className="chatgpt-new-chat" onClick={onNewChat}>
        <ChatGPTLogo size={16} />
        <span>新聊天</span>
      </button>

      <nav className="chatgpt-nav">
        <button className="chatgpt-nav-item">
          <Library className="mini-icon" strokeWidth={1.8} />
          <span>图库</span>
        </button>
        <button className="chatgpt-nav-item">
          <Sparkles className="mini-icon" strokeWidth={1.8} />
          <span>探索 GPT</span>
        </button>
      </nav>

      <div className="chatgpt-history-wrap">
        {groups.length === 0 ? (
          <p className="chatgpt-history-empty">还没有对话</p>
        ) : (
          groups.map((group) => (
            <section key={group.title} className="chatgpt-history-group">
              <p className="chatgpt-history-title">{group.title}</p>
              <div className="chatgpt-history-list">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={
                      activeId === item.id
                        ? "chatgpt-history-item active"
                        : "chatgpt-history-item"
                    }
                    onClick={() => {
                      onSelect(item.id);
                      onAfterSelect?.();
                    }}
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <div className="chatgpt-sidebar-foot">
        <button className="chatgpt-user" onClick={onSettings}>
          <div className="chatgpt-user-avatar">
            {userName ? userName[0] : "U"}
          </div>
          <div className="chatgpt-user-meta">
            <span className="chatgpt-user-name">{userName || "用户"}</span>
            <span className="chatgpt-user-plan">Free</span>
          </div>
          <Settings className="mini-icon" strokeWidth={1.8} />
        </button>
      </div>
    </>
  );
}

export function ChatGPTSidebar(props) {
  const { mobile, open, onClose } = props;

  if (mobile) {
    return (
      <>
        {open ? (
          <button
            className="drawer-backdrop"
            onClick={onClose}
            aria-label="关闭侧边栏"
          />
        ) : null}
        <aside
          className={
            open ? "mobile-drawer chatgpt open" : "mobile-drawer chatgpt"
          }
        >
          <ChatGPTSidebarInner {...props} onAfterSelect={onClose} />
        </aside>
      </>
    );
  }

  return (
    <aside className="sidebar chatgpt">
      <ChatGPTSidebarInner {...props} />
    </aside>
  );
}

export function ChatGPTDesktopView({
  chat,
  mode,
  setMode,
  thinkingTimes,
  streaming,
  onDeleteMessage,
  onRegenerate,
  onEditUserMessage,
  onRetryFailed,
  onAssistantFeedback,
  userName,
  thinkingExpanded,
}) {
  if (!chat) {
    return (
      <section className="chatgpt-empty-desktop">
        <header className="chatgpt-desktop-topbar">
          <ChatGPTModelPill mode={mode} setMode={setMode} />
          <div className="chatgpt-topbar-right">
            <div
              className="chatgpt-avatar-sm"
              title={userName || "用户"}
            >
              {userName ? userName[0] : "U"}
            </div>
          </div>
        </header>
        <div className="chatgpt-empty-inner">
          <h1 className="chatgpt-empty-title">
            {userName ? `${userName}，有什么能帮您？` : "有什么能帮您？"}
          </h1>
        </div>
      </section>
    );
  }

  const lastIdx = chat.messages.length - 1;
  return (
    <section className="chatgpt-desktop-chat">
      <header className="chatgpt-desktop-topbar">
        <ChatGPTModelPill mode={mode} setMode={setMode} />
        <div className="chatgpt-topbar-right">
          <div
            className="chatgpt-avatar-sm"
            title={userName || "用户"}
          >
            {userName ? userName[0] : "U"}
          </div>
        </div>
      </header>
      <div className="conversation-stage chatgpt">
        {chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="chatgpt"
            isLastAssistant={msg.role === "assistant" && idx === lastIdx}
            streaming={streaming}
            onDelete={
              onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined
            }
            onRegenerate={onRegenerate}
            onEdit={onEditUserMessage}
            onRetry={onRetryFailed}
            onFeedback={onAssistantFeedback}
            userName={userName}
            thinkingExpanded={thinkingExpanded}
          />
        ))}
      </div>
    </section>
  );
}

export function ChatGPTMobileView({
  chat,
  mode,
  setMode,
  setDrawerOpen,
  thinkingTimes,
  streaming,
  onDeleteMessage,
  onRegenerate,
  onEditUserMessage,
  onRetryFailed,
  onAssistantFeedback,
  userName,
  thinkingExpanded,
}) {
  const lastIdx = chat ? chat.messages.length - 1 : -1;

  return (
    <section className="chatgpt-mobile-view">
      <header className="chatgpt-mobile-topbar">
        <button
          className="mobile-icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
        >
          <Menu className="mini-icon" strokeWidth={2} />
        </button>
        <ChatGPTModelPill mode={mode} setMode={setMode} />
        <button
          className="mobile-icon"
          aria-label="新对话"
          onClick={() => setDrawerOpen(true)}
        >
          <SquarePen className="mini-icon" strokeWidth={1.8} />
        </button>
      </header>

      <div className="chatgpt-mobile-body">
        {!chat ? (
          <div className="chatgpt-empty-mobile">
            <div className="chatgpt-empty-logo">
              <ChatGPTLogo size={36} />
            </div>
            <h1 className="chatgpt-empty-title mobile">
              {userName ? `${userName}，有什么能帮您？` : "有什么能帮您？"}
            </h1>
          </div>
        ) : (
          <div className="chatgpt-mobile-thread">
            {chat.messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                prev={chat.messages[idx - 1]}
                thinkingTime={thinkingTimes[msg.id]}
                variant="chatgpt"
                isLastAssistant={msg.role === "assistant" && idx === lastIdx}
                streaming={streaming}
                onDelete={
                  onDeleteMessage
                    ? () => onDeleteMessage(chat.id, msg.id)
                    : undefined
                }
                onRegenerate={onRegenerate}
                onEdit={onEditUserMessage}
                onRetry={onRetryFailed}
                onFeedback={onAssistantFeedback}
                userName={userName}
                thinkingExpanded={thinkingExpanded}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function ChatGPTComposer({
  mode,
  setMode,
  onSend,
  inputValue,
  setInputValue,
  streaming,
  sendKey,
  placeholder,
  hasChat,
}) {
  const handleKey = (e) => {
    if (sendKey === "ctrl-enter") {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (!streaming && inputValue.trim()) onSend();
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!streaming && inputValue.trim()) onSend();
    }
  };

  const canSend = !streaming && inputValue.trim();

  return (
    <footer className={`composer-root ${hasChat ? "chatgpt-composer with-chat" : "chatgpt-composer empty"}`}>
      <div className="chatgpt-composer-card">
        <textarea
          className="chatgpt-composer-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "询问任何问题"}
          rows={1}
          disabled={false}
        />

        <div className="chatgpt-composer-bottom">
          <div className="chatgpt-composer-left">
            <button className="chatgpt-composer-icon" aria-label="附件">
              <Plus className="action-icon" strokeWidth={1.8} />
            </button>
            <button
              className={
                mode === "expert"
                  ? "chatgpt-tool-chip active"
                  : "chatgpt-tool-chip"
              }
              onClick={() => setMode(mode === "expert" ? "fast" : "expert")}
            >
              <Sparkles className="mini-icon" strokeWidth={1.8} />
              <span>推理</span>
            </button>
            <button className="chatgpt-tool-chip">
              <Search className="mini-icon" strokeWidth={1.8} />
              <span>搜索</span>
            </button>
            <button className="chatgpt-composer-icon hide-on-narrow" aria-label="附件">
              <Paperclip className="action-icon" strokeWidth={1.8} />
            </button>
          </div>

          <div className="chatgpt-composer-right">
            {canSend ? (
              <button
                className="chatgpt-send-btn"
                aria-label="发送"
                onClick={onSend}
              >
                <ArrowUp className="action-icon" strokeWidth={2.2} />
              </button>
            ) : (
              <button
                className="chatgpt-send-btn disabled"
                aria-label="语音输入"
                disabled
              >
                <Mic className="action-icon" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </div>
      {!hasChat && (
        <p className="chatgpt-empty-footnote">
          ChatGPT 可能会犯错。请核查重要信息。
        </p>
      )}
    </footer>
  );
}
