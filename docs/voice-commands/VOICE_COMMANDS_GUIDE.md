# Voice Commands — Developer & User Guide

> **Target audience**: Developers integrating the voice-command module, and end-users who need VoiceOver / NVDA / Orbit Reader 20 setup help.
>
> **Reference implementation**: [voice-commands.html](file:///Users/jayrao/Documents/tack-webapp/docs/voice-commands/voice-commands.html)

---

## 1. Design Summary

The Tack voice-command system is a **browser-first, framework-free module** that lets users control the web app entirely by voice. It wraps the **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) behind an accessible toggle button with full ARIA states, a keyboard shortcut (`Ctrl+Option+Shift+V` on macOS, `Ctrl+Alt+Shift+V` on Windows), and a live-region status area that keeps screen readers and braille displays informed of every state change. When the API is unsupported the system falls back to a visible text-entry field so no user is ever locked out.

On **macOS (Safari & Chrome)** the system uses `webkitSpeechRecognition` and supports both one-shot and continuous modes. Safari has a notable limitation: it requires a **user gesture** (click/tap) to start audio capture each time, and continuous mode may silently stop after extended use. The module auto-restarts recognition when this happens. On **Windows (Edge Chromium & Chrome)** the system uses the unprefixed `SpeechRecognition` (or the webkit-prefixed version) and continuous recognition works more reliably, though it still times out after ~60 seconds of silence and is auto-restarted.

**Native-assistant invocation** (Siri on macOS, Cortana on Windows) **cannot be done directly from a web page** due to browser sandboxing. The module uses a two-tier approach: first it attempts a deep-link URL (`shortcuts://run-shortcut?name=Run%20Siri%20Bridge` on macOS; `ms-cortana://` or a custom protocol handler on Windows). If the browser blocks the URL—or if the user has not set up the required Shortcut / protocol handler—the module shows a visible, accessible fallback panel with a clickable link and clear setup instructions. This is the most secure, practical approach without requiring a desktop companion app.

---

## 2. Command Reference

| Command | Match Type | Action |
|---|---|---|
| `"open inbox"` | exact / fuzzy | Navigate to the inbox |
| `"next heading"` | exact | Move screen-reader focus to next heading |
| `"go back"` | exact | Navigate to the previous page (`history.back()`) |
| `"repeat"` | exact | Re-announce the last status message |
| `"stop listening"` | exact | Turn off voice recognition |
| `"voice commands help"` | regex | Open the command reference panel |
| `"click [button name]"` | regex | Click a button or link by its accessible label |
| `"activate siri"` | regex | Attempt to launch Siri via macOS Shortcut URL |
| `"activate cortana"` | regex | Attempt to launch Cortana via protocol handler |

### How matching works

1. **Exact** — The spoken text, lowercased, must equal the command string exactly or contain it as a substring.
2. **Regex** — The spoken text is tested against a `RegExp` pattern (case-insensitive).
3. **Fuzzy substring** — If no exact match is found, a substring check is performed (this is combined with exact in the implementation).

Developers can register additional commands at runtime:

```js
window.voiceCommands.registerCommand(
  'new message',             // name
  /new (message|email)/i,    // regex pattern
  (text) => { /* handler */ },
  'Start composing a new message.',
  'regex'
);
```

---

## 3. macOS Shortcut Instructions (Siri Bridge)

### Goal

Create a macOS Shortcut that the web app can invoke via the `shortcuts://` URL scheme to attempt Siri activation.

### Step-by-step

1. **Open the Shortcuts app** (Launchpad → Shortcuts, or Spotlight → "Shortcuts").
2. **Create a new Shortcut**: click **+** in the toolbar.
3. **Name it exactly**: `Run Siri Bridge` (case matters for the URL scheme).
   - Click the Shortcut's name at the top of the editor to rename it.
4. **Add actions in this order**:
   1. **"Play Sound"** — Select a short system sound (e.g., "Glass"). This gives audio feedback that the Shortcut ran.
   2. *(Optional)* **"Ask Siri"** / **"Dictate Text"** — If you want Siri to actually activate, add the "Ask Siri" action. Note: macOS may show a consent dialog the first time.
5. **Save** (Cmd+S or close the editor).
6. **Test manually**: open Safari and navigate to `shortcuts://run-shortcut?name=Run%20Siri%20Bridge`. The Shortcuts app should open and run the Shortcut.

### URL the web app uses

```
shortcuts://run-shortcut?name=Run%20Siri%20Bridge
```

### Sample JavaScript

```js
// Attempt to invoke the Shortcut
window.open('shortcuts://run-shortcut?name=Run%20Siri%20Bridge', '_blank');
```

The implementation also tries a hidden `<iframe>` fallback if `window.open` is blocked.

### Limitations & consent

- **Safari** may show: _"Do you want to allow this page to open 'Shortcuts'?"_. The user must click Allow.
- **Chrome** silently blocks most custom URL schemes that are not `http(s)`. The user may need to use the manual fallback link.
- The Shortcut runs in the Shortcuts app, which becomes frontmost. The browser is backgrounded. Users must Cmd+Tab back.
- If the Shortcut does not exist, the Shortcuts app opens but shows an error.

### VoiceOver tips for creating the Shortcut

- **Navigate the Shortcuts editor**: Use `VO+Right` to step through the action list. Each action is an interactive group.
- **Naming the Shortcut**: Press `VO+Shift+M` on the title area to open context menu → Rename.
- **Adding actions**: `VO+Space` on the "Add Action" button, then use the search field to type "Play Sound" or "Ask Siri".
- **Testing**: Once saved, switch to Safari (`Cmd+Tab`), press `VO+Shift+U` to open the address bar, type the `shortcuts://` URL, and press Enter.

---

## 4. Windows Cortana / Assistant Instructions

> [!IMPORTANT]
> **Browsers on Windows typically block direct assistant activation.** The approaches below are listed from simplest to most capable. All require some user setup.

### Option A: `ms-cortana://` protocol (simplest, limited)

Windows 10 registers `ms-cortana://` by default. Edge may allow it; Chrome usually blocks it.

```js
window.open('ms-cortana://', '_blank');
```

**Limitation**: This only worked reliably in legacy Edge and Windows 10 builds. Windows 11 and Chromium-based Edge may block it. If it fails, the module shows the fallback panel.

### Option B: Custom protocol handler + PowerShell script (recommended)

Create a custom URL protocol (`myapp-cortana://`) that runs a small local script.

#### Step 1: Create the script

Save as `C:\Users\<you>\cortana-bridge.ps1`:

```powershell
# cortana-bridge.ps1 — Activates Cortana and returns focus to the browser
Add-Type -AssemblyName System.Windows.Forms

# Play a confirmation sound
[System.Media.SystemSounds]::Exclamation.Play()

# Simulate Win+C (Cortana shortcut)
[System.Windows.Forms.SendKeys]::SendWait("^{ESC}")
Start-Sleep -Milliseconds 500

# Optionally bring browser back to front
# (Not strictly needed — user can Alt+Tab)
```

#### Step 2: Register the protocol handler

Save as `register-cortana-protocol.reg` and double-click to import:

```ini
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Classes\myapp-cortana]
@="URL:Tack Cortana Bridge"
"URL Protocol"=""

[HKEY_CURRENT_USER\Software\Classes\myapp-cortana\shell]

[HKEY_CURRENT_USER\Software\Classes\myapp-cortana\shell\open]

[HKEY_CURRENT_USER\Software\Classes\myapp-cortana\shell\open\command]
@="powershell.exe -ExecutionPolicy Bypass -File \"C:\\Users\\<you>\\cortana-bridge.ps1\""
```

> [!CAUTION]
> Replace `<you>` with your actual Windows username. Registry edits are **per-user** (`HKEY_CURRENT_USER`) and do not require admin elevation.

#### Step 3: Test

Navigate to `myapp-cortana://activate` in Edge or Chrome. The browser should prompt _"Open myapp-cortana?"_. Click "Open". The PowerShell script runs, plays a sound, and simulates the Cortana hotkey.

#### JavaScript used by the module

```js
window.open('myapp-cortana://activate', '_blank');
```

### Option C: Desktop shortcut (no registry)

1. Right-click Desktop → New → Shortcut.
2. Target: `powershell.exe -ExecutionPolicy Bypass -File "C:\Users\<you>\cortana-bridge.ps1"`.
3. Name: `Cortana Bridge`.
4. The user manually double-clicks this shortcut when prompted by the web app.

### NVDA braille notes for confirming activation

1. Open NVDA menu (`Insert+N`) → **Preferences** → **Settings** → **Braille**.
2. Ensure **Braille display** is set to the Orbit Reader 20 (USB or Bluetooth).
3. Under **Braille**, set **Show Messages** to "Use timeout" (so status messages appear on the display temporarily).
4. After running the Cortana bridge, the NVDA braille display should show the NVDA announcement. If it does not, check **Tether Braille** is set to "Automatically".

---

## 5. VoiceOver Configuration (macOS + Orbit Reader 20)

### 5.1 Enable VoiceOver

1. Press **Cmd+F5** to toggle VoiceOver on/off.
2. A **Quick Start** tutorial appears on first launch — complete it or press `V` to skip.
3. VoiceOver keys (VO) are **Ctrl+Option** by default.

### 5.2 Open VoiceOver Utility

- Press **VO+F8** (i.e., `Ctrl+Option+F8`).
- Or: System Settings → Accessibility → VoiceOver → Open VoiceOver Utility.

### 5.3 Configure Orbit Reader 20 as a Braille Display

Navigate to: **VoiceOver Utility → Braille → Displays**.

1. **Connect the display**:
   - **USB**: Plug in the Orbit Reader 20. It should appear automatically in the Displays list.
   - **Bluetooth**: Pair the Orbit Reader 20 in System Settings → Bluetooth first. Then it appears in VoiceOver Utility.
2. **Select the display**: In the Displays tab, check the box next to "Orbit Reader 20".
3. **Set braille translation**:
   - In the **Braille** panel, set **Output** to `Contracted` or `Uncontracted` Braille (choose the user's preference).
   - Set **Input** similarly.
   - Grade 2 (contracted) is more compact; Grade 1 (uncontracted) is letter-by-letter.
4. **Cursor routing & display**:
   - Check **"Show Braille Cursor"** — ensures the cursor position is visible on the display.
   - Check **"Cursor Routing"** — pressing a cursor-routing button on the Orbit Reader will move VoiceOver's focus to that position.
   - Under **Braille Display Output**: ensure **"Show VoiceOver Cursor"** is selected so braille output follows VoiceOver focus (which follows the focused web element).
5. **Enable braille**: In the **General** tab, ensure **"Enable Braille"** is checked.

### 5.4 VoiceOver Rotor Configuration

The **rotor** (rotate two fingers on trackpad, or press `VO+U`) lets users jump between elements by type. Configure it for voice-command usage:

1. **VoiceOver Utility → Web → Web Rotor** (or navigate with `VO+Right` in the Utility).
2. Enable these rotor items:
   - ☑ **Headings** — jump between `<h1>`–`<h6>` elements.
   - ☑ **Links** — jump between `<a>` elements.
   - ☑ **Form Controls** — jump between `<button>`, `<input>`, `<select>`, etc.
   - ☑ **Landmarks** — jump between ARIA landmarks (`main`, `nav`, `banner`, etc.).
3. To use the rotor in a web page: rotate two fingers to select the element type, then swipe down/up (or `VO+Down` / `VO+Up`) to move through items of that type.

### 5.5 Key Combinations That Pair with Voice Commands

| Keys | Action |
|---|---|
| `VO+Space` | Activate the currently focused element (click) |
| `VO+Left` / `VO+Right` | Move to previous / next element |
| `VO+Shift+H` | Jump to next heading |
| `VO+Shift+Down` | Interact with (enter) a group or menu item |
| `VO+Shift+Up` | Stop interacting with current group |
| `VO+A` | Read from current position (read-all) |
| `VO+F3` | Announce the current item's description |
| `VO+U` | Open the rotor |

### 5.6 Ensuring Braille Updates on `aria-live` Changes

The voice-command module uses `aria-live="assertive"` for the status region. VoiceOver should:

- Speak the new text immediately.
- Update the braille display if **Braille Alert Messages** is enabled.

To verify:

1. **VoiceOver Utility → Braille → General**: Set **"Show alert messages"** to **"All"** or **"Timed"**.
2. Toggle voice commands on. The braille display should show "Listening… Speak a command."
3. If braille does not update, check that VoiceOver's focus has not moved to a different app.

### 5.7 Verifying Braille Input & Output

**Testing output**:
1. Enable VoiceOver and connect the Orbit Reader 20.
2. Navigate to the voice-commands page in Safari.
3. Press `VO+Right` to move through elements. Each element's label should appear on the braille display.
4. Focus the toggle button. The display should read: `Start listening btn` (or similar).

**Testing input**:
1. Focus the text-entry fallback field.
2. Type on the Orbit Reader 20's braille keyboard. Characters should appear in the input field.
3. If input goes to the wrong app, ensure **Cursor Routing** is enabled and VoiceOver focus is on the text field.

### 5.8 Safari-Specific Notes

- **User gesture requirement**: Safari requires a user interaction (click, tap, or key press) before starting audio capture. The module's toggle button satisfies this when clicked.
- **Continuous recognition**: Safari may silently end recognition after a period. The module's `autoRestart` feature handles this.
- **HTTPS required**: `getUserMedia` (microphone) requires HTTPS in Safari. `localhost` is exempt during development.
- **Popups/URL schemes**: Safari is more permissive about `shortcuts://` URLs than Chrome. It will show a confirmation dialog.

---

## 6. NVDA Configuration (Windows + Orbit Reader 20)

### 6.1 Connect the Orbit Reader 20

1. **USB**: Plug in; NVDA should auto-detect.
2. **Bluetooth**: Pair in Windows Bluetooth settings first.

### 6.2 NVDA Braille Settings

1. Open NVDA menu: press **Insert+N** (or **Caps Lock+N** if using laptop layout).
2. Navigate: **Preferences → Settings → Braille**.
3. Set **Braille display** to **"Orbit Reader 20"** (or **"Auto detect"**).
4. Set **Port** to the correct COM port (USB) or Bluetooth.
5. Set **Output table** to your preferred braille table (e.g., `English (Unified) Grade 2` for contracted).
6. Set **Input table** similarly.
7. **Tether Braille** → **"Automatically"** (so braille follows focus or review cursor).
8. **Show Messages** → **"Use timeout"** (so `aria-live` announcements appear on the display temporarily then revert to current focus).

### 6.3 Verifying `aria-live` on Braille

1. Open the voice-commands page in Chrome or Edge.
2. Toggle voice commands on.
3. The NVDA braille display should flash "Listening… Speak a command." before returning to the focused element.
4. If this does not happen, increase the **Message timeout** value in Braille settings.

---

## 7. Security & Privacy Notes

| Concern | How Addressed |
|---|---|
| **Microphone access** | Explicitly requested via `getUserMedia()`. Browser shows permission prompt. Never auto-granted. |
| **Audio data** | The Web Speech API sends audio to the browser vendor's cloud service for recognition (Google for Chrome, Apple for Safari, Microsoft for Edge). **No audio is sent to the Tack server.** |
| **Server logging** | The module performs **no server logging by default**. All processing is client-side. |
| **User opt-in** | Voice commands are off by default. The user must explicitly toggle them on. |
| **Ephemeral processing** | Transcripts are held in DOM only. They are lost on page refresh. No localStorage or cookies. |
| **CORS** | No cross-origin requests are made. The module is self-contained. |
| **URL scheme risks** | `shortcuts://` and custom protocol URLs are opened via `window.open()`. Browsers show a confirmation dialog. The user must consent each time. No data is passed beyond the Shortcut name. |
| **Protocol handler (Windows)** | Registry entries are `HKEY_CURRENT_USER` only (no admin needed). The PowerShell script runs locally and does not make network requests. Users should review the script before registering. |

> [!WARNING]
> If you extend the module to send transcripts to a server, you **must** obtain explicit user consent (e.g., a GDPR-style opt-in dialog) and use HTTPS.

---

## 8. Accessibility Checklist

Test with **VoiceOver + Orbit Reader 20 on macOS** and **NVDA + Orbit Reader 20 on Windows**.

| # | Check | Pass? |
|---|---|---|
| 1 | **Toggle button announces state**: VoiceOver/NVDA reads "Start listening, toggle button, not pressed" → after activation "Stop listening, toggle button, pressed". Orbit Reader shows the same. | ☐ |
| 2 | **`aria-live` status announced**: When listening starts, SR and braille display show "Listening… Speak a command." | ☐ |
| 3 | **Keyboard shortcut works**: `Ctrl+Option+Shift+V` (macOS) / `Ctrl+Alt+Shift+V` (Windows) toggles listening. Focus moves to the toggle button. | ☐ |
| 4 | **Tab order is logical**: Skip-link → Toggle button → Status region → Transcript → Text input → Run button → Help. | ☐ |
| 5 | **Focus ring visible**: All interactive elements show a visible focus indicator (blue ring) in light and high-contrast modes. | ☐ |
| 6 | **Permission denied announced**: When microphone is denied, NVDA/VoiceOver reads "Microphone access denied" plus browser-specific guidance. Braille display shows the message. | ☐ |
| 7 | **Text fallback usable by keyboard**: Tab to text input, type "open inbox", press Enter. Command executes and is announced. | ☐ |
| 8 | **Command transcript updates braille**: New transcript entries appear on the braille display (NVDA: check "Show Messages" setting; VoiceOver: check "Show alert messages"). | ☐ |
| 9 | **Help table readable**: Open the "Available voice commands" details element. SR reads table headers and cells. Braille display presents them. | ☐ |
| 10 | **Native-assistant fallback accessible**: After saying "activate siri" on macOS, the fallback panel appears with a link. VoiceOver reads the link label. The link is keyboard-reachable. | ☐ |

---

## 9. Test Plan & Debugging Tips

### 9.1 Browser Matrix

| Browser | SpeechRecognition | Continuous | Mic permission | URL schemes |
|---|---|---|---|---|
| Safari 17+ (macOS) | `webkitSpeechRecognition` | Unreliable (auto-restart) | User-gesture required | `shortcuts://` works with dialog |
| Chrome 100+ (macOS) | `webkitSpeechRecognition` | ✅ Reliable | Standard prompt | `shortcuts://` usually blocked |
| Chrome 100+ (Windows) | `SpeechRecognition` | ✅ Reliable | Standard prompt | `ms-cortana://` blocked; custom protocol with dialog |
| Edge Chromium (Windows) | `SpeechRecognition` | ✅ Reliable | Standard prompt | `ms-cortana://` may work on Win10 |
| Firefox | ❌ Not supported | — | — | — (text fallback) |

### 9.2 Simulating Permission Denied

1. Open browser DevTools → Application (Chrome) or Security (Safari).
2. Reset site permissions, reload, then deny the microphone prompt.
3. Verify the error message and guidance text appear in the status region.

### 9.3 Testing Braille Output

**VoiceOver + Orbit Reader 20**:
1. Connect the display via USB.
2. Open the page in Safari. Navigate with `VO+Right`.
3. Confirm each element's label appears on the braille display.
4. Toggle voice commands on. Confirm "Listening…" appears on the display.

**NVDA + Orbit Reader 20**:
1. Connect the display. Verify autodetect in NVDA Braille settings.
2. Open the page in Chrome or Edge.
3. Tab through elements. Confirm braille output matches screen reader speech.
4. Toggle listening. Confirm status message appears on the display.

### 9.4 Testing Shortcut / Protocol Flows

**macOS (Siri Bridge)**:
1. Create the Shortcut as described in section 3.
2. In Safari, say "activate siri" (or type it). Verify the Shortcuts app opens and runs.
3. If using Chrome, verify the fallback link appears.

**Windows (Cortana)**:
1. Register the protocol handler as described in section 4.
2. Say "activate cortana". Verify the browser shows "Open myapp-cortana?" prompt.
3. Click Open. Verify the PowerShell script runs and plays a sound.

---

## 10. Troubleshooting FAQ

### Q: Microphone is blocked and I can't re-enable it.

**Chrome/Edge**: Click the lock icon (or tune icon) left of the URL bar → "Site settings" → Microphone → Allow. Reload the page.

**Safari**: Safari menu → Settings → Websites → Microphone → Select the site → Allow. Reload.

### Q: Speech recognition stops after a few seconds of silence.

This is normal. The Web Speech API has a built-in silence timeout (~60 s in Chrome, shorter in Safari). The module's `autoRestart` feature automatically restarts recognition. If you want to disable auto-restart, set `window.voiceCommands.autoRestart = false`.

### Q: SpeechRecognition is not available in my browser.

Firefox and some privacy-focused browsers do not implement the Web Speech API. Use the text-entry fallback field to type commands manually. The module detects this and shows a warning in the status area.

### Q: The Shortcuts URL is blocked by Chrome on macOS.

Chrome blocks most non-HTTP URL schemes. The module shows a clickable fallback link in the assistant panel. **Click the link directly** — direct user clicks on `<a href="shortcuts://…">` are more likely to succeed. Alternatively, use Safari.

### Q: The Windows protocol handler doesn't fire.

- Verify the registry entry was imported correctly: open `regedit`, navigate to `HKEY_CURRENT_USER\Software\Classes\myapp-cortana`, and confirm the command path is correct.
- Ensure the PowerShell script path has no spaces that are un-escaped.
- Some enterprise environments block custom protocol handlers via Group Policy. Check with your IT administrator.

### Q: Voice commands hear me but match the wrong command.

Check the transcript log. The Web Speech API may transcribe differently than expected (e.g., "go back" → "go back."). The command matcher is fuzzy (substring), so partial matches may fire. Adjust the regex pattern for precision, e.g. `^go back$` instead of `go back`.

### Q: Braille display does not update when status changes.

**VoiceOver**: VoiceOver Utility → Braille → General → "Show alert messages" → "All". Also ensure "Show VoiceOver Cursor" is selected under Braille Display Output.

**NVDA**: NVDA menu → Preferences → Settings → Braille → "Show Messages" → "Use timeout". Increase the timeout if messages disappear too quickly.

---

## 11. Platform-Specific Screen Reader Notes

### Safari (macOS)

- **User gesture required**: The first call to `getUserMedia()` or `SpeechRecognition.start()` must originate from a user gesture (click, keypress). The toggle button click satisfies this. Programmatic calls from a timer or `DOMContentLoaded` will fail.
- **Continuous mode**: Safari may silently end recognition. The module's `onend` handler restarts it if `autoRestart` is true.
- **VoiceOver interaction**: When VoiceOver is active, pressing `VO+Space` on the toggle button counts as a user gesture. This works correctly.
- **Audio output**: Safari may require a user gesture before playing audio (e.g., a confirmation beep). The module currently does not play audio, but if you add sounds, wrap them in a click handler.

### Chrome / Edge Chromium (macOS & Windows)

- **Continuous mode**: Works reliably. Times out after ~60 s of silence; auto-restart handles this.
- **Microphone indicator**: Chrome shows a red dot in the tab. Edge shows a camera/mic icon. This is expected and cannot be suppressed.
- **Screen reader compatibility**: NVDA and JAWS work well with Chrome and Edge. VoiceOver works with Chrome but occasionally has focus-tracking issues; Safari is preferred for VoiceOver users.

### NVDA-Specific

- **Browse mode vs Focus mode**: When NVDA is in Browse mode (default on web pages), it intercepts most key presses for navigation. The voice-command keyboard shortcut (`Ctrl+Alt+Shift+V`) uses modifier keys that NVDA passes through, so it works in both modes.
- **`aria-live` in Browse mode**: NVDA announces `aria-live` changes regardless of the current mode.
- **JAWS**: JAWS behaves similarly to NVDA for `aria-live` regions. The toggle button and keyboard shortcut work in both Virtual Cursor and Forms mode.

### VoiceOver + Braille (macOS)

- Ensure **VoiceOver Utility → Braille → General → "Enable Braille"** is checked.
- The Orbit Reader 20's cursor routing buttons should move VoiceOver focus to that element on screen.
- Contracted braille output may abbreviate ARIA labels. Switch to uncontracted if labels are unclear.
- VoiceOver's braille panel (VO+F9 to show on screen) can be used to debug what the Orbit Reader is displaying.
