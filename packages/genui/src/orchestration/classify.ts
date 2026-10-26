import type { CompositionTier } from "../core/tiers";
import { JEV_CONFIDENCE_THRESHOLD, tierFromSignals } from "../core/tiers";
import type { ControlledIntent, RoutedIntent } from "./routing";

export type ComposeClassifier = "jev" | "regex";

export type AmbiguousClassification =
  | {
      classifier: ComposeClassifier;
      intent: ControlledIntent;
      tier: 1;
    }
  | {
      classifier: ComposeClassifier;
      intent: null;
      tier: CompositionTier;
    }
  | {
      classifier: "jev";
      failure: "classification_failed";
    };

const jevIntentFromChoice = (
  choiceId: string
): ControlledIntent | "open" | null => {
  if (choiceId === "open") return "open";
  if (choiceId === "unsupported") return "insufficient-data";
  const intents: ControlledIntent[] = [
    "compare-plans",
    "show-metrics",
    "support-dashboard",
    "onboarding-form",
    "product-timeline",
    "search-products",
    "list-products",
  ];
  return intents.includes(choiceId as ControlledIntent)
    ? (choiceId as ControlledIntent)
    : null;
};

const regexFallback = ({
  routed,
}: {
  routed: RoutedIntent;
}): AmbiguousClassification => ({
  classifier: "regex",
  intent: null,
  tier: routed.tier,
});

export const classifyAmbiguousQuery = async ({
  query,
  routed,
  runJev = defaultJevClassifier,
}: {
  query: string;
  routed: RoutedIntent;
  runJev?: (query: string) => Promise<AmbiguousClassification | null>;
}): Promise<AmbiguousClassification> => {
  const apiKey = process.env.TYPESAFE_API_KEY?.trim();
  if (!apiKey) return regexFallback({ routed });

  try {
    const jevResult = await runJev(query);
    if (jevResult) return jevResult;
    return regexFallback({ routed });
  } catch {
    return { classifier: "jev", failure: "classification_failed" };
  }
};

const defaultJevClassifier = async (
  query: string
): Promise<AmbiguousClassification | null> => {
  const { choice, TypeSafeClient } = await import("@typesafe-ai/sdk");
  const client = new TypeSafeClient({ defaultModel: "jev-latest" });
  const response = await client.systemOne({
    questions: {
      intent: choice("Which starter experience best matches this UI request?", {
        "compare-plans": "Compare subscription or product plans",
        "list-products": "List or browse catalog entities",
        "onboarding-form": "Collect new user information in a form",
        open: "Open-ended or novel layout requiring generation",
        "product-timeline": "Show a chronological product timeline",
        "search-products": "Search or filter catalog items",
        "show-metrics": "Show metrics, revenue, or dashboard charts",
        "support-dashboard": "Customer support or help desk dashboard",
        unsupported: "Request is outside the registered component catalog",
      }),
    },
    state: query,
  });

  const confidence = response.answers.intent.confidence ?? 0;
  if (confidence < JEV_CONFIDENCE_THRESHOLD) {
    const decision = tierFromSignals({
      ambiguous: query.trim().length < 8,
      hasControlledIntent: false,
      needsOpenComposition:
        /custom layout|surprise me|design a|generate|pricing/u.test(
          query.toLowerCase()
        ),
      synthesisRequired: false,
    });
    return { classifier: "jev", intent: null, tier: decision.tier };
  }

  const mapped = jevIntentFromChoice(response.answers.intent.choice);
  if (mapped === "open") {
    return { classifier: "jev", intent: null, tier: 3 };
  }
  if (mapped === "insufficient-data" || mapped === null) {
    return { classifier: "jev", intent: "insufficient-data", tier: 1 };
  }
  return { classifier: "jev", intent: mapped, tier: 1 };
};
