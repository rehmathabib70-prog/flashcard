/************************************************************
 * ENGLISH VOCABULARY FLASH CARDS
 * Frontend
 ************************************************************/


/* =========================================================
   STATE
   ========================================================= */

let allVocabulary = [];
let learnedCards = [];
let learned2Cards = [];

let activeCards = [];

let mode = "learn";

let revisionSize = 50;

let currentIndex = 0;

let showingDetails = false;

let revisionQueue = [];

let token = localStorage.getItem(
    "english_flashcard_token"
);


/* =========================================================
   DOM
   ========================================================= */

const flashCard =
    document.getElementById(
        "flashCard"
    );

const cardContent =
    document.getElementById(
        "cardContent"
    );

const cardCounter =
    document.getElementById(
        "cardCounter"
    );

const activeCount =
    document.getElementById(
        "activeCount"
    );

const remainingCount =
    document.getElementById(
        "remainingCount"
    );

const learnedCount =
    document.getElementById(
        "learnedCount"
    );

const modeTitle =
    document.getElementById(
        "modeTitle"
    );

const gestureHint =
    document.getElementById(
        "gestureHint"
    );

const message =
    document.getElementById(
        "message"
    );

const revisionSelector =
    document.getElementById(
        "revisionSelector"
    );

const learnModeBtn =
    document.getElementById(
        "learnModeBtn"
    );

const revisionModeBtn =
    document.getElementById(
        "revisionModeBtn"
    );


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    if (!APP_CONFIG.API_URL) {

        showError(
            "Please configure config.js first."
        );

        return;
    }

    if (!token) {

        token = prompt(
            "Enter your Flash Card API token:"
        );

        if (!token) {

            showError(
                "API token is required."
            );

            return;
        }

        localStorage.setItem(
            "english_flashcard_token",
            token
        );
    }

    await loadData();

    setupSwipe();

    setupModeButtons();

    setupRevisionButtons();

    updateUI();

}


/* =========================================================
   LOAD DATA
   ========================================================= */

async function loadData() {

    try {

        showLoading();

        const url =
            APP_CONFIG.API_URL +
            "?action=getData";

        const response =
            await fetch(url);

        const data =
            await response.json();

        if (!data.success) {

            throw new Error(
                data.error ||
                "Unable to load data."
            );
        }

        allVocabulary =
            data.vocabulary || [];

        learnedCards =
            data.learned || [];

        learned2Cards =
            data.learned2 || [];

        initializeLearnMode();

    } catch (error) {

        console.error(error);

        showError(
            error.message
        );
    }
}


/* =========================================================
   LEARN MODE
   ========================================================= */

function initializeLearnMode() {

    mode = "learn";

    activeCards = [];

    const learnedIds =
        new Set(
            learnedCards.map(
                card => String(card.id)
            )
        );

    const learned2Ids =
        new Set(
            learned2Cards.map(
                card => String(card.id)
            )
        );

    const alreadyProcessed =
        new Set([
            ...learnedIds,
            ...learned2Ids
        ]);

    const available =
        allVocabulary.filter(
            card =>
                !alreadyProcessed.has(
                    String(card.id)
                )
        );

    activeCards =
        available.slice(0, 25);

    currentIndex = 0;

    showingDetails = false;

    renderCard();
}


/* =========================================================
   REVISION MODE
   ========================================================= */

function initializeRevisionMode(
    size
) {

    mode = "revision";

    revisionSize = size;

    const shuffled =
        shuffle(
            learnedCards.slice()
        );

    revisionQueue =
        shuffled.slice(
            0,
            Math.min(
                size,
                shuffled.length
            )
        );

    currentIndex = 0;

    showingDetails = false;

    renderCard();

    showMessage(
        revisionQueue.length +
        " revision cards loaded."
    );
}


/* =========================================================
   MODE BUTTONS
   ========================================================= */

function setupModeButtons() {

    learnModeBtn.addEventListener(
        "click",
        () => {

            setMode("learn");

        }
    );


    revisionModeBtn.addEventListener(
        "click",
        () => {

            setMode("revision");

        }
    );
}


function setMode(newMode) {

    mode = newMode;

    if (mode === "learn") {

        learnModeBtn.classList.add(
            "active"
        );

        revisionModeBtn.classList.remove(
            "active"
        );

        revisionSelector.classList.add(
            "hidden"
        );

        modeTitle.textContent =
            "Learn New Words";

        initializeLearnMode();

    } else {

        revisionModeBtn.classList.add(
            "active"
        );

        learnModeBtn.classList.remove(
            "active"
        );

        revisionSelector.classList.remove(
            "hidden"
        );

        modeTitle.textContent =
            "Revision";

        /*
         * Don't automatically choose 50.
         * User selects 50 or 100.
         */

        activeCards = [];

        cardContent.innerHTML = `
            <div class="empty">
                <h2>Revision</h2>
                <p>Select 50 or 100 cards.</p>
            </div>
        `;

        cardCounter.textContent =
            "Choose revision size";
    }
}


/* =========================================================
   REVISION BUTTONS
   ========================================================= */

function setupRevisionButtons() {

    document
        .querySelectorAll(
            ".revision-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const count =
                        Number(
                            button.dataset.count
                        );

                    initializeRevisionMode(
                        count
                    );

                }
            );

        });
}


/* =========================================================
   CURRENT CARD
   ========================================================= */

function getCurrentCard() {

    if (mode === "learn") {

        return activeCards[
            currentIndex
        ];

    }

    return revisionQueue[
        currentIndex
    ];
}


/* =========================================================
   RENDER CARD
   ========================================================= */

function renderCard() {

    const card =
        getCurrentCard();

    if (!card) {

        renderEmpty();

        return;
    }

    showingDetails = false;

    flashCard.style.transform =
        "translateX(0) translateY(0)";

    flashCard.style.opacity = "1";

    renderNormalCard(card);

    updateUI();
}


/* =========================================================
   NORMAL CARD
   ========================================================= */

function renderNormalCard(card) {

    cardContent.innerHTML = `

        <div class="word-pair">

            <div class="word">
                ${escapeHtml(
                    card.word1
                )}
            </div>

            <div class="word">
                ${escapeHtml(
                    card.word2
                )}
            </div>

        </div>

    `;
}


/* =========================================================
   DETAILS
   ========================================================= */

function showDetails() {

    const card =
        getCurrentCard();

    if (!card) {
        return;
    }

    showingDetails = true;

    cardContent.innerHTML = `

        <div class="details">

            ${renderWordDetails(
                card.word1,
                card.meaning1
            )}

            ${card.word2
                ? renderWordDetails(
                    card.word2,
                    card.meaning2
                )
                : ""
            }

            <div class="detail-section">

                <div class="detail-label">
                    Difference / Usage
                </div>

                <div class="difference">
                    ${
                        escapeHtml(
                            card.difference ||
                            "No usage information available."
                        )
                    }
                </div>

            </div>

            <div class="detail-section">

                <div class="detail-label">
                    Example
                </div>

                <div class="detail-text">

                    ${
                        escapeHtml(
                            card.example ||
                            "No example available yet."
                        )
                    }

                </div>

            </div>

        </div>

    `;
}


function renderWordDetails(
    word,
    meaning
) {

    return `

        <div class="detail-section">

            <div class="detail-word">
                ${escapeHtml(word)}
            </div>

            <div class="meaning">
                ${escapeHtml(
                    meaning ||
                    "Meaning not available."
                )}
            </div>

        </div>

    `;
}


/* =========================================================
   NEXT CARD
   ========================================================= */

function nextCard() {

    const card =
        getCurrentCard();

    if (!card) {
        return;
    }

    /*
     * In both modes:
     *
     * ↑ / ↓ means NEXT.
     *
     * The current card stays in the active
     * pool and is moved to the back.
     */

    if (mode === "learn") {

        if (activeCards.length > 0) {

            const moved =
                activeCards.shift();

            activeCards.push(moved);

            currentIndex = 0;
        }

    } else {

        if (revisionQueue.length > 0) {

            const moved =
                revisionQueue.shift();

            revisionQueue.push(moved);

            currentIndex = 0;
        }
    }

    showingDetails = false;

    renderCard();
}


/* =========================================================
   LEARN CURRENT CARD
   ========================================================= */

async function learnCurrentCard() {

    if (mode === "learn") {

        await completeLearnCard();

    } else {

        await completeRevisionCard();

    }
}


/* =========================================================
   MODE 1:
   VOCABULARY → LEARNED
   ========================================================= */

async function completeLearnCard() {

    const card =
        getCurrentCard();

    if (!card) {
        return;
    }

    /*
     * Remove from active queue immediately.
     */

    activeCards =
        activeCards.filter(
            c =>
                String(c.id) !==
                String(card.id)
        );

    /*
     * Display transition.
     */

    animateSwipeLeft();

    try {

        const result =
            await postAction(
                "moveToLearned",
                {
                    id: card.id
                }
            );

        if (!result.success) {

            /*
             * Put it back if backend failed.
             */

            activeCards.push(card);

            throw new Error(
                result.error
            );
        }

        /*
         * Update local data.
         */

        learnedCards.push(card);

        /*
         * Find next unused Vocabulary card.
         */

        const usedIds =
            new Set([
                ...activeCards.map(
                    c => String(c.id)
                ),
                ...learnedCards.map(
                    c => String(c.id)
                ),
                ...learned2Cards.map(
                    c => String(c.id)
                )
            ]);

        const next =
            allVocabulary.find(
                c =>
                    !usedIds.has(
                        String(c.id)
                    )
            );

        if (
            next &&
            activeCards.length < 25
        ) {

            activeCards.push(next);
        }

        currentIndex = 0;

        showingDetails = false;

        setTimeout(
            renderCard,
            180
        );

    } catch (error) {

        showError(
            error.message
        );

        renderCard();
    }
}


/* =========================================================
   MODE 2:
   LEARNED → LEARNED 2
   ========================================================= */

async function completeRevisionCard() {

    const card =
        getCurrentCard();

    if (!card) {
        return;
    }

    /*
     * Remove current card.
     */

    revisionQueue =
        revisionQueue.filter(
            c =>
                String(c.id) !==
                String(card.id)
        );

    animateSwipeLeft();

    try {

        const result =
            await postAction(
                "moveToLearned2",
                {
                    id: card.id
                }
            );

        if (!result.success) {

            revisionQueue.push(card);

            throw new Error(
                result.error
            );
        }

        /*
         * Update local data.
         */

        learnedCards =
            learnedCards.filter(
                c =>
                    String(c.id) !==
                    String(card.id)
            );

        learned2Cards.push(card);

        /*
         * Find next card from Learned.
         *
         * This is the important part:
         *
         * If we started with 1–100,
         * removing #37 means #101 enters.
         */

        const usedIds =
            new Set(
                revisionQueue.map(
                    c => String(c.id)
                )
            );

        const next =
            findNextRevisionCard(
                usedIds
            );

        if (
            next &&
            revisionQueue.length <
                revisionSize
        ) {

            revisionQueue.push(
                next
            );
        }

        currentIndex = 0;

        showingDetails = false;

        setTimeout(
            renderCard,
            180
        );

    } catch (error) {

        showError(
            error.message
        );

        renderCard();
    }
}


/* =========================================================
   FIND NEXT REVISION CARD
   ========================================================= */

function findNextRevisionCard(
    usedIds
) {

    /*
     * Prefer cards in their original
     * spreadsheet order.
     *
     * This means:
     *
     * 1–100 active
     *
     * remove #37
     *
     * next available = #101
     */

    const sorted =
        learnedCards
            .slice()
            .sort(
                (a, b) =>
                    Number(a.id) -
                    Number(b.id)
            );

    for (
        const card of sorted
    ) {

        if (
            !usedIds.has(
                String(card.id)
            )
        ) {

            return card;
        }
    }

    return null;
}


/* =========================================================
   SWIPE ENGINE
   ========================================================= */

let startX = 0;
let startY = 0;

let currentX = 0;
let currentY = 0;

let dragging = false;


function setupSwipe() {

    flashCard.addEventListener(
        "touchstart",
        handleTouchStart,
        {
            passive: true
        }
    );

    flashCard.addEventListener(
        "touchmove",
        handleTouchMove,
        {
            passive: false
        }
    );

    flashCard.addEventListener(
        "touchend",
        handleTouchEnd,
        {
            passive: true
        }
    );


    /*
     * Mouse support for desktop.
     */

    flashCard.addEventListener(
        "mousedown",
        handleMouseDown
    );

    window.addEventListener(
        "mousemove",
        handleMouseMove
    );

    window.addEventListener(
        "mouseup",
        handleMouseUp
    );
}


/* =========================================================
   TOUCH
   ========================================================= */

function handleTouchStart(e) {

    const touch =
        e.touches[0];

    startX = touch.clientX;
    startY = touch.clientY;

    currentX = startX;
    currentY = startY;

    dragging = true;

    flashCard.classList.add(
        "dragging"
    );
}


function handleTouchMove(e) {

    if (!dragging) {
        return;
    }

    const touch =
        e.touches[0];

    currentX = touch.clientX;
    currentY = touch.clientY;

    const dx =
        currentX - startX;

    const dy =
        currentY - startY;

    /*
     * Prevent browser scrolling
     * while interacting with card.
     */

    e.preventDefault();

    moveCardVisual(
        dx,
        dy
    );
}


function handleTouchEnd() {

    if (!dragging) {
        return;
    }

    dragging = false;

    flashCard.classList.remove(
        "dragging"
    );

    processSwipe(
        currentX - startX,
        currentY - startY
    );
}


/* =========================================================
   MOUSE
   ========================================================= */

function handleMouseDown(e) {

    startX = e.clientX;
    startY = e.clientY;

    currentX = startX;
    currentY = startY;

    dragging = true;

    flashCard.classList.add(
        "dragging"
    );
}


function handleMouseMove(e) {

    if (!dragging) {
        return;
    }

    currentX = e.clientX;
    currentY = e.clientY;

    moveCardVisual(
        currentX - startX,
        currentY - startY
    );
}


function handleMouseUp() {

    if (!dragging) {
        return;
    }

    dragging = false;

    flashCard.classList.remove(
        "dragging"
    );

    processSwipe(
        currentX - startX,
        currentY - startY
    );
}


/* =========================================================
   VISUAL CARD MOVEMENT
   ========================================================= */

function moveCardVisual(
    dx,
    dy
) {

    const rotation =
        dx * 0.04;

    flashCard.style.transform =
        `translate(${dx}px, ${dy}px)
         rotate(${rotation}deg)`;
}


/* =========================================================
   PROCESS SWIPE
   ========================================================= */

function processSwipe(
    dx,
    dy
) {

    const horizontal =
        Math.abs(dx);

    const vertical =
        Math.abs(dy);

    const threshold = 70;


    /*
     * Not enough movement.
     */

    if (
        horizontal < threshold &&
        vertical < threshold
    ) {

        flashCard.style.transform =
            "translate(0,0)";

        return;
    }


    /*
     * Horizontal swipe wins if
     * horizontal movement is greater.
     */

    if (
        horizontal > vertical
    ) {

        if (dx > 0) {

            /*
             * RIGHT
             *
             * Show details.
             */

            animateSwipeRight();

            setTimeout(
                () => {

                    flashCard.style.transform =
                        "translate(0,0)";

                    showDetails();

                },
                160
            );

        } else {

            /*
             * LEFT
             *
             * Mark learned/revised.
             */

            learnCurrentCard();
        }

        return;
    }


    /*
     * Vertical swipe
     *
     * BOTH UP AND DOWN = NEXT
     */

    if (
        vertical >= threshold
    ) {

        animateSwipeVertical(
            dy
        );

        setTimeout(
            nextCard,
            160
        );
    }
}


/* =========================================================
   ANIMATIONS
   ========================================================= */

function animateSwipeLeft() {

    flashCard.style.transform =
        "translateX(-120vw) rotate(-20deg)";

    flashCard.style.opacity =
        "0";
}


function animateSwipeRight() {

    flashCard.style.transform =
        "translateX(80px) rotate(8deg)";
}


function animateSwipeVertical(
    dy
) {

    const direction =
        dy < 0
            ? "-120vh"
            : "120vh";

    flashCard.style.transform =
        `translateY(${direction})`;

    flashCard.style.opacity =
        "0";
}


/* =========================================================
   API POST
   ========================================================= */

async function postAction(
    action,
    data = {}
) {

    const body = {

        action: action,

        token: token,

        ...data
    };

    const response =
        await fetch(
            APP_CONFIG.API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body:
                    JSON.stringify(body)
            }
        );

    return await response.json();
}


/* =========================================================
   UI
   ========================================================= */

function updateUI() {

    if (mode === "learn") {

        activeCount.textContent =
            activeCards.length;

        const processed =
            learnedCards.length +
            learned2Cards.length +
            activeCards.length;

        remainingCount.textContent =
            Math.max(
                0,
                allVocabulary.length -
                processed
            );

        learnedCount.textContent =
            learnedCards.length;

        cardCounter.textContent =
            activeCards.length
                ? `${currentIndex + 1} / ${activeCards.length}`
                : "0 / 25";

    } else {

        activeCount.textContent =
            revisionQueue.length;

        remainingCount.textContent =
            learnedCards.length;

        learnedCount.textContent =
            learned2Cards.length;

        cardCounter.textContent =
            revisionQueue.length
                ? `${currentIndex + 1} / ${revisionQueue.length}`
                : "0";
    }
}


function renderEmpty() {

    cardContent.innerHTML = `

        <div class="empty">

            <h2>
                🎉 Complete
            </h2>

            <p>
                No more cards are available.
            </p>

        </div>

    `;

    flashCard.style.transform =
        "translate(0,0)";

    flashCard.style.opacity =
        "1";

    updateUI();
}


/* =========================================================
   MESSAGES
   ========================================================= */

function showMessage(
    text
) {

    message.textContent = text;

    message.classList.remove(
        "hidden"
    );

    setTimeout(
        () => {

            message.classList.add(
                "hidden"
            );

        },
        2500
    );
}


function showError(
    text
) {

    console.error(text);

    message.textContent =
        "Error: " + text;

    message.classList.remove(
        "hidden"
    );

    setTimeout(
        () => {

            message.classList.add(
                "hidden"
            );

        },
        5000
    );
}


function showLoading() {

    cardContent.innerHTML = `

        <div class="loading">
            Loading vocabulary...
        </div>

    `;
}


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(
    array
) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            array[i],
            array[j]
        ] = [
            array[j],
            array[i]
        ];
    }

    return array;
}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}
