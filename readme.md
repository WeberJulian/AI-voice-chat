# AI Voice Chat

## Overview

This is a simple react app that allows you to chat with an AI assistant using your voice.

It uses `Whisper large v3` for transcription, `openchat 3.5 AWQ` for the AI assistant, and `XTTS v2` for text-to-speech.

Its main feature is speech-to-speech latency, it more than halves the latency of the ChatGPT with voice demo video.
This repo runs on a single RTX 3090 GPU. 

No concurrency is supported and the project is not optimized production ready. It's also probably riddled with bugs so if you experience some, please open an issue or send a PR.

The XTTS v2 model is from the [coqui-TTS](https://github.com/coqui-ai/TTS).
If you have any questions about the model or the project, you can join our [discord server](https://discord.gg/vHgDbMzgfv)

## Demo

https://github.com/WeberJulian/AI-voice-chat/assets/17219561/2be20ec1-fa5e-4c26-83ec-c074357f3905

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
cd ..
docker-compose up
```

## Usage

1. Open the app in your browser at `http://localhost:5000`

2. Allow microphone access

3. Push to talk either with the `Shift` ⇧ key or the circle

4. Enjoy!

To reset the conversation, refresh the page.

## Custom models

If you fine-tune XTTS and want to use your own model, you can add that line to the `docker-compose.yml` file, in the tts service:

```yml
services:
    ...
    tts:
        ...
        volumes:
            - /path/to/your/model:/app/tts_models
```

In the /path/to/your/model folder, you must have the following files:
- `config.json`
- `model.pth`
- `vocab.json`

