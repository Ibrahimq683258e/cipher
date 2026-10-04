# Cipher - Client-Side File Encryptor

Cipher is a zero-trust, client-side file encryption web app built with standard browser Web Crypto APIs. Files are encrypted and decrypted in the browser with **AES-256-GCM** and keys are derived from passwords with **PBKDF2**.

There is no backend, build process, or package installation required.

## Requirements

- A modern browser with Web Crypto API support, such as current Chrome, Edge, Firefox, or Safari
- Python 3, Node.js, or a VS Code static-server extension for the recommended local run method
- Internet access when loading Cloudflare Turnstile on the contact page or Google Fonts

## Run Locally

Because Cipher uses a service worker and an installable PWA manifest, run it from a local HTTP server instead of opening `index.html` directly with a `file://` URL.

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
- **Installable Offline PWA**: Cipher caches its app shell for offline use and exposes an install action in supported browsers.
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
7. In a supported browser, use **Install** in the app header to add Cipher to your desktop or home screen.

Opening `index.html` directly may display the page, but service-worker registration, PWA installation, and the Turnstile-protected contact form require a supported origin such as `http://localhost` or HTTPS.

## Privacy and Storage

- Files, passwords, and encryption results stay in browser memory during processing.
- No application backend receives the files or passwords.
- The service worker caches only the static application shell; user files and results are never added to the cache.
- The contact page loads Cloudflare Turnstile, and pages load Google Fonts, as external resources.

## Deployment

Cipher can be deployed as a static website to GitHub Pages, Netlify, Vercel, or any other host that serves static files over HTTPS. Keep the project structure unchanged so relative paths to `css/`, `images/`, `manifest.webmanifest`, and `sw.js` continue to resolve.
