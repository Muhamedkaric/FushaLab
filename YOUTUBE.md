# FushaLab — YouTube & Video Sources

Curated YouTube channels and playlists for the Listening section of FushaLab.
All channels teach **Modern Standard Arabic (MSA / الفصحى)** — no dialects.

Machine-readable version: `public/data/listening/channels.json`

---

## How to add a channel or playlist

1. Find the YouTube playlist ID from the URL: `youtube.com/playlist?list=XXXXXXX` — copy the `XXXXXXX` part
2. Open `public/data/listening/channels.json`
3. Find the channel entry and fill in the `playlistId` field (remove `UNKNOWN`)
4. Set `"verified": true`
5. To add individual videos: add entries to `notableVideos` with the `youtubeId` from the URL

---

## What still needs to be done (open TODOs)

Most playlist IDs below are marked `UNKNOWN` because YouTube requires a browser to render the page. You need to:

- Visit each channel in a browser
- Open their Playlists tab
- Click a playlist → copy the ID from the URL bar

| Channel | What's missing |
|---------|---------------|
| Learn Arabic with Khasu | Playlist IDs (visit @LearnArabicKhasu → Playlists) |
| Adnan Mrkonjic | Level 2 + Level 3 playlist IDs, channel ID |
| Imran Alawiye | Playlist IDs (visit @ImranAlawiye-gatewaytoarabic) |
| Arabic Khatawaat | Playlist IDs for all 3 levels |
| Madinah Arabic | Playlist IDs |
| Learning Arabic with Angela | Channel URL + playlist IDs |
| Al Jazeera | Best documentary playlists (slower content) |
| DW Arabic | Any documentary/cultural playlists |

---

## Channels — Overview

### Tier 1 — Structured MSA Lessons

#### 🇧🇦 Learn Arabic with Khasu (English) ★★★★★
- **Channel:** https://www.youtube.com/@LearnArabicKhasu
- **Subscribers:** ~677K
- **Levels:** A1 – B2
- **Language of instruction:** English
- **Why:** Exclusively MSA/Fusha, no dialects. Creator studied Arabic formally in Jordan. Clear, practical, modern. One of the very best free MSA channels. Top video has 8.3M views.
- **Best for:** Beginners who prefer English-medium instruction

#### 🇧🇦 Hfz. Adnan Mrkonjic — Nauči Arapski Jezik (Bosnian) ★★★★★
- **Channel:** Search "Adnan Mrkonjic arapski jezik" on YouTube, or visit http://nauciarapski.com
- **Known playlist (Level 1):** https://www.youtube.com/watch?v=18kGuThiIJo&list=PLyb_wIFb3qXg2Z6HJmyRWMxYcLAR9FKEj
- **Levels:** A1 – B1 (3 levels: 78 + 65 + 63 lessons)
- **Language of instruction:** Bosnian
- **Why:** The only comprehensive structured Arabic course in Bosnian on YouTube. Hafiz Mrkonjic studied in Kuwait, taught in the Arab world. Grammar-first approach with Quranic examples. 206+ total lessons across 3 levels.
- **Best for:** Bosnian speakers who want structure in their native language

#### 📚 Imran Alawiye — Gateway to Arabic (English) ★★★★★
- **Channel:** https://www.youtube.com/@ImranAlawiye-gatewaytoarabic
- **Subscribers:** ~630K — 379 videos
- **Levels:** A1 – B2
- **Language of instruction:** English
- **Why:** Author of the widely used Gateway to Arabic textbook series. The most grammar-complete free MSA channel. Classroom-style but very thorough.
- **Best for:** Learners who want solid grammar knowledge alongside reading

#### 🎓 Arabic Khatawaat (English) ★★★★
- **Channel:** https://www.youtube.com/@ArabicKhatawaat
- **Subscribers:** ~259K — 280+ videos
- **Levels:** A1 – B1 (3 explicit levels)
- **Language of instruction:** English
- **Why:** Instructor Ustaatha Raja. Step-by-step MSA: script → alphabet → sounds → grammar → vocabulary → conversation. Very structured progression.
- **Best for:** Complete beginners wanting a clear three-level path

---

### Tier 2 — Good Supplementary Channels

#### 📖 Madinah Arabic (English) ★★★★
- **Channel:** https://www.youtube.com/@MadinahArabicTuition
- **Subscribers:** ~107K — 620+ videos
- **Levels:** A1 – B2
- **Why:** Large library, slow explanations, Arabic + romanized subtitles. Good secondary resource.
- **Best for:** Reinforcing vocabulary and grammar covered in the app

#### 📖 Learning Arabic with Angela (English) ★★★★
- **Channel:** https://learningarabicwithangela.com (dedicated Fusha YouTube channel)
- **Subscribers:** ~59K
- **Levels:** A2 – B1
- **Why:** Practical, topic-based approach with short stories. Notable playlist: "Learn Arabic through Short Stories" — directly complements FushaLab reading texts.
- **Best for:** Learners who enjoy story-based learning

#### 📺 The Arabic Student (English) ★★★★
- **Channel:** https://www.youtube.com/@saxquiz
- **Levels:** B1 – C1
- **Why:** Authentic Arabic materials — TV shows, news, interviews — analysed in English. Best comprehensible input channel for intermediate learners crossing from classroom to real Arabic.
- **Best for:** B1+ learners ready for authentic content with guidance

---

### Tier 3 — Authentic Input (Advanced)

*No learner scaffolding. Use as immersion: watch → try to understand → check.*

#### 📡 Al Jazeera Arabic ★★★★★ (authentic input)
- **Channel:** https://www.youtube.com/@aljazeera
- **Subscribers:** 20M+
- **Levels:** B2 – C2
- **Why:** The largest Arabic-language YouTube channel. Formal journalistic MSA at native speed. News, analysis, documentaries, interviews.
- **Best for:** Advanced learners wanting real-world formal Arabic
- **Tip:** Documentaries and cultural programmes are easier than fast news — look for those playlists

#### 📡 DW عربية ★★★★ (authentic input)
- **Channel:** https://www.youtube.com/@dw_arabic
- **Levels:** B2 – C2
- **Why:** Deutsche Welle's Arabic service. Dubbed documentaries in formal MSA. Slightly clearer and slower than Al Jazeera — better entry point for B2 learners trying authentic content.

---

## Do NOT use (dialect channels)

These teach Arabic dialects, not MSA — they would confuse FushaLab users:

| Channel | Dialect |
|---------|---------|
| ArabicPod101 | Mixed — Egyptian, Moroccan, MSA unlabeled |
| Arabic with Maha | Palestinian/Levantine |
| Nassra Arabic Method | Levantine (Syrian/Palestinian/Jordanian) |
| Easy Arabic | Street Arabic — Egyptian, Tunisian, Palestinian |
| Speak Real Arabic | Syrian Arabic |
| Effective Arabic | Moroccan Darija |

---

## Other (non-YouTube) resources worth linking

| Resource | URL | Why |
|----------|-----|-----|
| Aswaat Arabiyya (UT Austin) | https://www.laits.utexas.edu/aswaat/video_s.php | Academic leveled listening (B1–C2) with speed control |
| Al Jazeera Learning Platform | https://learning.aljazeera.net/en | Full 7-level Arabic course, separate from YT channel |

---

*All channel/subscriber data is approximate. Verify playlist IDs before adding to the app.*
