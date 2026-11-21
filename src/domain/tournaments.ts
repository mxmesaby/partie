import { State, Tournament } from "./types";
export function createTournament(
  state: State,
  input: Pick<Tournament, "name" | "type" | "stake" | "due">,
): State {
  if (!input.name.trim()) throw Error("Nommez le tournoi.");
  if (!["CLASSIQUE", "LES_JEUDIS_A_LA_MELEE"].includes(input.type))
    throw Error("Type de tournoi invalide.");
  return {
    ...state,
    tournaments: [
      {
        ...input,
        name: input.name.trim(),
        stake: input.stake.trim(),
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        created: new Date().toISOString(),
      },
      ...state.tournaments,
    ],
  };
}
export function closeTournament(state: State, id: string): State {
  if (!state.tournaments.some((t) => t.id === id))
    throw Error("Tournoi absent.");
  if (state.games.some((g) => g.tournament === id && !g.end))
    throw Error("Une partie est encore en cours.");
  return {
    ...state,
    tournaments: state.tournaments.map((t) =>
      t.id === id ? { ...t, closed: t.closed ?? new Date().toISOString() } : t,
    ),
  };
}
