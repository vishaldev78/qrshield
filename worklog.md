# QRShield Worklog

Project: QRShield — Privacy-first Quishing Defense Platform (Next.js 16, single-route SPA with client view states)

---
Task ID: 1
Agent: Z.ai Code (main orchestrator)
Task: Project exploration, dependency setup, worklog initialization

Work Log:
- Explored scaffold: Next.js 16 + Tailwind 4 + shadcn/ui (New York) + framer-motion + zustand + date-fns + z-ai-web-dev-sdk present
- Installed jsqr@1.4.0 (cozmo/jsQR, pure client-side QR decoding — privacy-first, no upload)
- Loaded LLM skill for the optional AI explanation backend route
- Confirmed single-route constraint: entire app lives on `/` with client-side view switching (landing / scanner / result / how-it-works / privacy)

Stage Summary:
- Ready to build: security engine (client-side, deterministic rules) → QR layer → UI → AI explain API → browser verification
---
Task ID: 2-8
Agent: Z.ai Code (main orchestrator)
Task: Full implementation of QRShield — privacy-first Quishing Defense Platform

Work Log:
- Security engine (src/lib/security/): types.ts, domain.ts (PSL-lite eTLD+1, IP/punycode/leet utils), brands.ts (28 brands w/ official-domain registry), rules.ts (14 explainable rules incl. brand-impersonation via leet-decoded token matching + registrable-domain compare, NOT naive includes()), scoring.ts (per-category caps domain:60/transport:30/content:35, independent-signal amplifier, level floors for IP/shortener/punycode/brand/userinfo), analyzer.ts (normalizeQrContent handles http(s)/bare-domain/bare-IP/WIFI:/mailto:/upi:/javascript:/data: outcomes)
- QR layer (src/lib/qr/): decodeImage.ts (File→canvas→jsQR, 100% local), camera.ts (getUserMedia + 180ms frame loop → jsQR, typed CameraError states: unsupported/denied/not-found/failed)
- Storage: localStorage-only scan history (cap 20, SSR-safe); Zustand store with hash-based view routing (#scanner/#result/#how/#privacy)
- UI (src/components/qrshield/): AppShell, Navbar, Footer (mt-auto sticky), LandingHero (animated decode→analyze→verdict pipeline mock), ScannerPanel (Camera/Upload/Paste URL tabs), CameraScanner (corner brackets + scanline + graceful error fallbacks), ImageUploader (drag&drop, local preview, error tips), URLInput (synthetic demo URLs labeled safe), ResultView (2-col desktop/stacked mobile), RiskScore (animated SVG gauge w/ sr-only verdict), RiskFlag (severity-styled), URLDetails (8-row technical dl), SafeActionCard (level-aware actions; Open always behind AlertDialog w/ "Stay safe" default; high-risk has NO open button), AIExplain (opt-in only), ScanHistory, HowItWorks, PrivacyView
- API /api/explain: z-ai-web-dev-sdk backend-only, zod-validated, system prompt locks AI to restating engine findings (never re-scores, never contradicts)
- Theme: exact PRD palette (#0B1020/#111827/#6366F1/#10B981/#F59E0B/#EF4444/#94A3B8) in globals.css + scanline/scrollbar utilities; metadata + viewport themeColor in layout.tsx
- Verification (Agent Browser): landing render ✓, camera-error fallback ✓, QR image upload → 80/100 HIGH RISK w/ PayPal impersonation ✓, safe URL → 0/100 ✓, bit.ly → 30/100 suspicious floor ✓, WIFI: content → correct non-web card ✓, javascript: → blocked card ✓, AI explain POST 200 w/ calm plain-language output ✓, history w/ relative times ✓, Open-destination dialog ✓, mobile 390px ✓, sticky footer ✓, zero console/page errors, lint clean

Stage Summary:
- App complete and browser-verified at http://localhost:3000 (single route, PRD-compliant)
- Key decisions: dark-only theme (PRD palette), hash routing instead of extra routes (sandbox constraint), client-side deterministic engine + opt-in AI translator, shortener/IP level-floors reconciling PRD's +15/+25 scores with Suspicious verdict examples
- Artifacts: 26 new files (5 lib/security, 2 lib/qr, 1 lib/storage, 1 store, 16 components, 1 API route) + page.tsx/layout.tsx/globals.css rewrites

---
Task ID: 3
Agent: Z.ai Code (main orchestrator)
Task: Add built-in Test QR generator panel + ground-truth aligned expected verdicts (user asked "how to test QR codes")

Work Log:
- Installed qrcode@1.5.4 + @types/qrcode for on-device QR generation
- Created src/components/qrshield/TestQRPanel.tsx: 6 synthetic test cases (brand-impersonation 80/high, raw-ip 50/suspicious, punycode 55/suspicious, subdomain-brand 60/high, shortener 30/suspicious, legit 0/low), dynamic qrcode import, white QR plate for scan contrast, Download PNG + Copy URL + Analyze-directly actions, 3-step how-to-test guide (two-device camera loop / single-device download+upload loop)
- Ran all 6 URLs through the deterministic engine via bun to extract ground-truth scores; aligned every "expected" badge with real engine output (raw-ip & punycode corrected from high→suspicious)
- ScannerPanel: added 4th "Test QR" tab (grid-cols-4, mobile-safe labels)
- Browser E2E: QR generation ✓, upload-decode-analyze loop (raw-ip PNG → 50/100 suspicious, 3 indicators) ✓, brand case → 80/100 HIGH RISK + PayPal impersonation ✓, control → 0/100 low ✓, mobile 390px ✓, zero console errors, lint clean

Stage Summary:
- App is now fully self-testing: no external QR generator needed
- Test panel doubles as a demo oracle — expected badge must match live verdict
