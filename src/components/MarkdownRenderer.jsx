import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/github.css";
import { useEffect, useRef } from "react";

export default function MarkdownRenderer({ content }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll("pre code").forEach((block) => {
      import("highlight.js").then((hljs) => {
        hljs.default.highlightElement(block);
      });
    });
  }, [content]);

  return (
    <div className="markdown-body" ref={ref}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }) {
            const lang = className?.replace("language-", "") || "";
            if (inline) {
              return <code className="inline-code" {...props}>{children}</code>;
            }
            return (
              <code className={lang ? `language-${lang}` : ""} {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            return <pre className="code-block">{children}</pre>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
