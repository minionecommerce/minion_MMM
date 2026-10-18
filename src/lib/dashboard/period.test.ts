import test from "node:test";
import assert from "node:assert/strict";
import { dayRange, instantRange, resolvePeriod, toSlices } from "./period";

const TODAY = "2026-10-18";

test("Today is the default", () => {
  const p = resolvePeriod({}, TODAY);
  assert.deepEqual([p.mode, p.from, p.to], ["today", TODAY, TODAY]);
  assert.equal(resolvePeriod({ mode: "nonsense" }, TODAY).mode, "today");
});

test("Total has no dates; Monthly is the whole month (default: this month)", () => {
  const total = resolvePeriod({ mode: "total" }, TODAY);
  assert.deepEqual([total.from, total.to], [null, null]);
  const m = resolvePeriod({ mode: "monthly" }, TODAY);
  assert.deepEqual([m.from, m.to, m.month], ["2026-10-01", "2026-10-31", "2026-10"]);
  const feb = resolvePeriod({ mode: "monthly", month: "2028-02" }, TODAY);
  assert.deepEqual([feb.from, feb.to], ["2028-02-01", "2028-02-29"]);
  assert.equal(resolvePeriod({ mode: "monthly", month: "2026-13" }, TODAY).month, "2026-10");
});

test("a custom Start / Due Date beats the buttons, a reversed range is put in order, junk is ignored", () => {
  const p = resolvePeriod({ mode: "today", from: "2026-10-20", to: "2026-10-05" }, TODAY);
  assert.deepEqual([p.mode, p.from, p.to], ["custom", "2026-10-05", "2026-10-20"]);
  assert.deepEqual([resolvePeriod({ from: "2026-10-05" }, TODAY).from, resolvePeriod({ from: "2026-10-05" }, TODAY).to], ["2026-10-05", null]);
  assert.equal(resolvePeriod({ from: "2026-02-31", to: "x" }, TODAY).mode, "today");
});

test("ranges: whole days; the last day is included", () => {
  const d = dayRange({ from: "2026-10-01", to: "2026-10-31" })!;
  assert.equal(d.gte!.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(d.lt!.toISOString(), "2026-11-01T00:00:00.000Z");
  const i = instantRange({ from: "2026-10-18", to: "2026-10-18" })!; // Asia/Kolkata day: 18 Oct 00:00 IST = 17 Oct 18:30 UTC
  assert.equal(i.gte!.toISOString(), "2026-10-17T18:30:00.000Z");
  assert.equal(i.lt!.toISOString(), "2026-10-18T18:30:00.000Z");
  assert.equal(dayRange({ from: null, to: null }), null);
});

test("chart percentages add up to 100", () => {
  const { total, slices } = toSlices([{ key: "a", label: "A", count: 1 }, { key: "b", label: "B", count: 1 }, { key: "c", label: "C", count: 1 }]);
  assert.equal(total, 3);
  assert.equal(slices.reduce((a, s) => a + s.pct, 0), 100);
  assert.deepEqual(toSlices([{ key: "a", label: "A", count: 0 }]).slices.map(s => s.pct), [0]);
});
