# Mellune — Music App Starter

A responsive React + Vite starter for the Mellune music app concept.

## Run locally
1. Install Node.js on a computer, or use a browser-based development environment that supports Vite.
2. Run `npm install`
3. Run `npm run dev`

## Build
Run `npm run build`.

## Current prototype features
- Responsive purple/pink music-app interface
- Search across sample track cards
- Mood discovery cards
- Like/favourite buttons
- Upload and play audio files stored on the user's device (local browser session)
- Basic playback controls and volume

## Important limitations
- Sample track cards are design placeholders, not real playable songs.
- Uploading audio plays a file selected by the user; it does not upload it to a server.
- No commercial music catalogue, accounts, cloud sync, public uploads, subscriptions, or streaming backend is included.
- Only use audio you own or have permission to stream. Commercial songs require appropriate music licences.
- Google Fonts is loaded from the internet; the app UI itself otherwise works without a music API.

## Next development steps
1. Add a secure backend and user accounts.
2. Add licensed music or a catalogue of tracks from artists who explicitly permit streaming.
3. Add playlists and cloud sync.
4. Add content moderation, copyright reporting, and artist payout rules before public uploads.
5. Test the Android build with Capacitor after the web version is stable.
