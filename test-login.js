const fetchWithFallback = async (...args) => {
  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch(...args);
  }

  const nodeFetchModule = await import("node-fetch");
  return nodeFetchModule.default(...args);
};

async function test() {
  try {
    const res = await fetchWithFallback("https://astonishing-heart-production-9d98.up.railway.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "super@medflow.com", password: "Super@2026" })
    });
    const data = await res.json();
    console.log("Login HTTP Status:", res.status);
    console.log("Login Response JSON:", JSON.stringify(data, null, 2));

    const health = await fetchWithFallback("https://astonishing-heart-production-9d98.up.railway.app/api/health");
    const healthData = await health.json();
    console.log("Health Status:", health.status);
    console.log("Health Response JSON:", JSON.stringify(healthData, null, 2));

  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

test();
