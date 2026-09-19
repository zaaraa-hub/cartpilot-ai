function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
}

function normalizeWord(word) {
  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  }

  if (word.endsWith("es")) {
    return word.slice(0, -2);
  }

  if (word.endsWith("s")) {
    return word.slice(0, -1);
  }

  return word;
}

function overlapCount(queryTokens, categoryTokens) {
  const normalizedQuery = queryTokens.map(normalizeWord);
  const normalizedCategory = categoryTokens.map(normalizeWord);

  return normalizedCategory.filter(token =>
    normalizedQuery.includes(token)
  ).length;
}

function descriptionHasToken(description, token) {
  const descriptionTokens = tokenize(description).map(normalizeWord);

  return descriptionTokens.includes(normalizeWord(token));
}


// ===============================
// CATEGORY MATCHING
// ===============================

export function matchingCategories(query, catalog) {
  const queryTokens = tokenize(query).map(normalizeWord);

  // Make singular "dress" match the "dresses" category
  if (queryTokens.includes("dress")) {
    queryTokens.push("dresses");
  }

  const categories = [
    ...new Set(
      catalog.map(product =>
        product.category.toLowerCase()
      )
    )
  ];

  const scored = categories
    .map(category => {
      const categoryTokens = tokenize(category).map(normalizeWord);

      const overlap = categoryTokens.filter(token =>
        queryTokens.includes(token)
      ).length;

      return {
        category,
        overlap,
        full: overlap === categoryTokens.length
      };
    })
    .filter(entry => entry.overlap > 0);

  const fullMatches = scored.filter(entry => entry.full);

  if (fullMatches.length) {
    return fullMatches.map(entry => entry.category);
  }

  return scored.map(entry => entry.category);
}


// ===============================
// BUDGET EXTRACTION
// ===============================

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
      return Number(
        match[1].replace(/,/g, "")
      );
    }
  }

  return Infinity;
}


// ===============================
// PRODUCT SCORING
// ===============================

export function scoreProduct(product, text, budget) {
  const query = text.toLowerCase();
  const queryTokens = tokenize(text);

  let score = product.rating;

  // Category match
  if (
    overlapCount(
      queryTokens,
      tokenize(product.category)
    ) > 0
  ) {
    score += 20;
  }

  // Product name match
  if (
    overlapCount(
      queryTokens,
      tokenize(product.name)
    ) > 0
  ) {
    score += 15;
  }

  // Color match
  if (
    product.color &&
    (
      query.includes(product.color.toLowerCase()) ||
      overlapCount(
        queryTokens,
        tokenize(product.color)
      ) > 0
    )
  ) {
    score += 15;
  }

  // Occasion match
  if (
    product.occasion &&
    (
      query.includes(product.occasion.toLowerCase()) ||
      overlapCount(
        queryTokens,
        tokenize(product.occasion)
      ) > 0
    )
  ) {
    score += 8;
  }

  // Tag matches
  for (const tag of product.tags) {
    const tagText = tag.toLowerCase();

    if (
      query.includes(tagText) ||
      overlapCount(
        queryTokens,
        tokenize(tag)
      ) > 0
    ) {
      score += 8;
    }
  }

  // Description matches
  for (const token of queryTokens) {
    if (
      descriptionHasToken(
        product.description,
        token
      )
    ) {
      score += 2;
    }
  }

  // Budget
  if (product.price <= budget) {
    score += 5;
  } else {
    score -= 100;
  }

  return score;
}


// ===============================
// MAIN RECOMMENDATION ENGINE
// ===============================

export function recommend(query, catalog) {
  const budget = extractBudget(query);

  const MAX_RESULTS = 6;

  const categories = matchingCategories(
    query,
    catalog
  );

  // If a category is identified,
  // ONLY products from that category
  // enter the recommendation pool.
  const pool = categories.length
    ? catalog.filter(product =>
        categories.includes(
          product.category.toLowerCase()
        )
      )
    : catalog;

  const matches = pool
    .map(product => ({
      ...product,
      score: scoreProduct(
        product,
        query,
        budget
      )
    }))

    // Hard budget filter
    .filter(product =>
      product.price <= budget
    )

    // If no category was detected,
    // only keep products that received
    // some relevance score beyond rating.
    .filter(product =>
      categories.length
        ? true
        : product.score > product.rating
    )

    // Highest relevance first
    .sort((a, b) =>
      b.score - a.score
    )

    // Maximum 6 recommendations
    .slice(0, MAX_RESULTS);

  return {
    budget,
    matches,
    categories
  };
}