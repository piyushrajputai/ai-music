const API_URL = "https://mpg-livestock-waiting-tablet.trycloudflare.com ";

// =====================================================
// ELEMENTS
// =====================================================

const promptBox = document.getElementById("prompt");
const characterCount = document.getElementById("characterCount");
const generateButton = document.getElementById("generateButton");
const outputSection = document.getElementById("musicResult");

const genreSelect = document.getElementById("genre");
const moodSelect = document.getElementById("mood");
const durationSlider = document.getElementById("duration");
const durationValue = document.getElementById("durationValue");


// =====================================================
// DURATION
// =====================================================

if (durationSlider && durationValue) {

    durationValue.textContent =
        `${durationSlider.value} sec`;

    durationSlider.addEventListener("input", () => {

        durationValue.textContent =
            `${durationSlider.value} sec`;

    });

}


// =====================================================
// CHARACTER COUNT
// =====================================================

if (promptBox && characterCount) {

    promptBox.addEventListener("input", () => {

        characterCount.textContent =
            `${promptBox.value.length} / 1000`;

    });

}


// =====================================================
// EXAMPLE PROMPTS
// =====================================================

const examples =
    document.querySelectorAll(".example");

examples.forEach(example => {

    example.addEventListener("click", () => {

        const prompt =
            example.dataset.prompt;

        promptBox.value = prompt;

        if (characterCount) {

            characterCount.textContent =
                `${prompt.length} / 1000`;

        }

        promptBox.focus();

    });

});


// =====================================================
// GENERATE BUTTON
// =====================================================

if (generateButton) {

    generateButton.addEventListener(
        "click",
        generateMusic
    );

}


// =====================================================
// GENERATE MUSIC
// =====================================================

async function generateMusic() {

    const prompt =
        promptBox.value.trim();

    if (!prompt) {

        promptBox.focus();

        alert(
            "Describe the music you want first."
        );

        return;

    }


    // =================================================
    // GET OPTIONS
    // =================================================

    const genre =
        genreSelect
            ? genreSelect.value
            : "";

    const mood =
        moodSelect
            ? moodSelect.value
            : "";

    const duration =
        durationSlider
            ? Number(durationSlider.value)
            : 10;


    // =================================================
    // BUTTON
    // =================================================

    generateButton.disabled = true;

    generateButton.innerHTML = `
        <span>✦</span>
        Adding to queue...
    `;


    // =================================================
    // SHOW QUEUE
    // =================================================

    outputSection.innerHTML = `

        <div class="output-empty">

            <div class="empty-icon">
                ✦
            </div>

            <h2>
                Your music is in the queue
            </h2>

            <p>
                Your request has been sent to
                Instruva.AI.
            </p>

            <p>
                Your RTX 4060 will generate
                your music shortly.
            </p>

        </div>

    `;


    try {

        // =================================================
        // SEND REQUEST
        // =================================================

        const response =
            await fetch(
                `${API_URL}/generate`,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        prompt: prompt,

                        genre: genre,

                        mood: mood,

                        duration: duration

                    })

                }
            );


        const data =
            await response.json();


        console.log(
            "Backend response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to create music."
            );

        }


        // =================================================
        // FIND JOB CODE
        // =================================================

        const jobCode =
            data.job_code ||
            data.job_id ||
            data.id;


        // =================================================
        // IF AUDIO IS ALREADY AVAILABLE
        // =================================================

        if (data.audio_url) {

            showMusicResult(
                data.audio_url,
                prompt
            );

            return;

        }


        // =================================================
        // QUEUED JOB
        // =================================================

        if (!jobCode) {

            throw new Error(
                "The server accepted the request but did not return a job code."
            );

        }


        // =================================================
        // START STATUS CHECKING
        // =================================================

        outputSection.innerHTML = `

            <div class="output-empty">

                <div class="empty-icon">
                    ✦
                </div>

                <h2>
                    AI is creating your music
                </h2>

                <p>
                    Job:
                    <strong>
                        ${escapeHTML(jobCode)}
                    </strong>
                </p>

                <p>
                    MusicGen is generating your
                    ${duration}-second track on the RTX 4060.
                </p>

            </div>

        `;


        await checkMusicStatus(
            jobCode,
            prompt
        );


    } catch (error) {

        console.error(
            "Generation error:",
            error
        );


        outputSection.innerHTML = `

            <div class="output-empty error">

                <div class="empty-icon">
                    !
                </div>

                <h2>
                    Something went wrong
                </h2>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>

        `;

    } finally {

        generateButton.disabled = false;

        generateButton.innerHTML = `

            <span class="generate-icon">
                ✦
            </span>

            Generate Music

            <span class="arrow">
                →
            </span>

        `;

    }

}


// =====================================================
// CHECK MUSIC STATUS
// =====================================================

async function checkMusicStatus(
    jobCode,
    prompt
) {

    let attempts = 0;

    const maxAttempts = 240;


    while (
        attempts < maxAttempts
    ) {

        attempts++;


        try {

            const response =
                await fetch(
                    `${API_URL}/status/${encodeURIComponent(jobCode)}`
                );


            const data =
                await response.json();


            console.log(
                "Music status:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    "Unable to check music status."
                );

            }


            const job =
                data.job ||
                data;


            // =================================================
            // READY
            // =================================================

            if (
                job.status === "ready" &&
                job.audio_url
            ) {

                showMusicResult(
                    job.audio_url,
                    prompt
                );

                return;

            }


            // =================================================
            // FAILED
            // =================================================

            if (
                job.status === "failed"
            ) {

                throw new Error(
                    job.error_message ||
                    "Music generation failed."
                );

            }


            // =================================================
            // GENERATING
            // =================================================

            if (
                job.status === "generating"
            ) {

                outputSection.innerHTML = `

                    <div class="output-empty">

                        <div class="empty-icon">
                            ♪
                        </div>

                        <h2>
                            Instruva is generating...
                        </h2>

                    
                            
                

                        <p>
                            Please keep this page open.
                        </p>

                    </div>

                `;

            }


            // =================================================
            // QUEUED
            // =================================================

            else if (
                job.status === "queued"
            ) {

                outputSection.innerHTML = `

                    <div class="output-empty">

                        <div class="empty-icon">
                            ✦
                        </div>

                        <h2>
                            Your music is in the queue
                        </h2>

                        <p>
                            Waiting for MusicGen...
                        </p>

                    </div>

                `;

            }


        } catch (error) {

            console.error(
                "Status error:",
                error
            );

            throw error;

        }


        // =================================================
        // WAIT 5 SECONDS
        // =================================================

        await sleep(5000);

    }


    throw new Error(
        "Music generation is taking longer than expected."
    );

}


// =====================================================
// SHOW MUSIC
// =====================================================

function showMusicResult(audioURL, prompt) {

    audioURL = new URL(audioURL, API_URL).href;

    console.log("FINAL AUDIO URL:", audioURL);

    // rest of your function...


    outputSection.innerHTML = `

        <div class="generated-result">

            <div class="result-top">

                <div class="result-cover">
                    ♪
                </div>

                <div class="result-info">

                    <span>
                        AI GENERATED
                    </span>

                    <h2>
                        Your AI Music
                    </h2>

                    <p>
                        ${escapeHTML(prompt)}
                    </p>

                </div>

            </div>


            <audio
                controls
                preload="auto"
                class="audio-player"
            >

                <source
                    src="${escapeHTML(audioURL)}"
                    type="audio/wav"
                >

                Your browser does not support audio playback.

            </audio>


            <div class="result-actions">

               <button
    type="button"
    class="download-button"
    onclick="downloadMusic('${escapeHTML(audioURL)}')"
>
    ↓ Download
</button>


                <button
                    onclick="generateMusic()"
                    class="again-button"
                >
                    ↻ Generate Again
                </button>

            </div>

        </div>

    `;


    const audioPlayer =
        outputSection.querySelector(".audio-player");


    if (audioPlayer) {

        audioPlayer.load();

        audioPlayer.addEventListener(
            "error",
            () => {

                console.error(
                    "Audio player error:",
                    audioPlayer.error
                );

            }
        );

    }


    outputSection.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });

}

// =====================================================
// SLEEP
// =====================================================

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );

}


// =====================================================
// SECURITY
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;

}

async function downloadMusic(audioURL) {

    try {

        const response = await fetch(audioURL);

        if (!response.ok) {
            throw new Error(
                "Music file is not available."
            );
        }

        const blob = await response.blob();

        const blobURL =
            window.URL.createObjectURL(blob);

        const downloadLink =
            document.createElement("a");

        downloadLink.href = blobURL;

        downloadLink.download =
            "instruva-ai-music.wav";

        document.body.appendChild(
            downloadLink
        );

        downloadLink.click();

        downloadLink.remove();

        window.URL.revokeObjectURL(
            blobURL
        );

    } catch (error) {

        console.error(
            "Download error:",
            error
        );

        alert(
            "The music file could not be downloaded."
        );

    }

}

// =====================================================
// INSTRUVA.AI BACKEND STATUS
// =====================================================

async function checkInstruvaStatus() {

    const dot =
        document.getElementById("instruvaStatusDot");

    const text =
        document.getElementById("instruvaStatusText");

    if (!dot || !text) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/`,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error("Backend offline");
        }

        // Backend responded
        dot.classList.remove("closed");
        dot.classList.add("open");

        text.textContent =
            "Instruva.AI is Currently Open";

    } catch (error) {

        // Backend did not respond
        dot.classList.remove("open");
        dot.classList.add("closed");

        text.textContent =
            "Instruva.AI is Currently Closed";
    }
}


// Check immediately
checkInstruvaStatus();


// Check every 10 seconds
setInterval(
    checkInstruvaStatus,
    10000
);