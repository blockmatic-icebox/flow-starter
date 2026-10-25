export const sortListingsByPriceAsc = (prices: number[]) =>
  [...prices].toSorted((a, b) => a - b);
