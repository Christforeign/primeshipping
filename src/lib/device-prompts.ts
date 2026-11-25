export type DevicePrompt = "ios-install" | "android-install" | "permission" | "none";

export function devicePromptState(input: { ios: boolean; standalone: boolean; installAvailable: boolean; permission: NotificationPermission | "unsupported"; dismissed: boolean }): DevicePrompt {
  if (input.dismissed) return "none";
  if (!input.standalone && input.ios) return "ios-install";
  if (!input.standalone && input.installAvailable) return "android-install";
  return input.permission === "default" ? "permission" : "none";
}