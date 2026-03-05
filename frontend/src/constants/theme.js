export const V = {
  bg:               "#f2f2f0",
  white:            "#ffffff",
  sidebar:          "#ffffff",
  border:           "#e5e5e3",
  borderLight:      "#efefed",
  teal:             "#1ab7ea",
  tealLight:        "#e8f8fd",
  tealMid:          "#b3e8f7",
  text:             "#1a1a1a",
  textMid:          "#444444",
  textMuted:        "#767676",
  textLight:        "#999999",
  active:           "#f0f0ee",
  red:              "#e5484d",
  redLight:         "#fff0f0",
  green:            "#30a46c",
  greenLight:       "#f0fdf4",
  amber:            "#f59e0b",
  amberLight:       "#fffbeb",
  purple:           "#8b5cf6",
  purpleLight:      "#f5f3ff",
  enterpriseBg:     "#faf7ff",
  enterpriseBorder: "#ddd0f7",
  enterpriseText:   "#6d28d9",
};

export const EVENT_COLORS = {
  play: V.teal, pause: V.textMuted, seeked: V.purple,
  texttrackchange: V.green, qualitychange: V.amber,
  volumechange: V.textMuted, bufferstart: V.red, bufferend: V.teal,
  ended: V.green, timeupdate: V.borderLight,
};

export const fmtSecs = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
