import {
  ArrowLeft,
  ChevronRight,
  Code2,
  Ellipsis,
  FileText,
  Image,
  Languages,
  PanelLeft,
  Paperclip,
  Phone,
  SquarePen,
  Link2,
  VolumeX,
  Search,
  SendHorizonal,
  Settings,
  Sparkles,
  Zap,
  AudioLines,
} from "lucide-react";
import { CommonSidebar, MessageBubble, groupChats } from "./shared";

function DoubaoDesktopTopbar({ title, subtitle }) {
  return (
    <header className="doubao-desktop-topbar">
      <div className="doubao-topbar-side left">
        <button className="doubao-topbar-btn" aria-label="折叠侧边栏">
          <PanelLeft className="mini-icon" strokeWidth={1.9} />
        </button>
        <button className="doubao-topbar-btn" aria-label="编辑标题">
          <SquarePen className="mini-icon" strokeWidth={1.9} />
        </button>
      </div>

      <div className="doubao-topbar-title">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="doubao-topbar-side right">
        <button className="doubao-topbar-btn" aria-label="通话">
          <Phone className="mini-icon" strokeWidth={1.9} />
        </button>
        <button className="doubao-topbar-btn" aria-label="复制链接">
          <Link2 className="mini-icon" strokeWidth={1.9} />
        </button>
      </div>
    </header>
  );
}

export function DoubaoSidebar(props) {
  const {
    chats,
    activeId,
    onSelect,
    onDelete,
    onNewChat,
    onSettings,
    mobile,
    open,
    onClose,
    logoText,
    userName,
  } = props;
  const groups = groupChats(chats);

  return (
    <>
      {mobile && open ? (
        <button className="drawer-backdrop" onClick={onClose} aria-label="关闭侧边栏" />
      ) : null}
      <aside className={mobile ? `mobile-drawer${open ? " open" : ""} doubao` : "sidebar doubao"}>
        <div>
          <div className="sidebar-brand">
            <div className="brand-logo">
              <div className="doubao-avatar">豆</div>
              <span className="logo-text">{logoText || "豆包"}</span>
            </div>
            <div className="sidebar-brand-actions">
              <button className="sidebar-icon-btn" aria-label="折叠侧边栏">
                <PanelLeft className="mini-icon" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <div className="sidebar-nav">
            <button className="sidebar-nav-item active" onClick={onNewChat}>
              <div className="sidebar-nav-left">
                <Search className="mini-icon" strokeWidth={1.8} />
                <span>AI 浏览器</span>
              </div>
              <ChevronRight className="mini-icon" strokeWidth={1.8} />
            </button>
            <button className="sidebar-nav-item">
              <div className="sidebar-nav-left">
                <Image className="mini-icon" strokeWidth={1.8} />
                <span>AI 创作</span>
              </div>
              <ChevronRight className="mini-icon" strokeWidth={1.8} />
            </button>
            <button className="sidebar-nav-item">
              <div className="sidebar-nav-left">
                <Code2 className="mini-icon" strokeWidth={1.8} />
                <span>应用生成</span>
              </div>
              <ChevronRight className="mini-icon" strokeWidth={1.8} />
            </button>
            <button className="sidebar-nav-item">
              <div className="sidebar-nav-left">
                <FileText className="mini-icon" strokeWidth={1.8} />
                <span>云盘</span>
              </div>
              <ChevronRight className="mini-icon" strokeWidth={1.8} />
            </button>
            <button className="sidebar-nav-item">
              <div className="sidebar-nav-left">
                <Ellipsis className="mini-icon" strokeWidth={1.8} />
                <span>更多</span>
              </div>
              <ChevronRight className="mini-icon" strokeWidth={1.8} />
            </button>
          </div>

          <div className="history-wrap">
            <p className="doubao-history-caption">历史对话</p>
            {groups.length === 0 && <p className="history-empty-hint">暂无对话</p>}
            {groups.map((group) => (
              <section key={group.title} className="history-group">
                <p className="history-title">{group.title}</p>
                <div className="history-list">
                  {group.items.map((item) => (
                    <div key={item.id} className={activeId === item.id ? "history-item active" : "history-item"}>
                      <button
                        className="history-item-text"
                        onClick={() => {
                          onSelect(item.id);
                          if (mobile) onClose?.();
                        }}
                      >
                        <span>{item.title}</span>
                      </button>
                      {activeId === item.id && (
                        <button className="history-item-delete" onClick={() => onDelete(item.id)} aria-label="删除对话">
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <button className="sidebar-footer-profile" onClick={onSettings}>
            <div className="sidebar-footer-avatar">{userName?.[0] || "普"}</div>
            <span>{userName || "普通用户"}</span>
          </button>
          <div className="sidebar-footer-actions">
            <button className="sidebar-icon-btn" onClick={onSettings} aria-label="设置">
              <Settings className="mini-icon" strokeWidth={1.8} />
            </button>
            <button className="sidebar-icon-btn" aria-label="礼物">
              <Sparkles className="mini-icon" strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function DoubaoDesktopView({ chat, thinkingTimes, streaming, onDeleteMessage, onRegenerate, onEditUserMessage, onRetryFailed, userName, thinkingExpanded }) {
  if (!chat) {
    return (
      <section className="empty-state doubao">
        <DoubaoDesktopTopbar title="新对话" subtitle="内容由豆包 AI 生成" />
        <div className="empty-inner doubao">
          <div className="empty-brand doubao">
            <span>有什么我能帮你的吗？</span>
          </div>
        </div>
      </section>
    );
  }

  const lastIdx = chat.messages.length - 1;
  return (
    <section className="desktop-chat doubao">
      <DoubaoDesktopTopbar title={chat.title} subtitle="内容由豆包 AI 生成" />
      <div className="conversation-stage">
        {chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="doubao"
            isLastAssistant={msg.role === "assistant" && idx === lastIdx}
            streaming={streaming}
            onDelete={onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined}
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

export function DoubaoMobileView({ chat, setDrawerOpen, thinkingTimes, streaming, onDeleteMessage, onRegenerate, onEditUserMessage, onRetryFailed, userName, thinkingExpanded }) {
  const lastIdx = chat ? chat.messages.length - 1 : -1;
  return (
    <section className="mobile-preview doubao">
      <header className="mobile-topbar doubao">
        <button className="mobile-icon doubao-back" onClick={() => setDrawerOpen(true)} aria-label="打开菜单">
          <ArrowLeft className="mini-icon" strokeWidth={2.2} />
        </button>
        <div className="mobile-title">
          <p>{chat ? chat.title : "新对话"}</p>
          <span className="mobile-subtitle">内容由豆包 AI 生成</span>
        </div>
        <div className="mobile-top-actions">
          <button className="mobile-icon" aria-label="通话">
            <Phone className="mini-icon" strokeWidth={2} />
          </button>
          <button className="mobile-icon" aria-label="静音">
            <VolumeX className="mini-icon" strokeWidth={2} />
          </button>
        </div>
      </header>
      <div className="mobile-chat-area">
        {chat ? chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="doubao"
            isLastAssistant={msg.role === "assistant" && idx === lastIdx}
            streaming={streaming}
            onDelete={onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined}
            onRegenerate={onRegenerate}
            onEdit={onEditUserMessage}
            onRetry={onRetryFailed}
            userName={userName}
            thinkingExpanded={thinkingExpanded}
          />
        )) : null}
      </div>
    </section>
  );
}

export function DoubaoComposer({ mode, setMode, onSend, inputValue, setInputValue, streaming, sendKey, placeholder }) {
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
    <footer className="composer-wrap doubao composer-root">
      <div className="composer doubao">
        <div className="doubao-tool-row">
          <div className="composer-tags doubao">
            <button
              className={mode === "fast" ? "tag-chip doubao-tag active" : "tag-chip doubao-tag"}
              onClick={() => setMode("fast")}
            >
              <Zap className="mini-icon" strokeWidth={2} />快捷
            </button>
            <button className="tag-chip doubao-tag"><Sparkles className="mini-icon" strokeWidth={2} />AI 创作</button>
            <button className="tag-chip doubao-tag"><Image className="mini-icon" strokeWidth={2} />豆包 P 图</button>
            <button
              className={mode === "expert" ? "tag-chip doubao-tag active" : "tag-chip doubao-tag"}
              onClick={() => setMode("expert")}
            >
              <Search className="mini-icon" strokeWidth={2} />深入研究
            </button>
            <button className="tag-chip doubao-tag desktop-doubao-only"><Languages className="mini-icon" strokeWidth={2} />翻译</button>
            <button className="tag-chip doubao-tag desktop-doubao-only"><FileText className="mini-icon" strokeWidth={2} />PPT 生成</button>
            <button className="tag-chip doubao-tag desktop-doubao-only"><Sparkles className="mini-icon" strokeWidth={2} />帮我写作</button>
            <button className="tag-chip doubao-tag desktop-doubao-only"><Code2 className="mini-icon" strokeWidth={2} />编程</button>
            <button className="tag-chip doubao-tag desktop-doubao-only"><Ellipsis className="mini-icon" strokeWidth={2} />更多</button>
          </div>
        </div>

        <div className="doubao-input-row">
          <textarea
            className="composer-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder || "发消息给 豆包..."}
            rows={1}
            disabled={false}
          />

          <div className="composer-actions doubao-input-actions">
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
              <button className="composer-icon doubao-voice" aria-label="语音">
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

export const fallbackSidebar = CommonSidebar;
