# Master Jarvis: Voice AI Chat System

A sophisticated voice-enabled AI chat system with multi-input support, conversation memory, and self-learning capabilities.

## Features

### Core Capabilities
- **Multi-Input Support**: Voice, text, PDF, image, and video uploads
- **Bilingual**: Full English & German support
- **Fallback System**: Text input when voice is unavailable
- **Conversation Memory**: Persistent history with IndexedDB
- **AI Integration**: Gemini API with streaming responses
- **Self-Learning**: Prompt optimization based on success metrics
- **Dark Mode**: Full dark mode support

### Voice Features
- Real-time transcription with confidence scores
- Text-to-speech voice synthesis
- Adjustable voice speed (0.5x - 2x)
- Language-specific voice recognition

### File Processing
- PDF upload and extraction
- Image recognition (JPG, PNG, GIF)
- Video file support
- Text file import

### Settings & Customization
- Language switching (English/German)
- Dark/Light theme toggle
- Voice output control
- API key management
- Conversation history export/clear

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repo-url>
cd MASTER_JARVIS_GEM
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

4. Start development server:
```bash
npm run dev
```

5. Open http://localhost:3000 in your browser

## Project Structure

```
src/
├── components/
│   ├── Header.tsx           # App header with title
│   ├── InputPanel.tsx       # Multi-input interface
│   ├── ConversationTimeline.tsx  # Conversation history display
│   └── SettingsPanel.tsx    # Settings & preferences
├── services/
│   ├── geminiApi.ts         # Gemini API integration
│   ├── voiceService.ts      # Web Speech API wrapper
│   └── fileProcessor.ts     # File upload & processing
├── store/
│   └── jarvisStore.ts       # Zustand state management
├── i18n/
│   ├── config.ts            # i18next configuration
│   └── locales/
│       ├── en.json          # English translations
│       └── de.json          # German translations
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

## Configuration

### Environment Variables

```env
VITE_GEMINI_API_KEY=your_api_key  # Gemini API key
```

### Voice Settings
- **Language**: English (en-US) / German (de-DE)
- **Speed**: 0.5x to 2x playback rate
- **Output**: Toggle text-to-speech on/off

### Storage
- Conversations stored in browser localStorage
- Automatic persistence of settings

## Usage

### Voice Input
1. Click the microphone button
2. Speak your task
3. System transcribes in real-time
4. Click again to stop

### Text Input
1. Type or paste your query
2. Optional: Attach files (PDF, images, videos)
3. Click "Submit"

### File Upload
- Drag & drop or click to upload
- Supported formats: PDF, JPG, PNG, GIF, MP4, WebM
- Max file size: 25MB

### Rating Responses
- Click thumbs up (helpful) or down (not helpful)
- Ratings improve prompt optimization over time

## API Integration

### Gemini API
- Prompt optimization for task-specific queries
- Streaming responses with token counting
- Language-specific prompt generation

### Web Speech API
- Browser-native speech recognition
- Multi-language support
- Confidence scoring

## Architecture

### State Management
- **Zustand** for centralized state
- Persistent storage with localStorage middleware
- Conversation history management

### Styling
- **Tailwind CSS** for utility-first design
- Dark mode support with CSS classes
- Responsive grid layout

### Internationalization
- **i18next** for translation management
- German & English language packs
- Context-based language switching

## Performance Optimizations
- Lazy component loading
- Efficient file processing
- Optimized API calls
- Minimal re-renders with React.memo

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Troubleshooting

### Voice not working?
- Check browser permissions for microphone access
- Verify HTTPS connection (required for Web Speech API)
- Use text input as fallback

### API errors?
- Verify Gemini API key in settings
- Check internet connection
- Ensure API key has sufficient quota

### Dark mode issues?
- Clear browser cache
- Verify `dark` class on root element
- Check Tailwind CSS dark mode configuration

## Security Considerations
- API keys stored securely in browser storage
- No server-side storage of conversations
- HTTPS required for voice features
- File uploads processed client-side only

## Development

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

### Run linter:
```bash
npm run lint
```

## Future Enhancements
- [ ] Export conversations as PDF/Markdown
- [ ] Conversation branching (explore alternatives)
- [ ] Custom voice personalities
- [ ] Integration with calendar/email
- [ ] Advanced prompt template library
- [ ] Multi-model support (Claude, OpenAI)
- [ ] Cloud sync with authentication

## License
MIT

## Support
For issues or questions, please open an issue on the repository.

---

**Created with ❤️ for voice-first AI interactions**
