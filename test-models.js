import fs from "fs";

async function checkGroqModels() {
  try {
    const envFile = fs.readFileSync(".env", "utf-8");
    const keyMatch = envFile.match(/GROQ_API_KEY=(.+)/);

    if (!keyMatch) {
      console.log("No GROQ_API_KEY found in .env");
      return;
    }

    const key = keyMatch[1].trim().replace(/['"]/g, "");

    // We do a raw REST fetch to Groq to see EXACTLY what models your key is allowed to see
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Groq API Error:",
        data.error?.message || "Unknown error occurred",
      );
    } else {
      console.log("--- MODELS YOUR GROQ KEY HAS ACCESS TO ---");
      // Groq returns an object with a "data" array containing the models
      const supported = data.data.map((m) => m.id);

      // Joining with newlines for easier readability
      console.log(supported.join("\n"));
    }
  } catch (err) {
    console.error("Failed to run test:", err.message);
  }
}

checkGroqModels();
