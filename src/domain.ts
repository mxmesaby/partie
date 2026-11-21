import { State, Game, Debt, Team, Place } from "./domain/types";
import { evaluateStake } from "./domain/stakes";
export * from "./domain/types";
export * from "./domain/stakes";
export * from "./domain/tournaments";
export const identity = (s: string) =>
  s.trim().normalize("NFKC").toLocaleLowerCase("fr");
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const score = (g: Game) =>
  [0, 1].map((t) =>
    g.ends.filter((e) => e.team === t).reduce((n, e) => n + e.points, 0),
  );
export function start(
  state: State,
  input: Pick<Game, "teams" | "place" | "stake" | "due"> & {
    tournament?: string;
  },
  prior?: Game,
): State {
  if (prior) {
    const priorId = prior.id;
    const stored = state.games.find((g) => g.id === priorId);
    if (!stored || !nextRound(state, stored))
      throw Error("Cette série ne permet plus de nouvelle manche.");
    prior = stored;
    input = {
      teams: stored.teams,
      place: stored.place,
      stake: stored.stake,
      due: stored.due,
    };
  }
  if (input.tournament) {
    const tournament = state.tournaments.find((t) => t.id === input.tournament);
    if (!tournament || tournament.closed)
      throw Error("Tournoi inexistant ou clôturé.");
    input = { ...input, stake: tournament.stake, due: tournament.due };
  }
  const sizes = input.teams.map((t) => t.players.length);
  if (!sizes.every((n) => n === sizes[0] && n >= 1 && n <= 3))
    throw Error(
      "Les équipes doivent avoir le même effectif, de 1 à 3 joueurs.",
    );
  if (
    ![
      input.place.address,
      input.place.postal,
      input.place.city,
      input.place.country,
    ].every((v) => v?.trim())
  )
    throw Error("Complétez tous les champs du lieu.");
  if (input.teams.some((t) => !t.name.trim()))
    throw Error("Nommez les deux équipes.");
  const names = input.teams.flatMap((t) => t.players.map(identity));
  if (names.some((n) => !n) || new Set(names).size !== names.length)
    throw Error("Chaque joueur doit avoir un nom unique.");
  const busy = state.games
    .filter((g) => g.status === "EN_COURS")
    .flatMap((g) => g.teams.flatMap((t) => t.players.map(identity)));
  if (names.some((n) => busy.includes(n)))
    throw Error("Un joueur participe déjà à une partie en cours.");
  if (prior && !nextRound(state, prior))
    throw Error("Cette série ne permet plus de nouvelle manche.");
  const game: Game = {
    ...input,
    teams: input.teams.map((t) => ({
      ...t,
      players: t.players.map((p) => p.trim()),
    })) as Game["teams"],
    id: id(),
    series: prior?.series ?? id(),
    previous: prior?.id,
    round: prior ? prior.round + 1 : 1,
    start: new Date().toISOString(),
    status: "EN_COURS",
    ends: [],
  };
  const stakes =
    !prior && game.stake.trim()
      ? [
          {
            id: id(),
            initial: game.id,
            series: game.series,
            description: game.stake,
            due: game.due,
            status: "EN_ATTENTE" as const,
            trigger: game.tournament ? ("PARTIE_TOURNOI" as const) : undefined,
            chosen: game.tournament ? game.start : undefined,
          },
          ...state.stakes,
        ]
      : state.stakes;
  return { ...state, games: [game, ...state.games], stakes };
}
export function nextRound(state: State, g: Game): string | undefined {
  const series = state.games.filter((x) => x.series === g.series);
  const stake = state.stakes.find((s) => s.series === g.series);
  if (
    g.tournament ||
    state.closedSeries.includes(g.series) ||
    (stake && !stake.trigger) ||
    g.status === "EN_COURS" ||
    series.some((x) => x.round > g.round)
  )
    return;
  if (g.round === 1) return "Revanche";
  if (g.round === 2 && series.find((x) => x.round === 1)?.winner !== g.winner)
    return "La Belle";
}
function finish(state: State, g: Game, winner: number, reason: string): State {
  const end = new Date().toISOString();
  const done: Game = {
    ...g,
    end,
    winner,
    reason,
    status: reason === "SCORE_13" ? "TERMINEE_13_PTS" : "TERMINEE_ANTICIPEE",
  };
  return evaluateStake(
    { ...state, games: state.games.map((x) => (x.id === g.id ? done : x)) },
    done,
  );
}
export function addPoints(
  state: State,
  gameId: string,
  team: number,
  points: number,
): State {
  const g = state.games.find((g) => g.id === gameId);
  if (!g || g.status !== "EN_COURS")
    throw Error("Cette partie est déjà terminée.");
  if (
    ![0, 1].includes(team) ||
    !Number.isInteger(points) ||
    points < 1 ||
    points > (g.teams[0].players.length === 1 ? 3 : 6)
  )
    throw Error("Nombre de points non autorisé pour ce format.");
  const updated = {
    ...g,
    ends: [...g.ends, { team, points, at: new Date().toISOString() }],
  };
  if (score(updated)[team] >= 13)
    return finish(state, updated, team, "SCORE_13");
  return {
    ...state,
    games: state.games.map((x) => (x.id === g.id ? updated : x)),
  };
}
export function stop(
  state: State,
  gameId: string,
  reason: string,
  forfeiting?: number,
): State {
  const g = state.games.find((g) => g.id === gameId);
  if (!g || g.status !== "EN_COURS") throw Error("Partie non active.");
  if (
    g.tournament &&
    state.tournaments.find((t) => t.id === g.tournament)?.type ===
      "LES_JEUDIS_A_LA_MELEE" &&
    g.stake
  )
    throw Error(
      "Avec enjeu aux Jeudis, les arrêts anticipés attendent une règle confirmée. Reprenez la partie ou jouez sans enjeu lors d’un prochain tournoi.",
    );
  if (!["ABANDON", "LIMITE_TEMPS", "METEO", "ACCORD_MUTUEL"].includes(reason))
    throw Error("Motif invalide.");
  const scores = score(g);
  if (reason === "ABANDON" && ![0, 1].includes(forfeiting!))
    throw Error("Choisissez l’équipe qui déclare forfait.");
  if (reason !== "ABANDON" && scores[0] === scores[1])
    throw Error("Égalité : jouez une mène décisive ou enregistrez un forfait.");
  return finish(
    state,
    g,
    reason === "ABANDON" ? 1 - forfeiting! : scores[0] > scores[1] ? 0 : 1,
    reason,
  );
}
export function settle(state: State, debtId: string): State {
  return {
    ...state,
    debts: state.debts.map((d) =>
      d.id === debtId && !d.closed
        ? { ...d, closed: new Date().toISOString() }
        : d,
    ),
  };
}
export function takeOver(state: State, gameId: string, player: string): State {
  const g = state.games.find((g) => g.id === gameId);
  const stake = state.stakes.find(
    (s) => s.game === gameId && s.status === "DU",
  );
  if (
    !g ||
    !stake ||
    stake.payer === undefined ||
    !g.teams[stake.payer].players.includes(player)
  )
    throw Error("Choisissez un joueur de l’équipe redevable.");
  if (state.debts.some((d) => d.game === gameId && (d.closed || d.exclusive)))
    throw Error("Prise en charge déjà fixée ou règlement déjà commencé.");
  return {
    ...state,
    debts: state.debts.map((d) =>
      d.game === gameId ? { ...d, debtor: player, exclusive: true } : d,
    ),
  };
}
