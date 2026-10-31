import type { GarmentKind } from "./garments";

/** Demo garment measurements in centimetres, measured flat. */
export type SizeGuide = { columns: string[]; rows: (string | number)[][]; note: string };

const tops = (chest: number, length: number, sleeve: number, step = 2): (string | number)[][] =>
  ["XS", "S", "M", "L", "XL", "XXL"].map((s, i) => [s, chest + i * step, length + i * 2, sleeve + i]);

const TOP_COLUMNS = ["Size", "Chest width", "Body length", "Sleeve"];

export const sizeGuides: Record<GarmentKind, SizeGuide> = {
  tee: { columns: TOP_COLUMNS, rows: tops(56, 70, 22), note: "Oversized fit. Chest measured 2.5 cm below the armhole." },
  "tee-boxy": { columns: TOP_COLUMNS, rows: tops(54, 62, 20), note: "Boxy, cropped fit." },
  hoodie: { columns: TOP_COLUMNS, rows: tops(60, 68, 62), note: "Relaxed fit. Sleeve measured from shoulder seam." },
  "zip-hoodie": { columns: TOP_COLUMNS, rows: tops(58, 68, 63), note: "Regular fit. Sleeve measured from shoulder seam." },
  jacket: { columns: TOP_COLUMNS, rows: tops(62, 70, 64), note: "Boxy fit with room to layer." },
  cargo: {
    columns: ["Size", "Waist", "Inseam", "Leg opening"],
    rows: ["28", "30", "32", "34", "36"].map((s, i) => [s, 72 + i * 5, 78, 21 + i * 0.5]),
    note: "Waist measured around. Drawcord hems adjust the leg opening.",
  },
};
