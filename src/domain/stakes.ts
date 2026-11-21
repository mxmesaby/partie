import { Game, State, Trigger } from "./types";
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function evaluateStake(state: State, game: Game): State {
  const stake = state.stakes.find((s) => s.series === game.series);
  if (
    !stake ||
    stake.status !== "EN_ATTENTE" ||
    !stake.trigger ||
    game.winner === undefined
  )
    return state;
  let acquired = false,
    notDue = false,
    payer = 1 - game.winner,
    rule: string = stake.trigger;
  if (stake.trigger === "PREMIERE_PARTIE") acquired = game.round === 1;
  if (stake.trigger === "REVANCHE" && game.round === 2) {
    acquired =
      state.games.find((g) => g.id === stake.initial)?.winner === game.winner;
    notDue = !acquired;
  }
  if (stake.trigger === "BELLE") {
    acquired = game.round === 3;
    notDue =
      game.round === 2 &&
      state.games.find((g) => g.id === stake.initial)?.winner === game.winner;
  }
  if (stake.trigger === "PARTIE_TOURNOI") {
    const tournament = state.tournaments.find((t) => t.id === game.tournament);
    if (!tournament) throw Error("Tournoi absent.");
    acquired = true;
    if (tournament.type === "LES_JEUDIS_A_LA_MELEE") {
      if (game.reason !== "SCORE_13")
        throw Error(
          "Règle des arrêts anticipés à préciser pour les Jeudis avec enjeu.",
        );
      const loserScore = game.ends
        .filter((e) => e.team === 1 - game.winner!)
        .reduce((n, e) => n + e.points, 0);
      payer = loserScore >= 7 ? game.winner : 1 - game.winner;
      rule = "SEUIL_PERDANT_7";
    }
  }
  if (!acquired && !notDue) return state;
  const now = new Date().toISOString();
  const updated = {
    ...stake,
    status: acquired ? ("DU" as const) : ("NON_DU" as const),
    game: acquired ? game.id : undefined,
    payer: acquired ? payer : undefined,
    rule,
  };
  const debts = acquired
    ? game.teams[payer].players.map((p, i) => ({
        id: id(),
        stakeId: stake.id,
        game: game.id,
        creditor: game.teams[1 - payer].players[i],
        debtor: p,
        original: p,
        description: stake.description,
        due: stake.due,
        created: now,
        exclusive: false,
      }))
    : [];
  return {
    ...state,
    stakes: state.stakes.map((s) => (s.id === stake.id ? updated : s)),
    debts: [...debts, ...state.debts],
  };
}
export function chooseStake(
  state: State,
  gameId: string,
  trigger: Exclude<Trigger, "PARTIE_TOURNOI">,
): State {
  const g = state.games.find((g) => g.id === gameId),
    stake = state.stakes.find((s) => s.initial === gameId);
  if (!g?.end || g.round !== 1 || g.tournament || !stake)
    throw Error(
      "Choix possible à la fin de la première partie libre avec enjeu.",
    );
  if (!["PREMIERE_PARTIE", "REVANCHE", "BELLE"].includes(trigger))
    throw Error("Choix invalide.");
  if (stake.trigger) {
    if (stake.trigger === trigger) return state;
    throw Error("Le choix est déjà confirmé.");
  }
  if (state.closedSeries.includes(g.series)) throw Error("Série clôturée.");
  const next = {
    ...state,
    stakes: state.stakes.map((s) =>
      s.id === stake.id
        ? { ...s, trigger, chosen: new Date().toISOString() }
        : s,
    ),
  };
  return evaluateStake(next, g);
}
export function closeSeries(state: State, series: string): State {
  const games = state.games.filter((g) => g.series === series);
  if (
    !games.length ||
    games.some((g) => !g.end) ||
    games.some((g) => g.tournament)
  )
    throw Error("Terminez la partie avant de clore le duel.");
  if (state.stakes.some((s) => s.series === series && !s.trigger))
    throw Error("Confirmez d’abord le choix de l’enjeu.");
  return {
    ...state,
    closedSeries: Array.from(new Set([...state.closedSeries, series])),
    stakes: state.stakes.map((s) =>
      s.series === series && s.status === "EN_ATTENTE"
        ? { ...s, status: "NON_DU" }
        : s,
    ),
  };
}
