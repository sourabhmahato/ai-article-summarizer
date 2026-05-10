/**
 * AI Article Summarizer — Popup Script
 * Handles summarization, history, copy, and UI state.
 */

// --- DOM Elements ---
const summarizeBtn = document.getElementById("summarize");
const copyBtn = document.getElementById("copy-btn");
const resultDiv = document.getElementById("result");
const summaryTypeSelect = document.getElementById("summary-type");
const wordCountDiv = document.getElementById("word-count");
const historyList = document.getElementById("history-list");
const historySection = document.getElementById("history-section");
const toggleHistoryBtn = document.getElementById("toggle-history");
const clearHistoryBtn = document.getElementById("clear-history");
const openSettingsBtn = document.getElementById("open-settings");

// --- Open settings page ---
if (openSettingsBtn) {
  openSettingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
}

// --- Summarize Button ---
summarizeBtn.addEventListener("click", async () => {
  resultDiv.innerHTML = '<div class="loading"><div class="loader"></div><span class="loading-text">Extracting article...</span></div>';
  summarizeBtn.disabled = true;
  wordCountDiv.textContent = "";

  const summaryType = summaryTypeSelect.value;

  // Get API key and provider (falls back to built-in defaults)
  chrome.storage.sync.get(["aiProvider", "geminiApiKey", "groqApiKey"], async (stored) => {
    const provider = stored.aiProvider || (typeof CONFIG !== "undefined" ? CONFIG.DEFAULT_PROVIDER : "groq");
    let apiKey = provider === "groq" ? stored.groqApiKey : stored.geminiApiKey;

    // Fall back to built-in default key if none is saved
    if (!apiKey && typeof CONFIG !== "undefined" && provider === "groq" && CONFIG.DEFAULT_GROQ_KEY) {
      apiKey = CONFIG.DEFAULT_GROQ_KEY;
    }

    if (!apiKey) {
      resultDiv.innerHTML = '⚠️ API key not set. <a href="#" id="open-options">Open Settings</a> to add your API key.';
      document.getElementById("open-options")?.addEventListener("click", (e) => {
        e.preventDefault();
        chrome.runtime.openOptionsPage();
      });
      summarizeBtn.disabled = false;
      return;
    }

    // Get active tab and extract text
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab || !tab.id) {
        resultDiv.innerText = "❌ No active tab found.";
        summarizeBtn.disabled = false;
        return;
      }

      // Check if we can access this tab
      if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://") || tab.url?.startsWith("about:")) {
        resultDiv.innerText = "❌ Cannot summarize browser internal pages. Navigate to a regular webpage.";
        summarizeBtn.disabled = false;
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: "GET_ARTICLE_TEXT" }, async (res) => {
        if (chrome.runtime.lastError) {
          resultDiv.innerText = "❌ Cannot access this page. Try refreshing the page first, then click Summarize again.";
          summarizeBtn.disabled = false;
          return;
        }

        if (!res || !res.text || res.text.trim().length < 50) {
          resultDiv.innerText = "❌ Not enough text found on this page to summarize.";
          summarizeBtn.disabled = false;
          return;
        }

        // Show word count
        const articleWords = res.wordCount || res.text.split(/\s+/).filter(Boolean).length;
        wordCountDiv.textContent = `📄 Article: ~${articleWords.toLocaleString()} words`;

        // Update loading text
        resultDiv.innerHTML = '<div class="loading"><div class="loader"></div><span class="loading-text">Generating summary...</span></div>';

        try {
          const summary = await getSummary(res.text, summaryType, apiKey, provider);
          resultDiv.innerText = summary;

          // Show summary word count
          const summaryWords = summary.split(/\s+/).filter(Boolean).length;
          wordCountDiv.textContent = `📄 Article: ~${articleWords.toLocaleString()} words → Summary: ~${summaryWords} words`;

          // Save to history
          saveToHistory(tab.title || tab.url, summary, summaryType);
        } catch (error) {
          resultDiv.innerText = `❌ ${error.message}`;
        } finally {
          summarizeBtn.disabled = false;
        }
      });
    });
  });
});

// --- Copy Button ---
copyBtn.addEventListener("click", () => {
  const summaryText = resultDiv.innerText;

  if (!summaryText || summaryText.trim() === "" || summaryText.startsWith("❌") || summaryText.includes("click Summarize")) {
    return;
  }

  navigator.clipboard.writeText(summaryText).then(() => {
    const original = copyBtn.innerText;
    copyBtn.innerText = "✓ Copied!";
    copyBtn.classList.add("copied");
    setTimeout(() => {
      copyBtn.innerText = original;
      copyBtn.classList.remove("copied");
    }, 2000);
  }).catch((err) => {
    console.error("Failed to copy:", err);
  });
});

// --- History ---
if (toggleHistoryBtn) {
  toggleHistoryBtn.addEventListener("click", () => {
    const isVisible = historySection.style.display !== "none";
    historySection.style.display = isVisible ? "none" : "block";
    toggleHistoryBtn.textContent = isVisible ? "📜 History" : "✕ Close";
  });
}

if (clearHistoryBtn) {
  clearHistoryBtn.addEventListener("click", () => {
    chrome.storage.local.set({ summaryHistory: [] }, () => {
      renderHistory([]);
    });
  });
}

function saveToHistory(title, summary, type) {
  chrome.storage.local.get(["summaryHistory"], (result) => {
    const history = result.summaryHistory || [];
    history.unshift({
      title: title?.substring(0, 60) || "Untitled",
      summary: summary.substring(0, 300),
      type,
      timestamp: Date.now(),
    });

    // Keep only last 20 items
    if (history.length > 20) history.length = 20;

    chrome.storage.local.set({ summaryHistory: history }, () => {
      renderHistory(history);
    });
  });
}

function renderHistory(history) {
  if (!historyList) return;

  if (!history || history.length === 0) {
    historyList.innerHTML = '<p class="empty-history">No summaries yet.</p>';
    return;
  }

  historyList.innerHTML = history
    .map((item) => {
      const date = new Date(item.timestamp);
      const timeStr = date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `
        <div class="history-item">
          <div class="history-title">${escapeHtml(item.title)}</div>
          <div class="history-meta">${item.type} · ${timeStr}</div>
          <div class="history-preview">${escapeHtml(item.summary)}</div>
        </div>
      `;
    })
    .join("");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Load history on popup open
chrome.storage.local.get(["summaryHistory"], (result) => {
  renderHistory(result.summaryHistory || []);
});

// --- AI Summary (multi-provider) ---
async function getSummary(text, summaryType, apiKey, provider) {
  const maxLength = 25000;
  const truncatedText = text.length > maxLength ? text.substring(0, maxLength) + "\n\n[Article truncated...]" : text;

  const prompt = buildPrompt(summaryType, truncatedText);

  if (provider === "groq") {
    return callGroq(prompt, apiKey);
  } else {
    return callGemini(prompt, apiKey);
  }
}

function buildPrompt(summaryType, articleText) {
  switch (summaryType) {
    case "brief":
      return `You are an expert article summarizer. Provide a clear, concise summary of the following article in 2-3 sentences. Focus on the main point and key takeaway.\n\nArticle:\n${articleText}`;
    case "detailed":
      return `You are an expert article summarizer. Provide a comprehensive summary of the following article. Cover all main points, key arguments, supporting evidence, and conclusions. Use clear paragraph structure.\n\nArticle:\n${articleText}`;
    case "bullets":
      return `You are an expert article summarizer. Summarize the following article in 5-8 key bullet points. Format each point starting with "• ". Each point should capture a distinct key insight. Be concise but informative.\n\nArticle:\n${articleText}`;
    default:
      return `Summarize the following article clearly and concisely:\n\n${articleText}`;
  }
}

// --- Groq API (OpenAI-compatible) ---
async function callGroq(prompt, apiKey) {
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are an expert article summarizer. Be clear, accurate, and concise." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Invalid Groq API key. Check your key in Settings.");
      if (res.status === 429) throw new Error("Rate limit reached. Wait a moment and try again.");
      throw new Error(err?.error?.message || `Groq API error (${res.status}).`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("No summary generated. Try a different article.");
    return text.trim();
  } catch (error) {
    if (error.message.includes("API") || error.message.includes("Rate") || error.message.includes("No summary")) throw error;
    throw new Error("Network error. Check your internet connection.");
  }
}

// --- Gemini API ---
async function callGemini(prompt, apiKey) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.error?.message || "";
      if (res.status === 400 && msg.includes("API_KEY")) throw new Error("Invalid Gemini API key. Check Settings.");
      if (res.status === 429) throw new Error("Rate limit reached. Wait a moment and try again.");
      if (res.status === 403) throw new Error("API key doesn't have access. Enable Gemini API.");
      throw new Error(msg || `Gemini API error (${res.status}).`);
    }

    const data = await res.json();
    if (data?.candidates?.[0]?.finishReason === "SAFETY") throw new Error("Content blocked by safety filters.");
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No summary generated. Try a different article.");
    return text.trim();
  } catch (error) {
    if (error.message.includes("API") || error.message.includes("Rate") || error.message.includes("Content") || error.message.includes("No summary")) throw error;
    throw new Error("Network error. Check your internet connection.");
  }
}