import {
  ChevronDown,
  Globe,
  Menu,
  Mic,
  Paperclip,
  Plus,
  Search,
  Settings,
  SendHorizonal,
  Sparkles,
  SquarePen,
  Telescope,
  Zap,
  ArrowUp,
} from "lucide-react";
import { groupChats, MessageBubble } from "./shared";

function GrokLogo({ size = 20 }) {
  return (
    <svg
      className="grok-logo-svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3.5 3h3.4l6.4 8.3L18.9 3h1.9l-6.2 8.5L21 21h-3.4l-5.8-7.7L6.2 21H4.3l6.8-9.4L3.5 3Zm3.2 1.4 7.2 9.3 5.5-7.4h-.9L14 13.2l-6.4-8.3h-.9Z" />
    </svg>
  );
}

function getModelLabel(mode) {
  return mode === "expert" ? "Grok 3 Think" : "Grok 3";
}

function GrokModelPill({ mode, setMode }) {
  const label = getModelLabel(mode);
  const next = mode === "expert" ? "fast" : "expert";
  return (
    <button
      className="grok-model-pill"
      onClick={() => setMode(next)}
      aria-label="切换模型"
    >
      <span className="grok-model-label">{label}</span>
      <ChevronDown className="mini-icon" strokeWidth={1.8} />
    </button>
  );
}

function GrokSidebarInner({
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
      <div className="grok-sidebar-head">
        <div className="grok-brand">
          <GrokLogo size={18} />
          <span className="grok-brand-text">Grok</span>
        </div>
        <button className="grok-icon-btn" onClick={onSettings} aria-label="设置">
          <Settings className="mini-icon" strokeWidth={1.8} />
        </button>
      </div>

      <button className="grok-new-chat" onClick={onNewChat}>
        <SquarePen className="mini-icon" strokeWidth={1.9} />
        <span>新对话</span>
      </button>

      <nav className="grok-nav">
        <button className="grok-nav-item">
          <Search className="mini-icon" strokeWidth={1.8} />
          <span>搜索对话</span>
        </button>
        <button className="grok-nav-item">
          <Telescope className="mini-icon" strokeWidth={1.8} />
          <span>DeepSearch</span>
        </button>
      </nav>

      <div className="grok-history-wrap">
        {groups.length === 0 ? (
          <p className="grok-history-empty">还没有对话</p>
        ) : (
          groups.map((group) => (
            <section key={group.title} className="grok-history-group">
              <p className="grok-history-title">{group.title}</p>
              <div className="grok-history-list">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={
                      activeId === item.id
                        ? "grok-history-item active"
                        : "grok-history-item"
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

      <div className="grok-sidebar-foot">
        <button className="grok-user" onClick={onSettings}>
          <div className="grok-user-avatar">
            {userName ? userName[0] : "U"}
          </div>
          <div className="grok-user-meta">
            <span className="grok-user-name">{userName || "用户"}</span>
            <span className="grok-user-plan">Free · xAI</span>
          </div>
        </button>
      </div>
    </>
  );
}

export function GrokSidebar(props) {
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
          className={open ? "mobile-drawer grok open" : "mobile-drawer grok"}
        >
          <GrokSidebarInner {...props} onAfterSelect={onClose} />
        </aside>
      </>
    );
  }

  return (
    <aside className="sidebar grok">
      <GrokSidebarInner {...props} />
    </aside>
  );
}

export function GrokDesktopView({
  chat,
  mode,
  setMode,
  thinkingTimes,
  streaming,
  onDeleteMessage,
  onRegenerate,
  onEditUserMessage,
  onRetryFailed,
  userName,
  thinkingExpanded,
}) {
  if (!chat) {
    return (
      <section className="grok-empty-desktop">
        <header className="grok-desktop-topbar">
          <GrokModelPill mode={mode} setMode={setMode} />
          <div className="grok-topbar-right">
            <div className="grok-avatar-sm" title={userName || "用户"}>
              {userName ? userName[0] : "U"}
            </div>
          </div>
        </header>
        <div className="grok-empty-inner">
          <div className="grok-empty-logo">
            <GrokLogo size={46} />
          </div>
          <h1 className="grok-empty-title">
            {userName ? `${userName}，想聊点什么？` : "想聊点什么？"}
          </h1>
        </div>
      </section>
    );
  }

  const lastIdx = chat.messages.length - 1;
  return (
    <section className="grok-desktop-chat">
      <header className="grok-desktop-topbar">
        <GrokModelPill mode={mode} setMode={setMode} />
        <div className="grok-topbar-right">
          <div className="grok-avatar-sm" title={userName || "用户"}>
            {userName ? userName[0] : "U"}
          </div>
        </div>
      </header>
      <div className="conversation-stage grok">
        {chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="grok"
            isLastAssistant={msg.role === "assistant" && idx === lastIdx}
            streaming={streaming}
            onDelete={
              onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined
            }
            onRegenerate={onRegenerate}
            onEdit={onEditUserMessage}
            onRetry={onRetryFailed}
            userName={userName}
            thinkingExpanded={thinkingExpanded}
          />
        ))}
      </div>
    </section>
  );
}

export function GrokMobileView({
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
  userName,
  thinkingExpanded,
}) {
  const lastIdx = chat ? chat.messages.length - 1 : -1;

  return (
    <section className="grok-mobile-view">
      <header className="grok-mobile-topbar">
        <button
          className="mobile-icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
        >
          <Menu className="mini-icon" strokeWidth={2} />
        </button>
        <GrokModelPill mode={mode} setMode={setMode} />
        <button
          className="mobile-icon"
          aria-label="新对话"
          onClick={() => setDrawerOpen(true)}
        >
          <SquarePen className="mini-icon" strokeWidth={1.8} />
        </button>
      </header>

      <div className="grok-mobile-body">
        {!chat ? (
          <div className="grok-empty-mobile">
            <div className="grok-empty-logo">
              <GrokLogo size={40} />
            </div>
            <h1 className="grok-empty-title mobile">
              {userName ? `${userName}，想聊点什么？` : "想聊点什么？"}
            </h1>
          </div>
        ) : (
          <div className="grok-mobile-thread">
            {chat.messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                prev={chat.messages[idx - 1]}
                thinkingTime={thinkingTimes[msg.id]}
                variant="grok"
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

export function GrokComposer({
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
    <footer className={`composer-root ${hasChat ? "grok-composer with-chat" : "grok-composer empty"}`}>
      <div className="grok-composer-card">
        <textarea
          className="grok-composer-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "Ask Grok anything..."}
          rows={1}
          disabled={false}
        />

        <div className="grok-composer-bottom">
          <div className="grok-composer-left">
            <button className="grok-composer-icon" aria-label="附件">
              <Paperclip className="action-icon" strokeWidth={1.8} />
            </button>
            <button className="grok-tool-chip">
              <Telescope className="mini-icon" strokeWidth={1.8} />
              <span>DeepSearch</span>
            </button>
            <button
              className={
                mode === "expert"
                  ? "grok-tool-chip active"
                  : "grok-tool-chip"
              }
              onClick={() => setMode(mode === "expert" ? "fast" : "expert")}
            >
              <Zap className="mini-icon" strokeWidth={1.8} />
              <span>Think</span>
            </button>
          </div>

          <div className="grok-composer-right">
            <button
              className={canSend ? "grok-send-btn active" : "grok-send-btn"}
              aria-label={canSend ? "发送" : "语音输入"}
              onClick={canSend ? onSend : undefined}
              disabled={!canSend && streaming}
            >
              {canSend ? (
                <ArrowUp className="action-icon" strokeWidth={2.2} />
              ) : (
                <Mic className="action-icon" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>
      </div>
      {!hasChat && (
        <p className="grok-empty-footnote">
          Grok 会讲真话，偶尔也会讲错话。请自行核实。
        </p>
      )}
    </footer>
  );
}
