# Shareable Notes - AI-Powered Note Taking App

A modern, feature-rich note-taking application with AI-powered auto glossary highlighting, built with React and Tailwind CSS.

### Deployment: https://playpowerlab-frontend-task-1.netlify.app/

## Features

### Core Functionality
- ✅ **Custom Rich Text Editor** - Built from scratch with formatting options
- ✅ **Note Management** - Create, edit, delete, and organize notes
- ✅ **Pin Notes** - Pin important notes to the top with visual indicators
- ✅ **Clean UI/UX** - Modern, responsive design with Tailwind CSS

### Rich Text Formatting
- **Bold, Italic, Underline** - Basic text formatting
- **Text Alignment** - Left, center, right alignment
- **Font Sizes** - Multiple font size options (12px - 32px)
- **Clear Formatting** - Remove all formatting from selected text

### AI-Powered Features
- 🤖 **Auto Glossary Highlighting** - AI automatically identifies and highlights key terms
- 💡 **Smart Definitions** - Hover over highlighted terms for AI-generated explanations
- 🔄 **Google Gemini Integration** - Powered by Google's advanced AI
- 📚 **Fallback Glossary** - Local glossary when AI is unavailable
- ⚡ **Smart Caching** - Reduces API calls and improves performance

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Google Gemini API (Optional but Recommended)

The app works with a built-in glossary, but AI features provide enhanced term detection and definitions.

#### Get Your Free Google Gemini API Key:
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

#### Configure Your API Key:
1. Open the `.env` file in the project root
2. Replace `your_google_gemini_api_key_here` with your actual API key:
```env
VITE_GOOGLE_GEMINI_API_KEY=AIzaSyC-your_actual_api_key_here
VITE_USE_FALLBACK=true
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:5173` in your browser.

## How to Use

### Basic Note Taking
1. Click "New Note" to create a note
2. Edit the title and content
3. Use the formatting toolbar for rich text
4. Notes are automatically saved

### Pin Important Notes
1. Click the pin icon next to any note
2. Pinned notes appear at the top with a pin indicator
3. Click again to unpin

### AI Glossary Features
1. Write content with technical terms, concepts, or specialized vocabulary
2. Stop editing (click outside the editor or press Tab)
3. Wait for the "AI Analyzing..." indicator
4. AI will automatically highlight key terms with yellow background
5. AI-generated terms get a purple gradient and "AI" badge
6. Hover over any highlighted term for detailed definitions

### Example Terms That Get Highlighted:
- **Technical Terms**: API, JavaScript, React, HTML, CSS, JSON
- **Business Terms**: ROI, KPI, SaaS, B2B, MVP, Agile
- **Concepts**: Algorithm, Database, Authentication, Encryption
- **AI-Detected Terms**: Any specialized vocabulary in your content

## Technical Details

### AI Features
- **Google Gemini Pro**: Advanced language model for term identification
- **Smart Processing**: Only analyzes substantial text changes
- **Intelligent Caching**: Prevents redundant API calls
- **Graceful Fallback**: Uses local glossary when AI is unavailable
- **Real-time Highlighting**: Updates as you write and edit

### Performance Optimizations
- **Debounced Processing**: Waits for user to stop typing
- **Cursor Protection**: Removes highlights during editing
- **Memory Management**: Limits cache size and processed text history
- **Error Handling**: Continues working even if API fails

### File Structure
```
src/
├── components/
│   ├── RichTextEditor.jsx      # Main editor component
│   ├── TextFormatToolbar.jsx   # Formatting controls
│   ├── NotesList.jsx           # Notes sidebar
│   └── GlossaryHighlighter.jsx # AI highlighting logic
├── services/
│   └── aiService.js            # Google Gemini integration
├── data/
│   └── glossaryTerms.js        # Local glossary fallback
├── utils/
│   └── helpers.js              # Utility functions
└── App.jsx                     # Main application
```

## Troubleshooting

### AI Features Not Working
1. **Check API Key**: Ensure your Gemini API key is correctly set in `.env`
2. **Restart Server**: After changing `.env`, restart with `npm run dev`
3. **Check Console**: Look for error messages in browser developer tools
4. **Verify API Key**: Make sure the key starts with `AIzaSy` and is complete
5. **Check Quota**: Ensure you haven't exceeded the free tier limits

### Highlighting Issues
1. **Wait for Processing**: Look for "AI Analyzing..." indicator
2. **Try Longer Text**: AI works best with 30+ characters
3. **Click Outside Editor**: Highlighting only works when not editing
4. **Clear Cache**: Refresh the page to clear any cached issues

### Performance Issues
1. **Reduce Text Length**: Very long notes may take longer to process
2. **Check Network**: Ensure stable internet connection
3. **Browser Console**: Check for JavaScript errors

## Google Gemini Free Tier

- **60 requests per minute** - Generous for personal use
- **No monthly limit** - Unlike other providers
- **High quality results** - Advanced language understanding
- **Fast processing** - Typically responds in 1-2 seconds

## How It Works

1. **Text Analysis**: When you stop editing, AI analyzes your text
2. **Term Identification**: Gemini identifies technical terms, concepts, and specialized vocabulary
3. **Definition Generation**: AI creates concise, accurate definitions
4. **Smart Highlighting**: Terms are highlighted with visual indicators
5. **Interactive Tooltips**: Hover for detailed explanations
6. **Fallback Support**: Local glossary ensures functionality without AI

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

**Note**: This app works perfectly without AI configuration using the built-in glossary. The Google Gemini integration enhances the experience by identifying and defining terms specific to your content, but it's not required for basic functionality.
