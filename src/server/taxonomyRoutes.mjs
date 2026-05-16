import express from "express";

const PERSONAS = [
  { id: "general_reader", label: "General reader" },
  { id: "local_resident", label: "Local resident" },
  { id: "policy_watcher", label: "Policy watcher" },
  { id: "founder", label: "Founder" },
  { id: "operator", label: "Operator" },
  { id: "investor", label: "Investor" },
  { id: "student", label: "Student" },
];

const INTERESTS = [
  { id: "politics", label: "Politics" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "culture", label: "Culture" },
  { id: "sports", label: "Sports" },
  { id: "climate", label: "Climate" },
  { id: "security", label: "Security" },
  { id: "health", label: "Health" },
  { id: "education", label: "Education" },
];

const LOCATION_TYPES = [
  { id: "city", label: "City" },
  { id: "state", label: "State" },
];

export function buildTaxonomyPayload() {
  return {
    ok: true,
    personas: PERSONAS,
    interests: INTERESTS,
    locationTypes: LOCATION_TYPES,
  };
}

export default function createTaxonomyRouter() {
  const router = express.Router();

  router.get("/api/taxonomy", (_req, res) => {
    res.json(buildTaxonomyPayload());
  });

  return router;
}
