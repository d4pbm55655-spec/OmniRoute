import assert from "node:assert/strict";
import test from "node:test";
import {
  buildQueries,
  dedupeSources,
  runHistorian,
  DIVISIONS_SEMAINE,
} from "../../examples/belgian-football-historian/historian.mjs";
import { buildUserPrompt } from "../../examples/belgian-football-historian/prompts.mjs";

const ENV = { OMNIROUTE_URL: "http://omni.test/v1", OMNIROUTE_API_KEY: "k", HISTORIAN_MODEL: "m" };

function fakeFetch(handler) {
  const calls = [];
  const impl = async (url, init) => {
    const body = JSON.parse(init.body);
    calls.push({ url, body });
    const { status = 200, json } = handler(url, body);
    return {
      ok: status < 400,
      status,
      json: async () => json,
      text: async () => JSON.stringify(json),
    };
  };
  return { impl, calls };
}

test("buildQueries covers each mode and rejects unknown ones", () => {
  assert.ok(buildQueries("joueur", "Paul Van Himst").every((q) => q.includes("Paul Van Himst")));
  assert.equal(buildQueries("semaine").length, DIVISIONS_SEMAINE.length);
  assert.deepEqual(buildQueries("semaine", "Nationale 1").length, 1);
  assert.throws(() => buildQueries("inconnu", "x"), /Mode inconnu/);
});

test("dedupeSources drops duplicate URLs and truncates long text", () => {
  const long = "a".repeat(5000);
  const out = dedupeSources([
    { title: "A", url: "https://a", snippet: "s" },
    { title: "A bis", url: "https://a", snippet: "dup" },
    { title: "B", url: "https://b", content: { text: long } },
    { title: "no url" },
  ]);
  assert.equal(out.length, 2);
  assert.equal(out[0].text, "s");
  assert.ok(out[1].text.length < 2600);
});

test("buildUserPrompt numbers sources and warns when none", () => {
  const p = buildUserPrompt("equipe", "RSC Anderlecht", [{ title: "T", url: "https://t" }]);
  assert.match(p, /RSC Anderlecht/);
  assert.match(p, /\[1\] T\nhttps:\/\/t/);
  assert.match(buildUserPrompt("joueur", "X", []), /aucune source/);
});

test("runHistorian searches, then writes the article from numbered sources", async () => {
  const { impl, calls } = fakeFetch((url) => {
    if (url.endsWith("/search")) {
      return { json: { results: [{ title: "Wiki", url: "https://w", snippet: "buts" }] } };
    }
    return { json: { choices: [{ message: { content: "# Fiche\n## Sources\n[1] Wiki" } }] } };
  });
  const { article, sources, errors } = await runHistorian("joueur", "Jan Ceulemans", {
    fetchImpl: impl,
    env: ENV,
  });
  assert.equal(article, "# Fiche\n## Sources\n[1] Wiki");
  assert.equal(sources.length, 1);
  assert.deepEqual(errors, []);
  const searches = calls.filter((c) => c.url === "http://omni.test/v1/search");
  assert.ok(searches.length > 1);
  assert.equal(searches[0].body.country, "BE");
  const chat = calls.find((c) => c.url === "http://omni.test/v1/chat/completions");
  assert.equal(chat.body.model, "m");
  assert.match(chat.body.messages[0].content, /n'inventes JAMAIS/);
  assert.match(chat.body.messages[1].content, /\[1\] Wiki/);
});

test("weekly mode uses news search for the past week and survives a failed search", async () => {
  let n = 0;
  const { impl, calls } = fakeFetch((url) => {
    if (url.endsWith("/search")) {
      n += 1;
      return n === 1 ? { status: 503, json: { error: "down" } } : { json: { results: [] } };
    }
    return { json: { choices: [{ message: { content: "recap" } }] } };
  });
  const { article, errors } = await runHistorian("semaine", "", {
    fetchImpl: impl,
    env: ENV,
    today: new Date("2026-11-02T08:00:00Z"),
  });
  assert.equal(article, "recap");
  assert.equal(errors.length, 1);
  const search = calls.find((c) => c.url.endsWith("/search"));
  assert.equal(search.body.search_type, "news");
  assert.equal(search.body.time_range, "week");
  const chat = calls.find((c) => c.url.endsWith("/chat/completions"));
  assert.match(chat.body.messages[1].content, /semaine du 2026-11-02/);
});

test("runHistorian requires a subject outside weekly mode", async () => {
  await assert.rejects(() => runHistorian("joueur", "  ", { env: ENV }), /demande un sujet/);
});
