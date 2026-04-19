import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Palette, User, Globe, Brain, Plus, Pencil, Trash2, Check, X, RefreshCw, Cloud, Settings as SettingsIcon } from "lucide-react";
import { loadSettings, saveSettings } from "../services/settings";
import { SKINS } from "../services/skins";
import { fetchModels } from "../services/api";

const TABS = [
  { key: "skin", label: "皮肤", icon: Palette },
  { key: "persona", label: "人设", icon: User },
  { key: "memory", label: "记忆", icon: Brain },
  { key: "appearance", label: "外观", icon: Palette },
  { key: "api", label: "API", icon: Globe },
];

export const FORM_OPTIONS = [
  { key: "male", label: "男塑" },
  { key: "female", label: "女塑" },
  { key: "animal", label: "动物塑" },
];

export const AGE_OPTIONS = ["", "18以下", "18-25", "25-35", "35-50", "50+"];
export const ZODIAC_OPTIONS = ["", "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座", "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座"];
export const MBTI_OPTIONS = ["", "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP", "ISTJ", "ISTP", "ESTJ", "ESTP", "ISFJ", "ISFP", "ESFJ", "ESFP"];
export const CHAT_PREF_OPTIONS = [
  { key: "", label: "不填" },
  { key: "casual", label: "随意聊天" },
  { key: "formal", label: "正式交流" },
  { key: "bicker", label: "互怼逗趣" },
  { key: "deep", label: "深度探讨" },
];

export default function SettingsPage({ onBack, onSaved, memories, onAddMemory, onUpdateMemory, onRemoveMemory, onClearMemories }) {
  const [form, setForm] = useState(null);
  const [tab, setTab] = useState("skin");
  const [modelList, setModelList] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    loadSettings().then((s) => setForm({ ...s }));
  }, []);

  useEffect(() => {
    if (!form) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      await saveSettings(form);
      onSaved(form);
    }, 200);
    return () => clearTimeout(saveTimerRef.current);
  }, [form]);

  if (!form) return null;

  const set = (key) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const currentSkin = SKINS[form.skin] || SKINS.deepseek;

  return (
    <div className="settings-page">
      <header className="settings-header">
        <button className="settings-back" onClick={onBack} aria-label="返回">
          <ArrowLeft size={18} />
        </button>
        <h2>设置</h2>
      </header>

      <div className="settings-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            className={tab === key ? "settings-tab active" : "settings-tab"}
            onClick={() => setTab(key)}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="settings-body">
        {tab === "skin" && (
          <>
            <div className="field-label">选择皮肤</div>
            <div className="skin-grid">
              {Object.entries(SKINS).map(([key, skin]) => (
                <button
                  key={key}
                  className={form.skin === key ? "skin-card active" : "skin-card"}
                  onClick={() => set("skin")(key)}
                  style={{
                    "--card-brand": skin.brand,
                    "--card-brand-soft": skin.brandSoft,
                  }}
                >
                  <span className="skin-logo">{skin.logoText}</span>
                  <span
                    className="skin-dot"
                    style={{ background: skin.brand }}
                  />
                </button>
              ))}
            </div>

            <div className="field-label" style={{ marginTop: 20 }}>
              塑型
              <span className="field-sub">
                · {currentSkin.animal}
              </span>
            </div>
            <div className="form-picker">
              {FORM_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  className={form.form === key ? "form-option active" : "form-option"}
                  onClick={() => set("form")(key)}
                >
                  {label}
                  {key === "animal" && (
                    <span className="form-animal">({currentSkin.animal})</span>
                  )}
                </button>
              ))}
            </div>

            <label className="field-label" style={{ marginTop: 16 }}>
              自定义系统提示词（追加到默认提示词后）
              <textarea
                className="field-input field-textarea"
                value={form.systemPrompt}
                onChange={set("systemPrompt")}
                placeholder="可选，留空使用默认"
                rows={3}
              />
            </label>
          </>
        )}

        {tab === "persona" && (
          <>
            <div className="profile-card">
              <label className="field-label">
                称呼
                <input
                  className="field-input"
                  value={form.userName}
                  onChange={set("userName")}
                  placeholder="TA该怎么叫你"
                />
              </label>
              <div className="profile-row">
                <label className="field-label">
                  性别
                  <select className="field-select" value={form.userGender} onChange={set("userGender")}>
                    <option value="">不填</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                    <option value="其他">其他</option>
                  </select>
                </label>
                <label className="field-label">
                  年龄段
                  <select className="field-select" value={form.userAge} onChange={set("userAge")}>
                    {AGE_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v || "不填"}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="profile-row">
                <label className="field-label">
                  星座
                  <select className="field-select" value={form.userZodiac} onChange={set("userZodiac")}>
                    {ZODIAC_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v || "不填"}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  MBTI
                  <select className="field-select" value={form.userMbti} onChange={set("userMbti")}>
                    {MBTI_OPTIONS.map((v) => (
                      <option key={v} value={v}>{v || "不填"}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field-label">
                性格
                <input
                  className="field-input"
                  value={form.userPersonality}
                  onChange={set("userPersonality")}
                  placeholder="如：内向、慢热、固执"
                />
              </label>
              <label className="field-label">
                兴趣爱好
                <input
                  className="field-input"
                  value={form.userInterests}
                  onChange={set("userInterests")}
                  placeholder="如：编程、音乐、游戏"
                />
              </label>
              <div className="profile-row">
                <label className="field-label">
                  职业
                  <input
                    className="field-input"
                    value={form.userJob}
                    onChange={set("userJob")}
                    placeholder="如：程序员、学生"
                  />
                </label>
                <label className="field-label">
                  聊天偏好
                  <select className="field-select" value={form.chatPref} onChange={set("chatPref")}>
                    {CHAT_PREF_OPTIONS.map(({ key, label }) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field-label">
                补充说明
                <textarea
                  className="field-input field-textarea"
                  value={form.userCustom}
                  onChange={set("userCustom")}
                  placeholder="任何你想让TA知道的"
                  rows={3}
                />
              </label>
            </div>
            <p className="field-hint">
              人设信息会作为上下文发送给模型，TA会据此理解和回应你。
            </p>
          </>
        )}

        {tab === "memory" && (
          <>
            <div className="mem-intro">
              <Brain size={16} />
              <span>这些是关于你的记忆，会在每次对话中作为上下文发送。模型也会在对话中自动记录新发现。</span>
            </div>

            <MemoryList
              memories={memories}
              onAdd={onAddMemory}
              onUpdate={onUpdateMemory}
              onRemove={onRemoveMemory}
              onClear={onClearMemories}
            />
          </>
        )}

        {tab === "appearance" && (
          <>
            <div className="field-label">主题</div>
            <div className="theme-picker">
              <button
                className={form.theme === "light" ? "theme-swatch active" : "theme-swatch"}
                onClick={() => set("theme")("light")}
              >
                <span className="swatch-preview" style={{ background: "#fff", border: "1px solid #f0f1f4", color: "#1f2937" }}>
                  Aa
                </span>
                <span className="swatch-label">浅色</span>
              </button>
              <button
                className={form.theme === "dark" ? "theme-swatch active" : "theme-swatch"}
                onClick={() => set("theme")("dark")}
              >
                <span className="swatch-preview" style={{ background: "#1a1a2e", border: "1px solid #2a2a44", color: "#e2e2ef" }}>
                  Aa
                </span>
                <span className="swatch-label">深色</span>
              </button>
            </div>

            <div className="field-label" style={{ marginTop: 20 }}>
              字体大小：{form.fontSize}px
            </div>
            <input
              type="range"
              className="font-slider"
              min="12"
              max="20"
              step="1"
              value={form.fontSize}
              onChange={(e) => set("fontSize")(Number(e.target.value))}
            />
            <div className="slider-labels">
              <span>小</span><span>大</span>
            </div>

            <label className="field-label" style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={form.thinkingExpanded}
                  onChange={(e) => set("thinkingExpanded")(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "var(--brand)" }}
                />
                <span>思考组件默认展开</span>
              </div>
              <p className="field-hint" style={{ marginTop: 4 }}>开启后，思考内容会先展开显示，手动点击可折叠</p>
            </label>
          </>
        )}

        {tab === "api" && (
          <>
            <div className="field-label">AI 来源</div>
            <div className="onboarding-api-mode settings-api-mode">
              <button
                type="button"
                className={(form.apiMode || "online") === "online" ? "api-mode-card active" : "api-mode-card"}
                onClick={() => set("apiMode")("online")}
              >
                <div className="api-mode-icon">
                  <Cloud size={20} />
                </div>
                <div className="api-mode-body">
                  <div className="api-mode-title">
                    在线 AI
                    <span className="api-mode-badge">推荐</span>
                  </div>
                  <div className="api-mode-desc">开箱即用，无需填写密钥</div>
                </div>
                {(form.apiMode || "online") === "online" && <Check size={16} className="api-mode-check" />}
              </button>
              <button
                type="button"
                className={form.apiMode === "custom" ? "api-mode-card active" : "api-mode-card"}
                onClick={() => set("apiMode")("custom")}
              >
                <div className="api-mode-icon">
                  <SettingsIcon size={20} />
                </div>
                <div className="api-mode-body">
                  <div className="api-mode-title">自定义 API</div>
                  <div className="api-mode-desc">用你自己的 OpenAI 兼容 API</div>
                </div>
                {form.apiMode === "custom" && <Check size={16} className="api-mode-check" />}
              </button>
            </div>

            {form.apiMode === "custom" && (
              <>
                <label className="field-label">
                  API 地址
                  <input
                    className="field-input"
                    value={form.apiUrl}
                    onChange={set("apiUrl")}
                    placeholder="https://api.openai.com/v1"
                  />
                </label>
                <label className="field-label">
                  API Key
                  <input
                    className="field-input"
                    type="password"
                    value={form.apiKey}
                    onChange={set("apiKey")}
                    placeholder="sk-..."
                  />
                </label>
                <label className="field-label">
                  模型名称
                  <div className="model-input-row">
                    <input
                      className="field-input"
                      value={form.model}
                      onChange={set("model")}
                      placeholder="gpt-3.5-turbo"
                      list="model-list"
                    />
                    <button
                      className="model-fetch-btn"
                      onClick={async () => {
                        if (!form.apiUrl || !form.apiKey) return;
                        setModelLoading(true);
                        const models = await fetchModels(form.apiUrl, form.apiKey);
                        setModelList(models);
                        setModelLoading(false);
                      }}
                      disabled={modelLoading || !form.apiUrl || !form.apiKey}
                      aria-label="获取模型列表"
                    >
                      <RefreshCw size={14} className={modelLoading ? "spin" : ""} />
                    </button>
                  </div>
                  {modelList.length > 0 && (
                    <datalist id="model-list">
                      {modelList.map((m) => (
                        <option key={m} value={m} />
                      ))}
                    </datalist>
                  )}
                  {modelList.length > 0 && (
                    <div className="model-tags">
                      {modelList.slice(0, 12).map((m) => (
                        <button
                          key={m}
                          className={form.model === m ? "model-tag active" : "model-tag"}
                          onClick={() => set("model")(m)}
                        >
                          {m.length > 24 ? m.slice(0, 22) + "…" : m}
                        </button>
                      ))}
                      {modelList.length > 12 && (
                        <span className="model-more">+{modelList.length - 12} 个</span>
                      )}
                    </div>
                  )}
                </label>
                <p className="field-hint">
                  这些字段只保存在你本地浏览器（IndexedDB），不会上传
                </p>
              </>
            )}

            {(form.apiMode || "online") === "online" && (
              <p className="field-hint">
                🌐 默认由春信后端 <code>api.xushuo.cc</code> 直接提供 AI 能力，每个设备每天 500 次聊天额度；若部署了 Cloudflare Functions 并配置了密钥，会改走同源代理
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MemoryList({ memories, onAdd, onUpdate, onRemove, onClear }) {
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

  const handleAdd = () => {
    if (newContent.trim()) {
      onAdd(newContent.trim(), "manual");
      setNewContent("");
      setAdding(false);
    }
  };

  return (
    <>
      {memories.length > 0 && (
        <button className="mem-clear-btn" onClick={onClear}>清空全部</button>
      )}

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
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
                <button className="mem-action save" onClick={() => saveEdit(mem.id)} aria-label="保存">
                  <Check size={14} />
                </button>
                <button className="mem-action" onClick={() => setEditingId(null)} aria-label="取消">
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
                if (e.key === "Escape") { setAdding(false); setNewContent(""); }
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
    </>
  );
}
