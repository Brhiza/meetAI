import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Bot,
  CirclePlus,
  Copy,
  Pencil,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Volume2,
} from "lucide-react";
import InnerVoiceBlock from "../components/InnerVoiceBlock";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { parseStreamingInnerVoice, stripMemoryTags } from "../services/api";

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(d) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatDateLabel(d) {
  const now = new Date();
  if (sameDay(d, now)) return "今天";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "昨天";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  if (y === now.getFullYear()) return `${m} 月 ${dd} 日`;
  return `${y} 年 ${m} 月 ${dd} 日`;
}

export function groupChats(chats) {
  const now = Date.now();
  const day = 86400000;
  const today = [];
  const month = [];
  const older = [];

  for (const c of chats) {
    const diff = now - c.createdAt;
    if (diff < day) today.push(c);
    else if (diff < 30 * day) month.push(c);
    else older.push(c);
  }

  const groups = [];
  if (today.length) groups.push({ title: "今天", items: today });
  if (month.length) groups.push({ title: "30 天内", items: month });
  if (older.length) groups.push({ title: "更早", items: older });
  return groups;
}

export function CommonSidebar({
  chats,
  activeId,
  onSelect,
  onDelete,
  onNewChat,
  onSettings,
  onTogglePin,
  mobile,
  open,
  onClose,
  logoText,
  userName,
}) {
  const groups = groupChats(chats);
  const [itemMenu, setItemMenu] = useState(null);
  const [query, setQuery] = useState("");

  const filteredGroups = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    const match = (c) => {
      if (c.title?.toLowerCase().includes(q)) return true;
      return c.messages?.some((m) => (m.content || "").toLowerCase().includes(q));
    };
    return groups
      .map((g) => ({ ...g, items: g.items.filter(match) }))
      .filter((g) => g.items.length > 0);
  })();

  const openItemMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const menuItems = [
      {
        label: item.pinned ? "取消置顶" : "置顶",
        icon: item.pinned ? PinOff : Pin,
        onClick: () => { onTogglePin?.(item.id); setItemMenu(null); },
      },
      { divider: true },
      {
        label: "删除对话",
        icon: Trash2,
        danger: true,
        onClick: () => { onDelete(item.id); setItemMenu(null); },
      },
    ];
    setItemMenu({ x: e.clientX, y: e.clientY, items: menuItems });
  };

  return (
    <>
      {mobile && open ? (
        <button className="drawer-backdrop" onClick={onClose} aria-label="关闭侧边栏" />
      ) : null}
      <aside className={mobile ? `mobile-drawer${open ? " open" : ""}` : "sidebar"}>
        <div>
          <div className="sidebar-brand">
            <div className="brand-logo">
              <Bot className="brand-icon" strokeWidth={2} />
              <span className="logo-text">{logoText || "deepseek"}</span>
            </div>
            <div className="sidebar-brand-actions">
              <button className="sidebar-icon-btn" onClick={onSettings} aria-label="设置">
                <Settings className="mini-icon" strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <button className="new-chat-btn" onClick={onNewChat}>
            <CirclePlus className="mini-icon" strokeWidth={1.8} />
            开启新对话
          </button>

          <div className="sidebar-search">
            <Search className="mini-icon" strokeWidth={1.8} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索对话"
              className="sidebar-search-input"
            />
          </div>

          <div className="history-wrap">
            {filteredGroups.length === 0 && <p className="history-empty-hint">{query ? "没有找到" : "暂无对话"}</p>}
            {filteredGroups.map((group) => (
              <section key={group.title} className="history-group">
                <p className="history-title">{group.title}</p>
                <div className="history-list">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={activeId === item.id ? "history-item active" : "history-item"}
                      onContextMenu={(e) => openItemMenu(e, item)}
                    >
                      <button
                        className="history-item-text"
                        onClick={() => {
                          onSelect(item.id);
                          if (mobile) onClose?.();
                        }}
                      >
                        <span>{item.pinned ? "📌 " : ""}{item.title}</span>
                      </button>
                      {activeId === item.id && (
                        <button
                          className="history-item-delete"
                          onClick={() => onDelete(item.id)}
                          aria-label="删除对话"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">
            {userName ? userName[0] : <Bot size={12} />}
          </div>
          <span className="user-name">{userName || "用户"}</span>
        </div>
      </aside>
      {itemMenu && <ContextMenu {...itemMenu} onClose={() => setItemMenu(null)} />}
    </>
  );
}

function ContextMenu({ x, y, items, onClose }) {
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ x, y });
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x;
    let ny = y;
    if (x + rect.width > vw - 8) nx = vw - rect.width - 8;
    if (y + rect.height > vh - 8) ny = vh - rect.height - 8;
    if (nx < 8) nx = 8;
    if (ny < 8) ny = 8;
    setPos({ x: nx, y: ny });
  }, [x, y]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      onCloseRef.current();
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    const handleContextMenu = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      e.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return createPortal(
    <div className="ctx-menu" ref={menuRef} style={{ top: pos.y, left: pos.x }}>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="ctx-menu-divider" />
        ) : (
          <button key={i} className={`ctx-menu-item${item.danger ? " danger" : ""}`} onClick={item.onClick}>
            {item.icon && <item.icon size={13} />}
            {item.label}
          </button>
        )
      )}
    </div>,
    document.body
  );
}

export function MessageBubble({
  msg,
  prev,
  thinkingTime,
  variant,
  isLastAssistant,
  onDelete,
  onRegenerate,
  onEdit,
  onRetry,
  streaming,
  thinkingExpanded,
  userName,
}) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const longPressTimer = useRef(null);
  const longPressed = useRef(false);
  const scrollAnchorRef = useRef(null);
  const isDoubao = variant === "doubao";
  const isGemini = variant === "gemini";
  const displayContent = msg.role === "assistant" ? stripMemoryTags(msg.content || "") : "";
  const parsedAssistant = msg.role === "assistant" ? parseStreamingInnerVoice(displayContent) : null;
  const innerVoice = parsedAssistant?.innerVoice || "";
  const reply = parsedAssistant?.reply || "";
  const thinking = parsedAssistant?.thinking || false;
  const done = parsedAssistant?.done || false;

  useEffect(() => {
    if (!streaming || !isLastAssistant) return;
    const anchor = scrollAnchorRef.current;
    if (!anchor) return;
    const container = anchor.closest(
      ".conversation-stage, .mobile-chat-area, .claude-mobile-body, .chatgpt-mobile-body, .grok-mobile-body, .gemini-ui-thread-shell, .gemini-ui-mobile-thread"
    );
    if (container) {
      const distFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      if (distFromBottom > 160) return;
    }
    anchor.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [streaming, isLastAssistant, innerVoice, reply]);

  const showDateSeparator = useMemo(() => {
    if (!msg.createdAt) return null;
    const d = new Date(msg.createdAt);
    const prevDate = prev?.createdAt ? new Date(prev.createdAt) : null;
    if (prevDate && sameDay(prevDate, d)) return null;
    return formatDateLabel(d);
  }, [msg.createdAt, prev?.createdAt]);

  const timeLabel = msg.createdAt ? formatTime(new Date(msg.createdAt)) : "";
  const userInitial = (userName && userName.trim()[0]) || "我";

  const startEdit = () => {
    setEditValue(msg.content);
    setEditing(true);
    setCtxMenu(null);
  };

  const submitEdit = () => {
    const text = editValue.trim();
    if (!text) return;
    onEdit?.(msg.id, text);
    setEditing(false);
  };

  const buildMenuItems = (clientX, clientY) => {
    const items = [];
    if (msg.role === "user") {
      items.push({ label: "复制", icon: Copy, onClick: () => { navigator.clipboard.writeText(msg.content); setCtxMenu(null); } });
      if (onEdit && !streaming) {
        items.push({ label: "编辑重问", icon: Pencil, onClick: startEdit });
      }
    } else {
      if (reply) {
        items.push({ label: "复制回复", icon: Copy, onClick: () => { navigator.clipboard.writeText(reply); setCtxMenu(null); } });
      }
      if (innerVoice) {
        items.push({ label: "复制心声", icon: Copy, onClick: () => { navigator.clipboard.writeText(innerVoice); setCtxMenu(null); } });
      }
      if (displayContent) {
        items.push({ label: "复制全文", icon: Copy, onClick: () => { navigator.clipboard.writeText(displayContent); setCtxMenu(null); } });
      }
      if (onRegenerate && isLastAssistant && !streaming) {
        items.push({ divider: true });
        items.push({ label: "让它重新回答", icon: RotateCcw, onClick: () => { onRegenerate(); setCtxMenu(null); } });
      }
    }
    if (onDelete) {
      items.push({ divider: true });
      items.push({ label: "删除消息", icon: Trash2, onClick: () => { onDelete(); setCtxMenu(null); }, danger: true });
    }
    return { x: clientX, y: clientY, items };
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu(buildMenuItems(e.clientX, e.clientY));
  };

  const handleTouchStart = (e) => {
    longPressed.current = false;
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      const cx = Math.min(Math.max(touch.clientX, 40), window.innerWidth - 40);
      const cy = Math.min(Math.max(touch.clientY, 40), window.innerHeight - 40);
      setCtxMenu(buildMenuItems(cx, cy));
    }, 500);
  };

  const handleTouchMove = () => clearTimeout(longPressTimer.current);
  const handleTouchEnd = () => clearTimeout(longPressTimer.current);
  const handleBubbleClick = () => {
    if (longPressed.current) longPressed.current = false;
  };

  if (msg.role === "user") {
    if (editing) {
      return (
        <div className="user-bubble-row">
          <div className="user-bubble user-bubble-editing">
            <textarea
              className="user-bubble-edit-input"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={Math.min(8, Math.max(2, editValue.split("\n").length))}
              autoFocus
            />
            <div className="user-bubble-edit-actions">
              <button className="user-bubble-edit-cancel" onClick={() => setEditing(false)}>取消</button>
              <button className="user-bubble-edit-save" onClick={submitEdit}>发送</button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <>
        {showDateSeparator && (
          <div className="date-separator"><span>{showDateSeparator}</span></div>
        )}
        <div className="user-bubble-row" onContextMenu={handleContextMenu} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={handleBubbleClick}>
          <div className="user-bubble" title={userName ? `${userName}${timeLabel ? " · " + timeLabel : ""}` : timeLabel}>
            {msg.content}
          </div>
          {timeLabel && <span className="msg-time user">{timeLabel}</span>}
        </div>
        {ctxMenu && <ContextMenu {...ctxMenu} onClose={() => setCtxMenu(null)} />}
      </>
    );
  }

  const isStreaming = streaming && isLastAssistant;
  const showThinkingBlock = isStreaming && !innerVoice && !reply;
  const showActions = isGemini ? Boolean(reply) && !isStreaming : done && !isStreaming;

  return (
    <>
      {showDateSeparator && (
        <div className="date-separator"><span>{showDateSeparator}</span></div>
      )}
      <div className={msg.error ? "assistant-block has-error" : "assistant-block"} onContextMenu={handleContextMenu} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onClick={handleBubbleClick}>
        {(innerVoice || showThinkingBlock) && (
          <InnerVoiceBlock
            text={innerVoice || ""}
            thinking={isStreaming ? !innerVoice : thinking}
            thinkingDone={done}
            thinkingTime={thinkingTime}
            variant={variant}
            defaultExpanded={thinkingExpanded}
          />
        )}

        <div className={isGemini && (innerVoice || showThinkingBlock) ? "assistant-answer no-prefix" : "assistant-answer"}>
          {reply ? <MarkdownRenderer content={reply} /> : ((isStreaming || thinking) && <span className="streaming-cursor">▍</span>)}
        </div>

        {msg.error && onRetry && !streaming && (
          <div className="msg-retry-row">
            <button className="msg-retry-btn" onClick={() => onRetry(msg.id)}>
              <RotateCcw size={13} /> 重试
            </button>
          </div>
        )}

        {showActions && (
          <div className="answer-actions">
            {isDoubao ? (
              <>
                <button aria-label="复制" onClick={() => navigator.clipboard.writeText(reply)}>
                  <Copy className="action-icon" strokeWidth={1.8} />
                </button>
                <button aria-label="朗读"><Volume2 className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="收藏"><Bookmark className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="分享"><Share2 className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="重试"><RotateCcw className="action-icon" strokeWidth={1.8} /></button>
              </>
            ) : isGemini ? (
              <>
                <button aria-label="点赞"><ThumbsUp className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="点踩"><ThumbsDown className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="重试"><RotateCcw className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="复制" onClick={() => navigator.clipboard.writeText(reply)}>
                  <Copy className="action-icon" strokeWidth={1.8} />
                </button>
                <button aria-label="更多"><Sparkles className="action-icon" strokeWidth={1.8} /></button>
              </>
            ) : (
              <>
                <button aria-label="复制" onClick={() => navigator.clipboard.writeText(reply)}>
                  <Copy className="action-icon" strokeWidth={1.8} />
                </button>
                <button
                  aria-label="重试"
                  onClick={() => isLastAssistant && onRegenerate?.()}
                  disabled={!isLastAssistant || !onRegenerate}
                >
                  <RotateCcw className="action-icon" strokeWidth={1.8} />
                </button>
                <button aria-label="点赞"><ThumbsUp className="action-icon" strokeWidth={1.8} /></button>
                <button aria-label="点踩"><ThumbsDown className="action-icon" strokeWidth={1.8} /></button>
              </>
            )}
          </div>
        )}
        {showActions && isGemini && <p className="gemini-answer-note">Gemini 是一款 AI 工具，其回答未必正确无误。</p>}
        {timeLabel && !msg.error && <span className="msg-time assistant">{timeLabel}</span>}
        <div ref={scrollAnchorRef} className="scroll-anchor" />
      </div>
      {ctxMenu && <ContextMenu {...ctxMenu} onClose={() => setCtxMenu(null)} />}
    </>
  );
}
