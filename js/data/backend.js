import { DATA_BACKEND } from "../config.js";

let mod;
if (DATA_BACKEND === "gas") {
  mod = await import("./api.js");
} else {
  mod = await import("./store.js");
}

export const backend = mod.backend;
export { seedIfEmpty } from "./store.js";
