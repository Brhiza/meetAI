import {
  BookOpen,
  ChevronDown,
  CirclePlus,
  MessageSquarePlus,
  Menu,
  Paperclip,
  Search,
  SendHorizonal,
  Settings,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { groupChats, MessageBubble } from "./shared";

function ClaudeStar({ size = 18 }) {
  return (
    <svg
      className="claude-star"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "夜深了";
  if (hour < 12) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜深了";
}

function ClaudeSidebarInner({
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
      <div className="claude-sidebar-head">
        <div className="claude-brand">
          <ClaudeStar size={20} />
          <span className="claude-brand-text">Claude</span>
        </div>
        <button className="claude-icon-btn" onClick={onSettings} aria-label="设置">
          <Settings className="mini-icon" strokeWidth={1.8} />
        </button>
      </div>

      <button className="claude-new-chat" onClick={onNewChat}>
        <MessageSquarePlus className="mini-icon" strokeWidth={1.9} />
        <span>新对话</span>
      </button>

      <nav className="claude-nav">
        <button className="claude-nav-item">
          <Search className="mini-icon" strokeWidth={1.8} />
          <span>搜索对话</span>
        </button>
        <button className="claude-nav-item">
          <BookOpen className="mini-icon" strokeWidth={1.8} />
          <span>项目</span>
        </button>
      </nav>

      <div className="claude-history-wrap">
        {groups.length === 0 ? (
          <p className="claude-history-empty">还没有对话</p>
        ) : (
          groups.map((group) => (
            <section key={group.title} className="claude-history-group">
              <p className="claude-history-title">{group.title}</p>
              <div className="claude-history-list">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={
                      activeId === item.id
                        ? "claude-history-item active"
                        : "claude-history-item"
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

      <div className="claude-sidebar-foot">
        <div className="claude-user">
          <div className="claude-user-avatar">
            {userName ? userName[0] : "U"}
          </div>
          <div className="claude-user-meta">
            <span className="claude-user-name">{userName || "用户"}</span>
            <span className="claude-user-plan">Free plan</span>
          </div>
          <ChevronDown className="mini-icon" strokeWidth={1.8} />
        </div>
      </div>
    </>
  );
}

export function ClaudeSidebar(props) {
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
            open ? "mobile-drawer claude open" : "mobile-drawer claude"
          }
        >
          <ClaudeSidebarInner
            {...props}
            onAfterSelect={onClose}
            onSettings={() => {
              props.onSettings?.();
            }}
            onNewChat={() => {
              props.onNewChat?.();
            }}
          />
        </aside>
      </>
    );
  }

  return (
    <aside className="sidebar claude">
      <ClaudeSidebarInner {...props} />
    </aside>
  );
}

function ClaudeModePill({ mode, setMode }) {
  const label = mode === "expert" ? "Opus 4" : "Sonnet 4";
  const next = mode === "expert" ? "fast" : "expert";
  return (
    <button
      className="claude-model-pill"
      onClick={() => setMode(next)}
      aria-label="切换模型"
    >
      <Sparkles className="mini-icon" strokeWidth={1.8} />
      <span>{label}</span>
      <ChevronDown className="mini-icon" strokeWidth={1.8} />
    </button>
  );
}

export function ClaudeDesktopView({
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
      <section className="claude-empty-desktop">
        <div className="claude-empty-inner">
          <div className="claude-empty-logo">
            <ClaudeStar size={44} />
          </div>
          <h1 className="claude-empty-title">
            {getGreeting()}
            {userName ? `，${userName}` : ""}
          </h1>
        </div>
      </section>
    );
  }

  const lastIdx = chat.messages.length - 1;
  return (
    <section className="claude-desktop-chat">
      <header className="claude-desktop-topbar">
        <div className="claude-desktop-title">
          <ClaudeStar size={15} />
          <ClaudeModePill mode={mode} setMode={setMode} />
        </div>
      </header>
      <div className="conversation-stage claude">
        {chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="claude"
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

export function ClaudeMobileView({
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
    <section className="claude-mobile-view">
      <header className="claude-mobile-topbar">
        <button
          className="mobile-icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
        >
          <Menu className="mini-icon" strokeWidth={2} />
        </button>
        <div className="claude-mobile-title">
          <ClaudeStar size={15} />
          <span>{chat ? "Claude" : "Claude"}</span>
          <ChevronDown className="mini-icon" strokeWidth={1.8} />
        </div>
        <button
          className="mobile-icon"
          aria-label="新对话"
          onClick={() => setDrawerOpen(true)}
        >
          <MessageSquarePlus className="mini-icon" strokeWidth={1.8} />
        </button>
      </header>

      <div className="claude-mobile-body">
        {!chat ? (
          <div className="claude-empty-mobile">
            <div className="claude-empty-logo">
              <ClaudeStar size={40} />
            </div>
            <h1 className="claude-empty-title mobile">
              {getGreeting()}
              {userName ? `，${userName}` : ""}
            </h1>
          </div>
        ) : (
          <div className="claude-mobile-thread">
            {chat.messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                prev={chat.messages[idx - 1]}
                thinkingTime={thinkingTimes[msg.id]}
                variant="claude"
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

export function ClaudeComposer({
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
    <footer className={`composer-root ${hasChat ? "claude-composer with-chat" : "claude-composer empty"}`}>
      <div className="claude-composer-card">
        <textarea
          className="claude-composer-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "向 Claude 提问..."}
          rows={1}
          disabled={false}
        />

        <div className="claude-composer-bottom">
          <div className="claude-composer-left">
            <button className="claude-composer-icon" aria-label="附件">
              <Paperclip className="action-icon" strokeWidth={1.8} />
            </button>
            <button
              className={
                mode === "expert"
                  ? "claude-tool-chip active"
                  : "claude-tool-chip"
              }
              onClick={() => setMode(mode === "expert" ? "fast" : "expert")}
            >
              <Zap className="mini-icon" strokeWidth={1.8} />
              <span>深度思考</span>
            </button>
            <button className="claude-tool-chip">
              <Search className="mini-icon" strokeWidth={1.8} />
              <span>网络搜索</span>
            </button>
          </div>

          <div className="claude-composer-right">
            <ClaudeModePill mode={mode} setMode={setMode} />
            <button
              className={
                canSend ? "claude-send-btn active" : "claude-send-btn"
              }
              aria-label="发送"
              onClick={canSend ? onSend : undefined}
              disabled={!canSend}
            >
              <SendHorizonal className="action-icon" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
      {!hasChat && (
        <p className="claude-empty-footnote">
          Claude 可能会犯错，请核对重要信息。
        </p>
      )}
    </footer>
  );
}
