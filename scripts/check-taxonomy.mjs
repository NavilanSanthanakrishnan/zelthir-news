import { buildTaxonomyPayload } from "../src/server/taxonomyRoutes.mjs";

const requiredPersonas = [
  "general_reader",
  "local_resident",
  "policy_watcher",
  "founder",
  "operator",
  "investor",
  "student",
];

const requiredInterests = [
  "politics",
  "technology",
  "business",
  "culture",
  "sports",
  "climate",
  "security",
  "health",
  "education",
];

const requiredLocationTypes = ["city", "state"];
const payload = buildTaxonomyPayload();

function idsFor(items) {
  return new Set(Array.isArray(items) ? items.map((item) => item.id) : []);
}

function findMissing(requiredIds, items) {
  const ids = idsFor(items);
  return requiredIds.filter((id) => !ids.has(id));
}

const missing = {
  personas: findMissing(requiredPersonas, payload.personas),
  interests: findMissing(requiredInterests, payload.interests),
  locationTypes: findMissing(requiredLocationTypes, payload.locationTypes),
};

const failures = Object.entries(missing).filter(([_key, ids]) => ids.length);

if (!payload.ok || failures.length) {
  console.error(JSON.stringify({ ok: false, missing }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  personas: payload.personas.length,
  interests: payload.interests.length,
  locationTypes: payload.locationTypes.length,
}, null, 2));
