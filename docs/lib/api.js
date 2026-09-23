// The app's data layer as a plain function: handle(method, path, body) → { status, data }.
// Runs entirely in the browser; `likes` is backed by the visitor's localStorage.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.DCGApi = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // getLibrary: () => library from prompts.js createLibrary
  // buildBrief: from brief.js
  // likes: { read(): {[id]: {likedAt, done}}, write(likes) }
  function createHandler({ getLibrary, buildBrief, likes }) {
    const ok = (data) => ({ status: 200, data });
    const fail = (status, error) => ({ status, data: { error } });

    // Checklist progress, ignoring indexes that no longer exist in the brief.
    function doneFor(challenge, like) {
      const total = buildBrief(challenge).checklist.length;
      return (Array.isArray(like.done) ? like.done : []).filter((i) => Number.isInteger(i) && i >= 0 && i < total);
    }

    function withLike(challenge, store) {
      const like = store[challenge.id];
      return { ...challenge, liked: Boolean(like), likedAt: like ? like.likedAt : null };
    }

    return async function handle(method, path, body = {}) {
      const library = getLibrary();
      const [resource, id, sub] = path.split("?")[0].split("/").filter(Boolean);

      if (resource === "meta" && method === "GET") return ok(library.meta());

      if (resource === "challenges") {
        if (id === "random" && method === "POST") {
          const result = library.random({
            category: body.category,
            difficulty: body.difficulty,
            seen: Array.isArray(body.seen) ? body.seen : [],
            exclude: body.exclude,
          });
          if (!result.challenge) return fail(404, "No challenges match those filters.");
          return ok({ reset: result.reset, challenge: withLike(result.challenge, await likes.read()) });
        }
        const challenge = id && library.get(id);
        if (!challenge) return fail(404, "Challenge not found");
        if (!sub && method === "GET") return ok(withLike(challenge, await likes.read()));
        if (sub === "brief" && method === "GET") return ok(buildBrief(challenge));
      }

      if (resource === "likes") {
        const store = await likes.read();

        if (!id && method === "GET") {
          const list = Object.entries(store)
            .map(([likeId, like]) => {
              const challenge = library.get(likeId);
              if (!challenge || !like || typeof like !== "object") return null;
              return {
                ...challenge,
                liked: true,
                likedAt: String(like.likedAt || ""),
                done: doneFor(challenge, like),
                checklistTotal: buildBrief(challenge).checklist.length,
              };
            })
            .filter(Boolean)
            .sort((a, b) => b.likedAt.localeCompare(a.likedAt));
          return ok(list);
        }

        const challenge = id && library.get(id);
        if (!challenge) return fail(404, "Challenge not found");

        if (!sub && method === "POST") {
          if (!store[challenge.id] || typeof store[challenge.id] !== "object") store[challenge.id] = { likedAt: new Date().toISOString(), done: [] };
          await likes.write(store);
          return ok({ challenge: withLike(challenge, store), brief: buildBrief(challenge), done: doneFor(challenge, store[challenge.id]) });
        }

        if (!sub && method === "GET") {
          if (!store[challenge.id]) return fail(404, "Not liked");
          return ok({ challenge: withLike(challenge, store), brief: buildBrief(challenge), done: doneFor(challenge, store[challenge.id]) });
        }

        if (!sub && method === "DELETE") {
          delete store[challenge.id];
          await likes.write(store);
          return ok({ challenge: withLike(challenge, store) });
        }

        if (sub === "checklist" && method === "PUT") {
          if (!store[challenge.id]) return fail(404, "Like the challenge first");
          store[challenge.id].done = doneFor(challenge, { done: Array.isArray(body.done) ? body.done : [] });
          await likes.write(store);
          return ok({ done: store[challenge.id].done });
        }
      }

      return fail(404, "Unknown endpoint");
    };
  }

  return { createHandler };
});
