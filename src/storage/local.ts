import AsyncStorage from "@react-native-async-storage/async-storage";
import { empty, State } from "../domain/types";
export const KEY = "parties.v2";
export async function load(): Promise<State> {
  // Suppression explicitement autorisée : ancienne version uniquement, jamais les données v2.
  await AsyncStorage.removeItem("parties.v1");
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return { ...empty };
  const data = JSON.parse(raw);
  if (
    !["games", "debts", "stakes", "tournaments", "closedSeries"].every((k) =>
      Array.isArray(data[k]),
    )
  )
    throw Error("Sauvegarde incompatible.");
  return data;
}
export const save = (state: State) =>
  AsyncStorage.setItem(KEY, JSON.stringify(state));
