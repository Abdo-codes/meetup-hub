export type ProjectLinkType = "testflight" | "appstore" | "playstore" | "web";

export function getProjectLinkType(url: string): ProjectLinkType {
  const normalized = url.toLowerCase();
  if (normalized.includes("testflight.apple.com/join")) return "testflight";
  if (normalized.includes("apps.apple.com")) return "appstore";
  if (normalized.includes("play.google.com/store/apps")) return "playstore";
  return "web";
}

export function getProjectLinkLabel(type: ProjectLinkType) {
  switch (type) {
    case "testflight":
      return "TestFlight";
    case "appstore":
      return "App Store";
    case "playstore":
      return "Google Play";
    default:
      return "Website";
  }
}
