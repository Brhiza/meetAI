import { useState } from "react";
import {
  Sparkles,
  User,
  Globe,
  Check,
  ArrowRight,
  ArrowLeft,
  Cloud,
  Settings as SettingsIcon,
  RefreshCw,
} from "lucide-react";
import { SKINS } from "../services/skins";
import { fetchModels } from "../services/api";
import {
  FORM_OPTIONS,
  AGE_OPTIONS,
  ZODIAC_OPTIONS,
  MBTI_OPTIONS,
  CHAT_PREF_OPTIONS,
} from "./SettingsPanel";

const STEPS = [
  { key: "skin", label: "挑一个皮肤", icon: Sparkles },
  { key: "persona", label: "聊聊你自己", icon: User },
  { key: "api", label: "选择 AI 来源", icon: Globe },
];

export default function OnboardingModal({ initialSettings, onFinish }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => ({ ...initialSettings }));
  const [modelList, setModelList] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setDraft((d) => ({ ...d, [key]: val }));
  };

  const currentSkin = SKINS[draft.skin] || SKINS.deepseek;
  const canFinish =
    draft.apiMode === "online" || (draft.apiKey && draft.apiUrl && draft.model);

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleFinish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onFinish({ ...draft, onboarded: true });
    } finally {
      setSubmitting(false);
    }
  };

  const fetchModelOptions = async () => {
    if (!draft.apiUrl || !draft.apiKey) return;
    setModelLoading(true);
    const models = await fetchModels(draft.apiUrl, draft.apiKey);
    setModelList(models);
    setModelLoading(false);
  };

  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="onboarding-overlay"
      style={{
        "--brand": currentSkin.brand,
        "--brand-soft": currentSkin.brandSoft,
      }}
    >
      <div className="onboarding-modal" role="dialog" aria-modal="true">
        <header className="onboarding-header">
          <div className="onboarding-hello">
            <span className="onboarding-wave">👋</span>
            <div>
              <h2>欢迎来和 AI 交朋友</h2>
              <p>花一分钟配置一下，让 TA 更懂你</p>
            </div>
          </div>
          <ol className="onboarding-steps">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const state =
                i < step ? "done" : i === step ? "active" : "pending";
              return (
                <li key={s.key} className={`onboarding-step ${state}`}>
                  <span className="onboarding-step-dot">
                    {state === "done" ? <Check size={12} /> : <Icon size={12} />}
                  </span>
                  <span className="onboarding-step-label">{s.label}</span>
                </li>
              );
            })}
          </ol>
        </header>

        <div className="onboarding-body">
          {step === 0 && <SkinStep draft={draft} set={set} />}
          {step === 1 && <PersonaStep draft={draft} set={set} />}
          {step === 2 && (
            <ApiStep
              draft={draft}
              set={set}
              modelList={modelList}
              modelLoading={modelLoading}
              onFetchModels={fetchModelOptions}
            />
          )}
        </div>

        <footer className="onboarding-actions">
          {step > 0 ? (
            <button className="onboarding-btn ghost" onClick={goPrev}>
              <ArrowLeft size={14} />
              上一步
            </button>
          ) : (
            <span />
          )}
          {!isLast ? (
            <button className="onboarding-btn primary" onClick={goNext}>
              下一步
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className="onboarding-btn primary"
              onClick={handleFinish}
              disabled={!canFinish || submitting}
            >
              {submitting ? "保存中..." : "开始聊天"}
              <ArrowRight size={14} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function SkinStep({ draft, set }) {
  const currentSkin = SKINS[draft.skin] || SKINS.deepseek;
  return (
    <>
      <div className="onboarding-hint">
        每个皮肤有不同的性格和风格，挑一个对味的
      </div>
      <div className="skin-grid onboarding-skin-grid">
        {Object.entries(SKINS).map(([key, skin]) => (
          <button
            key={key}
            className={draft.skin === key ? "skin-card active" : "skin-card"}
            onClick={() => set("skin")(key)}
            style={{
              "--card-brand": skin.brand,
              "--card-brand-soft": skin.brandSoft,
            }}
          >
            <span className="skin-logo">{skin.logoText}</span>
            <span className="skin-dot" style={{ background: skin.brand }} />
          </button>
        ))}
      </div>

      <div className="field-label" style={{ marginTop: 20 }}>
        塑型
        <span className="field-sub">· {currentSkin.animal}</span>
      </div>
      <div className="form-picker">
        {FORM_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            className={draft.form === key ? "form-option active" : "form-option"}
            onClick={() => set("form")(key)}
          >
            {label}
            {key === "animal" && (
              <span className="form-animal">({currentSkin.animal})</span>
            )}
          </button>
        ))}
      </div>

      <p className="onboarding-preview">
        当前选择：<strong style={{ color: currentSkin.brand }}>
          {currentSkin.label}
        </strong>{" "}
        · {currentSkin.personality.replace(/^你是[^，。]+，?一个AI助手。?/, "")}
      </p>
    </>
  );
}

function PersonaStep({ draft, set }) {
  return (
    <>
      <div className="onboarding-hint">
        全部选填，后面在设置里随时可以改
      </div>
      <div className="profile-card">
        <label className="field-label">
          称呼
          <input
            className="field-input"
            value={draft.userName}
            onChange={set("userName")}
            placeholder="TA 该怎么叫你"
          />
        </label>
        <div className="profile-row">
          <label className="field-label">
            性别
            <select
              className="field-select"
              value={draft.userGender}
              onChange={set("userGender")}
            >
              <option value="">不填</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="其他">其他</option>
            </select>
          </label>
          <label className="field-label">
            年龄段
            <select
              className="field-select"
              value={draft.userAge}
              onChange={set("userAge")}
            >
              {AGE_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v || "不填"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="profile-row">
          <label className="field-label">
            星座
            <select
              className="field-select"
              value={draft.userZodiac}
              onChange={set("userZodiac")}
            >
              {ZODIAC_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v || "不填"}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            MBTI
            <select
              className="field-select"
              value={draft.userMbti}
              onChange={set("userMbti")}
            >
              {MBTI_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v || "不填"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field-label">
          性格
          <input
            className="field-input"
            value={draft.userPersonality}
            onChange={set("userPersonality")}
            placeholder="如：内向、慢热、固执"
          />
        </label>
        <label className="field-label">
          兴趣爱好
          <input
            className="field-input"
            value={draft.userInterests}
            onChange={set("userInterests")}
            placeholder="如：编程、音乐、游戏"
          />
        </label>
        <div className="profile-row">
          <label className="field-label">
            职业
            <input
              className="field-input"
              value={draft.userJob}
              onChange={set("userJob")}
              placeholder="如：程序员、学生"
            />
          </label>
          <label className="field-label">
            聊天偏好
            <select
              className="field-select"
              value={draft.chatPref}
              onChange={set("chatPref")}
            >
              {CHAT_PREF_OPTIONS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field-label">
          补充说明
          <textarea
            className="field-input field-textarea"
            value={draft.userCustom}
            onChange={set("userCustom")}
            placeholder="任何你想让 TA 知道的"
            rows={2}
          />
        </label>
      </div>
    </>
  );
}

function ApiStep({ draft, set, modelList, modelLoading, onFetchModels }) {
  const mode = draft.apiMode || "online";
  return (
    <>
      <div className="onboarding-hint">
        选择 TA 背后的大脑来源
      </div>

      <div className="onboarding-api-mode">
        <button
          className={mode === "online" ? "api-mode-card active" : "api-mode-card"}
          onClick={() => set("apiMode")("online")}
        >
          <div className="api-mode-icon">
            <Cloud size={22} />
          </div>
          <div className="api-mode-body">
            <div className="api-mode-title">
              在线 AI
              <span className="api-mode-badge">推荐</span>
            </div>
            <div className="api-mode-desc">
              开箱即用，无需填写任何密钥
            </div>
          </div>
          {mode === "online" && <Check size={16} className="api-mode-check" />}
        </button>
        <button
          className={mode === "custom" ? "api-mode-card active" : "api-mode-card"}
          onClick={() => set("apiMode")("custom")}
        >
          <div className="api-mode-icon">
            <SettingsIcon size={22} />
          </div>
          <div className="api-mode-body">
            <div className="api-mode-title">自定义 API</div>
            <div className="api-mode-desc">
              用你自己的 OpenAI 兼容 API
            </div>
          </div>
          {mode === "custom" && <Check size={16} className="api-mode-check" />}
        </button>
      </div>

      {mode === "custom" && (
        <div className="onboarding-custom-api">
          <label className="field-label">
            API 地址
            <input
              className="field-input"
              value={draft.apiUrl}
              onChange={set("apiUrl")}
              placeholder="https://api.openai.com/v1"
            />
          </label>
          <label className="field-label">
            API Key
            <input
              className="field-input"
              type="password"
              value={draft.apiKey}
              onChange={set("apiKey")}
              placeholder="sk-..."
            />
          </label>
          <label className="field-label">
            模型名称
            <div className="model-input-row">
              <input
                className="field-input"
                value={draft.model}
                onChange={set("model")}
                placeholder="gpt-3.5-turbo"
                list="onb-model-list"
              />
              <button
                className="model-fetch-btn"
                onClick={onFetchModels}
                disabled={modelLoading || !draft.apiUrl || !draft.apiKey}
                aria-label="获取模型列表"
                type="button"
              >
                <RefreshCw size={14} className={modelLoading ? "spin" : ""} />
              </button>
            </div>
            {modelList.length > 0 && (
              <datalist id="onb-model-list">
                {modelList.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            )}
            {modelList.length > 0 && (
              <div className="model-tags">
                {modelList.slice(0, 8).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={draft.model === m ? "model-tag active" : "model-tag"}
                    onClick={() => set("model")(m)}
                  >
                    {m.length > 24 ? m.slice(0, 22) + "…" : m}
                  </button>
                ))}
                {modelList.length > 8 && (
                  <span className="model-more">+{modelList.length - 8} 个</span>
                )}
              </div>
            )}
          </label>
          <p className="field-hint">
            这些字段只保存在你本地浏览器（IndexedDB），不会上传
          </p>
        </div>
      )}

      {mode === "online" && (
        <p className="onboarding-preview">
          🌐 由叙说 <code>xushuo.cc</code> 提供每天 500 次聊天额度
        </p>
      )}
    </>
  );
}
