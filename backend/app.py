from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from transformers import (
    AutoProcessor,
    MusicgenForConditionalGeneration
)

import torch
import scipy.io.wavfile
import os
import uuid


# =====================================================
# APP
# =====================================================

app = Flask(__name__)
CORS(app)


# =====================================================
# SETTINGS
# =====================================================

MODEL_NAME = "facebook/musicgen-small"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

OUTPUT_FOLDER = os.path.join(
    BASE_DIR,
    "generated"
)

os.makedirs(OUTPUT_FOLDER, exist_ok=True)


# =====================================================
# DEVICE
# =====================================================

if torch.cuda.is_available():

    device = "cuda"

else:

    device = "cpu"


print()
print("========================================")
print("        MELODY AI MUSIC SERVER")
print("========================================")
print("Device:", device)
print("Model:", MODEL_NAME)
print("========================================")
print()


# =====================================================
# LOAD AI MODEL
# =====================================================

print("Loading MusicGen...")

processor = AutoProcessor.from_pretrained(
    MODEL_NAME
)

model = MusicgenForConditionalGeneration.from_pretrained(
    MODEL_NAME
)

model.to(device)

print()
print("MusicGen loaded successfully!")
print()


# =====================================================
# HOME
# =====================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({

        "success": True,

        "message":
            "MelodyAI Music Generator is running.",

        "model":
            MODEL_NAME,

        "device":
            device

    })


# =====================================================
# GENERATE MUSIC
# =====================================================

@app.route("/generate", methods=["POST"])
def generate():

    try:

        data = request.get_json()

        if not data:

            return jsonify({
                "success": False,
                "error": "No data received."
            }), 400


        prompt = data.get(
            "prompt",
            ""
        ).strip()


        if not prompt:

            return jsonify({
                "success": False,
                "error": "Please enter a music prompt."
            }), 400


        print()
        print("========================================")
        print("NEW GENERATION")
        print("========================================")
        print("Prompt:")
        print(prompt)
        print("========================================")


        # -------------------------------------------------
        # GENERATION LENGTH
        # -------------------------------------------------

        # Start with 8 seconds.
        #
        # MusicGen uses approximately 50 tokens per second.
        #

        duration = int(
            data.get(
                "duration",
                8
            )
        )


        # Safety limit

        duration = max(
            4,
            min(duration, 20)
        )


        max_new_tokens = duration * 50


        # -------------------------------------------------
        # PROCESS PROMPT
        # -------------------------------------------------

        inputs = processor(

            text=[prompt],

            padding=True,

            return_tensors="pt"

        )


        inputs = {
            key: value.to(device)
            for key, value in inputs.items()
        }


        # -------------------------------------------------
        # GENERATE
        # -------------------------------------------------

        print(
            f"Generating approximately {duration} seconds..."
        )


        with torch.no_grad():

            audio_values = model.generate(

                **inputs,

                do_sample=True,

                guidance_scale=3.0,

                max_new_tokens=max_new_tokens

            )


        # -------------------------------------------------
        # AUDIO
        # -------------------------------------------------

        audio = (
            audio_values[0, 0]
            .cpu()
            .numpy()
        )


        sample_rate = (
            model.config
            .audio_encoder
            .sampling_rate
        )


        # -------------------------------------------------
        # FILE
        # -------------------------------------------------

        filename = (
            f"{uuid.uuid4().hex}.wav"
        )


        filepath = os.path.join(

            OUTPUT_FOLDER,

            filename

        )


        scipy.io.wavfile.write(

            filepath,

            sample_rate,

            audio

        )


        print()
        print("Generation complete!")
        print("File:", filename)
        print()


        # -------------------------------------------------
        # RESPONSE
        # -------------------------------------------------

        return jsonify({

            "success": True,

            "prompt": prompt,

            "duration": duration,

            "audio_url":
                f"http://localhost:5000/audio/{filename}"

        })


    except Exception as error:

        print()
        print("GENERATION ERROR")
        print(error)
        print()


        return jsonify({

            "success": False,

            "error": str(error)

        }), 500


# =====================================================
# AUDIO ROUTE
# =====================================================

@app.route(
    "/audio/<filename>",
    methods=["GET"]
)
def audio(filename):

    return send_from_directory(

        OUTPUT_FOLDER,

        filename

    )


# =====================================================
# RUN SERVER
# =====================================================

if __name__ == "__main__":

    app.run(

        host="127.0.0.1",

        port=5000,

        debug=True

    )