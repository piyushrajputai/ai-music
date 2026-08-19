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
import threading
import queue
import time


# =========================================================
# APP
# =========================================================

app = Flask(__name__)
CORS(app)


# =========================================================
# SETTINGS
# =========================================================

MODEL_NAME = "facebook/musicgen-small"

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

OUTPUT_FOLDER = os.path.join(
    BASE_DIR,
    "generated"
)

os.makedirs(
    OUTPUT_FOLDER,
    exist_ok=True
)


# =========================================================
# DEVICE
# =========================================================

if torch.cuda.is_available():

    device = "cuda"

else:

    device = "cpu"


# =========================================================
# SERVER INFORMATION
# =========================================================

print()
print("=" * 60)
print("              INSTRUVA.AI")
print("          LOCAL MUSIC SERVER")
print("=" * 60)
print("Model :", MODEL_NAME)
print("Device:", device)

if device == "cuda":

    print(
        "GPU   :",
        torch.cuda.get_device_name(0)
    )

else:

    print(
        "WARNING: CUDA is not available."
    )

    print(
        "MusicGen will run on CPU."
    )

print("=" * 60)
print()


# =========================================================
# LOAD MUSICGEN
# =========================================================

print("Loading MusicGen...")
print("This may take some time the first time.")
print()


processor = AutoProcessor.from_pretrained(
    MODEL_NAME
)


model = MusicgenForConditionalGeneration.from_pretrained(
    MODEL_NAME
)


model.to(device)

model.eval()


print()
print("MusicGen loaded successfully!")
print()


# =========================================================
# MUSIC QUEUE
# =========================================================

music_queue = queue.Queue()


# =========================================================
# JOB STORAGE
# =========================================================

jobs = {}

jobs_lock = threading.Lock()


# =========================================================
# JOB STRUCTURE
# =========================================================

def create_job(
    prompt,
    genre,
    mood,
    duration
):

    job_id = (
        uuid.uuid4()
        .hex[:12]
    )

    job = {

        "job_id":
            job_id,

        "prompt":
            prompt,

        "genre":
            genre,

        "mood":
            mood,

        "duration":
            duration,

        "status":
            "queued",

        "audio_url":
            None,

        "error":
            None,

        "created_at":
            time.time(),

        "started_at":
            None,

        "completed_at":
            None
    }


    with jobs_lock:

        jobs[job_id] = job


    return job


# =========================================================
# BUILD MUSIC PROMPT
# =========================================================

def build_prompt(job):

    prompt = job["prompt"]

    genre = job.get(
        "genre",
        ""
    )

    mood = job.get(
        "mood",
        ""
    )


    parts = [
        prompt
    ]


    if genre:

        parts.append(
            f"{genre} instrumental"
        )


    if mood:

        parts.append(
            f"{mood} mood"
        )


    parts.append(
        "instrumental music"
    )


    parts.append(
        "no vocals"
    )


    return ", ".join(parts)


# =========================================================
# UPDATE JOB
# =========================================================

def update_job(
    job_id,
    **values
):

    with jobs_lock:

        if job_id not in jobs:

            return


        jobs[job_id].update(
            values
        )


# =========================================================
# GENERATE MUSIC
# =========================================================

def generate_music(job):

    job_id = job["job_id"]

    duration = int(
        job["duration"]
    )


    final_prompt = build_prompt(
        job
    )


    print()
    print("=" * 60)
    print("STARTING MUSIC GENERATION")
    print("=" * 60)
    print("Job ID :", job_id)
    print("Prompt :", final_prompt)
    print("Length :", duration, "seconds")
    print("Device :", device)
    print("=" * 60)
    print()


    update_job(

        job_id,

        status="generating",

        started_at=time.time()

    )


    try:

        # -------------------------------------------------
        # PROCESS PROMPT
        # -------------------------------------------------

        inputs = processor(

            text=[final_prompt],

            padding=True,

            return_tensors="pt"

        )


        inputs = {

            key: value.to(device)

            for key, value
            in inputs.items()

        }


        # -------------------------------------------------
        # GENERATION LENGTH
        # -------------------------------------------------

        max_new_tokens = (
            duration * 50
        )


        print(
            "Generating..."
        )


        # -------------------------------------------------
        # GENERATE
        # -------------------------------------------------

        with torch.no_grad():

            audio_values = model.generate(

                **inputs,

                do_sample=True,

                guidance_scale=3.0,

                max_new_tokens=
                    max_new_tokens

            )


        # -------------------------------------------------
        # CONVERT AUDIO
        # -------------------------------------------------

        audio = (

            audio_values[
                0,
                0
            ]

            .cpu()
            .numpy()

        )


        sample_rate = (

            model.config
            .audio_encoder
            .sampling_rate

        )


        # -------------------------------------------------
        # FILE NAME
        # -------------------------------------------------

        filename = (
            f"instruva_{job_id}.wav"
        )


        filepath = os.path.join(

            OUTPUT_FOLDER,

            filename

        )


        # -------------------------------------------------
        # SAVE WAV
        # -------------------------------------------------

        scipy.io.wavfile.write(

            filepath,

            sample_rate,

            audio

        )


        print()
        print(
            "Music generated successfully!"
        )

        print(
            "File:",
            filepath
        )


        # -------------------------------------------------
        # UPDATE JOB
        # -------------------------------------------------

        update_job(

            job_id,

            status="ready",

            audio_url=
                f"/audio/{filename}",

            completed_at=
                time.time()

        )


        print(
            "Job completed:",
            job_id
        )

        print()


    except Exception as error:

        print()
        print("=" * 60)
        print("MUSIC GENERATION ERROR")
        print("=" * 60)
        print(error)
        print("=" * 60)
        print()


        update_job(

            job_id,

            status="failed",

            error=str(error),

            completed_at=
                time.time()

        )


# =========================================================
# BACKGROUND QUEUE PROCESSOR
# =========================================================

def queue_processor():

    print(
        "Music queue processor started."
    )

    print(
        "Waiting for music jobs..."
    )

    print()


    while True:

        job = music_queue.get()


        try:

            generate_music(
                job
            )

        except Exception as error:

            print(
                "Queue processor error:",
                error
            )


        finally:

            music_queue.task_done()


# =========================================================
# START QUEUE THREAD
# =========================================================

queue_thread = threading.Thread(

    target=queue_processor,

    daemon=True

)

queue_thread.start()


# =========================================================
# HOME
# =========================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({

        "success":
            True,

        "service":
            "Instruva.AI Local Music Server",

        "status":
            "online",

        "model":
            MODEL_NAME,

        "device":
            device

    })


# =========================================================
# HEALTH
# =========================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "success":
            True,

        "status":
            "healthy",

        "device":
            device,

        "model":
            MODEL_NAME

    })


# =========================================================
# GENERATE
# =========================================================

@app.route(
    "/generate",
    methods=["POST"]
)
def generate():

    try:

        data = request.get_json()


        if not data:

            return jsonify({

                "success":
                    False,

                "error":
                    "No data received."

            }), 400


        # -------------------------------------------------
        # PROMPT
        # -------------------------------------------------

        prompt = str(

            data.get(
                "prompt",
                ""
            )

        ).strip()


        if not prompt:

            return jsonify({

                "success":
                    False,

                "error":
                    "Please enter a music prompt."

            }), 400


        if len(prompt) > 1000:

            return jsonify({

                "success":
                    False,

                "error":
                    "Prompt cannot exceed 1000 characters."

            }), 400


        # -------------------------------------------------
        # GENRE
        # -------------------------------------------------

        genre = str(

            data.get(
                "genre",
                ""
            )

        ).strip()


        # -------------------------------------------------
        # MOOD
        # -------------------------------------------------

        mood = str(

            data.get(
                "mood",
                ""
            )

        ).strip()


        # -------------------------------------------------
        # DURATION
        # -------------------------------------------------

        try:

            duration = int(

                data.get(
                    "duration",
                    10
                )

            )

        except:

            duration = 10


        duration = max(

            5,

            min(
                duration,
                30
            )

        )


        # -------------------------------------------------
        # CREATE JOB
        # -------------------------------------------------

        job = create_job(

            prompt,

            genre,

            mood,

            duration

        )


        # -------------------------------------------------
        # ADD TO QUEUE
        # -------------------------------------------------

        music_queue.put(
            job
        )


        # -------------------------------------------------
        # QUEUE POSITION
        # -------------------------------------------------

        position = (
            music_queue.qsize()
        )


        print()
        print("=" * 60)
        print("NEW MUSIC REQUEST")
        print("=" * 60)
        print("Job ID :", job["job_id"])
        print("Prompt :", prompt)
        print("Genre  :", genre)
        print("Mood   :", mood)
        print("Length :", duration)
        print("Queue  :", position)
        print("=" * 60)
        print()


        return jsonify({

            "success":
                True,

            "job_id":
                job["job_id"],

            "status":
                "queued",

            "queue_position":
                position,

            "message":
                "Your music has been added to the generation queue."

        })


    except Exception as error:

        print(
            "Generate error:",
            error
        )


        return jsonify({

            "success":
                False,

            "error":
                str(error)

        }), 500


# =========================================================
# STATUS
# =========================================================

@app.route(
    "/status/<job_id>",
    methods=["GET"]
)
def status(job_id):

    with jobs_lock:

        job = jobs.get(
            job_id
        )


    if not job:

        return jsonify({

            "success":
                False,

            "error":
                "Music job not found."

        }), 404


    response = {

        "success":
            True,

        "job_id":
            job["job_id"],

        "status":
            job["status"],

        "prompt":
            job["prompt"],

        "genre":
            job["genre"],

        "mood":
            job["mood"],

        "duration":
            job["duration"],

        "audio_url":
            job["audio_url"],

        "error":
            job["error"]

    }


    return jsonify(
        response
    )


# =========================================================
# AUDIO
# =========================================================

@app.route(
    "/audio/<filename>",
    methods=["GET"]
)
def audio(filename):

    return send_from_directory(

        OUTPUT_FOLDER,

        filename

    )


# =========================================================
# QUEUE INFORMATION
# =========================================================

@app.route(
    "/queue",
    methods=["GET"]
)
def queue_info():

    with jobs_lock:

        total_jobs = len(
            jobs
        )

        queued_jobs = sum(

            1

            for job in jobs.values()

            if job["status"] == "queued"

        )

        generating_jobs = sum(

            1

            for job in jobs.values()

            if job["status"] == "generating"

        )

        ready_jobs = sum(

            1

            for job in jobs.values()

            if job["status"] == "ready"

        )


    return jsonify({

        "success":
            True,

        "total_jobs":
            total_jobs,

        "queued":
            queued_jobs,

        "generating":
            generating_jobs,

        "ready":
            ready_jobs,

        "waiting_queue":
            music_queue.qsize()

    })


# =========================================================
# RUN SERVER
# =========================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print("        INSTRUVA.AI MUSIC SERVER")
    print("=" * 60)
    print("Server : http://127.0.0.1:5000")
    print("GPU    :", device)

    if device == "cuda":

        print(
            "GPU    :",
            torch.cuda.get_device_name(0)
        )

    print()
    print(
        "Keep this window running while"
    )

    print(
        "Instruva.AI is generating music."
    )

    print("=" * 60)
    print()


    app.run(

        host="0.0.0.0",

        port=5000,

        debug=False

    )