export type Team = { name: string; color: string; players: string[] };
export type Place = { address: string; postal: string; city: string; country: string };
export type Game = { id: string; series: string; previous?: string; round: number; teams: [Team, Team]; place: Place; stake: string; due: 'IMMEDIATE'|'PLUS_TARD'; start: string; end?: string; status: 'EN_COURS'|'TERMINEE_13_PTS'|'TERMINEE_ANTICIPEE'; reason?: string; winner?: number; ends: { team: number; points: number; at: string }[] };
export type Debt = { id: string; game: string; creditor: string; debtor: string; original: string; description: string; due: Game['due']; created: string; closed?: string; exclusive: boolean };
export type State = { games: Game[]; debts: Debt[] };
export const empty: State = { games: [], debts: [] };
export const identity = (s: string) => s.trim().normalize('NFKC').toLocaleLowerCase('fr');
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const score = (g: Game) => [0,1].map(t => g.ends.filter(e=>e.team===t).reduce((n,e)=>n+e.points,0));
export function start(state: State, input: Pick<Game,'teams'|'place'|'stake'|'due'>, prior?: Game): State {
  const sizes=input.teams.map(t=>t.players.length);
  if (!sizes.every(n=>n===sizes[0] && n>=1 && n<=3)) throw Error('Les équipes doivent avoir le même effectif, de 1 à 3 joueurs.');
  if (!Object.values(input.place).every(v=>v.trim())) throw Error('Complétez tous les champs du lieu.');
  if (input.teams.some(t=>!t.name.trim())) throw Error('Nommez les deux équipes.');
  const names=input.teams.flatMap(t=>t.players.map(identity));
  if (names.some(n=>!n)||new Set(names).size!==names.length) throw Error('Chaque joueur doit avoir un nom unique.');
  const busy=state.games.filter(g=>g.status==='EN_COURS').flatMap(g=>g.teams.flatMap(t=>t.players.map(identity)));
  if(names.some(n=>busy.includes(n))) throw Error('Un joueur participe déjà à une partie en cours.');
  if(prior && !nextRound(state,prior)) throw Error('Cette série ne permet plus de nouvelle manche.');
  const game: Game={...input,teams: input.teams.map(t=>({...t,players:t.players.map(p=>p.trim())})) as Game['teams'], id:id(),series:prior?.series??id(),previous:prior?.id,round:prior?prior.round+1:1,start:new Date().toISOString(),status:'EN_COURS',ends:[]};
  return {...state,games:[game,...state.games]};
}
export function nextRound(state: State, g: Game): string|undefined {
  const series=state.games.filter(x=>x.series===g.series);
  if(g.status==='EN_COURS'||series.some(x=>x.round>g.round)) return;
  if(g.round===1)return 'Revanche';
  if(g.round===2 && series.find(x=>x.round===1)?.winner!==g.winner)return 'La Belle';
}
function finish(state: State,g: Game,winner: number,reason: string): State {
  const end=new Date().toISOString();
  const done: Game={...g,end,winner,reason,status:reason==='SCORE_13'?'TERMINEE_13_PTS':'TERMINEE_ANTICIPEE'};
  const debts: Debt[]=g.stake.trim()?g.teams[1-winner].players.map((p,i)=>({id:id(),game:g.id,creditor:g.teams[winner].players[i],debtor:p,original:p,description:g.stake,due:g.due,created:end,exclusive:false})):[];
  return {games:state.games.map(x=>x.id===g.id?done:x),debts:[...debts,...state.debts]};
}
export function addPoints(state: State, gameId: string, team: number, points: number): State {
  const g=state.games.find(g=>g.id===gameId);
  if(!g||g.status!=='EN_COURS') throw Error('Cette partie est déjà terminée.');
  if(![0,1].includes(team)||!Number.isInteger(points)||points<1||points>(g.teams[0].players.length===1?3:6)) throw Error('Nombre de points non autorisé pour ce format.');
  const updated={...g,ends:[...g.ends,{team,points,at:new Date().toISOString()}]};
  if(score(updated)[team]>=13)return finish(state,updated,team,'SCORE_13');
  return {...state,games:state.games.map(x=>x.id===g.id?updated:x)};
}
export function stop(state: State, gameId: string, reason: string, forfeiting?: number): State {
  const g=state.games.find(g=>g.id===gameId);
  if(!g||g.status!=='EN_COURS')throw Error('Partie non active.');
  if(!['ABANDON','LIMITE_TEMPS','METEO','ACCORD_MUTUEL'].includes(reason))throw Error('Motif invalide.');
  const scores=score(g);
  if(reason==='ABANDON' && ![0,1].includes(forfeiting!))throw Error('Choisissez l’équipe qui déclare forfait.');
  if(reason!=='ABANDON' && scores[0]===scores[1])throw Error('Égalité : jouez une mène décisive ou enregistrez un forfait.');
  return finish(state,g,reason==='ABANDON'?1-forfeiting!:(scores[0]>scores[1]?0:1),reason);
}
export function settle(state: State, debtId: string): State {
  return {...state,debts:state.debts.map(d=>d.id===debtId&&!d.closed?{...d,closed:new Date().toISOString()}:d)};
}
export function takeOver(state: State, gameId: string, player: string): State {
  const g=state.games.find(g=>g.id===gameId);
  if(!g||g.winner===undefined||!g.teams[1-g.winner].players.includes(player))throw Error('Choisissez un joueur de l’équipe perdante.');
  if(state.debts.some(d=>d.game===gameId&&(d.closed||d.exclusive)))throw Error('Prise en charge déjà fixée ou règlement déjà commencé.');
  return {...state,debts:state.debts.map(d=>d.game===gameId?{...d,debtor:player,exclusive:true}:d)};
}
