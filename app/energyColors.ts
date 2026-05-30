// Apple system hues for the four energy bands, mirroring EnergyBand.tint in
// the app. Shared by EnergyCurve (the gradient stroke) and SiriPhrases (the
// coloured band words), so there's one source of truth for the palette.
export const energyColors = {
  intense: "#ff453a",
  energetic: "#bf5af2",
  mellow: "#0a84ff",
  glacial: "#40c8e0",
} as const

export type EnergyBand = keyof typeof energyColors
