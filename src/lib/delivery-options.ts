export function deliveryChoices(mode?: string | null) {
  return { home: mode !== "pickup", pickup: mode !== "home" };
}