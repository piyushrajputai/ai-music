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

const genre =
    document.getElementById("genre");

const language =
    document.getElementById("language");

const vocals =
    document.getElementById("vocals");

const mood =
    document.getElementById("mood");

const duration =
    document.getElementById("duration");

const durationValue =
    document.getElementById("durationValue");


// =====================================================
// CHARACTER COUNTER
// =====================================================

promptBox.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            `${promptBox.value.length} / 1000`;

    }
);


// =====================================================
// DURATION
// =====================================================

duration.addEventListener(
    "input",
    () => {

        durationValue.textContent =
            `${duration.value} sec`;

    }
);


// =====================================================
// INSTRUMENTS
// =====================================================

const instrumentButtons =
    document.querySelectorAll(
        ".instrument"
    );


instrumentButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const selected =
                    document.querySelectorAll(
                        ".instrument.active"
                    );


                // Maximum 5

                if (
                    !button.classList.contains(
                        "active"
                    ) &&
                    selected.length >= 5
                ) {

                    return;

                }


                button.classList.toggle(
                    "active"
                );

            }
        );

    }
);


// =====================================================
// MUSIC TYPE
// =====================================================

let musicType = "Song";


const typeButtons =
    document.querySelectorAll(
        ".type-button"
    );


typeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                typeButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );


                musicType =
                    button.dataset.type;


                // Automatically change vocal
                // setting for instrumental

                if (
                    musicType ===
                    "Instrumental"
                ) {

                    vocals.value =
                        "No vocals";

                    language.value =
                        "Instrumental";

                }

            }
        );

    }
);


// =====================================================
// TOP TOOL BUTTONS
// =====================================================

const toolButtons =
    document.querySelectorAll(
        ".tool-button"
    );


toolButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                toolButtons.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                button.classList.add(
                    "active"
                );

            }
        );

    }
);


// =====================================================
// EXAMPLES
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

                const text =
                    example.dataset.prompt;


                promptBox.value =
                    text;


                characterCount.textContent =
                    `${text.length} / 1000`;


                promptBox.focus();

            }
        );

    }
);


// =====================================================
// GENERATE
// =====================================================

generateButton.addEventListener(
    "click",
    generateMusic
);


async function generateMusic() {


    const userPrompt =
        promptBox.value.trim();


    if (!userPrompt) {

        alert(
            "Please describe the music you want."
        );

        promptBox.focus();

        return;

    }


    // -------------------------------------------------
    // GET SELECTED INSTRUMENTS
    // -------------------------------------------------

    const selectedInstruments =
        Array.from(
            document.querySelectorAll(
                ".instrument.active"
            )
        ).map(
            button =>
                button.dataset.instrument
        );


    // -------------------------------------------------
    // CREATE AI PROMPT
    // -------------------------------------------------

    let finalPrompt = "";


    finalPrompt +=
        `${userPrompt}. `;


    finalPrompt +=
        `Genre: ${genre.value}. `;


    if (
        language.value !==
        "Instrumental"
    ) {

        finalPrompt +=
            `Language: ${language.value}. `;

    }


    if (
        vocals.value !==
        "No vocals"
    ) {

        finalPrompt +=
            `${vocals.value}. `;

    } else {

        finalPrompt +=
            "Instrumental music with no vocals. ";

    }


    finalPrompt +=
        `Mood: ${mood.value}. `;


    if (
        selectedInstruments.length > 0
    ) {

        finalPrompt +=
            `Main instruments: ${selectedInstruments.join(", ")}. `;

    }


    finalPrompt +=
        `Music type: ${musicType}. `;


    finalPrompt +=
        "High quality, polished music production.";


    console.log(
        "FINAL AI PROMPT:",
        finalPrompt
    );


    // -------------------------------------------------
    // BUTTON
    // -------------------------------------------------

    generateButton.disabled =
        true;


    generateButton.innerHTML = `
        <span>✦</span>
        Creating your music...
    `;


    // -------------------------------------------------
    // OUTPUT
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
                Generating ${duration.value} seconds
                of ${genre.value} music...
            </p>

        </div>

    `;


    try {


        // -------------------------------------------------
        // SEND TO BACKEND
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

                            prompt:
                                finalPrompt,

                            duration:
                                Number(
                                    duration.value
                                )

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Generation failed."
            );

        }


        // -------------------------------------------------
        // RESULT
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
                            Your ${genre.value} Music
                        </h2>

                        <p>
                            ${escapeHTML(
                                userPrompt
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

    generateButton.disabled =
        false;


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


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}