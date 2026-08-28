import { calcDirectHPP, calcMarginFromPrice, calcMarkupFromPrice, menuHealth, validateMenu } from "../js/core/engine-menu.js";

let passed = 0, failed = 0;
const assert = (c, m) => { if (c) passed++; else { failed++; console.error("FAIL:", m); } };
const approx = (a, b, e = 0.001) => Math.abs(a - b) < e;

const dh = calcDirectHPP(5288.8, 800);
assert(approx(dh.directHPP, 6088.8), `direct HPP = 6088.8, got ${dh.directHPP}`);

const margin = calcMarginFromPrice(15000, 6088.8);
assert(approx(margin, (15000 - 6088.8) / 15000 * 100), `margin(15000,6088.8) correct, got ${margin}`);

const markup = calcMarkupFromPrice(15000, 6088.8);
assert(approx(markup, (15000 - 6088.8) / 6088.8 * 100), "markup correct");
assert(!approx(margin, markup), "margin != markup (PRD §20)");

const healthy = menuHealth(50, { healthyMarginThreshold: 35, reviewMarginThreshold: 20 });
assert(healthy.key === "healthy", `50% -> healthy, got ${healthy.key}`);
const review = menuHealth(30, { healthyMarginThreshold: 35, reviewMarginThreshold: 20 });
assert(review.key === "review", `30% -> review, got ${review.key}`);
const risk = menuHealth(10, { healthyMarginThreshold: 35, reviewMarginThreshold: 20 });
assert(risk.key === "risk", `10% -> risk, got ${risk.key}`);
const loss = menuHealth(-5, { healthyMarginThreshold: 35, reviewMarginThreshold: 20 });
assert(loss.key === "loss", `-5% -> loss, got ${loss.key}`);
assert(menuHealth(null, {}).key === "no-price", "null margin -> no-price");

const v = validateMenu({ name: "", recipeId: "" }, false, false);
assert(v.length >= 3, "invalid menu flagged");
const vOk = validateMenu({ name: "Kopi", recipeId: "REC-1" }, true, undefined);
assert(vOk.length === 0, "valid menu passes");

console.log(`\nPASS ${passed} / ${passed + failed}`);
process.exit(failed ? 1 : 0);
