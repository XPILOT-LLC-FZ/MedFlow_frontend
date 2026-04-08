const fetch = require("node-fetch"); // node 18+ has native fetch but Next.js might be using its own. We'll use the native global fetch if we run with node > 18.

async function test() {
  try {
    const res = await fetch("https://astonishing-heart-production-9d98.up.railway.app/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "super@medflow.com", password: "Super@2026" })
    });
    const data = await res.json();
    console.log("Login HTTP Status:", res.status);
    console.log("Login Response JSON:", JSON.stringify(data, null, 2));

    const health = await fetch("https://astonishing-heart-production-9d98.up.railway.app/api/health");
    const healthData = await health.json();
    console.log("Health Status:", health.status);
    console.log("Health Response JSON:", JSON.stringify(healthData, null, 2));

  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

test();
