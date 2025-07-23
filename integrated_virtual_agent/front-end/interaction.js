import { characterAudio, characterAudioQueue } from './virtualcharacter.js';

// Global variables
var typewriterRunning = false;
var nextNode = 1;
var nextResponse = "";
var conversationHistory = []; // Array to store all messages
var currentStreamingMessageId = null; // ID of currently streaming message
var isFormRendered = false; // Track if form is already rendered

// DOM elements
var formContainer = document.getElementById('form-container');
var optionsContainer = document.getElementById('options-container');
var audioContainer = document.getElementById('audio-container');
var startBtn = document.getElementById('start-btn');
var chatBody = document.getElementById('chat-body');

document.addEventListener('DOMContentLoaded', (event) => {
    formContainer = document.getElementById('form-container');
    optionsContainer = document.getElementById('options-container');
    audioContainer = document.getElementById('audio-container');
    startBtn = document.getElementById('start-btn');
    chatBody = document.getElementById('chat-body');
    
    typewriterRunning = false;
    nextNode = 1;
    nextResponse = "";
    isFormRendered = false;

    startBtn.addEventListener("click", () => {
        startBtn.style.display = "none";

        // Clear the initial welcome message and start fresh
        clearChat();
        
        // Start the AI negotiation conversation directly - no initial hardcoded message
        handleUserInput(1, { userInput: "Hello, I'm interested in discussing the compensation package." });
    });
});

// Function to clear chat and reset conversation history
function clearChat() {
    chatBody.innerHTML = '';
    conversationHistory = [];
    currentStreamingMessageId = null;
    isFormRendered = false;
}

// Function to generate unique message ID
function generateMessageId() {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Function to add user message to conversation
function addUserMessage(text) {
    const messageId = generateMessageId();
    const message = {
        id: messageId,
        type: 'user',
        content: text,
        timestamp: new Date(),
        isComplete: true
    };
    
    conversationHistory.push(message);
    displayMessage(message);
    scrollChatToBottom();
    
    return messageId;
}

// Function to add agent message to conversation
function addAgentMessage(text, useTypewriter = true) {
    const messageId = generateMessageId();
    const message = {
        id: messageId,
        type: 'agent',
        content: text,
        timestamp: new Date(),
        isComplete: !useTypewriter
    };
    
    conversationHistory.push(message);
    
    if (useTypewriter) {
        displayMessage({...message, content: ''}); // Start with empty content
        startTypewriterEffect(text, messageId);
    } else {
        displayMessage(message);
    }
    
    scrollChatToBottom();
    return messageId;
}

// Function to start streaming agent message
function startStreamingAgentMessage() {
    const messageId = generateMessageId();
    const message = {
        id: messageId,
        type: 'agent',
        content: '',
        timestamp: new Date(),
        isComplete: false,
        isStreaming: true
    };
    
    conversationHistory.push(message);
    displayMessage(message);
    currentStreamingMessageId = messageId;
    scrollChatToBottom();
    
    console.log('🚀 Started streaming message with ID:', messageId);
    return messageId;
}

// Function to update streaming message content
function updateStreamingMessage(text) {
    if (!currentStreamingMessageId) return;
    
    console.log('🔄 updateStreamingMessage called with text length:', text.length);
    
    // Find message in history
    const messageIndex = conversationHistory.findIndex(msg => msg.id === currentStreamingMessageId);
    if (messageIndex === -1) return;
    
    // Update message content
    conversationHistory[messageIndex].content = text;
    
    // Update DOM element directly without typewriter effect during streaming
    const messageElement = document.getElementById(currentStreamingMessageId);
    if (messageElement) {
        const contentElement = messageElement.querySelector('.message-content');
        if (contentElement) {
            contentElement.textContent = text;
            console.log('✅ DOM updated with text length:', text.length);
            scrollChatToBottom();
        }
    }
}

// Function to finalize streaming message
function finalizeStreamingMessage(finalText) {
    if (!currentStreamingMessageId) return;
    
    console.log('🏁 finalizeStreamingMessage called with text length:', finalText.length);
    console.log('🏁 Final text:', finalText);
    
    // Find message in history
    const messageIndex = conversationHistory.findIndex(msg => msg.id === currentStreamingMessageId);
    if (messageIndex === -1) return;
    
    // Update message
    conversationHistory[messageIndex].content = finalText;
    conversationHistory[messageIndex].isComplete = true;
    conversationHistory[messageIndex].isStreaming = false;
    
    // Update DOM element
    const messageElement = document.getElementById(currentStreamingMessageId);
    if (messageElement) {
        messageElement.classList.remove('streaming');
        const contentElement = messageElement.querySelector('.message-content');
        if (contentElement) {
            contentElement.textContent = finalText;
            console.log('✅ Final DOM updated with text length:', finalText.length);
        }
    }
    
    currentStreamingMessageId = null;
    scrollChatToBottom();
}

// Function to display a message in the chat
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    messageElement.id = message.id;
    
    if (message.isStreaming) {
        messageElement.classList.add('streaming');
    }
    
    // Create message content
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = message.content;
    
    // Create timestamp
    const timestampElement = document.createElement('div');
    timestampElement.className = 'message-timestamp';
    timestampElement.textContent = formatTimestamp(message.timestamp);
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    chatBody.appendChild(messageElement);
    
    return messageElement;
}

// Function to format timestamp
function formatTimestamp(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Function to start typewriter effect
function startTypewriterEffect(text, messageId, isUpdate = false) {
    const messageElement = document.getElementById(messageId);
    if (!messageElement) return;
    
    const contentElement = messageElement.querySelector('.message-content');
    if (!contentElement) return;
    
    // Cancel any existing typewriter effect
    typewriterRunning = false;
    
    // Start new typewriter effect
    typewriterRunning = true;
    let i = isUpdate ? contentElement.textContent.length : 0;
    
    function typeWriter() {
        if (!typewriterRunning) {
            contentElement.textContent = text;
            return;
        }
        
        if (i < text.length) {
            contentElement.textContent = text.substring(0, i + 1);
            i++;
            
            if (i % 5 === 0) {
                scrollChatToBottom();
            }
            
            setTimeout(typeWriter, 20);
        } else {
            typewriterRunning = false;
            scrollChatToBottom();
        }
    }
    
    typeWriter();
}

// Function to cancel typewriter effect
function cancelTypewriterEffect() {
    typewriterRunning = false;
}

// Function to scroll chat to bottom
function scrollChatToBottom() {
    if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

// Main function to handle user input
async function handleUserInput(nodeId, body) {
    const response = await fetch(`/Interaction/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        console.error('Failed to fetch response:', response.statusText);
        return;
    }

    const contentType = response.headers.get('Content-Type');

    // Handle streamed response
    if (contentType && contentType.includes('application/json; charset=utf-8')) {
        console.log("Streamed Response.");
        
        const reader = response.body.getReader();
        await handleStreamedResponse(reader);
    } else {
        console.error("Unknown response type. Unable to process.");
    }
}

// Function to handle streamed response - FIXED: Process dialogue regardless of audio
async function handleStreamedResponse(reader) {
    const decoder = new TextDecoder();
    let partialData = '';
    let isFirstChunk = true;
    let streamingMessageId = null;
    let completeDialogue = ''; // Track the complete dialogue
    let inputData = null;
    let optionsData = null;
    let chunkCount = 0;

    while (true) {
        const { value, done } = await reader.read();

        if (done) {
            console.log('🏁 Stream completed.');
            console.log('📊 Total chunks processed:', chunkCount);
            console.log('📊 Final complete dialogue:', completeDialogue);
            
            // Finalize streaming message with complete dialogue
            if (streamingMessageId && completeDialogue) {
                finalizeStreamingMessage(completeDialogue);
            }
            
            // Render form and options after streaming is complete
            if (inputData) {
                renderInput(inputData.input, inputData.wholeDialogue);
            }
            if (optionsData) {
                renderOptions(optionsData.options, optionsData.wholeDialogue);
            }
            
            break;
        }

        partialData += decoder.decode(value, { stream: true });

        // Process each complete JSON chunk
        let boundaryIndex;
        while ((boundaryIndex = partialData.indexOf('\n')) !== -1) {
            const chunk = partialData.slice(0, boundaryIndex).trim();
            partialData = partialData.slice(boundaryIndex + 1);

            if (chunk) {
                try {
                    chunkCount++;
                    const data = JSON.parse(chunk);
                    
                    console.log(`📦 Chunk ${chunkCount}:`, {
                        hasAudio: !!data.audio,
                        hasDialogue: !!data.dialogue,
                        hasWholeDialogue: !!data.wholeDialogue,
                        dialogueLength: data.dialogue ? data.dialogue.length : 0,
                        wholeDialogueLength: data.wholeDialogue ? data.wholeDialogue.length : 0
                    });

                    // FIXED: Process dialogue regardless of audio presence
                    let textToDisplay = '';
                    
                    // Use wholeDialogue if available, fallback to dialogue
                    if (data.wholeDialogue && data.wholeDialogue.trim()) {
                        textToDisplay = data.wholeDialogue;
                        console.log('🎯 Using wholeDialogue:', textToDisplay.substring(0, 100) + '...');
                    } else if (data.dialogue && data.dialogue.trim()) {
                        textToDisplay = data.dialogue;
                        console.log('🎯 Using dialogue:', textToDisplay.substring(0, 100) + '...');
                    }
                    
                    if (textToDisplay) {
                        // Update complete dialogue if we have longer/better text
                        if (textToDisplay.length > completeDialogue.length) {
                            completeDialogue = textToDisplay;
                        }
                        
                        // Start streaming message on first chunk with content
                        if (isFirstChunk) {
                            streamingMessageId = startStreamingAgentMessage();
                            isFirstChunk = false;
                        }
                        
                        // Update streaming message with complete dialogue
                        if (streamingMessageId) {
                            updateStreamingMessage(completeDialogue);
                        }
                    }
                    
                    // Handle audio separately if present
                    if (data.audio && data.audio.audioBase64) {
                        const audioData = await parseAudio(data.audio, null);
                        characterAudioQueue(audioData, null);
                    }
                    
                    // Store input and options data for later rendering
                    if (data.input) {
                        inputData = { input: data.input, wholeDialogue: data.wholeDialogue || completeDialogue };
                    }
                    if (data.options) {
                        optionsData = { options: data.options, wholeDialogue: data.wholeDialogue || completeDialogue };
                    }
                } catch (e) {
                    console.error("❌ Error parsing JSON chunk", e, chunk);
                }
            }
        }
    }
}

// Audio parsing function (unchanged)
async function parseAudio(audio, emoji) {
    console.log("parseAudio called with audio and emoji:", { audio, emoji });

    try {
        const base64Audio = audio.audioBase64;
        const arrayBuffer = await fetch(`data:audio/wav;base64,${base64Audio}`)
            .then(response => response.arrayBuffer());
        console.log("Audio decoded into ArrayBuffer.");

        const audioContext = new AudioContext();
        console.log("AudioContext created.");

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("AudioBuffer decoded:", audioBuffer);

        const audioWithWav = {
            ...audio,
            audio: audioBuffer,
            sampleRate: audioBuffer.sampleRate,
        };

        return audioWithWav;
    } catch (error) {
        console.error("Error decoding audio data:", error);
        throw error;
    }
}

// Function to render input form
function renderInput(input, wholeDialogue, url = null) {
    // Only clear and re-render if not already rendered or if input has changed
    if (!isFormRendered || formContainer.innerHTML === '') {
        formContainer.innerHTML = '';
        const container = document.querySelector('.container');

        if (input) {
            container.classList.remove('no-form');

            const inputElement = document.createElement('textarea');
            inputElement.classList.add('large-text');
            inputElement.placeholder = 'Type your response here...';

            const buttonWrapper = document.createElement('div');
            buttonWrapper.className = 'form-button-wrapper';

            const submitButton = document.createElement('button');
            submitButton.className = 'game-button';
            submitButton.innerText = 'Send';

            const loadingSpinner = document.createElement('div');
            loadingSpinner.className = 'loading-spinner';
            loadingSpinner.style.display = 'none';

            submitButton.addEventListener('click', () => {
                if (inputElement.value.trim() !== "") {
                    // Cancel any ongoing typewriter effect
                    cancelTypewriterEffect();
                    
                    // Finalize any streaming message
                    if (currentStreamingMessageId) {
                        const message = conversationHistory.find(msg => msg.id === currentStreamingMessageId);
                        if (message) {
                            finalizeStreamingMessage(message.content);
                        }
                    }

                    // Add user message to conversation history
                    addUserMessage(inputElement.value.trim());

                    // Disable input and show loading
                    var inputElementValue = inputElement.value;
                    inputElement.disabled = true;
                    submitButton.disabled = true;
                    submitButton.style.display = 'none';
                    loadingSpinner.style.display = 'inline-block';
                    
                    // Clear form rendered flag so it can be re-rendered
                    isFormRendered = false;
                    
                    nextNode = input.nextNode;
                    nextResponse = inputElementValue;
                    
                    // Send response
                    handleUserInput(nextNode, { alexInput: wholeDialogue, userInput: inputElementValue });
                } else {
                    alert("Please enter a response.");
                }
            });

            // Enter key listener
            inputElement.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submitButton.click();
                }
            });

            buttonWrapper.appendChild(submitButton);
            buttonWrapper.appendChild(loadingSpinner);

            formContainer.appendChild(inputElement);
            formContainer.appendChild(buttonWrapper);
            
            isFormRendered = true;
        } else {
            container.classList.add('no-form');
        }
    }
}

// Function to render options
function renderOptions(options, wholeDialogue, url) {
    optionsContainer.innerHTML = '';

    if (options && options.length > 0) {
        const isSingleOption = options.length === 1;

        options.forEach(option => {
            const button = document.createElement('button');
            button.className = isSingleOption || option.optionText === "I'd like to move onto the next topic of the conversation"
                ? "move-button"
                : "game-button";
            button.innerText = option.optionText;
            button.style.margin = "0.5em";

            button.addEventListener('click', () => {
                // Cancel any ongoing typewriter effect
                cancelTypewriterEffect();
                
                // Finalize any streaming message
                if (currentStreamingMessageId) {
                    const message = conversationHistory.find(msg => msg.id === currentStreamingMessageId);
                    if (message) {
                        finalizeStreamingMessage(message.content);
                    }
                }
                
                // Add user message to conversation history
                addUserMessage(option.optionText);
                
                // Disable inputs
                const inputElement = document.querySelector('.large-text');
                const sendButton = document.querySelector('.game-button');
                if (inputElement) inputElement.disabled = true;
                if (sendButton) sendButton.disabled = true;

                // Clear options and show loading
                optionsContainer.innerHTML = '';
                
                // Clear form rendered flag so it can be re-rendered
                isFormRendered = false;

                const loadingSpinner = document.createElement('div');
                loadingSpinner.className = 'loading-spinner';
                loadingSpinner.style.display = 'inline-block';
                optionsContainer.appendChild(loadingSpinner);

                const additionalData = {
                    alexInput: wholeDialogue,
                    userInput: option.optionText
                };
                handleUserInput(option.nextNode, additionalData);
            });

            optionsContainer.appendChild(button);
        });
    }
}
