import { test } from "node:test";
import assert from "node:assert/strict";
import {
  start,
  empty,
  addPoints,
  score,
  stop,
  nextRound,
  settle,
  takeOver,
  chooseStake,
  createTournament,
  closeTournament,
  closeSeries,
  State,
} from "../src/domain";
const input = (n = 2) => ({
  teams: [
    {
      name: "A",
      color: "green",
      players: ["Alice", "Anne", "Alex"].slice(0, n),
    },
    { name: "B", color: "orange", players: ["Bob", "Ben", "Bill"].slice(0, n) },
  ] as Parameters<typeof start>[1]["teams"],
  place: {
    address: "Terrain du parc",
    postal: "1200",
    city: "Genève",
    country: "Suisse",
  },
  stake: "Café",
  due: "PLUS_TARD" as const,
});
function win(s: State, t = 0, confirm = true) {
  const g = s.games[0];
  const n = g.teams[0].players.length === 1 ? 3 : 6;
  while (!s.games[0].end) s = addPoints(s, g.id, t, n);
  if (confirm && s.stakes.some((x) => x.initial === g.id && !x.trigger))
    s = chooseStake(s, g.id, "PREMIERE_PARTIE");
  return s;
}
test("parité, unicité, lieu et non-simultanéité", () => {
  const a = input();
  assert.throws(() =>
    start(empty, {
      ...a,
      teams: [a.teams[0], { ...a.teams[1], players: ["Bob"] }],
    }),
  );
  assert.throws(() => start(empty, { ...a, place: { ...a.place, city: "" } }));
  assert.throws(() =>
    start(empty, {
      ...a,
      teams: [a.teams[0], { ...a.teams[1], players: [" alice ", "Ben"] }],
    }),
  );
  assert.throws(() => start(start(empty, a), a));
});
test("formats et limite de points, victoire automatique, score exact", () => {
  let s = start(empty, input(1));
  assert.throws(() => addPoints(s, s.games[0].id, 0, 4));
  s = win(s);
  assert.equal(s.games[0].status, "TERMINEE_13_PTS");
  assert.deepEqual(score(s.games[0]), [15, 0]);
  assert.ok(s.games[0].end);
  assert.throws(() => addPoints(s, s.games[0].id, 0, 1));
  for (const n of [2, 3]) {
    let x = start(empty, input(n));
    x = addPoints(x, x.games[0].id, 1, 6);
    assert.deepEqual(score(x.games[0]), [0, 6]);
  }
});
test("dettes nominatives, reprise exclusive, clôture idempotente", () => {
  let s = win(start(empty, input(3)));
  assert.equal(s.debts.length, 3);
  assert.ok(s.debts.every((d) => !d.closed));
  s = takeOver(s, s.games[0].id, "Bob");
  assert.ok(s.debts.every((d) => d.debtor === "Bob" && d.exclusive));
  assert.equal(s.debts[1].original, "Ben");
  s = settle(s, s.debts[0].id);
  assert.ok(s.debts[0].closed);
  assert.deepEqual(settle(s, s.debts[0].id), s);
  assert.throws(() => takeOver(s, s.games[0].id, "Ben"));
});
test("clôture anticipée : égalité bloquée et forfait explicite", () => {
  let s = start(empty, input());
  const id = s.games[0].id;
  assert.throws(() => stop(s, id, "METEO"));
  assert.throws(() => stop(s, id, "ABANDON"));
  s = stop(s, id, "ABANDON", 0);
  assert.equal(s.games[0].winner, 1);
  assert.equal(s.games[0].status, "TERMINEE_ANTICIPEE");
  assert.deepEqual(score(s.games[0]), [0, 0]);
});
test("revanche, belle et fin de duel", () => {
  let s = win(start(empty, input()), 0);
  let g = s.games[0];
  assert.equal(nextRound(s, g), "Revanche");
  s = win(start(s, input(), g), 1);
  g = s.games[0];
  assert.equal(nextRound(s, g), "La Belle");
  s = win(start(s, input(), g), 1);
  assert.equal(nextRound(s, s.games[0]), undefined);
  assert.equal(new Set(s.games.map((g) => g.series)).size, 1);
  assert.throws(() => start(s, input(), g));
});
test("deux victoires consécutives terminent la série et sans enjeu ne crée rien", () => {
  const a = { ...input(), stake: "" };
  let s = win(start(empty, a));
  s = win(start(s, a, s.games[0]));
  assert.equal(nextRound(s, s.games[0]), undefined);
  assert.equal(s.debts.length, 0);
});
test("choix à la fin de la première partie : aucune dette avant confirmation", () => {
  let s = start(empty, input());
  assert.throws(() => chooseStake(s, s.games[0].id, "REVANCHE"));
  s = win(s, 0, false);
  assert.equal(s.debts.length, 0);
  assert.equal(nextRound(s, s.games[0]), undefined);
  s = chooseStake(s, s.games[0].id, "PREMIERE_PARTIE");
  assert.equal(s.debts.length, 2);
  assert.deepEqual(chooseStake(s, s.games[0].id, "PREMIERE_PARTIE"), s);
  assert.throws(() => chooseStake(s, s.games[0].id, "BELLE"));
});
test("enjeu sur revanche : acquis à 2–0 une seule fois", () => {
  let s = win(start(empty, input()), 0, false);
  const initial = s.games[0];
  s = chooseStake(s, initial.id, "REVANCHE");
  assert.equal(s.debts.length, 0);
  s = win(start(s, input(), initial), 0);
  assert.equal(s.debts.length, 2);
  assert.equal(s.stakes[0].status, "DU");
  assert.equal(s.debts[0].game, s.games[0].id);
  assert.throws(() => start(s, input(), initial));
});
test("enjeu sur revanche : non dû à 1–1 même si une Belle suit", () => {
  let s = win(start(empty, input()), 0, false);
  s = chooseStake(s, s.games[0].id, "REVANCHE");
  s = win(start(s, input(), s.games[0]), 1);
  assert.equal(s.stakes[0].status, "NON_DU");
  s = win(start(s, input(), s.games[0]), 0);
  assert.equal(s.debts.length, 0);
});
test("enjeu sur Belle : dettes uniquement après la troisième manche", () => {
  let s = win(start(empty, input()), 0, false);
  s = chooseStake(s, s.games[0].id, "BELLE");
  s = win(start(s, input(), s.games[0]), 1);
  assert.equal(s.debts.length, 0);
  s = win(start(s, input(), s.games[0]), 1);
  assert.equal(s.debts.length, 2);
  assert.equal(s.debts[0].debtor, "Alice");
});
test("Belle non jouée et duel abandonné : aucun enjeu dû", () => {
  let s = win(start(empty, input()), 0, false);
  s = chooseStake(s, s.games[0].id, "BELLE");
  const abandoned = closeSeries(s, s.games[0].series);
  assert.equal(abandoned.stakes[0].status, "NON_DU");
  assert.equal(nextRound(abandoned, abandoned.games[0]), undefined);
  s = win(start(s, input(), s.games[0]), 0);
  assert.equal(s.stakes[0].status, "NON_DU");
  assert.equal(s.debts.length, 0);
});
function tournament(
  stake = "Café",
  type: "CLASSIQUE" | "LES_JEUDIS_A_LA_MELEE" = "LES_JEUDIS_A_LA_MELEE",
) {
  let s = createTournament(empty, {
    name: "Jeudi",
    type,
    stake,
    due: "IMMEDIATE",
  });
  return start(s, { ...input(), tournament: s.tournaments[0].id });
}
for (const loser of [0, 6, 7, 12])
  test(`Jeudis : score des perdants ${loser}`, () => {
    let s = tournament();
    const g = s.games[0];
    let left = loser;
    while (left) {
      const p = Math.min(6, left);
      s = addPoints(s, g.id, 1, p);
      left -= p;
    }
    s = win(s);
    assert.equal(s.games[0].winner, 0);
    assert.equal(s.stakes[0].payer, loser >= 7 ? 0 : 1);
    assert.equal(s.debts[0].debtor, loser >= 7 ? "Alice" : "Bob");
    if (loser >= 7) {
      s = takeOver(s, g.id, "Anne");
      assert.ok(s.debts.every((d) => d.debtor === "Anne"));
    }
    assert.equal(nextRound(s, s.games[0]), undefined);
  });
test("tournoi sans enjeu et clôture protégée", () => {
  let s = tournament("");
  assert.throws(() => closeTournament(s, s.tournaments[0].id));
  s = win(s);
  assert.equal(s.debts.length, 0);
  assert.equal(s.stakes.length, 0);
  s = closeTournament(s, s.tournaments[0].id);
  assert.throws(() =>
    start(s, { ...input(), tournament: s.tournaments[0].id }),
  );
});
test("Jeudis : arrêt anticipé avec enjeu bloqué, classique permis", () => {
  const s = tournament();
  assert.throws(() => stop(s, s.games[0].id, "ABANDON", 0));
  let classic = tournament("Café", "CLASSIQUE");
  classic = stop(classic, classic.games[0].id, "ABANDON", 0);
  assert.equal(classic.debts.length, 2);
  assert.equal(classic.stakes[0].payer, 0);
});
