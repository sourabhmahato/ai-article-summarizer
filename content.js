/**
 * AI Article Summarizer — Content Script
 * Extracts meaningful article text from web pages.
 */

function getArticleText() {
  // Remove noise elements before extraction
  const noiseSelectors = [
    "nav", "footer", "header", "aside",
    "script", "style", "noscript", "iframe",
    "[role='navigation']", "[role='banner']", "[role='contentinfo']",
    ".ad", ".ads", ".advertisement", ".sidebar",
    ".comments", ".comment-section", "#comments",
    ".social-share", ".share-buttons",
    ".related-posts", ".recommended",
    ".newsletter", ".popup", ".modal",
    ".cookie-banner", ".cookie-consent"
  ];

  // Clone the body so we don't modify the actual page
  const clone = document.body.cloneNode(true);

  // Remove noise from clone
  noiseSelectors.forEach((sel) => {
    clone.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // Strategy 1: Look for <article> tag
  const article = clone.querySelector("article");
  if (article && article.innerText.trim().length > 200) {
    return cleanText(article.innerText);
  }

  // Strategy 2: Look for main content area
  const main =
    clone.querySelector("main") ||
    clone.querySelector("[role='main']") ||
    clone.querySelector("#content") ||
    clone.querySelector(".content") ||
    clone.querySelector(".post-content") ||
    clone.querySelector(".article-content") ||
    clone.querySelector(".entry-content") ||
    clone.querySelector(".story-body");

  if (main && main.innerText.trim().length > 200) {
    return cleanText(main.innerText);
  }

  // Strategy 3: Collect all paragraphs with substantial text
  const paragraphs = Array.from(clone.querySelectorAll("p"));
  const meaningfulParagraphs = paragraphs.filter(
    (p) => p.innerText.trim().length > 40
  );

  if (meaningfulParagraphs.length > 0) {
    return cleanText(meaningfulParagraphs.map((p) => p.innerText).join("\n\n"));
  }

  // Strategy 4: Last resort — grab all text from body clone
  return cleanText(clone.innerText);
}

function cleanText(text) {
  return text
    .replace(/\t/g, " ")           // Replace tabs with spaces
    .replace(/ {3,}/g, "  ")       // Collapse excessive spaces
    .replace(/\n{3,}/g, "\n\n")    // Collapse excessive newlines
    .trim();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((req, _sender, sendResponse) => {
  if (req.type === "GET_ARTICLE_TEXT") {
    const text = getArticleText();
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    sendResponse({ text, wordCount });
  }
  return true; // Keep message channel open for async
});
