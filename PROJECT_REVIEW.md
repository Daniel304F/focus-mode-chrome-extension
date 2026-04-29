# FocusMode — Design- & Product-Review

> Kurzes Review aus zwei Perspektiven: zuerst UI/UX, dann Product Owner.
> Stand: 2026-04-29

---

## 1. Projekt-Zusammenfassung

**FocusMode** ist eine Browser-Erweiterung für Chromium-basierte Browser
(Chrome, Edge, Brave) mit dem Anspruch, die digitale Selbstkontrolle und
Produktivität des Nutzers zu unterstützen. Der Funktionsumfang ist über
sechs Tabs in einem 460×600 px-Popup organisiert:

| Tab | Funktion |
|---|---|
| Blocker | Domains blockieren, Favoriten markieren, Autocomplete aus statischer Top-Liste |
| Elemente | Per Element-Picker beliebige DOM-Elemente einer Seite ausblenden |
| Statistik | Zeit-Tracking pro Domain, Heute/Woche-Übersicht, 7-Tage-Bar-Chart |
| Pomodoro | Timer mit Fokus / kurze / lange Pause + konfigurierbaren Längen |
| Empfehlungen | Vorschlagsliste „weiterer ablenkender Seiten" |
| Setup | SQLite-Tracker, Theme/Sprache, LLM-Zusammenfassung |

Architektur:

- **Frontend:** modulares ES-Module-Setup (`src/popup.js` als Orchestrator, `src/ui/*` pro Tab, `src/lib/*` für Utilities, `src/state.js` als zentrales Zustands-Singleton).
- **Background Service Worker:** Tracking, Block-Logik, Pomodoro-Alarme, Recommendation-Refresh.
- **Optionaler Node/Express-Server** (`tracker-server/`) mit `better-sqlite3` zur dauerhaften Speicherung von Sitzungen.
- **LLM-Integration:** direkter Browser-Aufruf an Anthropic API oder OpenAI-kompatibles Custom-Endpoint.

Die Code-Qualität ist solide (klare Modulgrenzen, sinnvolle Trennung von State & UI, gut kommentierte Module). Die **Design-Sprache und das Feature-Scoping** sind dagegen die Hauptbaustellen.

---

## 2. UI/UX-Review (Senior Designer)

### Befund vor dem Redesign

Das Popup wirkte **überladen, laut und tech-demohaft** statt fokussiert:

- **Farb-Overload:** zwei Akzentfarben (Teal + Royal Blue) als Verlauf in Header, Logo, Pomodoro-Ring, Statistik-Bars, Tagesbalken — also fünf prominente Stellen gleichzeitig.
- **Dunkle Sidebar im hellen Layout:** ein abrupter Bruch in der Tonalität, der bei einem 460-px-Popup unverhältnismäßig viel visuelles Gewicht beansprucht.
- **Dekoratives Logo („FM"-Gradient-Tile)** in einem Tool, das Klarheit verspricht.
- **Emoji als Navigations-Icons** (🔒 👁 📊 🍅 💡 ⚙️) — uneinheitlich, plattformabhängig gerendert, semantisch beliebig (warum 💡 für „Tipps", warum 🍅 statt einer Uhr?).
- **Emoji im UI-Body:** ⛔ ✓ 👁 🙈 📊 ★ — Mischung aus Symbol-Fonts und farbigen Emojis.
- **Typografie:** „Segoe UI"-only-Stack, sehr kleine 11–13 px Schrift bei großzügigem Bold-Einsatz, fehlende Hierarchie zwischen H1/H2/Body.
- **Statuszeichen:** „SQLite: offline" als roter Pill-Chip im Header dauerhaft prominent — sieht aus wie ein Fehler, ist aber Default-Zustand.
- **Verlaufs-Hintergrund:** Radial-Gradient hinter dem Content-Bereich ohne funktionalen Nutzen.

### Prinzipien des Redesigns

1. **Eine einzige Akzentfarbe** (neutrales Schwarz / im Dark Mode Off-White). Keine Verläufe.
2. **Helle, ruhige Sidebar** mit Strich-Icons (SVG, nicht Emoji), aktiver Tab über einen 2-px-Akzentstreifen links — kein Hintergrund-Wash.
3. **Systemschriftarten-Stack** (`-apple-system, Segoe UI, Roboto …`) mit `font-variant-numeric: tabular-nums` an allen Stellen mit Zahlen (Zeiten, Counts, Countdown).
4. **Karten flacher**: 1-px-Border, 8-px-Radius, kein Schatten. Whitespace ersetzt visuelle Trenner.
5. **Status-Chip mit Punkt-Indikator** statt farbiger Pille. „aus / offline / online" durch Farbe **am Punkt**, nicht am ganzen Element.
6. **Pomodoro-Ring** in einer einzigen Akzentfarbe, ohne SVG-Gradient.
7. **Konsistente Typo-Hierarchie:** H1 14 px / 600, H2 12 px / 600, Body 13 px / 400, Stat-Value 18 px / 600 mit `letter-spacing: -0.02em`.
8. **Emoji-Entfernung:** Nav-Icons → Inline-SVG-Strichzeichnungen. Buttons mit Wort-Labels statt 👁/🙈, ⛔/✓ etc.
9. **Dark Mode** aus dem gleichen Token-Set abgeleitet (echtes Off-White auf Off-Black, kein bläuliches Slate).

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `popup.html` | Komplett-Redesign (Tokens, Sidebar, Header, Karten, Buttons, Pomodoro-Ring, Status-Chip). DOM-IDs unverändert → JS unangetastet. |
| `blocked.html` | Klare Karte, Eyebrow-Label, einzelner Akzent-Button, neutrale Palette. |
| `styles.css` (Content-Script) | Picker-Highlight in neutralem Schwarz statt knalligem Blau; HUD typografisch entschärft. |
| `src/lib/i18n.js` | Emoji-Präfixe aus Button-Labels (`📊`, `✓`, `✗`) entfernt. |
| `src/ui/pomodoro.js` | „✓"-Mikrofeedback durch „Gespeichert" ersetzt. |
| `src/ui/recs.js` | Block-Icon-Toggle ohne ⛔-Emoji. |
| `src/ui/settings.js` | API-Key-Sichtbarkeits-Toggle als Wort-Label. |

---

## 3. Product-Owner-Review

Aus PO-Sicht stelle ich **Sinn, Notwendigkeit und Qualität** der einzelnen Features in Frage. Die Erweiterung ist technisch breit aufgestellt, leidet aber unter **Feature-Sprawl ohne klares Nutzerproblem**: Block + Hide + Tracking + Pomodoro + Empfehlungen + LLM in einem Popup ist eher „Schweizer Taschenmesser" als „Fokus-Werkzeug".

### Leitfrage
> Welches einzelne Problem löst FocusMode für welchen Nutzer-Typ — und welche Features dienen genau diesem Problem?

Plausible Kernzielgruppe: **Wissens-/Heimarbeitende, die sich selbst beim ablenkenden Surfen erwischen und Reibung einbauen wollen**. Daraus folgt eine klare Priorisierung.

---

## 4. Feature-Liste: Beibehalten / Überarbeiten / Optimieren / Ersetzen

### Legende
- **KEEP** — Kernfunktion, qualitativ erhalten.
- **REWORK** — Kerngedanke richtig, Umsetzung nicht.
- **OPTIMIZE** — Funktioniert, kann härter, schneller, schlanker.
- **REPLACE** — In aktueller Form falsch / aus Scope nehmen / durch besseres Feature ersetzen.

---

### 4.1 Blocker

**Status: KEEP / OPTIMIZE**

Funktioniert, ist die unbestrittene Kernfunktion.

Optimierungen:
- **Schedules / Zeitfenster:** Blockieren nur Mo–Fr 9–17 Uhr, nicht 24/7. Ohne diese Funktion ist der Blocker oft entweder zu strikt oder wird ignoriert.
- **Härtegrad pro Domain:** „Soft" (Bestätigungs-Overlay mit 10 s Wartezeit, Feedback-Loop) vs. „Hard" (kompletter Block). Aktuell nur Hard-Block.
- **Gruppen / Profile:** „Social", „News", „Shopping" als Gruppen, mit einem Toggle aktivierbar.
- **Pause-Timer:** „5 Minuten Pause vom Block" mit explizitem Grund-Eingabefeld → nudgt zur Reflexion und liefert eigene Daten.
- **Wildcard-Pfade:** `youtube.com/shorts*` blockieren statt der ganzen Domain.
- **Static-Suggestions-Liste** (90+ Domains in `blocker.js`) → in JSON auslagern und versionierbar machen, nicht als Code-Konstante.

---

### 4.2 Element-Hider

**Status: REWORK**

Konzept gut, Umsetzung unzureichend für reale Web-Seiten:

- **Selektoren sind brittle.** Klassennamen wie `_a1b2c3` (Instagram, Reddit) ändern sich bei jedem Deploy → versteckte Elemente kommen zurück.
- **Keine SPA-Awareness:** Bei React-/Vue-Apps wird das Element nach Navigation neu eingehängt; der Selektor matcht nicht mehr.
- **Kein Sync zwischen Geräten** (nicht zwingend nötig, aber konsequent zu machen).

Empfehlungen:
- **Heuristischere Selektor-Strategie:** mehrere Fallback-Selektoren pro Eintrag (Tag+Klasse, ARIA-Role, Text-Content-Match) und dem Picker das Beste auswählen lassen.
- **MutationObserver** auf `body`, um Re-Inserts in SPAs zu erkennen und das Hide-Style erneut anzuwenden.
- **Kuratierte Vorlagen** für Top-Domains („YouTube: Sidebar / Recommendations / Shorts ausblenden") mit gepflegten Selektoren — das ist die eigentliche Wertversprechung gegenüber Tools wie uBlock.

---

### 4.3 Statistik / Time-Tracking

**Status: KEEP / OPTIMIZE**

Solides Tracking, aber:

- **`recentSessions` lokal auf 200 begrenzt** → Wochenstatistik ist im Browser-Modus systematisch unvollständig. Entweder ehrlich kommunizieren („nur letzte ~3 Tage präzise") oder lokal IndexedDB statt `chrome.storage.local` nutzen.
- **Domain-Tracking ohne Kategorien:** „youtube.com" misst Tutorial **und** Katzenvideo gleich. Manuelle Tags / Kategorien („Arbeit", „Lernen", „Ablenkung") pro Domain wären ein deutlich höherer Mehrwert als noch eine Vis.
- **Stundengenauer Tagesverlauf** (Heatmap 0–23 Uhr) wäre nützlicher als die Wochenleiste — viele Nutzer wollen sehen, *wann* sie abdriften.
- **Active-Session-Tracking** läuft auch bei minimiertem Browser weiter (`window.onFocusChanged` fängt das ab — gut. Aber: bei längeren Idle-Phasen ohne Tab-Wechsel zählt es weiter. **Idle-Detection via `chrome.idle`** einbauen.)

---

### 4.4 Pomodoro-Timer

**Status: OPTIMIZE oder REPLACE**

Die Implementierung ist sauber, aber:

- **Pomodoro-Timer gibt es als Standalone-Erweiterung dutzendfach.** FocusMode hat keinen USP hier außer „liegt eh schon im Popup".
- **Keine Integration mit dem Blocker:** Während einer Fokus-Session sollten die Pause-Domains automatisch härter gesperrt sein. Genau diese Verbindung wäre der eigentliche Mehrwert.

Empfehlung:
- **Entweder** Pomodoro tief mit Blocker verzahnen (Fokus-Session = automatischer Blockmodus, Pause = entsperrt), oder
- **streichen** und stattdessen eine generische **„Fokus-Sitzung"** (frei wählbare Länge, optional mit Pomodoro-Schema) anbieten, deren Hauptzweck die Block-Integration ist.

---

### 4.5 Empfehlungen

**Status: REPLACE**

Aktuell unklar, was empfohlen wird und woher es kommt — Code zeigt eine statische Liste plus „Interesse"-Keyword. Aus User-Perspektive ist „Hier sind weitere ablenkende Seiten" **kontraproduktiv** in einem Anti-Ablenkungs-Tool.

Ersetzen durch:
- **Persönliche Insights** auf Basis der eigenen Daten („Diese Woche 4 h auf YouTube, 80 % davon nach 21 Uhr — Block ab 21 Uhr aktivieren?").
- **Konkrete Vorschläge zu blockierenden Domains** *aus dem eigenen Tracking* (Top-5-Zeitfresser, die noch nicht blockiert sind), nicht aus einer generischen Liste.

---

### 4.6 KI-Zusammenfassung

**Status: REWORK**

- **API-Key im Klartext in `chrome.storage.local`** — auch wenn lokal: das ist für Anwender ein No-Go-Vertrauenssignal in einem Tool, das mit „100 % lokal, keine Daten verlassen den Browser" wirbt. Genau hier verlassen sie ihn.
- **Direkter Browser-Call an `api.anthropic.com`** umgeht das normale CORS-Modell und ist auch deshalb fragil (Header-Whitelist, Versions-Drift).
- **Mehrwert gegenüber „selbst auf die Zahlen schauen" niedrig**, solange die Insights nicht handlungsleitend werden.

Empfehlungen:
- **Default ohne externes LLM:** ein paar fest verdrahtete Heuristiken liefern 80 % der Insights („Top-Site > 30 % der Zeit", „Verteilung über Tageszeiten").
- **LLM optional und transparent:** klarer Hinweis vor jedem Call, *welche* Daten geschickt werden. Key in `session`-Storage, nicht persistent.
- Wenn behalten, dann **als Reflexions-Coach** mit konkreten Aktions-Vorschlägen, die das UI direkt anbietet („Block für reddit.com setzen?" als Button), nicht nur als Textwand.

---

### 4.7 SQLite-Tracker (lokaler Node-Server)

**Status: REPLACE**

Aus Anwender-Sicht: **falsche Reibung im falschen Produkt**. Eine Browser-Extension, die einen lokalen Node-Server zum Starten verlangt, verlässt zwei Zielgruppen sofort:
- Nicht-Entwickler (offensichtlich).
- Entwickler, die kein zweites Terminal-Fenster für eine Productivity-Extension auflassen wollen.

Außerdem: Der Server liefert Daten, die **auch ohne ihn vorhanden sein müssten** (siehe 4.3). Aktueller Zustand: die Hauptauswertung („Heute / Woche / 7 Tage") *funktioniert lokal nicht zuverlässig*, weil `recentSessions` auf 200 begrenzt ist — der Server stopft also ein selbst gegrabenes Loch.

Empfehlungen:
- **Tracking-Storage in IndexedDB** (`chrome.storage.local` ist für ~5 MB ungeeignet bei längerem Tracking).
- **Export als CSV/JSON** statt Live-DB. Wer Langzeit-Auswertungen will, exportiert in sein eigenes Tool.
- **SQLite-Server entfernen** oder klar als „Power-User / Entwickler-Mode" labeln und aus dem Standard-Setup ziehen.

---

### 4.8 Querschnitt: i18n / Theme / Shortcut

**Status: KEEP**

- DE/EN-Lokalisierung sauber.
- Theme-Toggle + globaler Shortcut (`Strg+Shift+F`) sind Pflicht und funktionieren.

Kleine Optimierung: **System-Theme** als dritte Option (`auto`) — aktuell nur Light/Dark manuell.

---

## 5. Priorisierte Roadmap (PO-Vorschlag)

| Prio | Maßnahme | Begründung |
|---|---|---|
| P0 | Element-Hider robuster machen (MutationObserver, Selektor-Fallbacks, kuratierte Templates für Top-Sites) | Stärkstes Differenzierungsmerkmal, aktuell aber unzuverlässig — höchster Hebel auf User-Vertrauen. |
| P0 | Tracking-Storage auf IndexedDB; Idle-Detection einbauen | Macht Statistik & Empfehlungen erst belastbar, ohne Server-Krücke. |
| P0 | Blocker × Pomodoro verzahnen (Fokus-Session = automatischer Block) | Liefert den USP des Pakets gegen Standalone-Blocker. |
| P1 | Empfehlungs-Tab durch Insights aus eigenen Daten ersetzen | „Anti-Ablenkungs-Tool empfiehlt Ablenkungen" ist ein Markenproblem. |
| P1 | Schedules / Profile / Soft-Block für den Blocker | Häufigster realistischer Bedarf. |
| P2 | SQLite-Server raus aus Default-Setup, optional als Export | Reduziert Setup-Friktion radikal. |
| P2 | LLM-Feature: API-Key sicherer; Insights als Aktionen statt Prosa | Wenn behalten, dann mit klarem Wertbeitrag. |
| P3 | System-Theme-Auto, kleine i18n-Politur | Hygiene. |

---

## 6. Zusammenfassung

**Design:** vorher zu laut, gradientenverliebt und emoji-getrieben — jetzt eine ruhige, neutrale, typografisch klare Oberfläche mit einer einzigen Akzentfarbe und konsequentem Token-System.

**Produkt:** das Hauptproblem ist nicht „zu wenig Features", sondern **fehlende Verzahnung** der vorhandenen. Element-Hider robust + Blocker schedulebar + Pomodoro/Block gekoppelt + Insights aus echten Daten ergeben ein scharfes Werkzeug. Aktuell ist es eine Sammlung paralleler Tabs mit unklarem Werteversprechen.
