import { componentNames } from "../registry/components";

export const GENUI_LIBRARY_VERSION = 1;

export type GroundedRecord =
  | {
      id: string;
      kind: "entity";
      title: string;
      url: string;
      summary?: string;
      tags?: string[];
    }
  | {
      id: string;
      kind: "document";
      title: string;
      url: string;
      excerpt: string;
      revisedAt?: string;
    }
  | {
      id: string;
      kind: "metric";
      label: string;
      value: string;
      unit?: string;
      trend?: "up" | "down" | "flat";
    }
  | {
      id: string;
      kind: "media";
      title: string;
      url: string;
      mimeType: string;
    };

export interface CompositionEnvelope {
  fallbackText: string;
  libraryVersion: number;
  openuiText: string;
  records: GroundedRecord[];
  requestId: string;
}

export const recordIdsValid = ({
  ids,
  records,
}: {
  ids: string[];
  records: GroundedRecord[];
}) => {
  const known = new Set(records.map((record) => record.id));
  return ids.every((id) => known.has(id));
};

export const componentAllowed = (name: string) =>
  (componentNames as readonly string[]).includes(name);
