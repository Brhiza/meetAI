import { useEffect, useRef, useState } from "react";
import { Brain, ChevronDown, Lightbulb, Sparkles, Zap } from "lucide-react";

function ClaudeThinkingStar() {
  return (
    <svg
      className="thought-icon claude-thinking-star"
      width="14"
      height="14"
      viewBox="0 0 100 100"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
    </svg>
  );
}

export default function InnerVoiceBlock({ text, thinking, thinkingDone, thinkingTime, variant, defaultExpanded }) {
  const [open, setOpen] = useState(() => {
    if (defaultExpanded === true) return true;
    return Boolean(thinking);
  });
  const wasThinking = useRef(thinking);

  useEffect(() => {
    if (defaultExpanded === true) return;
    if (wasThinking.current && !thinking) {
      setOpen(false);
    }
    wasThinking.current = thinking;
  }, [thinking, defaultExpanded]);

  if (!text) return null;

  const isClaude = variant === "claude";
  const isGemini = variant === "gemini";
  const isChatGPT = variant === "chatgpt";
  const isDoubao = variant === "doubao";
  const isDeepSeek = variant === "deepseek";
  const isGrok = variant === "grok";

  let label;
  if (thinking) {
    label = isClaude
      ? "思考中"
      : isChatGPT
      ? "正在推理..."
      : isGemini
      ? "Thinking..."
      : isDoubao
      ? "认真想想..."
      : isDeepSeek
      ? "深度思考中..."
      : isGrok
      ? "Thinking hard..."
      : "正在思考...";
  } else if (thinkingTime != null) {
    label = isClaude
      ? `思考了 ${thinkingTime} 秒`
      : isChatGPT
      ? `已推理 · ${thinkingTime} 秒`
      : isGemini
      ? `已思考 · ${thinkingTime} 秒`
      : isDoubao
      ? `想了 ${thinkingTime} 秒`
      : isDeepSeek
      ? `深度思考 · ${thinkingTime} 秒`
      : isGrok
      ? `Thought for ${thinkingTime}s`
      : `已思考（用时 ${thinkingTime} 秒）`;
  } else {
    label = isChatGPT
      ? "已推理"
      : isDeepSeek
      ? "深度思考"
      : isGrok
      ? "Thought"
      : "已思考";
  }

  const headerClass = isClaude
    ? `thought-header claude${thinking ? " thinking" : ""}`
    : isGemini
    ? `thought-header gemini${thinking ? " thinking" : ""}`
    : isChatGPT
    ? `thought-header chatgpt${thinking ? " thinking" : ""}`
    : isDoubao
    ? `thought-header doubao${thinking ? " thinking" : ""}`
    : isDeepSeek
    ? `thought-header deepseek${thinking ? " thinking" : ""}`
    : isGrok
    ? `thought-header grok${thinking ? " thinking" : ""}`
    : "thought-header default";

  const outerClass = isClaude
    ? "inner-voice-block claude"
    : isChatGPT
    ? "inner-voice-block chatgpt"
    : isGemini
    ? "inner-voice-block gemini"
    : isDoubao
    ? "inner-voice-block doubao"
    : isDeepSeek
    ? "inner-voice-block deepseek"
    : isGrok
    ? "inner-voice-block grok"
    : "inner-voice-block";

  const boxClass = isClaude
    ? "thought-box claude"
    : isChatGPT
    ? "thought-box chatgpt"
    : isGemini
    ? "thought-box gemini"
    : isDoubao
    ? "thought-box doubao"
    : isDeepSeek
    ? "thought-box deepseek"
    : isGrok
    ? "thought-box grok"
    : "thought-box";

  return (
    <div className={outerClass}>
      <button className={headerClass} onClick={() => setOpen((v) => !v)}>
        {isClaude ? (
          <ClaudeThinkingStar />
        ) : isGemini ? (
          <span className="thought-icon gemini-thought-diamond" aria-hidden="true" />
        ) : isChatGPT ? (
          <span className="thought-icon chatgpt-thought-sparkle" aria-hidden="true">
            <Sparkles size={12} strokeWidth={1.8} />
          </span>
        ) : isDoubao ? (
          <span className="thought-icon doubao-thought-bulb" aria-hidden="true">
            <Lightbulb size={13} strokeWidth={2} />
          </span>
        ) : isDeepSeek ? (
          <span className="thought-icon deepseek-thought-brain" aria-hidden="true">
            <Brain size={13} strokeWidth={1.9} />
          </span>
        ) : isGrok ? (
          <span className="thought-icon grok-thought-zap" aria-hidden="true">
            <Zap size={12} strokeWidth={2} />
          </span>
        ) : (
          <span className="thought-icon thought-badge" aria-hidden="true">
            <svg
              className="thought-badge-svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 10.0938C13.0527 10.0938 13.9062 10.9474 13.9062 12.0001C13.9062 13.0529 13.0528 13.9063 12 13.9063C10.9473 13.9062 10.0937 13.0528 10.0937 12.0001C10.0938 10.9474 10.9473 10.094 12 10.0938Z" fill="currentColor" />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.12107 3.12216C4.69147 1.55205 8.25395 2.41806 11.999 4.99716C15.7444 2.41769 19.3074 1.55188 20.8779 3.12216L20.9736 3.22274C22.4116 4.84128 21.5268 8.33306 19.001 12.0001C21.5803 15.7453 22.4471 19.3075 20.8769 20.878L20.7763 20.9737C19.1578 22.4117 15.666 21.5269 11.999 19.0011C8.33218 21.5265 4.84105 22.4116 3.22264 20.9737L3.12205 20.878C1.5518 19.3075 2.41759 15.7444 4.99705 11.9991C2.47185 8.33245 1.58756 4.84109 3.02537 3.22274L3.12107 3.12216ZM6.00779 13.3643C5.36578 14.3496 4.86348 15.3013 4.51365 16.1768C4.10303 17.2046 3.93208 18.0537 3.9365 18.6856C3.94096 19.3077 4.1091 19.6033 4.25291 19.7472C4.39685 19.8909 4.69181 20.0591 5.31346 20.0636C5.94539 20.0681 6.79427 19.8961 7.82225 19.4854C8.69792 19.1356 9.64924 18.6325 10.6347 17.9903C9.81209 17.338 8.98962 16.6098 8.18943 15.8097L7.73826 15.3477C7.11298 14.6947 6.5354 14.0297 6.00779 13.3643ZM17.9902 13.3634C17.3378 14.1862 16.6099 15.0093 15.8096 15.8097L15.3476 16.2608C14.6944 16.8863 14.0289 17.4636 13.3633 17.9913C14.3491 18.6338 15.3018 19.1365 16.1777 19.4864C17.2053 19.8969 18.0538 20.068 18.6855 20.0636C19.3071 20.0591 19.6021 19.8909 19.7461 19.7472C19.8899 19.6033 20.058 19.3076 20.0625 18.6856C20.0669 18.0538 19.8958 17.2054 19.4853 16.1778C19.1353 15.3018 18.6329 14.3494 17.9902 13.3634ZM11.998 6.97177C11.1064 7.6516 10.2045 8.43811 9.32127 9.32137C8.43756 10.2051 7.65165 11.108 6.97166 12.0001C7.65155 12.892 8.43774 13.7943 9.32127 14.6778C10.2046 15.5612 11.1073 16.3466 11.999 17.0265C12.8909 16.3465 13.7941 15.5614 14.6777 14.6778C15.5613 13.7943 16.3464 12.891 17.0263 11.9991C16.3465 11.1074 15.561 10.2047 14.6777 9.32137C13.7938 8.43747 12.8903 7.65186 11.998 6.97177ZM5.31346 3.93661C4.69145 3.94106 4.39583 4.10921 4.25193 4.25302C4.10818 4.39695 3.94002 4.69194 3.93553 5.31356C3.93103 5.9455 4.10296 6.79438 4.51365 7.82235C4.86355 8.69809 5.36555 9.65024 6.00779 10.6358C6.66031 9.81283 7.38991 8.99102 8.19041 8.19052L8.65232 7.73837C9.30503 7.11346 9.96972 6.5362 10.6347 6.00887C9.64929 5.36672 8.69788 4.86364 7.82225 4.51376C6.79448 4.10315 5.94536 3.93219 5.31346 3.93661ZM18.6855 3.93661C18.0537 3.93223 17.2053 4.10325 16.1777 4.51376C15.3018 4.86372 14.3491 5.36538 13.3633 6.0079C14.1863 6.66041 15.0081 7.39002 15.8086 8.19052L16.2607 8.65243C16.8856 9.30513 17.4629 9.96982 17.9902 10.6349C18.6327 9.64906 19.1364 8.69723 19.4863 7.82137C19.8968 6.79381 20.0679 5.94534 20.0635 5.31356C20.059 4.69194 19.8908 4.39695 19.7471 4.25302C19.6032 4.1092 19.3076 3.94106 18.6855 3.93661Z"
                fill="currentColor"
              />
            </svg>
          </span>
        )}
        <span>{label}</span>
        <span className={open ? "thought-arrow open" : "thought-arrow"}>
          <ChevronDown className="mini-icon" strokeWidth={1.8} />
        </span>
      </button>

      {open && (
        <div className={boxClass}>
          {text.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {thinking && <span className="thinking-cursor">▍</span>}
        </div>
      )}
    </div>
  );
}
