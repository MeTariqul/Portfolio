import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import { CodeBlock } from "@/components/code-block";
import { copyDefaults } from "@/lib/copy";

// Renders markdown with GitHub-flavored syntax, heading ids (for the TOC)
// and syntax highlighting. Sanitization is inherent: react-markdown never
// allows raw HTML unless rehype-raw is added (it is not).
//
// `codeLabels` carries the copy-screen wording for the copy button; pages
// pass it so the site reflects admin edits, while admin previews (which
// render markdown too) can omit it and get the defaults.
export function Markdown({
  children,
  codeLabels,
}: {
  children: string;
  codeLabels?: { copy: string; copied: string };
}) {
  const labels = {
    copy: codeLabels?.copy ?? copyDefaults["code.copy"],
    copied: codeLabels?.copied ?? copyDefaults["code.copied"],
  };

  return (
    <div className="prose-site">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, rehypeHighlight]}
        components={{
          pre: ({ children: preChildren, ...rest }) => (
            <CodeBlock labels={labels} {...rest}>
              {preChildren}
            </CodeBlock>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
