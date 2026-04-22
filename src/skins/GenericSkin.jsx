import {
  AudioLines,
  Bot,
  Menu,
  Paperclip,
  Search,
  SendHorizonal,
  Zap,
} from "lucide-react";
import { CommonSidebar, MessageBubble } from "./shared";

export { CommonSidebar as GenericSidebar };

export function GenericDesktopView({
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
  logoText,
  thinkingExpanded,
}) {
  if (!chat) {
    return (
      <section className="empty-state">
        <div className="empty-inner">
          <div className="empty-brand">
            <Bot className="brand-icon large" strokeWidth={2} />
            <span>{logoText || "AI 助手"}已准备就绪</span>
          </div>

          <div className="mode-switch">
            <button
              className={mode === "fast" ? "mode-pill active" : "mode-pill"}
              onClick={() => setMode("fast")}
            >
              <Zap className="mini-icon" strokeWidth={2} />
              快速模式
            </button>
            <button
              className={mode === "expert" ? "mode-pill active" : "mode-pill"}
              onClick={() => setMode("expert")}
            >
              <Search className="mini-icon" strokeWidth={2} />
              专家模式
            </button>
          </div>
        </div>
      </section>
    );
  }

  const lastIdx = chat.messages.length - 1;
  return (
    <section className="desktop-chat">
      <div className="conversation-stage">
        {chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="default"
            isLastAssistant={msg.role === "assistant" && idx === lastIdx}
            streaming={streaming}
            onDelete={onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined}
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

export function GenericMobileView({
  chat,
  mode,
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
    <section className="mobile-preview">
      <header className="mobile-topbar">
        <button
          className="mobile-icon"
          onClick={() => setDrawerOpen(true)}
          aria-label="打开菜单"
        >
          <Menu className="mini-icon" strokeWidth={2} />
        </button>
        <div className="mobile-title">
          <p>{chat ? chat.title : "新对话"}</p>
          <div className="mode-inline center">
            <Zap className="mini-icon" strokeWidth={2} />
            <span>{mode === "fast" ? "快速模式" : "专家模式"}</span>
          </div>
        </div>
        <button className="mobile-icon add" aria-label="打开菜单" onClick={() => setDrawerOpen(true)}>
          <Menu className="mini-icon" strokeWidth={2} />
        </button>
      </header>

      <div className="mobile-chat-area">
        {chat
          ? chat.messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                prev={chat.messages[idx - 1]}
                thinkingTime={thinkingTimes[msg.id]}
                variant="default"
                isLastAssistant={msg.role === "assistant" && idx === lastIdx}
                streaming={streaming}
                onDelete={onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined}
                onRegenerate={onRegenerate}
                onEdit={onEditUserMessage}
                onRetry={onRetryFailed}
                onFeedback={onAssistantFeedback}
                userName={userName}
                thinkingExpanded={thinkingExpanded}
              />
            ))
          : null}
      </div>
    </section>
  );
}

export function GenericComposer({
  mode,
  setMode,
  onSend,
  inputValue,
  setInputValue,
  streaming,
  sendKey,
  placeholder,
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
    <footer className="composer-wrap composer-root">
      <div className="composer">
        <textarea
          className="composer-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "发消息..."}
          rows={1}
          disabled={false}
        />

        <div className="composer-bottom">
          <div className="composer-tags">
            <button
              className={mode === "expert" ? "tag-chip active" : "tag-chip"}
              onClick={() => setMode("expert")}
            >
              <Zap className="mini-icon" strokeWidth={2} />
              深度思考
            </button>
            <button
              className={mode === "fast" ? "tag-chip active" : "tag-chip"}
              onClick={() => setMode("fast")}
            >
              <Search className="mini-icon" strokeWidth={2} />
              智能搜索
            </button>
          </div>

          <div className="composer-actions">
            <button className="composer-icon composer-desktop-attach" aria-label="附件">
              <Paperclip className="action-icon" strokeWidth={1.8} />
            </button>
            <button className="composer-icon composer-mobile-plus" aria-label="附件">
              <Paperclip className="action-icon" strokeWidth={1.8} />
            </button>
            {canSend ? (
              <button className="composer-icon send" aria-label="发送" onClick={onSend}>
                <SendHorizonal className="action-icon" strokeWidth={1.8} />
              </button>
            ) : (
              <button className="composer-icon mobile-voice" aria-label="语音">
                <AudioLines className="action-icon" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="composer-note">内容由 AI 生成，请仔细甄别</p>
    </footer>
  );
}
