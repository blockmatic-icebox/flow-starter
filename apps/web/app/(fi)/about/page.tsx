import { aboutBody } from "@/lib/fi-agent-surfaces-content";

export default function AboutPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>About Feature Intelligence</h1>
      <p>{aboutBody}</p>
    </article>
  );
}
