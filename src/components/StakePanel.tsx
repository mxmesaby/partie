import React from "react";
import { Text, View, TouchableOpacity, StyleSheet } from "react-native";
import {
  State,
  Game,
  chooseStake,
  closeSeries,
  settle,
  takeOver,
  Trigger,
} from "../domain";
const labels: Record<Trigger, string> = {
  PREMIERE_PARTIE: "Enjeu sur cette partie",
  REVANCHE: "Seulement si les gagnants gagnent aussi la revanche",
  BELLE: "Enjeu sur la Belle",
  PARTIE_TOURNOI: "Enjeu sur cette partie de tournoi",
};
export function StakePanel({
  state,
  game,
  act,
}: {
  state: State;
  game: Game;
  act: (fn: (s: State) => State) => unknown;
}) {
  const stake = state.stakes.find((s) => s.series === game.series);
  if (!stake) return <Text style={s.text}>Sans enjeu · aucune dette</Text>;
  const debts = state.debts.filter((d) => d.stakeId === stake.id);
  const triggerGame = state.games.find((g) => g.id === stake.game);
  return (
    <View style={s.panel}>
      <Text style={s.heading}>L’enjeu · {stake.description}</Text>
      <Text style={s.text}>
        {stake.trigger
          ? labels[stake.trigger]
          : "Choisissez quand l’enjeu devient dû"}
      </Text>
      <Text style={s.text}>
        {stake.status === "DU"
          ? "Dû"
          : stake.status === "NON_DU"
            ? "Non dû"
            : "En attente"}{" "}
        ·{" "}
        {stake.due === "IMMEDIATE"
          ? "Tout de suite après acquisition"
          : "À consommer plus tard"}
      </Text>
      {!stake.trigger &&
        (["PREMIERE_PARTIE", "REVANCHE", "BELLE"] as const).map((t) => (
          <Action
            key={t}
            title={labels[t]}
            onPress={() => act((v) => chooseStake(v, stake.initial, t))}
          />
        ))}
      {!stake.trigger && (
        <Text style={s.text}>
          Confirmez ce choix avant de lancer la revanche. Il sera définitif.
        </Text>
      )}
      {stake.trigger === "REVANCHE" && (
        <Text style={s.text}>
          Si la revanche donne 1–1, cet enjeu ne sera pas dû et ne sera pas
          reporté sur la Belle.
        </Text>
      )}
      {stake.trigger === "BELLE" && (
        <Text style={s.text}>
          Pas de Belle en cas de 2–0 : l’enjeu ne sera pas dû.
        </Text>
      )}
      {stake.status === "DU" && triggerGame && stake.payer !== undefined && (
        <Text style={s.heading}>
          Équipe redevable : {triggerGame.teams[stake.payer].name}
          {stake.rule === "SEUIL_PERDANT_7"
            ? " · seuil des perdants : 0–6 perdants paient, ≥7 gagnants paient"
            : ""}
        </Text>
      )}
      {debts.map((d) => (
        <View key={d.id} style={s.debt}>
          <Text style={s.text}>
            {d.debtor} → {d.creditor} · {d.description}
          </Text>
          <Text style={s.text}>
            {d.closed
              ? `Honorée le ${new Date(d.closed).toLocaleString("fr-FR")}`
              : `Ouverte depuis le ${new Date(d.created).toLocaleString("fr-FR")}`}
            {d.exclusive
              ? ` · Reprise exclusive (initialement ${d.original})`
              : ""}
          </Text>
          {!d.closed && (
            <Action
              title="Marquer comme honorée"
              onPress={() => act((v) => settle(v, d.id))}
            />
          )}
        </View>
      ))}
      {debts.length > 0 &&
        !debts.some((d) => d.closed || d.exclusive) &&
        triggerGame &&
        stake.payer !== undefined &&
        triggerGame.teams[stake.payer].players.map((p) => (
          <Action
            key={p}
            title={`${p} régale toute l’équipe`}
            onPress={() => act((v) => takeOver(v, triggerGame.id, p))}
          />
        ))}
      {!game.tournament &&
        stake.trigger &&
        !state.closedSeries.includes(game.series) && (
          <Action
            title="Terminer le duel sans autre manche"
            onPress={() => act((v) => closeSeries(v, game.series))}
          />
        )}
    </View>
  );
}
function Action({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={s.button}
      onPress={onPress}
    >
      <Text style={s.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  panel: { backgroundColor: "#1c3d35", padding: 18, borderRadius: 20, gap: 12 },
  heading: { color: "#f8f2df", fontSize: 17, fontWeight: "700" },
  text: { color: "#d8e8dd", fontSize: 14, lineHeight: 22 },
  debt: { borderTopWidth: 1, borderColor: "#527b65", paddingTop: 12, gap: 8 },
  button: { backgroundColor: "#9ee8c5", padding: 14, borderRadius: 12 },
  buttonText: { color: "#12392e", textAlign: "center", fontWeight: "700" },
});
