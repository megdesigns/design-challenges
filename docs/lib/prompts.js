// Parses 600_design_practice_prompts.txt into structured challenges and hands
// out random picks that don't repeat until a pool is exhausted.
// Shared by the Node server and the browser (static / GitHub Pages mode).
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DCGPrompts = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const LINE = /^(\d+)\.\s+\[(\w+)\]\s+\[([^\]]+)\]\s+(.+)$/;
  // Greedy first group so we split on the *last* "for a X product." in the line.
  const BODY = /^(.*) for an? (.+?) product\.\s+(.+)$/;

  const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

  function article(word) {
    return /^(?:[aeiou]|HR\b)/i.test(word) ? "an" : "a";
  }

  function slug(value) {
    return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function parse(text) {
    const challenges = [];
    for (const raw of text.split(/\r?\n/)) {
      const match = LINE.exec(raw.trim());
      if (!match) continue;
      const [, num, difficulty, category, rest] = match;
      const body = BODY.exec(rest);
      const task = body ? body[1] : rest;
      const domain = body ? body[2] : null;
      const constraint = body ? body[3] : "";
      challenges.push({
        id: Number(num),
        difficulty,
        category,
        categorySlug: slug(category),
        task,
        domain,
        domainLabel: domain ? `${article(domain)} ${domain} product` : null,
        constraint,
        prompt: domain ? `${task} for ${article(domain)} ${domain} product. ${constraint}` : rest,
      });
    }
    return challenges;
  }

  function createLibrary(challenges) {
    const byId = new Map(challenges.map((c) => [c.id, c]));

    // Filters accept a single value or a list; empty / "all" means no filter.
    const toSet = (value) => {
      const list = (Array.isArray(value) ? value : [value]).filter((v) => typeof v === "string" && v && v !== "all");
      return list.length ? new Set(list) : null;
    };

    function filter({ category, difficulty } = {}) {
      const categories = toSet(category);
      const levels = toSet(difficulty);
      return challenges.filter(
        (c) => (!categories || categories.has(c.categorySlug)) && (!levels || levels.has(c.difficulty))
      );
    }

    // `seen` = ids already shown for this filter. Draw from the unseen part of
    // the pool; once it's empty the pool resets (avoiding an immediate repeat).
    function random({ category, difficulty, seen = [], exclude } = {}) {
      const pool = filter({ category, difficulty });
      if (!pool.length) return { challenge: null, reset: false };
      const seenSet = new Set(seen.map(Number));
      let candidates = pool.filter((c) => !seenSet.has(c.id));
      let reset = false;
      if (!candidates.length) {
        reset = true;
        candidates = pool.filter((c) => c.id !== Number(exclude));
        if (!candidates.length) candidates = pool;
      }
      return { challenge: candidates[Math.floor(Math.random() * candidates.length)], reset };
    }

    function meta() {
      const categories = new Map();
      for (const c of challenges) {
        if (!categories.has(c.categorySlug)) categories.set(c.categorySlug, { slug: c.categorySlug, name: c.category });
      }
      return { categories: [...categories.values()], difficulties: DIFFICULTIES };
    }

    return { all: challenges, get: (id) => byId.get(Number(id)) || null, filter, random, meta };
  }

  return { parse, article, createLibrary };
});
