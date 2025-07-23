# Integrated Virtual Agent - AI Salary Negotiation Bot

This project integrates an AI salary negotiation bot with a visual virtual agent that can speak and interact through a web interface.

## Features

- **3D Virtual Avatar**: Interactive 3D character with realistic animations
- **AI Salary Negotiation**: Intelligent negotiation bot with knowledge graph
- **Text-to-Speech**: AI responses are converted to speech and spoken by the avatar
- **Real-time Chat**: Text-based conversation interface
- **Session Management**: Maintains conversation context throughout negotiation

## Architecture

- **Frontend**: HTML/CSS/JavaScript with Three.js for 3D avatar
- **Backend**: 
  - Node.js/Express server for visual agent
  - Flask API for AI negotiation logic
- **AI Integration**: OpenAI/LiteLLM for language model and TTS

## Setup Instructions

### Prerequisites

- Node.js (v20+)
- Python 3.11+
- Required API keys (see .env file)

### Installation

1. **Install Python dependencies:**
   ```bash
   pip install flask flask-cors python-dotenv langchain-openai langchain networkx
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Update the `.env` file with your API keys:
   ```
   OPENAI_API_KEY="your-openai-key"
   OPENAI_API_KEY1="your-litellm-key"
   LITELLM_API_BASE="https://api.ai.it.ufl.edu"
   PORT="3000"
   SESSION_KEY="your-session-key"
   FLASK_PORT="5000"
   ```

### Running the Application

#### Option 1: Using the startup script (Recommended)
```bash
python start_services.py
```

#### Option 2: Manual startup
1. **Start Flask AI service:**
   ```bash
   python ai_negotiator_api_cors.py
   ```

2. **Start Node.js visual agent (in another terminal):**
   ```bash
   node server.js
   ```

### Access the Application

- Open your browser and go to: `http://localhost:3000`
- Click "Start Negotiation" to begin the salary negotiation
- Type your responses in the text box and press "Send"
- The AI agent will respond with both text and speech

## How It Works

1. **User Interface**: The frontend displays a 3D avatar and chat interface
2. **User Input**: Users type salary expectations and negotiation points
3. **AI Processing**: The Flask backend processes input using the AI negotiation bot
4. **Response Generation**: AI generates intelligent negotiation responses
5. **Speech Synthesis**: Responses are converted to speech using OpenAI TTS
6. **Avatar Animation**: The 3D avatar speaks the response with lip sync

## File Structure

```
integrated_virtual_agent/
├── ai_negotiator_api_cors.py    # Flask API for AI negotiation
├── negotiation_bot_kg.py        # AI negotiation logic with knowledge graph
├── negotiation_kg.py            # Knowledge graph implementation
├── server.js                    # Node.js Express server
├── start_services.py            # Startup script for both services
├── .env                         # Environment variables
├── package.json                 # Node.js dependencies
├── front-end/                   # Frontend files
│   ├── interaction.html         # Main HTML interface
│   ├── interaction.js           # Frontend JavaScript
│   ├── virtualcharacter.js     # 3D avatar logic
│   ├── characters/              # 3D avatar models
│   ├── css/                     # Stylesheets
│   └── middleware/              # TalkingHead library
└── back-end/                    # Backend routing
    ├── Interaction.js           # Main interaction handler
    └── GenerateScripts.js       # Script generation
```

## API Endpoints

- `GET /` - Main application interface
- `POST /Interaction/:nodeId` - Handle user interactions
- `POST /negotiate` - Direct AI negotiation API (Flask)
- `GET /health` - Health check for Flask service

## Troubleshooting

1. **Services not starting**: Check that ports 3000 and 5000 are available
2. **AI not responding**: Verify API keys in .env file
3. **Audio not playing**: Ensure browser allows autoplay for the domain
4. **Avatar not loading**: Check that Three.js dependencies are accessible

## Technical Details

- **AI Model**: Uses LangChain with OpenAI/LiteLLM for conversation
- **Knowledge Graph**: NetworkX-based graph for tracking negotiation state
- **TTS**: OpenAI text-to-speech API for voice generation
- **3D Rendering**: Three.js with TalkingHead library for avatar animation
- **Session Management**: Express sessions for maintaining conversation state

## License

This project integrates multiple components and should be used in accordance with their respective licenses.

