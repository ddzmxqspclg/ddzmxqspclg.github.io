# Yanzhou Wang — academic homepage

A small, English academic homepage for GitHub Pages. The published page is plain HTML and CSS, with no runtime JavaScript, framework, third-party fonts, tracking, or server. Both publications and the contact details are present directly in `index.html` and remain visible with JavaScript disabled.

## Confirmed identity and destination

- Name: Yanzhou Wang / 王言舟
- Affiliation: Beijing University of Posts and Telecommunications (BUPT)
- Education: Undergraduate Student; Internet of Things Engineering
- OpenReview registration email, confirmed by the owner: **2686705997@bupt.edu.cn**
- GitHub account returned by the connected GitHub tool: **ddzmxqspclg**
- Intended repository: https://github.com/ddzmxqspclg/ddzmxqspclg.github.io
- Intended homepage: https://ddzmxqspclg.github.io/

The website is designed to publish at these GitHub Pages addresses. The deployment script confirms the actual authenticated account before publishing and verifies the public HTTPS response after deployment. Repository and live-site status can be checked at the links above.

## Publish from PowerShell

1. Install Git, Node.js, and GitHub CLI if necessary. Git and Node.js were already available in the development environment. GitHub CLI can be installed from https://cli.github.com/ or with `winget install --id GitHub.cli --exact`. Reopen your terminal after installation if the commands are not found.
2. Open PowerShell in this directory and sign in yourself:

   ```powershell
   gh auth login --web
   gh api user --jq .login
   ```

   Verify the account is the one you want to publish from. The deployment script reads the actual signed-in account and adjusts the repository name, GitHub contact link, canonical URL, and sitemap automatically. It never assumes the username is `yanzhouwang`.

3. Run:

   ```powershell
   .\deploy.ps1
   ```

   If your PowerShell execution policy prevents running scripts, review the file and invoke it for this process only:

   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\deploy.ps1
   ```

   An official portable GitHub CLI was also downloaded under the parent task's `work/github-cli/bin/gh.exe`. Without installing it, pass its absolute path:

   ```powershell
   & 'C:\Users\王\Documents\Codex\2026-11-02\github-pages-openreview-name-yanzhou-wang\work\github-cli\bin\gh.exe' auth login --web
   .\deploy.ps1 -GhPath 'C:\Users\王\Documents\Codex\2026-11-02\github-pages-openreview-name-yanzhou-wang\work\github-cli\bin\gh.exe'
   ```

The script rebuilds the page, creates a **public** `<actual-login>.github.io` repository, pushes `main`, enables Pages from `main` and `/`, requests HTTPS enforcement, and checks the public HTTPS response for the name, affiliation, email, and both publication titles. It does not force-push. If an existing remote site is found without a configured local origin, it stops for inspection instead of overwriting it. The account needs permission to create repositories and manage GitHub Pages; `gh auth login` normally supplies the required repository scope. Never paste tokens into source files or this README.

GitHub deployment can take several minutes. If the script times out after pushing, inspect the repository's Actions tab and Settings → Pages. A timeout does not by itself mean the source push failed.

## Publish using the GitHub website

If CLI authentication is unavailable:

1. Sign in to GitHub, verify the actual username from your profile, and create a **public** repository named `<username>.github.io`. For the account identified in this session, the exact name is `ddzmxqspclg.github.io`.
2. Upload this directory's contents to the repository root, with `index.html` and `styles.css` directly at the root. Do not upload an enclosing `academic-homepage` directory or only the ZIP file. Include `data/`, `tools/`, README, and the hidden `.nojekyll` file for future maintenance. If a drag-and-drop upload omits `.nojekyll`, add an empty file with that name using GitHub's editor.
3. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, set **main** and **/ (root)**, then Save.
4. Wait for the Pages build to finish, enable **Enforce HTTPS** when available, and open `https://<username>.github.io/` in a private window.
5. If you publish under another username, update `githubUsername` in `data/profile.json`, run `node tools/build.mjs`, and upload the rebuilt files before publishing.

## Update academic information

- Edit `data/profile.json` for name, affiliation, major, email, introduction, GitHub account, and interests.
- Edit `data/publications.json` to update or add papers. Use a complete author list, official publication venue, publication year, DOI, and publisher link. The build automatically sorts by descending publication year and bolds the exact name `Yanzhou Wang`.
- Run `node tools/build.mjs` to regenerate `index.html`, `robots.txt`, and `sitemap.xml`.
- Edit `styles.css` for typography and layout.
- Commit and push the changes to `main`. GitHub Pages then republishes them.

For a new publication, copy an existing record and assign a unique `id`. Optional fields are `issue`, `articleNumber`, `pages`, `published` (ISO date), and `publisher`. Keep the year tied to the official publication date rather than the digits in a DOI.

The 2025 survey is deliberately labeled **Conference Proceedings Paper · Survey**, in the EWA Publishing series **Applied and Computational Engineering (ACE)**. No unverified specific conference name is used. Its year stays **2025**, despite the DOI containing `2026`.

## Preview locally

Open `index.html` directly in a browser, or run:

```powershell
node tools/preview.mjs
```

Then open http://127.0.0.1:4173/ . Press Ctrl+C to stop the preview server. Check at a narrow width (for example 375 px) as well as desktop width. The stylesheet uses a single-column layout on small screens, wraps the email, and uses system fonts.

## OpenReview checks after publishing

Open the HTTPS homepage in a private browser window without signing in and confirm:

- The name, full university name, and **2686705997@bupt.edu.cn** are visible in the header.
- The same email is used in OpenReview and both email links open `mailto:2686705997@bupt.edu.cn`.
- Both publications appear directly on the page, ordered 2026 then 2025, with the author's name bold.
- Each Paper and DOI link points to the correct official publication.
- Contact includes the university and actual GitHub profile.

This page supplies the requested public identity evidence. OpenReview makes its own verification decision; a homepage does not guarantee acceptance.

## Verification limits at delivery

The generated source and local HTTP response were checked for identity details, publication metadata, link targets, navigation anchors, and external asset dependencies. The ACE official page confirmed the 2025 date and citation. MDPI returned HTTP 403/429 to automated requests; its Paper and DOI URLs are retained exactly as supplied, and the DOI resolved to the supplied MDPI page. Responsive layout rules are included, but browser automation was unavailable, so an actual visual mobile-browser check remains pending. The deployment script separately checks the public HTTPS homepage after publishing.
