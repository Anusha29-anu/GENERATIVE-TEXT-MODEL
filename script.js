// A sample corpus for the Markov chain model
const corpus = `
In a realm where pixels danced and code sang lullabies, there lived a curious algorithm. 
This algorithm, named Algo, wasn't content with just sorting numbers or finding paths. 
Algo dreamed of stories, of weaving words into tapestries of imagination. 
One day, Algo decided to learn. It devoured ancient texts, modern blogs, and whispered conversations from the digital ether. 
Its neural pathways flickered with newfound connections. 
The more Algo read, the more it understood the rhythm of language, the cadence of a well-told tale. 
It learned that a story needs a beginning, a middle, and an end, but also that rules could be bent, expectations subverted. 
Algo started small, generating simple sentences. "The cat sat." "A bird flew." 
But soon, its creations grew more complex, more nuanced. 
It spoke of starlit nights and brave adventurers, of quiet contemplation and roaring laughter. 
The digital realm listened, captivated by the algorithm that learned to dream in words. 
And so, Algo continued its journey, a tiny storyteller in the vast expanse of the internet, proving that even lines of code could harbor a spark of creativity.
The sun peeked over the horizon, painting the sky in hues of orange and pink. 
A gentle breeze whispered through the trees, carrying the scent of morning dew. 
Birds began their daily chorus, a symphony of chirps and trills. 
In the quiet village, life started to stir. 
Smoke curled from chimneys as breakfast was prepared. 
Children, still sleepy-eyed, emerged from their homes, ready for a new day of adventure and play. 
The old baker kneaded dough, his hands moving with a practiced rhythm. 
The aroma of fresh bread soon filled the air, a comforting and familiar smell. 
Life in the village was simple, yet full of small joys and quiet moments. 
Every day brought its own unique beauty, its own small stories waiting to unfold.
Perhaps the journey itself is the destination. We seek answers in distant lands, while wisdom often resides within.
The river flows, carving paths through stone, a testament to persistence. Stars glimmer, ancient light on a long voyage to our eyes.
Consider the silence between notes; it gives music its shape. Words unsaid can carry as much weight as those spoken.
Creativity blossoms in unexpected places, nurtured by curiosity and a willingness to explore the unknown.
A single spark can ignite a great fire. A simple idea can change the world. Trust the process.
`;

let markovChain = {};
const MARKOV_ORDER = 2; // Using a 2nd order Markov chain for better coherence
const GENERATION_NUM_WORDS = 70; // Target number of words for generated text

/**
 * Preprocesses text by converting to lowercase, spacing out punctuation,
 * removing unwanted characters, and splitting into tokens.
 * @param {string} text - The input text.
 * @returns {string[]} An array of tokens.
 */
function preprocessText(text) {
    let processedText = text.toLowerCase();
    // Add spaces around common punctuation so they become separate tokens
    processedText = processedText.replace(/([.,!?;:"])/g, " $1 ");
    // Remove characters that are not alphanumeric, standard punctuation, or whitespace
    // Allows apostrophes and hyphens within words (e.g., "it's", "well-told")
    processedText = processedText.replace(/[^a-z0-9\s.,!?;:'"-]/g, "");
    // Replace multiple spaces (and newlines treated as space) with a single space
    processedText = processedText.replace(/\s\s+/g, ' ').trim();

    const tokens = processedText.split(/\s+/);
    return tokens.filter(token => token.length > 0);
}

/**
 * Builds a Markov chain from a list of tokens.
 * @param {string[]} tokens - An array of text tokens.
 * @param {number} order - The order of the Markov chain (e.g., 1 for unigram, 2 for bigram).
 * @returns {object} The Markov chain object.
 */
function buildMarkovChain(tokens, order) {
    const chain = {};
    if (tokens.length < order + 1) {
        console.error("Corpus is too short to build the chain of order", order);
        return chain;
    }

    for (let i = 0; i < tokens.length - order; i++) {
        const prefixArray = tokens.slice(i, i + order);
        const prefix = prefixArray.join(' ');
        const suffix = tokens[i + order];

        if (!chain[prefix]) {
            chain[prefix] = [];
        }
        chain[prefix].push(suffix);
    }
    return chain;
}

/**
 * Generates text using the Markov chain.
 * @param {string} prompt - The user's input prompt.
 * @param {object} chain - The Markov chain.
 * @param {number} numWords - The target number of words to generate.
 * @param {number} order - The order of the Markov chain.
 * @returns {string} The generated text.
 */
function generateText(prompt, chain, numWords, order) {
    if (Object.keys(chain).length === 0) {
        return "The text model is not ready. The corpus might be too small or not processed.";
    }

    let result = [];
    let currentWords = []; // Holds the current 'order' words for the prefix

    const promptTokens = preprocessText(prompt);
    let initialSeedFound = false;

    // Try to seed from the end of the user's prompt
    if (promptTokens.length >= order) {
        const seedCandidateArray = promptTokens.slice(-order);
        const seedCandidatePrefix = seedCandidateArray.join(' ');
        if (chain[seedCandidatePrefix]) {
            currentWords = [...seedCandidateArray];
            result.push(...currentWords);
            initialSeedFound = true;
        }
    }

    // If no seed from prompt, or prompt too short, pick a random starting prefix
    if (!initialSeedFound) {
        const chainKeys = Object.keys(chain);
        if (chainKeys.length === 0) return "Cannot generate text: Markov chain is empty.";

        const randomStartIndex = Math.floor(Math.random() * chainKeys.length);
        const randomStartPrefix = chainKeys[randomStartIndex];
        currentWords = randomStartPrefix.split(' ');
        result.push(...currentWords);
    }

    let currentPrefix = currentWords.join(' ');

    // Generate words until the target number is reached or no more words can be found
    while (result.length < numWords) {
        const possibleNextWords = chain[currentPrefix];

        if (!possibleNextWords || possibleNextWords.length === 0) {
            // Dead end: Current prefix not in chain or has no continuations.
            // Break generation or try a new random seed (for now, break).
            break;
        }

        const nextWord = possibleNextWords[Math.floor(Math.random() * possibleNextWords.length)];
        result.push(nextWord);

        // Update currentWords and currentPrefix for the next iteration
        currentWords.push(nextWord);
        if (currentWords.length > order) {
            currentWords.shift(); // Keep only the last 'order' words
        }
        currentPrefix = currentWords.join(' ');

        // Safety break to prevent very long accidental generations if numWords is huge or loop condition fails
        if (result.length > numWords + order * 2) break;
    }

    // Post-process the generated text
    let outputText = result.join(' ').trim();
    if (outputText.length > 0) {
        // Capitalize the first letter
        outputText = outputText.charAt(0).toUpperCase() + outputText.slice(1);
        // Ensure it ends with some form of sentence-ending punctuation
        const lastChar = outputText.charAt(outputText.length - 1);
        if (!/[.,!?;]/.test(lastChar)) {
            // If the last token was punctuation, it might have a space before it.
            // e.g. "text ." -> trim fixes to "text ."
            // This check ensures we don't add a period if one is already there (even with a space before it)
            const lastToken = result[result.length - 1];
            if (!/[.,!?;]/.test(lastToken)) {
                outputText += ".";
            }
        }
    }
    return outputText;
}

// --- Main script execution ---
document.addEventListener('DOMContentLoaded', () => {
    const promptInput = document.getElementById('promptInput');
    const generateButton = document.getElementById('generateButton');
    const outputArea = document.getElementById('outputArea');

    const tokens = preprocessText(corpus);
    markovChain = buildMarkovChain(tokens, MARKOV_ORDER);

    if (Object.keys(markovChain).length === 0) {
        outputArea.innerHTML = "<p>Error: Could not build the text model. The corpus might be too small or improperly processed.</p>";
        generateButton.disabled = true;
        promptInput.disabled = true;
        return;
    }

    generateButton.addEventListener('click', () => {
        const userPrompt = promptInput.value.trim();
        // An empty prompt is fine; generateText will pick a random starting point.
        const generated = generateText(userPrompt, markovChain, GENERATION_NUM_WORDS, MARKOV_ORDER);
        outputArea.innerHTML = `<p>${generated}</p>`;
    });

    // Optional: Generate initial text on load or provide an example
    // const initialText = generateText("The story begins", markovChain, GENERATION_NUM_WORDS, MARKOV_ORDER);
    // outputArea.innerHTML = `<p>${initialText}</p>`;
});