import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { matchingCategories, recommend } from "./recommend.js";
const catalog = JSON.parse(readFileSync("./catalog.json", "utf8"));
test("dress queries only return dresses, not dressier unrelated items", () => {
  const { matches, categories } = recommend("dress", catalog);
  assert.deepEqual(categories, ["dresses"]);
  assert.ok(matches.length > 0);
  assert.ok(matches.every((product) => product.category === "dresses"));
  assert.ok(!matches.some((product) => /watch|cardigan|belt/i.test(product.name)));
});
test("plural dresses still maps to the dresses category", () => {
  const { matches } = recommend("dresses under ₹2500", catalog);
  assert.ok(matches.every((product) => product.category === "dresses"));
});
test("running shoes prefers the running shoes category", () => {
  const { matches, categories } = recommend("Running shoes under ₹3,000", catalog);
  assert.deepEqual(categories, ["running shoes"]);
  assert.ok(matches.every((product) => product.category === "running shoes"));
});
test("matchingCategories treats dress as dresses", () => {
  assert.deepEqual(matchingCategories("I want a dress", catalog), ["dresses"]);
});