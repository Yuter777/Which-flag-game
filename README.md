# 🎮 Flag Game - Bayroq O'yini

A modern, interactive flag guessing game with beautiful animations, sound effects, and Uzbek language text-to-speech.

## ✨ Features

- 🎯 **Interactive Gameplay**: Press ENTER to start the game
- 🎨 **Modern UI**: Glassmorphism design with gradient backgrounds and particle effects
- 🎬 **Smooth Animations**: GSAP-powered flag shuffle and fade-in animations
- 🔊 **Sound Effects**: Shuffle sound effect using Web Audio API
- 🗣️ **Text-to-Speech**: Speaks country names in Uzbek (Latin) using SpeechSynthesis API
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Fast Performance**: Flags loaded once and cached in memory
- 🎭 **Custom Cursor**: Glowing cursor effect on desktop

## 🚀 Quick Start

### Option 1: Direct Open (Recommended)

1. Simply open `index.html` in a modern web browser
2. No installation or build process required!

### Option 2: Local Server (For Development)

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📋 Requirements

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Internet connection (for fetching flags from API)
- JavaScript enabled

## 🎮 How to Play

1. **Start the Game**: Click the "ENTER ni bosing" button or press ENTER on your keyboard
2. **Watch the Shuffle**: Flags will shuffle randomly with a spinning animation (0.7-1 second)
3. **Countdown**: After the shuffle, a 3-second countdown will appear
4. **Listen**: The game will speak the country name in Uzbek when the countdown ends
5. **Repeat**: Press ENTER again to play another round

## 🛠️ Technologies Used

- **Vanilla JavaScript**: Pure JS, no frameworks
- **GSAP 3.12.5**: For smooth animations (via CDN)
- **Web Audio API**: For shuffle sound effects
- **SpeechSynthesis API**: For Uzbek text-to-speech
- **REST Countries API**: For flag images (`https://restcountries.com/v3.1/all`)

## 📁 Project Structure

```
FlagGame/
├── index.html      # Main HTML structure
├── style.css       # Styles and animations
├── script.js       # Game logic and functionality
└── README.md       # This file
```

## 🎨 Design Features

- **Glassmorphism**: Frosted glass effect on cards
- **Gradient Backgrounds**: Beautiful color gradients
- **Particle Effects**: Animated background particles
- **Smooth Transitions**: All animations use easing functions
- **Responsive Layout**: Adapts to different screen sizes

## 🔊 Audio & Speech

- **Shuffle Sound**: Generated using Web Audio API (no external files needed)
- **Text-to-Speech**: Uses browser's built-in SpeechSynthesis API
- **Uzbek Language**: Country names translated to Uzbek (Latin script)

## 🌐 Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

**Note**: SpeechSynthesis API may have limited Uzbek voice support in some browsers. The game will fall back to default voice if Uzbek is not available.

## 🐛 Troubleshooting

### Flags not loading?

- Check your internet connection
- Verify that `https://restcountries.com` is accessible
- Check browser console for errors

### No sound?

- Some browsers require user interaction before playing audio
- Check browser audio settings
- Try clicking the button instead of using keyboard

### Speech not working?

- Ensure your browser supports SpeechSynthesis API
- Check browser language/voice settings
- The game will work even without TTS (just won't speak)

## 📝 Notes

- Flags are loaded once on first game start and cached in memory
- ENTER key is ignored during animations to prevent glitches
- Game automatically resets after speaking the country name
- Custom cursor only appears on desktop (hidden on touch devices)

## 🎯 Future Enhancements

Potential improvements:

- Score tracking
- Multiple difficulty levels
- More sound effects
- Flag hints
- Leaderboard
- Offline mode with cached flags

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Development

To modify the game:

1. Edit `script.js` for game logic
2. Edit `style.css` for styling
3. Edit `index.html` for structure

All code is well-commented for easy understanding.

---

**Enjoy the game!** 🎮✨
# Which-flag-game
