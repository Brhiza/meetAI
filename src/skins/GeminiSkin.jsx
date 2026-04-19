import {
  AudioLines,
  ChevronRight,
  CirclePlus,
  Ellipsis,
  FileText,
  Menu,
  Search,
  SendHorizonal,
  Settings,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { MessageBubble } from "./shared";

const GEMINI_EMPTY_ACTIONS = [
  { icon: "🖼️", label: "制作图片" },
  { icon: "🎸", label: "创作音乐" },
  { icon: "💭", label: "随便写点什么" },
  { icon: "📚", label: "帮我学习" },
];

function GeminiHeader({ compact }) {
  return (
    <header className={compact ? "gemini-ui-header compact" : "gemini-ui-header"}>
      <div className="gemini-ui-title">Gemini</div>
      <div className="gemini-ui-header-actions">
        {!compact && <button className="gemini-ui-plus-badge">✦ 升级到 Google AI Plus</button>}
        <button className="sidebar-icon-btn" aria-label="窗口">
          <span className="gemini-frame-icon" />
        </button>
        <button className="sidebar-icon-btn gemini-avatar-btn" aria-label="头像">
          <span className="gemini-avatar">G</span>
        </button>
      </div>
    </header>
  );
}

function GeminiSidebarContent({ chats, activeId, onSelect, onNewChat, onSettings, onAfterSelect }) {
  const recentItems = chats.slice(0, 10);

  return (
    <div className="gemini-ui-sidebar-content">
      <div className="gemini-ui-sidebar-top">
        <button className="sidebar-icon-btn gemini-rail-btn" aria-label="搜索">
          <Search className="mini-icon" strokeWidth={1.8} />
        </button>
      </div>

      <button className="gemini-ui-sidebar-action" onClick={onNewChat}>
        <FileText className="mini-icon" strokeWidth={1.8} />
        <span>发起新对话</span>
      </button>

      <section className="gemini-ui-sidebar-section">
        <div className="gemini-ui-sidebar-row">
          <span>我的内容</span>
          <ChevronRight className="mini-icon" strokeWidth={1.8} />
        </div>
        <div className="gemini-ui-cards">
          {[1, 2, 3].map((item) => (
            <div key={item} className="gemini-ui-card">
              <span>无法加载图片</span>
              <span className="gemini-ui-card-mark">⊠</span>
            </div>
          ))}
        </div>
      </section>

      <section className="gemini-ui-sidebar-section">
        <div className="gemini-ui-sidebar-row">
          <span>笔记本</span>
          <ChevronRight className="mini-icon" strokeWidth={1.8} />
        </div>
        <button className="gemini-ui-sidebar-subaction">
          <CirclePlus className="mini-icon" strokeWidth={1.8} />
          <span>新建笔记本</span>
        </button>
      </section>

      <section className="gemini-ui-sidebar-section">
        <div className="gemini-ui-sidebar-row">
          <span>Gem</span>
          <ChevronRight className="mini-icon" strokeWidth={1.8} />
        </div>
      </section>

      <section className="gemini-ui-sidebar-section grow">
        <div className="gemini-ui-sidebar-label">对话</div>
        <div className="gemini-ui-history">
          {recentItems.length === 0 ? (
            <>
              <button className="gemini-ui-history-item">AI 生成图片辨别指南</button>
              <button className="gemini-ui-history-item">添加本地代理节点配置</button>
              <button className="gemini-ui-history-item">提取图片产品，参考图片2生成组图</button>
              <button className="gemini-ui-history-item">主体：苹果公司高管风格人像，身着极简</button>
            </>
          ) : (
            recentItems.map((item) => (
              <button
                key={item.id}
                className={activeId === item.id ? "gemini-ui-history-item active" : "gemini-ui-history-item"}
                onClick={() => {
                  onSelect(item.id);
                  onAfterSelect?.();
                }}
              >
                {item.title}
              </button>
            ))
          )}
        </div>
      </section>

      <button className="gemini-ui-sidebar-footer" onClick={onSettings}>
        <Settings className="mini-icon" strokeWidth={1.8} />
        <span>设置和帮助</span>
      </button>
    </div>
  );
}

export function GeminiDesktopSidebar({
  open,
  chats,
  activeId,
  onSelect,
  onNewChat,
  onSettings,
  onToggle,
}) {
  return (
    <>
      <aside className="sidebar gemini-ui-rail">
        <div className="gemini-ui-rail-top">
          <button
            className="sidebar-icon-btn gemini-rail-btn"
            aria-label={open ? "关闭菜单" : "打开菜单"}
            onClick={() => onToggle(!open)}
          >
            <Menu className="mini-icon" strokeWidth={1.8} />
          </button>
          <button className="sidebar-icon-btn gemini-rail-btn" onClick={onNewChat} aria-label="新建对话">
            <FileText className="mini-icon" strokeWidth={1.8} />
          </button>
        </div>
        <div className="gemini-ui-rail-bottom">
          <button className="sidebar-icon-btn gemini-rail-btn" onClick={onSettings} aria-label="设置">
            <Settings className="mini-icon" strokeWidth={1.8} />
          </button>
        </div>
      </aside>

      {open ? (
        <aside className="gemini-ui-sidebar-panel">
          <GeminiSidebarContent
            chats={chats}
            activeId={activeId}
            onSelect={onSelect}
            onNewChat={onNewChat}
            onSettings={onSettings}
          />
        </aside>
      ) : null}
    </>
  );
}

export function GeminiMobileSidebar({
  open,
  chats,
  activeId,
  onSelect,
  onNewChat,
  onSettings,
  onClose,
}) {
  return (
    <>
      {open ? (
        <button className="drawer-backdrop" onClick={onClose} aria-label="关闭侧边栏" />
      ) : null}
      <aside className={open ? "gemini-ui-mobile-sidebar open" : "gemini-ui-mobile-sidebar"}>
        <div className="gemini-ui-mobile-sidebar-top">
          <button className="sidebar-icon-btn gemini-rail-btn" aria-label="关闭菜单" onClick={onClose}>
            <Menu className="mini-icon" strokeWidth={1.8} />
          </button>
        </div>
        <GeminiSidebarContent
          chats={chats}
          activeId={activeId}
          onSelect={onSelect}
          onNewChat={() => {
            onNewChat();
            onClose();
          }}
          onSettings={() => {
            onSettings();
            onClose();
          }}
          onAfterSelect={onClose}
        />
      </aside>
    </>
  );
}

export function GeminiDesktopView({ chat, thinkingTimes, streaming, onDeleteMessage, onRegenerate, onEditUserMessage, onRetryFailed, userName, thinkingExpanded }) {
  if (!chat) {
    return (
      <section className="gemini-ui-desktop-view empty">
        <GeminiHeader />
        <div className="gemini-ui-empty-shell">
          <p className="gemini-empty-hello desktop">{userName ? `${userName}，你好` : "你好"}</p>
          <div className="empty-brand gemini">
            <span>需要我为你做些什么？</span>
          </div>
        </div>
      </section>
    );
  }

  const lastIdx = chat.messages.length - 1;
  return (
    <section className="gemini-ui-desktop-view with-chat">
      <GeminiHeader compact />
      <div className="gemini-ui-thread-shell">
        {chat.messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prev={chat.messages[idx - 1]}
            thinkingTime={thinkingTimes[msg.id]}
            variant="gemini"
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

export function GeminiMobileView({ chat, setDrawerOpen, thinkingTimes, streaming, onDeleteMessage, onRegenerate, onEditUserMessage, onRetryFailed, userName, thinkingExpanded }) {
  const lastIdx = chat ? chat.messages.length - 1 : -1;
  const greeting = userName ? `${userName}，你好` : "你好";

  return (
    <section className="gemini-ui-mobile-view">
      <header className="gemini-ui-mobile-header">
        <button className="mobile-icon" onClick={() => setDrawerOpen(true)} aria-label="打开菜单">
          <Menu className="mini-icon" strokeWidth={2} />
        </button>
        <div className="mobile-title gemini">
          <p>{chat ? chat.title : "Gemini"}</p>
        </div>
        {chat ? (
          <div className="mobile-top-actions gemini">
            <button className="mobile-icon" aria-label="编辑"><span className="gemini-edit-icon" /></button>
            <button className="mobile-icon" aria-label="分享"><Share2 className="mini-icon" strokeWidth={2} /></button>
            <button className="mobile-icon" aria-label="更多"><Ellipsis className="mini-icon" strokeWidth={2} /></button>
          </div>
        ) : (
          <div className="mobile-top-actions gemini">
            <button className="mobile-icon" aria-label="窗口"><span className="gemini-frame-icon" /></button>
            <button className="mobile-icon gemini-avatar-btn" aria-label="头像"><span className="gemini-avatar">G</span></button>
          </div>
        )}
      </header>

      <div className="gemini-ui-mobile-thread">
        {!chat ? (
          <section className="gemini-empty-mobile">
            <p className="gemini-empty-hello">{greeting}</p>
            <h2 className="gemini-empty-title">需要我为你做些什么？</h2>
            <div className="gemini-empty-actions">
              {GEMINI_EMPTY_ACTIONS.map((item) => (
                <button key={item.label} className="gemini-empty-chip">
                  <span className="gemini-empty-chip-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          chat.messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              prev={chat.messages[idx - 1]}
              thinkingTime={thinkingTimes[msg.id]}
              variant="gemini"
              isLastAssistant={msg.role === "assistant" && idx === lastIdx}
              streaming={streaming}
              onDelete={onDeleteMessage ? () => onDeleteMessage(chat.id, msg.id) : undefined}
              onRegenerate={onRegenerate}
              onEdit={onEditUserMessage}
              onRetry={onRetryFailed}
              userName={userName}
              thinkingExpanded={thinkingExpanded}
            />
          ))
        )}
      </div>
    </section>
  );
}

export function GeminiComposer({
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
    <footer className={`composer-root ${hasChat ? "gemini-ui-composer with-chat" : "gemini-ui-composer empty"}`}>
      <div className="gemini-ui-composer-card">
        <textarea
          className="gemini-ui-composer-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder || "问问 Gemini"}
          rows={1}
          disabled={false}
        />
        <div className="gemini-ui-composer-bottom">
          <div className="gemini-ui-composer-left">
            <button className="composer-icon gemini-plain" aria-label="更多工具">
              <CirclePlus className="action-icon" strokeWidth={1.8} />
            </button>
            <button className="composer-icon gemini-plain" aria-label="工具">
              <SlidersHorizontal className="action-icon" strokeWidth={1.8} />
            </button>
            {!hasChat && <span className="gemini-tools-label">工具</span>}
          </div>
          <div className="gemini-ui-composer-right">
            <button className={mode === "fast" ? "gemini-mode-chip active" : "gemini-mode-chip"} onClick={() => setMode("fast")}>
              快速
            </button>
            <button className="composer-icon gemini-circle" aria-label="语音">
              <AudioLines className="action-icon" strokeWidth={1.8} />
            </button>
            {canSend ? (
              <button className="composer-icon gemini-send" aria-label="发送" onClick={onSend}>
                <SendHorizonal className="action-icon" strokeWidth={2} />
              </button>
            ) : (
              <button className="composer-icon gemini-circle" aria-label="Gemini 动作">
                <Sparkles className="action-icon" strokeWidth={1.8} />
              </button>
            )}
          </div>
        </div>
      </div>

      {!hasChat && (
        <div className="gemini-ui-prompts">
          <button className="gemini-empty-chip desktop"><span className="gemini-empty-chip-icon">🖼️</span><span>制作图片</span></button>
          <button className="gemini-empty-chip desktop"><span className="gemini-empty-chip-icon">🎸</span><span>创作音乐</span></button>
          <button className="gemini-empty-chip desktop"><span className="gemini-empty-chip-icon">💭</span><span>给我的一天注入活力</span></button>
          <button className="gemini-empty-chip desktop"><span className="gemini-empty-chip-icon">📚</span><span>帮我学习</span></button>
          <button className="gemini-empty-chip desktop"><span className="gemini-empty-chip-icon">💭</span><span>随便写点什么</span></button>
        </div>
      )}
    </footer>
  );
}
