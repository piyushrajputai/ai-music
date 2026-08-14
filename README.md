# MelodyAI - AI Music Generator

Create music with the power of artificial intelligence! MelodyAI uses the MusicGen model to generate high-quality music from text descriptions.

## Features

- 🎵 **AI Music Generation** - Describe your music idea, and AI will create it
- 🎤 **Multiple Formats** - Generate full songs, vocals, or instrumentals
- 🎹 **Genre Support** - Various genres and musical styles
- 🌍 **Multilingual** - Support for different languages
- 📥 **Download** - Save your generated music as WAV files
- ✨ **Modern UI** - Beautiful, responsive web interface

## Project Structure

```
ai-music/
├── backend/
│   ├── app.py              # Flask backend server
│   ├── requirements.txt    # Python dependencies
│   └── generated/          # Output folder for generated music
├── frontend/
│   ├── index.html          # Main HTML page
│   ├── script.js           # JavaScript logic
│   └── style.css           # Styling
└── README.md               # This file
```

## Installation

### Prerequisites
- Python 3.8+
- Node.js (optional, for running frontend locally)

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

The server will start on `http://localhost:5000`

### Frontend

Open `frontend/index.html` in your browser or serve it using a local server.

## Usage

1. **Start the backend** - Run `python app.py` in the backend folder
2. **Open the frontend** - Open `frontend/index.html` in your browser
3. **Describe your music** - Type what you want to create
4. **Generate** - Click the "Generate Music" button
5. **Download** - Download the generated WAV file

## Technology Stack

- **Backend**: Flask, PyTorch, Transformers (Hugging Face)
- **Frontend**: HTML, CSS, JavaScript
- **AI Model**: MusicGen (facebook/musicgen-small)

## API Endpoints

### POST /generate
Generate music from a text prompt

**Request:**
```json
{
  "prompt": "upbeat electronic dance music",
  "duration": 8
}
```

**Response:**
```json
{
  "success": true,
  "prompt": "upbeat electronic dance music",
  "duration": 8,
  "audio_url": "http://localhost:5000/audio/filename.wav"
}
```

### GET /audio/<filename>
Download the generated audio file

## License

MIT License - Feel free to use this project for personal or commercial purposes

## Support

For issues, feature requests, or questions, please create an issue on GitHub.

---

Made with ❤️ and AI 🎵
