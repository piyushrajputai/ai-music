const API_URL = "http://localhost:5000";


// =====================================================
// ELEMENTS
// =====================================================

const promptBox =
    document.getElementById("prompt");

const characterCount =
    document.getElementById("characterCount");

const generateButton =
    document.getElementById("generateButton");

const outputSection =
    document.getElementById("outputSection");


// =====================================================
// CHARACTER COUNT
// =====================================================

promptBox.addEventListener(
    "input",
    () => {

        const length =
            promptBox.value.length;

        characterCount.textContent =
            `${length} / 1000`;

    }
);


// =====================================================
// EXAMPLE PROMPTS
// =====================================================

const examples =
    document.querySelectorAll(
        ".example"
    );


examples.forEach(
    example => {

        example.addEventListener(
            "click",
            () => {

                const prompt =
                    example.dataset.prompt;

                promptBox.value =
                    prompt;

                characterCount.textContent =
                    `${prompt.length} / 1000`;

                promptBox.focus();

            }
        );

    }
);


// =====================================================
// GENERATE MUSIC
// =====================================================

generateButton.addEventListener(
    "click",
    generateMusic
);


async function generateMusic() {

    const prompt =
        promptBox.value.trim();


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!prompt) {

        promptBox.focus();

        alert(
            "Describe the music you want first."
        );

        return;

    }


    // -------------------------------------------------
    // BUTTON LOADING
    // -------------------------------------------------

    generateButton.disabled = true;

    generateButton.innerHTML = `
        <span>✦</span>
        Creating your music...
    `;


    // -------------------------------------------------
    // SHOW GENERATING STATE
    // -------------------------------------------------

    outputSection.innerHTML = `

        <div class="output-empty">

            <div class="empty-icon">
                ✦
            </div>

            <h2>
                AI is creating your music
            </h2>

            <p>
                This may take a little while.
                MusicGen is generating the audio locally.
            </p>

        </div>

    `;


    try {

        // -------------------------------------------------
        // SEND PROMPT TO PYTHON
        // -------------------------------------------------

        const response =
            await fetch(
                `${API_URL}/generate`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            prompt: prompt,

                            duration: 8

                        })

                }
            );


        const data =
            await response.json();


        // -------------------------------------------------
        // ERROR
        // -------------------------------------------------

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Music generation failed."
            );

        }


        // -------------------------------------------------
        // SHOW RESULT
        // -------------------------------------------------

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
                            ${escapeHTML(
                                data.prompt
                            )}
                        </p>

                    </div>

                </div>


                <audio
                    controls
                    autoplay
                    class="audio-player"
                    src="${data.audio_url}"
                ></audio>


                <div class="result-actions">

                    <a
                        href="${data.audio_url}"
                        download="melody-ai-music.wav"
                        class="download-button"
                    >
                        ↓ Download
                    </a>

                    <button
                        onclick="generateMusic()"
                        class="again-button"
                    >
                        ↻ Generate Again
                    </button>

                </div>

            </div>

        `;


        // Scroll to result

        outputSection.scrollIntoView({

            behavior: "smooth",

            block: "center"

        });


    } catch (error) {

        console.error(error);


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

    }


    // -------------------------------------------------
    // RESET BUTTON
    // -------------------------------------------------

    generateButton.disabled = false;

    generateButton.innerHTML = `
        <span class="generate-icon">✦</span>

        Generate Music

        <span class="arrow">→</span>
    `;

}


// =====================================================
// SECURITY HELPER
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}