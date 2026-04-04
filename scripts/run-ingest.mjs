import { runHomepageDiscovery } from "../src/ingest/discoveryAgent.mjs";

const home = await runHomepageDiscovery();
console.log(JSON.stringify(home, null, 2));
