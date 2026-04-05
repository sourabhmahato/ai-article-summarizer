const apiKeyInput = document.getElementById("api-key");
const saveBtn = document.getElementById("save-btn");
const statusDiv = document.getElementById("status");
const toggleBtn = document.getElementById("toggle-vis");

// Load saved key on page open
chrome.storage.sync.get(["geminiApiKey"], (result) => {
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
  }
});

// Toggle key visibility
toggleBtn.addEventListener("click", () => {
  const isPassword = apiKeyInput.type === "password";
  apiKeyInput.type = isPassword ? "text" : "password";
  toggleBtn.textContent = isPassword ? "🙈" : "👁️";
});

// Save key
saveBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();

  if (!key) {
    showStatus("Please enter an API key.", "error");
    return;
  }

  chrome.storage.sync.set({ geminiApiKey: key }, () => {
    showStatus("API key saved successfully!", "success");
  });
});

function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;

  if (type === "success") {
    setTimeout(() => {
      statusDiv.className = "status";
    }, 3000);
  }
}
