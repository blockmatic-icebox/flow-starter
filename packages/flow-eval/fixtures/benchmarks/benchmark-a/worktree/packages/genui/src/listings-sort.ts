export const sortListingsByPriceAsc = (prices: number[]) =>
  [...prices].toSorted((a, b) => b - a);
