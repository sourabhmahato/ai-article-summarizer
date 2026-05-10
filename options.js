const apiKeyInput = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const statusDiv = document.getElementById("status");
const toggleBtn = document.getElementById("toggle-vis");
const providerSelect = document.getElementById("provider");
const helpGroq = document.getElementById("help-groq");
const helpGemini = document.getElementById("help-gemini");

// Load saved settings
chrome.storage.sync.get(["aiProvider", "geminiApiKey", "groqApiKey"], (result) => {
  const provider = result.aiProvider || "groq";
  providerSelect.value = provider;
  updateHelpText(provider);

  if (provider === "groq" && result.groqApiKey) {
    apiKeyInput.value = result.groqApiKey;
  } else if (provider === "gemini" && result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
});

// Switch help text and load correct key when provider changes
providerSelect.addEventListener("change", () => {
  const provider = providerSelect.value;
  updateHelpText(provider);
  statusDiv.className = "status";

  // Load the correct key for this provider
  chrome.storage.sync.get(["geminiApiKey", "groqApiKey"], (result) => {
    if (provider === "groq") {
      apiKeyInput.value = result.groqApiKey || "";
    } else {
      apiKeyInput.value = result.geminiApiKey || "";
    }
  });
});

function updateHelpText(provider) {
  helpGroq.style.display = provider === "groq" ? "inline" : "none";
  helpGemini.style.display = provider === "gemini" ? "inline" : "none";
}

// Toggle key visibility
toggleBtn.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleBtn.textContent = isPassword ? "🙈" : "👁️";
});

// Save & validate
saveBtn.addEventListener("click", async () => {
  const key = apiKeyInput.value.trim();
  const provider = providerSelect.value;

  if (!key) {
    showStatus("Please enter an API key.", "error");
    return;
  }

  saveBtn.disabled = true;
  saveBtn.textContent = "Validating...";
  showStatus("Testing your API key...", "info");

  const isValid = await validateKey(provider, key);

  if (isValid) {
    const saveData = { aiProvider: provider };
    if (provider === "groq") {
      saveData.groqApiKey = key;
    } else {
      saveData.geminiApiKey = key;
    }

    chrome.storage.sync.set(saveData, () => {
      showStatus("✅ API key validated and saved!", "success");
    });
  } else {
    showStatus("❌ Invalid API key. Please check and try again.", "error");
  }

  saveBtn.textContent = "Save & Validate";
  saveBtn.disabled = false;
});

async function validateKey(provider, key) {
  try {
    if (provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 5,
        }),
      });
      return res.ok;
    } else {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Say OK" }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        }
      );
      return res.ok;
    }
  } catch {
    return false;
  }
}

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  if (type === "success") {
    setTimeout(() => { statusDiv.className = "status"; }, 4000);
  }
}
