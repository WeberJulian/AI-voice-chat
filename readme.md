# AI Voice Chat

## Overview

This is a simple react app that allows you to chat with an AI assistant using your voice.

It uses `Whisper large v3` for transcription, `openchat 3.5 AWQ` for the AI assistant, and `XTTS v2` for text to speech.

Its main feature is speech to speech latency, it more than halves the latency of the ChatGPT with voice demo video.
This repo runs on a single RTX 3090 GPU. No concurency is supported and the server is not optimized for production.

## Installation

### Requisites
1. Have a Nvidia GPU with more than 16GB of VRAM and latest drivers
2. Have `docker-compose` installed

### Steps
1. Clone the repo

```bash
git clone https://github.com/WeberJulian/AI-voice-chat.git
```

2. Build the react app

```bash
cd AI-voice-chat
cd web-app
npm install && npm run build
```

3. Start everything 🚀

```bash
docker-compose up
```

## Usage

1. Open the app in your browser at `http://localhost:5000`

2. Allow microphone access

3. Push to talk either with the `SPACE` key or the circle

4. Enjoy!

To reset the conversation, refresh the page.