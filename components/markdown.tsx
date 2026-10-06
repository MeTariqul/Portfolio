import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "@/components/code-block";

// Renders markdown with GitHub-flavored syntax, heading ids (for the TOC)
// and syntax highlighting. Sanitization is inherent: react-markdown never
// allows raw HTML unless rehype-raw is added (it is not).
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-site">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          pre: ({ children: preChildren, ...rest }) => (
            <CodeBlock {...rest}>{preChildren}</CodeBlock>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
