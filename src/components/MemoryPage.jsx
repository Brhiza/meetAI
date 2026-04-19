import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Brain } from "lucide-react";

export default function MemoryPage({ memories, onAdd, onUpdate, onRemove, onClear, onBack }) {
  const [adding, setAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (mem) => {
    setEditingId(mem.id);
    setEditContent(mem.content);
  };

  const saveEdit = (id) => {
    if (editContent.trim()) {
      onUpdate(id, editContent.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleAdd = () => {
    if (newContent.trim()) {
      onAdd(newContent.trim(), "manual");
      setNewContent("");
      setAdding(false);
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="settings-back" onClick={onBack} aria-label="返回">
          <X size={18} />
        </button>
        <h2>记忆</h2>
        {memories.length > 0 && (
          <button className="mem-clear-btn" onClick={onClear}>清空全部</button>
        )}
      </header>

      <div className="mem-intro">
        <Brain size={16} />
        <span>这些是关于你的记忆，会在每次对话中作为上下文发送给模型。模型也会在对话中自动记录新发现。</span>
      </div>

      <div className="mem-list">
        {memories.length === 0 && !adding && (
          <p className="mem-empty">还没有记忆，手动添加或通过对话自动积累</p>
        )}

        {memories.map((mem) => (
          <div key={mem.id} className="mem-item">
            {editingId === mem.id ? (
              <div className="mem-edit-row">
                <input
                  className="mem-edit-input"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit(mem.id);
                    if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                />
                <button className="mem-action save" onClick={() => saveEdit(mem.id)} aria-label="保存">
                  <Check size={14} />
                </button>
                <button className="mem-action" onClick={cancelEdit} aria-label="取消">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="mem-content">
                  <span className={`mem-source ${mem.source}`}>{mem.source === "auto" ? "自动" : "手动"}</span>
                  {mem.content}
                </div>
                <div className="mem-actions">
                  <button className="mem-action" onClick={() => startEdit(mem)} aria-label="编辑">
                    <Pencil size={12} />
                  </button>
                  <button className="mem-action del" onClick={() => onRemove(mem.id)} aria-label="删除">
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {adding ? (
          <div className="mem-add-row">
            <input
              className="mem-add-input"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setAdding(false);
              }}
              placeholder="输入一条记忆..."
              autoFocus
            />
            <button className="mem-action save" onClick={handleAdd} aria-label="添加">
              <Check size={14} />
            </button>
            <button className="mem-action" onClick={() => { setAdding(false); setNewContent(""); }} aria-label="取消">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button className="mem-add-btn" onClick={() => setAdding(true)}>
            <Plus size={14} />
            手动添加记忆
          </button>
        )}
      </div>
    </div>
  );
}
