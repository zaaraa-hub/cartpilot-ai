
  const categories = [...new Set(catalog.map((product) => product.category.toLowerCase()))];
  const scored = categories
    .map((category) => {
      const catTokens = tokenize(category);
      const overlap = overlapCount(queryTokens, catTokens);
      return {
        category,
        overlap,
        full: overlap > 0 && overlap === catTokens.length
      };
    })
    .filter((entry) => entry.overlap > 0);
  const fullMatches = scored.filter((entry) => entry.full);
  if (fullMatches.length) {
    return fullMatches.map((entry) => entry.category);
  }
  return scored.map((entry) => entry.category);

export function extractBudget(text) {
  const patterns = [
    /under\s*₹?\s*(\d[\d,]*)/i,
    /below\s*₹?\s*(\d[\d,]*)/i,
    /less than\s*₹?\s*(\d[\d,]*)/i,
    /within\s*₹?\s*(\d[\d,]*)/i,
    /budget.*?₹?\s*(\d[\d,]*)/i,
    /₹\s*(\d[\d,]*)/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return Number(match[1].replace(/,/g, ""));
    }
  }
  return Infinity;
}
export function scoreProduct(product, text, budget) {
  const query = text.toLowerCase();
  const queryTokens = tokenize(text);
  let score = product.rating;
  if (overlapCount(queryTokens, tokenize(product.category)) > 0) {
    score += 20;
  }
  if (overlapCount(queryTokens, tokenize(product.name)) > 0) {
    score += 15;
  }
  if (
    product.color &&
    (query.includes(product.color.toLowerCase()) ||
      overlapCount(queryTokens, tokenize(product.color)) > 0)
  ) {
    score += 15;
  }
  if (
    product.occasion &&
    (query.includes(product.occasion.toLowerCase()) ||
      overlapCount(queryTokens, tokenize(product.occasion)) > 0)
  ) {
    score += 8;
  }
  for (const tag of product.tags) {
    const tagText = tag.toLowerCase();
    if (
      query.includes(tagText) ||
      overlapCount(queryTokens, tokenize(tag)) > 0
    ) {
      score += 8;
    }
  }
  for (const token of queryTokens) {
    if (descriptionHasToken(product.description, token)) {
      score += 2;
    }
  }
  if (product.price <= budget) {
    score += 5;
  } else {
    score -= 100;
  }
  return score;
}
export function recommend(query, catalog) {
  const budget = extractBudget(query);
  const MAX_RESULTS = 6;
  const categories = matchingCategories(query, catalog);
  const pool = categories.length
    ? catalog.filter((product) => categories.includes(product.category.toLowerCase()))
    : catalog;
  const matches = pool
    .map((product) => ({
      ...product,
      score: scoreProduct(product, query, budget)
    }))
    .filter((product) => product.price <= budget)
    .filter((product) =>
      categories.length
        ? true
        : product.score > product.rating
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);
  return { budget, matches, categories };
}