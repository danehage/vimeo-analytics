export const V = {
  bg:               "#0e1216",
  white:            "#151b21",
  sidebar:          "#0e1216",
  border:           "rgba(114,130,163,0.12)",
  borderLight:      "rgba(114,130,163,0.06)",
  teal:             "#03c1eb",
  tealLight:        "rgba(3,193,235,0.12)",
  tealMid:          "rgba(3,193,235,0.24)",
  text:             "#f9fafb",
  textMid:          "#e4e9ef",
  textMuted:        "#b6c0cc",
  textLight:        "#7282a3",
  active:           "rgba(190,227,248,0.16)",
  red:              "#e5484d",
  redLight:         "rgba(229,62,62,0.12)",
  green:            "#30a46c",
  greenLight:       "rgba(48,164,108,0.12)",
  amber:            "#f59e0b",
  amberLight:       "rgba(245,158,11,0.12)",
  purple:           "#8b5cf6",
  purpleLight:      "rgba(139,92,246,0.12)",
  enterpriseBg:     "rgba(109,40,217,0.08)",
  enterpriseBorder: "rgba(109,40,217,0.2)",
  enterpriseText:   "#a78bfa",
  tableHeaderBg:    "#1d242c",
  cardRadius:       12,
};

export const EVENT_COLORS = {
  play: V.teal, pause: V.textMuted, seeked: V.purple,
  texttrackchange: V.green, qualitychange: V.amber,
  volumechange: V.textMuted, bufferstart: V.red, bufferend: V.teal,
  ended: V.green, timeupdate: V.borderLight,
};

export const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
