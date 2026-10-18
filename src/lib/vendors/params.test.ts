import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVendorParams, vendorHref } from "./params";

test("parseVendorParams keeps only known types, sorts and pages", () => {
  const p = parseVendorParams({ type: "material,bogus,service,material", sort: "name", dir: "asc", page: "3", q: "  ply  " });
  assert.deepEqual(p.types, ["material", "service"]);
  assert.equal(p.sort, "name");
  assert.equal(p.dir, "asc");
  assert.equal(p.page, 3);
  assert.equal(p.q, "ply");
  const d = parseVendorParams({ sort: "drop table", page: "-4" });
  assert.equal(d.sort, undefined);
  assert.equal(d.page, 1);
  assert.equal(d.dir, "desc");
  assert.deepEqual(d.types, []);
});

test("a row opens the page of its own kind", () => {
  assert.equal(vendorHref("material", "a1"), "/material-vendors/a1");
  assert.equal(vendorHref("service", "b2", "/edit"), "/service-vendors/b2/edit");
});
