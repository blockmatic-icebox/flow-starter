import { contactBody } from "@/lib/fi-agent-surfaces-content";

export default function ContactPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>Contact</h1>
      <p>{contactBody}</p>
    </article>
  );
}
