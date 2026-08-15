# Privacy Policy — TL;DReader

**Last updated:** August 2026

TL;DReader is a Chrome extension that generates AI-powered summaries of web articles. This policy explains what data the extension accesses and how it is used.

## Data We Access

**Website content.** When you click the extension icon on an article page, TL;DReader extracts the readable text content of that page (filtering out ads, navigation, and other non-article elements) in order to generate a summary.

**Authentication information.** Your AI provider API key (Groq or Google Gemini, depending on your selection) is stored locally using `chrome.storage` so you don't have to re-enter it each time.

## How Your Data Is Used

- Extracted article text is sent directly to the AI provider you select (Groq or Google Gemini) over HTTPS, solely to generate the summary you requested.
- Your API key is stored locally on your device via Chrome's sync storage and is never sent to any server operated by us.
- Your last 20 summaries are stored locally on your device for quick reference.

## What We Do Not Do

- We do not operate any backend server. There is no data collection on our end.
- We do not sell, rent, or transfer your data to any third party, except as required to fulfill the summarization request you initiate (sending text to your selected AI provider).
- We do not use your data for advertising, profiling, or any purpose unrelated to generating the summary you asked for.
- We do not collect personally identifiable information, financial information, health information, location data, or browsing history.

## Third-Party AI Providers

When you use TL;DReader, the article text is sent to the AI provider you've configured (Groq or Google Gemini). Your use of those services is also subject to their respective privacy policies:
- Groq: https://groq.com/privacy-policy/
- Google Gemini: https://policies.google.com/privacy

## Data Retention

Summary history and settings are stored locally on your device only. Uninstalling the extension removes all locally stored data. We do not retain any data on our end, as we do not operate a backend.

## Changes to This Policy

If this policy changes, the updated version will be posted at this same URL with a revised "Last updated" date.

## Contact

Questions about this policy can be directed via the GitHub repository:
https://github.com/sourabhmahato/ai-article-summarizer
