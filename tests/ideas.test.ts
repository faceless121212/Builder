import { test } from "node:test";
import assert from "node:assert/strict";
import { countByFilter, figureNumbers, toggledStatus, upsertIdea, validateTitle, visibleIdeas, type Idea } from "../src/lib/ideas.ts";

const idea = (id: string, status: Idea["status"], created_at: string): Idea => ({
  id, user_id: "u", title: id, description: null, status, created_at, updated_at: created_at,
});
const a = idea("a", "not_started", "2026-01-01T00:00:00Z");
const b = idea("b", "working_on_it", "2026-01-02T00:00:00Z");
const c = idea("c", "not_started", "2026-01-03T00:00:00Z");
const all = [a, b, c];

test("empty / whitespace titles are rejected, long ones too", () => {
  assert.ok(validateTitle(""));
  assert.ok(validateTitle("   \n\t"));
  assert.ok(validateTitle("x".repeat(121)));
  assert.equal(validateTitle("  Build a thing  "), null);
});

test("counts per filter", () => {
  assert.deepEqual(countByFilter(all), { all: 3, working_on_it: 1, not_started: 2 });
  assert.deepEqual(countByFilter([]), { all: 0, working_on_it: 0, not_started: 0 });
});

test("newest first, filters, and pinning", () => {
  assert.deepEqual(visibleIdeas(all, "all", false).map((i) => i.id), ["c", "b", "a"]);
  assert.deepEqual(visibleIdeas(all, "all", true).map((i) => i.id), ["b", "c", "a"]);
  assert.deepEqual(visibleIdeas(all, "not_started", false).map((i) => i.id), ["c", "a"]);
  assert.deepEqual(visibleIdeas(all, "working_on_it", false).map((i) => i.id), ["b"]);
});

test("figure numbers follow creation order", () => {
  const figs = figureNumbers(all);
  assert.equal(figs.get("a"), "01");
  assert.equal(figs.get("c"), "03");
});

test("toggle and upsert", () => {
  assert.equal(toggledStatus("not_started"), "working_on_it");
  assert.equal(toggledStatus("working_on_it"), "not_started");
  assert.equal(upsertIdea(all, { ...a, title: "A2" }).find((i) => i.id === "a")?.title, "A2");
  assert.equal(upsertIdea(all, idea("d", "not_started", "2026-02-01T00:00:00Z"))[0].id, "d");
});
