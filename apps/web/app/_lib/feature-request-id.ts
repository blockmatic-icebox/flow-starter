const featureRequestIdPattern =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu;

export const isFeatureRequestId = (value: string) =>
  featureRequestIdPattern.test(value);
