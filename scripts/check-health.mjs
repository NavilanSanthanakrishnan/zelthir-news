import dotenv from "dotenv";

dotenv.config();

const apiBaseUrl = process.env.API_BASE_URL?.trim() || "http://127.0.0.1:3210";
const healthUrl = new URL("/api/health", apiBaseUrl);

try {
  const response = await fetch(healthUrl);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok || !body?.ok) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          status: response.status,
          url: healthUrl.toString(),
          services: body?.services || null,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.log(JSON.stringify(body, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        url: healthUrl.toString(),
        error: error instanceof Error ? error.message : "Health check failed",
      },
      null,
      2,
    ),
  );
  process.exit(1);
}
