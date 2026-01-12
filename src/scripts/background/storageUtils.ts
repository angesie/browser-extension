export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const data = await chrome.storage.local.get(key);
    return (data?.[key] as T) ?? fallback;
  } catch (e) {
    console.error("storageGet error", key, e);
    return fallback;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (e) {
    console.error("storageSet error", key, e);
  }
}