const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "your", "you",
  "are", "was", "want", "need", "looking", "look", "show", "get", "buy",
  "please", "some", "any", "something", "under", "below", "less", "than",
  "within", "budget", "around", "about", "have", "got", "can", "could",
  "would", "like", "also", "just", "find", "me"
]);
export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word));
}
export function stemSet(word) {
  const w = word.toLowerCase();
  const stems = new Set([w]);
  if (w.endsWith("ies") && w.length > 4) {
    stems.add(w.slice(0, -3) + "y");
  }
  if (w.endsWith("es") && w.length > 4) {
    stems.add(w.slice(0, -2));
  }
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) {
    stems.add(w.slice(0, -1));
  }
  return stems;
}
export function sharesStem(a, b) {
  const aStems = stemSet(a);
  for (const stem of stemSet(b)) {
    if (aStems.has(stem)) return true;
  }
  return false;
}
function overlapCount(queryTokens, otherTokens) {
  let count = 0;
  for (const token of otherTokens) {
    if (queryTokens.some((queryToken) => sharesStem(queryToken, token))) {
      count += 1;
    }
  }
  return count;
}
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function descriptionHasToken(description, token) {
  const haystack = description.toLowerCase();
  return [...stemSet(token)].some((stem) =>
    new RegExp(`\\b${escapeRegex(stem)}\\b`, "i").test(haystack)
  );
}
export function matchingCategories(query, catalog) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];
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
}
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
} 