// Renders schema.org markup as JSON-LD in the page body. Google reads it
// there as happily as in <head>, and it stays out of the visual tree.
//
// The `</` escape matters: a post title or excerpt containing "</script>"
// would otherwise close the tag early and let content inject markup.
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
