import { privacyBody } from "@/lib/fi-agent-surfaces-content";

export default function PrivacyPage() {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-3xl">
      <h1>Privacy</h1>
      <p>{privacyBody}</p>
    </article>
  );
}
