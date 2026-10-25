import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import Link from "next/link";

const intents = [
  {
    description: "Tell us what you need in plain language.",
    href: "/requests/new?context=external",
    title: "Share feedback",
  },
  {
    description: "Paste notes — we check duplicates first.",
    href: "/requests/new?context=internal",
    title: "Log customer feedback",
  },
  {
    description: "Decide what we do next.",
    href: "/triage",
    title: "Review queue",
  },
  {
    description: "Outcomes and decision capture.",
    href: "/insights",
    title: "See outcomes",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Feature Intelligence
        </h1>
        <p className="text-muted-foreground mt-2">
          Turn unstructured feedback into clear product decisions.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {intents.map((intent) => (
          <Card key={intent.href}>
            <CardHeader>
              <CardTitle>{intent.title}</CardTitle>
              <CardDescription>{intent.description}</CardDescription>
              <Link
                className="bg-primary text-primary-foreground mt-2 inline-flex w-fit items-center justify-center rounded-md px-4 py-2 text-sm font-medium"
                href={intent.href}
              >
                Open
              </Link>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Link
        className="border-border inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm"
        href="/requests"
      >
        Browse all requests
      </Link>
    </div>
  );
}
