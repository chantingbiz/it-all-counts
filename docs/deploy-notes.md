# Deploy Notes (snapshot)

Date: 2025-08-09

## Netlify
- Connected repo/branch: <fill in>  
- `netlify.toml` in repo sets `functions = netlify/functions`
- Environment variables (production):
  - `IAC_AWS_REGION` = `us-east-1`
  - `IAC_AWS_ACCESS_KEY_ID` = <set in Netlify UI>
  - `IAC_AWS_SECRET_ACCESS_KEY` = <set in Netlify UI>
  - `IAC_S3_BUCKET` = `itallcounts-videos`
- (Optional) Deploys  lock current production deploy after verifying

## AWS S3
- Bucket: `itallcounts-videos`
- Region: `us-east-1`
- Videos live under prefix: `clips/` (adjust if different)

## Local Dev
- Copy `.env.example`  `.env` and fill values
- Run: `npx netlify dev`

## Functions
- `netlify/functions/sign-s3-url.js` (presigns GET for S3 objects)
- `netlify/functions/list-s3-keys.js` (optional: lists/filters keys by substring)

## Frontend wiring
- Helper: `src/utils/getVideoUrl.js`
- Player: `src/components/S3VideoPlayer.jsx`
- Modal: `src/components/Modal.jsx`
- Filters: presets + custom terms in `App.jsx`

## Release tips
- Tag this version: see commands printed by the script
- If you want a static pool, add `public/video-manifest.json` with the keys used
