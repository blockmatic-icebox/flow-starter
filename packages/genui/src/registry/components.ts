export const componentNames = [
  "Answer",
  "SectionStack",
  "CollectionGrid",
  "SearchResults",
  "ComparisonView",
  "TimelineView",
  "DetailView",
  "DataExplorer",
  "DocumentationBlock",
  "InteractiveForm",
  "FilePreview",
  "StatusMessage",
] as const;

export type ComponentName = (typeof componentNames)[number];

export const forbiddenComponentKeys = [
  "presentation",
  "variant",
  "layout",
  "frame",
  "html",
  "css",
  "tool",
  "toolName",
  "endpoint",
  "onClick",
  "onSubmit",
] as const;
