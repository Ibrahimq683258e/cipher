# Cipher - Client-Side File Encryptor

Cipher is a zero-trust, client-side file encryption web app built with standard browser Web Crypto APIs. Files are encrypted and decrypted in the browser with **AES-256-GCM** and keys are derived from passwords with **PBKDF2**.

There is no backend, build process, or package installation required.

## Requirements

- A modern browser with Web Crypto API support, such as current Chrome, Edge, Firefox, or Safari
- Python 3, Node.js, or a VS Code static-server extension for the recommended local run method
- Internet access when loading Cloudflare Turnstile on the contact page or Google Fonts

## Run Locally

Run Cipher from a local HTTP server to use browser features such as the contact form's Turnstile verification.

### Python

From the project folder, run:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000> in your browser.

On Windows, `py -m http.server 8000` can be used if `python` is not available.

### Node.js

If Node.js is installed, run:

```bash
npx serve .
```

Open the local URL printed in the terminal.

### VS Code

Install a static-server extension such as **Live Server**, right-click `index.html`, and choose **Open with Live Server**.

To stop a terminal server, press `Ctrl+C` in the terminal running it.

## Features & Website Highlights

- **Complete Web Landing Page**: Includes Navigation, Hero Masthead, Integrated Working Encryptor Tool, Privacy Features Grid, Security Specifications, and Footer using standard `Open Sans` and `Merriweather` typography and styling.
- **End-to-End Local Encryption**: Your files and passwords never leave your browser memory.
- **AES-256-GCM Authenticated Encryption**: Guarantees data confidentiality and prevents file corruption or tampering.
- **PBKDF2 Key Derivation**: High-iteration key derivation (`250,000` iterations of `SHA-256` with a `16-byte` cryptographically random salt).
- **Drag & Drop Uploads**: Process files of any type and size.
- **Batch Encryption**: Select or drop multiple files, review their type and size, and encrypt them sequentially with one password.
- **Batch Downloads**: Download the first result or download every generated `.cipher` file from the completed batch.
- **Output Naming**: Encrypted output files are generated as `filename.ext.cipher` and retain their original UTF-8 filename inside the header for seamless decryption.

---

## Technical Specifications & `.cipher` File Format Layout

```
+---------------------------------------------------------------------------------------------+
| Magic Header  | Version | Salt        | Initialization Vector (IV) | Filename Length | Original Filename | Ciphertext + Auth Tag |
| 4 bytes       | 1 byte  | 16 bytes    | 12 bytes                  | 2 bytes (Uint16)| N bytes (UTF-8)   | Remaining bytes       |
| ('CPHR')      | (0x01)  | (Random)    | (Random)                  | Big-Endian      |                   | (AES-256-GCM)         |
+---------------------------------------------------------------------------------------------+
```

### Format Breakdown:
1. **Magic Header** (`4 bytes`): ASCII `CPHR` (`0x43`, `0x50`, `0x48`, `0x52`)
2. **Version** (`1 byte`): Container format version (`0x01`)
3. **Salt** (`16 bytes`): Cryptographically secure random salt generated via `crypto.getRandomValues()`
4. **IV** (`12 bytes`): Cryptographically secure random 96-bit Initialization Vector for AES-GCM
5. **Filename Length** (`2 bytes`): 16-bit Big-Endian unsigned integer specifying the byte length of the UTF-8 encoded original filename
6. **Original Filename** (`N bytes`): UTF-8 encoded string of the original file name
7. **Encrypted Payload**: AES-256-GCM ciphertext + 16-byte authentication tag

---

## How to Run

1. Start a local HTTP server using one of the methods above.
2. Open the server URL in a modern web browser.
3. Select **Encrypt** or **Decrypt** mode in the Cipher tool section.
4. Drop a file into the dropzone (or click to browse).
	- Multiple files can be selected or dropped together. Use **Add more** to extend the queue.
5. Enter a password.
6. Click **Encrypt file** / **Decrypt file** to process locally and download `filename.ext.cipher` or restored original files.
Opening `index.html` directly may display the page, but the Turnstile-protected contact form requires a supported origin such as `http://localhost` or HTTPS.

## Privacy and Storage

- Files, passwords, and encryption results stay in browser memory during processing.
- Cipher does not receive files or passwords for tool processing, but this does not mean every part of the site processes data locally.
- The site host may receive technical request data. The contact page uses Cloudflare Turnstile and Google Apps Script; pages load Google Fonts.
- The site includes a cookie choice interface for necessary storage, advertising, and analytics. First-party optional scripts can be loaded after consent with `window.CipherConsent.loadScript(url, "advertising")` or `window.CipherConsent.loadScript(url, "analytics")`; listen for `cipher:consentchange` to respond when choices change. Third-party scripts are not allowed in the page context; integrate them only through an appropriately isolated provider setup.
- Never send file contents, passwords, encryption keys, tool inputs, or generated results to advertising or analytics services.
- Ad and analytics provider scripts are not included in this repository. Add the selected provider names, policy links, and configuration details to the Privacy Policy before publishing those integrations.

## Deployment

Cipher can be deployed as a static website to GitHub Pages, Netlify, Vercel, or any other host that serves static files over HTTPS. Keep the project structure unchanged so relative paths to `css/` and `images/` continue to resolve.
