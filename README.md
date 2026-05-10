# ⚡ TL;DReader

Too long? Didn't read? Now you don't have to. A Chrome extension that uses AI to instantly summarize any article on the web. Get brief summaries, detailed breakdowns, or bullet-point key takeaways — all in one click.

## Features

- **3 Summary Modes** — Brief (2-3 sentences), Detailed (full breakdown), or Bullet Points
- **Smart Extraction** — Intelligently pulls article content while filtering out ads, navigation, and noise
- **Multi-Provider AI** — Choose between Groq (Llama 3.3 70B) or Google Gemini 2.0 Flash
- **Summary History** — Automatically saves your last 20 summaries for quick reference
- **Word Count** — Shows article length vs summary length
- **Copy to Clipboard** — One-click copy of any summary
- **API Key Validation** — Tests your key before saving
- **Works Everywhere** — Articles, blogs, news, docs, and more

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** and select this project folder
5. Click the puzzle icon and **pin** TL;DReader to your toolbar
6. Navigate to any article and click the extension icon → **Summarize**!

> Works out of the box with a built-in API key. You can also set your own key in Settings.

## Using Your Own API Key (Optional)

### Groq (recommended — free & fast)
1. Visit [console.groq.com/keys](https://console.groq.com/keys)
2. Sign up for free (no credit card needed)
3. Create an API key
4. Paste it in TL;DReader Settings

### Google Gemini
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create an API key
3. Paste it in TL;DReader Settings and select "Gemini" as provider

## Tech Stack

- **Chrome Extension Manifest V3**
- **Groq API** (Llama 3.3 70B) / **Google Gemini 2.0 Flash**
- **Vanilla JavaScript** — no frameworks, no build step
- **Chrome Storage API** — for settings (sync) and history (local)

## Privacy

- Your API key is stored locally in Chrome and only sent to the selected AI provider
- Article text is sent to the AI provider for summarization only
- Summary history is stored locally on your device
- No analytics, no tracking, no data collection

## License

MIT
