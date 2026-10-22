import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEY = "biti_token";

function webStore(): Storage | null {
  if (Platform.OS !== "web") return null;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export async function loadToken(): Promise<string | null> {
  const web = webStore();
  if (web) return web.getItem(KEY);
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

export async function saveToken(value: string | null): Promise<void> {
  const web = webStore();
  if (web) {
    if (value) web.setItem(KEY, value);
    else web.removeItem(KEY);
    return;
  }
  try {
    if (value) await SecureStore.setItemAsync(KEY, value);
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    /* native keychain unavailable in some simulators */
  }
}
