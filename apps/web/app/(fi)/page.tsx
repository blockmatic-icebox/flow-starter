import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";

import { fiProductTagline } from "@/lib/fi-agent-surfaces-content";
import { fiHomeSummary, fiHomeTitle } from "@/lib/fi-home-content";
import { resolveSiteOriginFromHeaderList } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const origin = resolveSiteOriginFromHeaderList(headerList);
  const url = `${origin}/`;

  return {
    alternates: { canonical: url },
    description: fiProductTagline,
    openGraph: {
      description: fiHomeSummary,
      images: [{ alt: fiHomeTitle, url: `${origin}/opengraph-image` }],
      title: `${fiHomeTitle} — product feature request triage`,
      type: "website",
      url,
    },
    title: `${fiHomeTitle} — product feature request triage`,
  };
}

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

export default async function HomePage() {
  const headerList = await headers();
  const origin = resolveSiteOriginFromHeaderList(headerList);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        address: {
          "@type": "PostalAddress",
          addressCountry: "US",
          addressLocality: "Austin",
          postalCode: "78701",
          streetAddress: "Meta CTO assessment demo",
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "technical support",
          email: "contact@gaboesquivel.com",
          telephone: "+1-512-555-0199",
        },
        name: fiHomeTitle,
        url: origin,
      },
      {
        "@type": "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        description: fiHomeSummary,
        name: fiHomeTitle,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        url: origin,
      },
    ],
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {fiHomeTitle}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">{fiProductTagline}</p>
        <p className="text-muted-foreground mt-2">{fiHomeSummary}</p>
        <p className="text-muted-foreground mt-4 text-sm">
          <Link className="underline" href="/developers">
            Developer portal
          </Link>{" "}
          ·{" "}
          <Link className="underline" href="/openapi.json">
            OpenAPI
          </Link>{" "}
          ·{" "}
          <Link className="underline" href="/.well-known/mcp/server-card.json">
            MCP server card
          </Link>{" "}
          · POST <code className="text-xs">/api/mcp</code> ·{" "}
          <Link className="underline" href="/llms.txt">
            llms.txt
          </Link>
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
