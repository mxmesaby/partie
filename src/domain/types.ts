export type Team = { name: string; color: string; players: string[] };
export type Place = {
  address: string;
  postal: string;
  city: string;
  country: string;
};
export type Game = {
  id: string;
  series: string;
  previous?: string;
  round: number;
  tournament?: string;
  teams: [Team, Team];
  place: Place;
  stake: string;
  due: "IMMEDIATE" | "PLUS_TARD";
  start: string;
  end?: string;
  status: "EN_COURS" | "TERMINEE_13_PTS" | "TERMINEE_ANTICIPEE";
  reason?: string;
  winner?: number;
  ends: { team: number; points: number; at: string }[];
};
export type Debt = {
  id: string;
  game: string;
  stakeId: string;
  creditor: string;
  debtor: string;
  original: string;
  description: string;
  due: Game["due"];
  created: string;
  closed?: string;
  exclusive: boolean;
};
export type Trigger =
  | "PREMIERE_PARTIE"
  | "REVANCHE"
  | "BELLE"
  | "PARTIE_TOURNOI";
export type Stake = {
  id: string;
  initial: string;
  series: string;
  description: string;
  due: Game["due"];
  trigger?: Trigger;
  chosen?: string;
  status: "EN_ATTENTE" | "DU" | "NON_DU";
  game?: string;
  payer?: number;
  rule?: string;
};
export type Tournament = {
  id: string;
  name: string;
  type: "CLASSIQUE" | "LES_JEUDIS_A_LA_MELEE";
  stake: string;
  due: Game["due"];
  created: string;
  closed?: string;
};
export type State = {
  games: Game[];
  debts: Debt[];
  stakes: Stake[];
  tournaments: Tournament[];
  closedSeries: string[];
};
export const empty: State = {
  games: [],
  debts: [],
  stakes: [],
  tournaments: [],
  closedSeries: [],
};
