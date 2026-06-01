// Apple system hues for the four energy bands, mirroring EnergyBand.tint in
// the app. Shared by EnergyCurve (the gradient stroke) and SiriPhrases (the
// coloured band words), so there's one source of truth for the palette.
export const energyColors = {
  intense: "oklch(0.659322 0.230058 35.2202)",
  energetic: "oklch(0.5853 0.3108 307.03)",
  mellow: "oklch(0.5529 0.259 261.33)",
  glacial: "oklch(0.7588 0.1702 221.9065)",
} as const

export type EnergyBand = keyof typeof energyColors
