(() => {
  const $ = (sel) => document.querySelector(sel);

  // ---------- local storage ----------
  // Everything a visitor saves (likes, checklist progress, recent, filters, theme)
  // stays in their own browser. Values are shape-checked on read so corrupted or
  // hand-edited storage falls back to defaults instead of breaking the app.
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(`dcg:${key}`);
        if (!raw) return fallback;
        const value = JSON.parse(raw);
        const sameShape = Array.isArray(fallback)
          ? Array.isArray(value)
          : value !== null && typeof value === typeof fallback && !Array.isArray(value);
        return sameShape ? value : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(`dcg:${key}`, JSON.stringify(value));
      } catch {}
    },
  };

  const state = {
    meta: null,
    category: store.get("category", "all"),
    difficulty: store.get("difficulty", "all"),
    current: null,
    brief: null,
    done: [],
    recent: store.get("recent", []).filter((r) => r && Number.isInteger(r.id) && typeof r.task === "string"),
    seen: store.get("seen", {}), // { "category|difficulty": [ids] } — avoids repeats per filter
    likes: [],
  };

  const LEVELS = ["all", "Beginner", "Intermediate", "Advanced"];
  const VISIBLE = { categoryGroup: 5, recentGroup: 3 }; // rows shown before "Show more"
  const expanded = new Set(store.get("expanded", []));
  const LEVEL_NUM = { Beginner: 1, Intermediate: 2, Advanced: 3 };
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isSheet = () => matchMedia("(max-width: 820px)").matches;
  const barsHtml = (n) => `<span class="bars" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;

  // ---------- Data ----------
  // Everything runs in the browser: the prompt file is parsed locally and each
  // visitor's likes and checklist progress live in their own localStorage.
  // Nothing is ever sent to a server.
  let handle = null;

  async function connect() {
    const res = await fetch("600_design_practice_prompts.txt");
    if (!res.ok) throw new Error("Prompt file not found");
    const library = DCGPrompts.createLibrary(DCGPrompts.parse(await res.text()));
    handle = DCGApi.createHandler({
      getLibrary: () => library,
      buildBrief: DCGBrief.buildBrief,
      likes: { read: () => store.get("likes", {}), write: (likes) => store.set("likes", likes) },
    });
  }

  async function api(path, options = {}) {
    const { status, data } = await handle(options.method || "GET", path, options.body);
    if (status >= 400) throw new Error(data.error || "Something went wrong");
    return data;
  }

  // ---------- Init ----------
  async function init() {
    bindEvents();
    try {
      await connect();
      state.meta = await api("/meta");
    } catch {
      $("#cardTask").textContent = "Couldn't load the challenges.";
      $("#cardDomain").textContent = "Check your connection and refresh.";
      return;
    }
    if (state.category !== "all" && !state.meta.categories.some((c) => c.slug === state.category)) state.category = "all";
    renderFilters();
    renderRecent();
    await refreshLikes();

    const fromHash = Number((location.hash.match(/^#\/c\/(\d+)/) || [])[1]);
    if (fromHash) await openChallenge(fromHash);
    else await draw();
  }

  function bindEvents() {
    $("#shuffleBtn").addEventListener("click", () => draw());
    $("#likeBtn").addEventListener("click", toggleLike);
    $("#unlockBtn").addEventListener("click", toggleLike);
    $("#copyBtn").addEventListener("click", copyPrompt);
    $("#themeToggle").addEventListener("click", toggleTheme);
    $("#likedToggle").addEventListener("click", () => setPanel(true));
    $("#closePanel").addEventListener("click", () => setPanel(false));
    $("#scrim").addEventListener("click", () => setPanel(false));
    $("#clearRecent").addEventListener("click", () => {
      state.recent = [];
      store.set("recent", []);
      renderRecent();
    });
    bindSheetDrag();

    document.querySelectorAll(".more-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        const id = btn.dataset.toggle;
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
        store.set("expanded", [...expanded]);
        syncCollapse(id);
      })
    );

    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "Escape") return setPanel(false);
      if ($("#likedPanel").classList.contains("is-open")) return;
      const key = e.key.toLowerCase();
      if (e.key === " " || key === "n") {
        if (tag === "button" && e.key === " ") return; // let focused buttons activate normally
        e.preventDefault();
        draw();
      } else if (key === "l") {
        toggleLike();
      } else if (key === "c") {
        copyPrompt();
      }
    });

    window.addEventListener("hashchange", () => {
      const id = Number((location.hash.match(/^#\/c\/(\d+)/) || [])[1]);
      if (id && (!state.current || state.current.id !== id)) openChallenge(id);
    });
  }

  // ---------- Filters (left rail) ----------
  function renderFilters() {
    const cats = [{ slug: "all", name: "All" }, ...state.meta.categories];
    const limit = VISIBLE.categoryGroup;
    $("#categoryList").innerHTML = cats
      .map((c, i) => {
        const selected = c.slug === state.category;
        // The selected category always stays visible, even when the list is collapsed.
        const extra = i >= limit && !selected ? " is-extra" : "";
        return `<button class="rail-item${extra}" role="radio" type="button" data-slug="${c.slug}" aria-checked="${selected}">${escape(c.name)}</button>`;
      })
      .join("");
    syncCollapse("categoryGroup");
    $("#categoryList").querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        state.category = b.dataset.slug;
        store.set("category", state.category);
        renderFilters();
        draw();
      })
    );

    $("#levelList").innerHTML = LEVELS.map(
      (d) => `<button class="rail-item" role="radio" type="button" data-d="${d}" aria-checked="${d === state.difficulty}">
        <span>${d === "all" ? "Any level" : d}</span>${d === "all" ? "" : barsHtml(LEVEL_NUM[d])}
      </button>`
    ).join("");
    $("#levelList").querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        state.difficulty = b.dataset.d;
        store.set("difficulty", state.difficulty);
        renderFilters();
        draw();
      })
    );

    // Keep the selected chip in view on mobile, where the rail scrolls sideways.
    if (isSheet()) {
      document.querySelectorAll('.rail-item[aria-checked="true"]').forEach((el) => el.scrollIntoView({ block: "nearest", inline: "nearest" }));
    }
  }

  // ---------- Drawing ----------
  async function draw() {
    const key = `${state.category}|${state.difficulty}`;
    const seen = state.seen[key] || [];
    try {
      const result = await api("/challenges/random", {
        method: "POST",
        body: { category: state.category, difficulty: state.difficulty, seen, exclude: state.current && state.current.id },
      });
      state.seen[key] = result.reset ? [result.challenge.id] : [...seen, result.challenge.id];
      store.set("seen", state.seen);
      await show(result.challenge);
    } catch (error) {
      toast(error.message);
    }
  }

  async function openChallenge(id) {
    try {
      await show(await api(`/challenges/${id}`));
    } catch {
      toast("That challenge doesn't exist");
      draw();
    }
  }

  async function show(challenge) {
    state.current = challenge;
    renderCard(challenge);
    pushRecent(challenge);
    history.replaceState(null, "", `#/c/${challenge.id}`);

    // The brief is always rendered; it stays blurred until the challenge is liked.
    if (challenge.liked) {
      const data = await api(`/likes/${challenge.id}`).catch(() => null);
      if (data) return renderBrief(data.brief, data.done, false);
    }
    const brief = await api(`/challenges/${challenge.id}/brief`).catch(() => null);
    if (brief) renderBrief(brief, [], false);
  }

  function renderCard(c) {
    const card = $("#card");
    card.classList.remove("is-swapping");
    void card.offsetWidth;
    card.classList.add("is-swapping");

    $("#cardCategory").textContent = c.category;
    $("#cardLevel").innerHTML = `${barsHtml(LEVEL_NUM[c.difficulty] || 0)}<span>${escape(c.difficulty)}</span>`;
    $("#cardTask").textContent = c.task;
    $("#cardDomain").innerHTML = c.domain ? `for ${escape(c.domainLabel.split(" ")[0])} <strong>${escape(c.domain)}</strong> product` : "";
    $("#cardConstraint").textContent = c.constraint;
    syncLike();
  }

  function syncLike() {
    const liked = Boolean(state.current && state.current.liked);
    $("#likeBtn").setAttribute("aria-pressed", String(liked));
    $("#likeLabel").textContent = liked ? "Liked" : "Like";
    $("#brief").classList.toggle("locked", !liked);
    $("#briefBody").setAttribute("aria-hidden", String(!liked));
    renderDoneCount();
  }

  // ---------- Recent ----------
  function pushRecent(c) {
    state.recent = [{ id: c.id, task: c.task, domain: c.domain }, ...state.recent.filter((r) => r.id !== c.id)].slice(0, 10);
    store.set("recent", state.recent);
    renderRecent();
  }

  function renderRecent() {
    const list = $("#recentList");
    if (!state.recent.length) {
      list.innerHTML = `<li><p class="empty">Nothing yet.</p></li>`;
      syncCollapse("recentGroup");
      return;
    }
    const likedIds = new Set(state.likes.map((l) => l.id));
    list.innerHTML = state.recent
      .map(
        (r, i) => `<li class="${i >= VISIBLE.recentGroup ? "is-extra" : ""}"><button type="button" data-id="${Number(r.id)}" aria-current="${Boolean(state.current && state.current.id === r.id)}">
          <span class="r-task">${escape(r.task)}</span>
          <span class="r-meta">${escape(r.domain ? `for ${r.domain}` : "")}${likedIds.has(r.id) ? " · Liked" : ""}</span>
        </button></li>`
      )
      .join("");
    list.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => openChallenge(Number(b.dataset.id))));
    syncCollapse("recentGroup");
  }

  // Show/hide the rows past the limit and keep the "Show more" label in sync.
  function syncCollapse(id) {
    const group = document.getElementById(id);
    const btn = group.querySelector(".more-btn");
    const hidden = group.querySelectorAll(".is-extra").length;
    const open = expanded.has(id);
    group.classList.toggle("expanded", open);
    btn.hidden = hidden === 0;
    btn.setAttribute("aria-expanded", String(open));
    btn.innerHTML = `${open ? "Show less" : `Show ${hidden} more`}<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>`;
  }

  // ---------- Likes + brief ----------
  async function toggleLike() {
    const c = state.current;
    if (!c) return;
    try {
      if (c.liked) {
        await api(`/likes/${c.id}`, { method: "DELETE" });
        c.liked = false;
        state.done = [];
        renderChecklist();
        syncLike();
        toast("Removed from liked");
      } else {
        const data = await api(`/likes/${c.id}`, { method: "POST" });
        c.liked = true;
        const btn = $("#likeBtn");
        btn.classList.remove("pop");
        void btn.offsetWidth;
        btn.classList.add("pop");
        const brief = $("#brief");
        brief.classList.remove("unlocking");
        renderBrief(data.brief, data.done, true);
        void brief.offsetWidth;
        brief.classList.add("unlocking");
        toast("Brief unlocked");
      }
      await refreshLikes();
    } catch (error) {
      toast(error.message);
    }
  }

  function renderBrief(brief, done, scroll) {
    state.brief = brief;
    state.done = done || [];

    $("#briefTime").textContent = brief.time;
    $("#briefDeliverable").textContent = brief.deliverable;
    $("#thinkList").innerHTML = brief.think.map((q) => `<li>${escape(q)}</li>`).join("");
    $("#realContent").innerHTML = brief.realContent ? `<strong>Use real content:</strong> ${escape(brief.realContent)}` : "";
    $("#avoidText").textContent = brief.avoid || "";
    renderChecklist();
    syncLike();

    // On narrow screens the brief sits below the card, so bring it into view.
    if (scroll && isSheet()) {
      const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => $("#brief").scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 100);
    }
  }

  function renderChecklist() {
    if (!state.brief) return;
    const items = state.brief.checklist;
    const done = new Set(state.done);
    $("#checklist").innerHTML = items
      .map(
        (item, i) => `<li><label>
          <input type="checkbox" data-i="${i}" ${done.has(i) ? "checked" : ""} />
          <span class="box"><svg viewBox="0 0 12 12"><path d="M2.5 6.5l2.2 2.2L9.5 3.5" /></svg></span>
          <span>${escape(item)}</span>
        </label></li>`
      )
      .join("");
    $("#checklist").querySelectorAll("input").forEach((input) =>
      input.addEventListener("change", async () => {
        const next = new Set(state.done);
        const i = Number(input.dataset.i);
        input.checked ? next.add(i) : next.delete(i);
        state.done = [...next].sort((a, b) => a - b);
        renderDoneCount();
        try {
          await api(`/likes/${state.current.id}/checklist`, { method: "PUT", body: { done: state.done } });
          if (state.done.length === items.length) toast("All done. Nice work.");
          refreshLikes();
        } catch (error) {
          toast(error.message);
        }
      })
    );
    renderDoneCount();
  }

  function renderDoneCount() {
    const liked = Boolean(state.current && state.current.liked);
    const total = state.brief ? state.brief.checklist.length : 0;
    $("#doneCount").textContent = liked && state.done.length ? `${state.done.length}/${total} done` : "";
  }

  async function refreshLikes() {
    try {
      state.likes = await api("/likes");
    } catch {
      state.likes = [];
    }
    const badge = $("#likedCount");
    badge.textContent = state.likes.length;
    badge.hidden = !state.likes.length;
    renderLikedList();
    renderRecent();
  }

  function renderLikedList() {
    const list = $("#likedList");
    if (!state.likes.length) {
      list.innerHTML = `<li class="panel-empty"><strong>Nothing liked yet</strong>Like a challenge to save it here with its brief.</li>`;
      return;
    }
    list.innerHTML = state.likes
      .map((l) => {
        const progress = l.done.length === l.checklistTotal ? "Done" : l.done.length ? `${l.done.length}/${l.checklistTotal} done` : "";
        return `<li class="liked-item">
          <button class="liked-open" type="button" data-id="${l.id}">
            <span class="t">${escape(l.task)}</span>
            <span class="d">${escape(l.category)} · ${escape(l.difficulty)}</span>
            ${progress ? `<span class="p">${progress}</span>` : ""}
          </button>
          <button class="unlike" type="button" data-id="${l.id}" aria-label="Unlike">
            <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.6a4.3 4.3 0 017.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" /></svg>
          </button>
        </li>`;
      })
      .join("");
    list.querySelectorAll(".liked-open").forEach((b) =>
      b.addEventListener("click", async () => {
        setPanel(false);
        await openChallenge(Number(b.dataset.id));
        window.scrollTo({ top: 0, behavior: "smooth" });
      })
    );
    list.querySelectorAll(".unlike").forEach((b) =>
      b.addEventListener("click", async () => {
        const id = Number(b.dataset.id);
        await api(`/likes/${id}`, { method: "DELETE" });
        if (state.current && state.current.id === id) {
          state.current.liked = false;
          state.done = [];
          renderChecklist();
          syncLike();
        }
        refreshLikes();
      })
    );
  }

  // ---------- Liked panel: side drawer on desktop, bottom sheet on mobile ----------
  function setPanel(open) {
    const panel = $("#likedPanel");
    panel.style.removeProperty("--drag");
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    $("#likedToggle").setAttribute("aria-expanded", String(open));
    $("#scrim").hidden = !open;
    document.body.style.overflow = open && isSheet() ? "hidden" : "";
    if (open && !isSheet()) $("#closePanel").focus();
  }

  // Drag the sheet down by its handle or header to dismiss it.
  function bindSheetDrag() {
    const panel = $("#likedPanel");
    let startY = null;
    let delta = 0;

    const start = (e) => {
      if (!isSheet() || e.target.closest("#closePanel")) return;
      startY = e.clientY;
      delta = 0;
      panel.classList.add("is-dragging");
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (startY === null) return;
      delta = Math.max(0, e.clientY - startY);
      panel.style.setProperty("--drag", `${delta}px`);
    };
    const end = () => {
      if (startY === null) return;
      startY = null;
      panel.classList.remove("is-dragging");
      if (delta > Math.min(120, panel.offsetHeight * 0.25)) setPanel(false);
      else panel.style.removeProperty("--drag");
    };

    for (const handle of [$("#grabber"), panel.querySelector(".panel-head")]) {
      handle.addEventListener("pointerdown", start);
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    }
  }

  // ---------- Misc ----------
  async function copyPrompt() {
    if (!state.current) return;
    try {
      await navigator.clipboard.writeText(state.current.prompt);
      toast("Prompt copied");
    } catch {
      toast("Copy was blocked by the browser");
    }
  }

  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try {
      localStorage.setItem("dcg:theme", root.dataset.theme);
    } catch {}
  }

  function toast(message) {
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("is-visible");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => el.classList.remove("is-visible"), 2000);
  }

  init();
})();
