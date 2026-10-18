import test from "node:test";
import assert from "node:assert/strict";
import { acceptedTotal, classifyKinds, itemKindOf, POS_BOTH, POS_PRODUCT, POS_SERVICE } from "./calc";

test("Product / Service comes from the kinds of the chosen items", () => {
  assert.equal(classifyKinds([]), null);
  assert.equal(classifyKinds(["Goods", "Goods"]), POS_PRODUCT);
  assert.equal(classifyKinds(["Service"]), POS_SERVICE);
  assert.equal(classifyKinds(["Goods", "Service"]), POS_BOTH);
});

test("an item's kind: the line's own kind first, then its catalog item, Goods when unknown", () => {
  assert.equal(itemKindOf("Service", "Goods"), "Service");
  assert.equal(itemKindOf("Goods", "Service"), "Goods");
  assert.equal(itemKindOf(null, "Service"), "Service");
  assert.equal(itemKindOf(null, null), "Goods");
});

test("only accepted quotes add to the Project Value, each once", () => {
  assert.equal(acceptedTotal([
    { id: "a", status: "Accepted", amount: 1000.1 },
    { id: "a", status: "Accepted", amount: 1000.1 },
    { id: "b", status: "Accepted", amount: 0.2 },
    { id: "c", status: "Declined", amount: 500 },
    { id: "d", status: "Sent", amount: 300 },
  ]), 1000.3);
});
