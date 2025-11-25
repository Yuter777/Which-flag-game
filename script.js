/**
 * ============================================
 * Modern Flag Game - Main Script
 * Features: GSAP Animations, Howler.js Sound, SpeechSynthesis TTS
 * ============================================
 */

// ============================================
// Game State Management
// ============================================

class FlagGame {
  constructor() {
    // DOM Elements
    this.startScreen = document.getElementById("startScreen");
    this.loadingScreen = document.getElementById("loadingScreen");
    this.gameScreen = document.getElementById("gameScreen");
    this.enterButton = document.getElementById("enterButton");
    this.flagImage = document.getElementById("flagImage");
    this.flagContainer = document.getElementById("flagContainer");
    this.countdownContainer = document.getElementById("countdownContainer");
    this.countdownNumber = document.getElementById("countdownNumber");
    this.shuffleIndicator = document.getElementById("shuffleIndicator");
    this.customCursor = document.getElementById("customCursor");
    this.particlesContainer = document.getElementById("particles");
    this.countryNameContainer = document.getElementById("countryNameContainer");
    this.countryName = document.getElementById("countryName");
    this.infoContainer = document.getElementById("infoContainer");

    // Game State
    this.flags = [];
    this.isLoading = false;
    this.isAnimating = false;
    this.isShuffling = false;
    this.currentFlag = null;
    this.countdownInterval = null;

    // Sound Effect (using Web Audio API for shuffle sound)
    this.audioContext = null;
    this.initSound();

    // Initialize
    this.init();
  }

  /**
   * Initialize the game
   */
  init() {
    this.setupEventListeners();
    this.createParticles();
    this.updateCursor();
  }

  /**
   * Initialize shuffle sound effect
   * Using Web Audio API to generate a simple shuffle sound
   */
  initSound() {
    try {
      // Initialize audio context (will be created on first use)
      this.audioContext = null;
    } catch (error) {
      console.warn("Audio context not available:", error);
    }
  }

  /**
   * Play drum roll sound effect (baraban aylantirish ovozi) - improved version
   */
  playDrumRollSound() {
    try {
      // Create audio context if it doesn't exist or is closed
      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      // Resume audio context if suspended (required by some browsers)
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }

      const now = this.audioContext.currentTime;
      const duration = 0.8; // Shuffle duration
      const steps = 12; // More steps for smoother sound

      // Create smoother drum roll with better frequency curve
      for (let i = 0; i < steps; i++) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const biquadFilter = this.audioContext.createBiquadFilter();

        oscillator.connect(biquadFilter);
        biquadFilter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Better drum sound with filter
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.value = 200;

        oscillator.type = "sawtooth";
        const startTime = now + (i * duration) / steps;
        const progress = i / steps;

        // Frequency curve: starts high, goes lower, then back up slightly
        const baseFreq = 80;
        const freqVariation = 40 * Math.sin(progress * Math.PI * 2);
        const freq = baseFreq + freqVariation + (Math.random() * 10 - 5);

        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          freq * 0.6,
          startTime + 0.08
        );

        // Smoother gain envelope
        const gainValue = 0.2 * (1 - progress * 0.5);
        gainNode.gain.setValueAtTime(gainValue, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.08);
      }
    } catch (error) {
      console.warn("Could not play drum roll sound:", error);
    }
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // Enter button click
    this.enterButton.addEventListener("click", () => this.startGame());

    // Keyboard ENTER key - can start new round even when flag is shown
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.startScreen.classList.contains("hidden")) {
          // If game screen is active, start new round
          if (!this.isShuffling) {
            this.playRound();
          }
        } else {
          // If start screen is visible, start game
          this.startGame();
        }
      }
    });

    // Custom cursor movement
    document.addEventListener("mousemove", (e) => this.updateCursorPosition(e));

    // Button hover effects for cursor
    this.enterButton.addEventListener("mouseenter", () => {
      this.customCursor.classList.add("hover");
    });
    this.enterButton.addEventListener("mouseleave", () => {
      this.customCursor.classList.remove("hover");
    });
  }

  /**
   * Update custom cursor position
   */
  updateCursorPosition(e) {
    this.customCursor.style.left = e.clientX + "px";
    this.customCursor.style.top = e.clientY + "px";
  }

  /**
   * Update cursor visibility
   */
  updateCursor() {
    // Show custom cursor on desktop, hide on touch devices
    if (window.matchMedia("(pointer: fine)").matches) {
      this.customCursor.style.display = "block";
    } else {
      this.customCursor.style.display = "none";
      document.body.style.cursor = "default";
    }
  }

  /**
   * Create background particles
   */
  createParticles() {
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.animationDelay = Math.random() * 15 + "s";
      particle.style.animationDuration = 10 + Math.random() * 10 + "s";
      this.particlesContainer.appendChild(particle);
    }
  }

  /**
   * Start the game
   */
  async startGame() {
    // Prevent multiple starts during animation
    if (this.isAnimating || this.isShuffling || this.isLoading) {
      return;
    }

    // Hide start screen
    gsap.to(this.startScreen, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.startScreen.classList.add("hidden");
      },
    });

    // Show loading screen if flags not loaded
    if (this.flags.length === 0) {
      await this.loadFlags();
    } else {
      // Start game immediately if flags already loaded
      this.playRound();
    }
  }

  /**
   * Load flags from API
   * Uses multiple API sources for reliability
   */
  async loadFlags() {
    this.isLoading = true;
    this.loadingScreen.classList.add("active");

    try {
      // Try multiple API endpoints with different formats
      const apiEndpoints = [
        // REST Countries API v3.1 with fields parameter (recommended)
        {
          url: "https://restcountries.com/v3.1/all?fields=name,flags,cca2",
          parser: (data) => this.parseRestCountriesV3(data),
        },
        // Alternative: REST Countries without fields (fallback)
        {
          url: "https://restcountries.com/v3.1/all",
          parser: (data) => this.parseRestCountriesV3(data),
        },
        // User suggested API
        {
          url: "https://next-js-countries-eight.vercel.app/_next/data/iLjXAfUjjvB63POmLec0M/index.json",
          parser: (data) => this.parseNextJsCountries(data),
        },
        // REST Countries v2 (older version)
        {
          url: "https://restcountries.com/v2/all",
          parser: (data) => this.parseRestCountriesV2(data),
        },
      ];

      let flags = null;
      let lastError = null;

      // Try each endpoint until one works
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API: ${endpoint.url}`);
          const response = await fetch(endpoint.url);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const responseData = await response.json();

          // Check if response is an error object
          if (
            responseData.status === 400 ||
            responseData.message === "Not Found" ||
            responseData._embedded?.errors
          ) {
            throw new Error(responseData.message || "API error");
          }

          // Parse data using the appropriate parser
          flags = endpoint.parser(responseData);

          if (flags && flags.length > 0) {
            this.flags = flags;
            console.log(
              `Successfully loaded ${flags.length} flags from ${endpoint.url}`
            );
            break;
          }
        } catch (error) {
          console.warn(`Failed to load from ${endpoint.url}:`, error.message);
          lastError = error;
          continue;
        }
      }

      if (!flags || flags.length === 0) {
        throw lastError || new Error("All API endpoints failed");
      }

      // Flags already loaded in the loop above

      // Hide loading screen
      gsap.to(this.loadingScreen, {
        opacity: 0,
        duration: 0.5,
        delay: 0.5,
        onComplete: () => {
          this.loadingScreen.classList.remove("active");
          this.isLoading = false;
          this.playRound();
        },
      });
    } catch (error) {
      console.error("Error loading flags:", error);

      // Show user-friendly error message
      const errorMessage = error.message?.includes("fields")
        ? "API sozlamalari o'zgardi. Iltimos, biroz kutib, qayta urinib ko'ring."
        : "Bayroqlarni yuklashda xatolik yuz berdi. Internet aloqasini tekshiring va sahifani yangilang.";

      alert(errorMessage);
      this.isLoading = false;
      this.loadingScreen.classList.remove("active");

      // Show start screen again
      this.startScreen.classList.remove("hidden");
      gsap.to(this.startScreen, {
        opacity: 1,
        duration: 0.5,
      });
    }
  }

  /**
   * Parse REST Countries API v3.1/v3.0 data
   */
  parseRestCountriesV3(data) {
    if (!Array.isArray(data)) return null;

    const allFlags = data
      .filter(
        (country) => country.flags && (country.flags.svg || country.flags.png)
      )
      .map((country) => ({
        name: country.name?.common || country.name,
        nameUzbek: this.translateToUzbek(country.name?.common || country.name),
        flagUrl: country.flags?.svg || country.flags?.png,
        code: country.cca2,
      }));

    // Filter only popular countries
    return this.filterPopularCountries(allFlags);
  }

  /**
   * Parse REST Countries API v2 data
   */
  parseRestCountriesV2(data) {
    if (!Array.isArray(data)) return null;

    const allFlags = data
      .filter(
        (country) => country.flags && (country.flags.svg || country.flags.png)
      )
      .map((country) => ({
        name: country.name,
        nameUzbek: this.translateToUzbek(country.name),
        flagUrl: country.flags?.svg || country.flags?.png,
        code: country.alpha2Code,
      }));

    // Filter only popular countries
    return this.filterPopularCountries(allFlags);
  }

  /**
   * Parse Next.js Countries API data
   */
  parseNextJsCountries(data) {
    // Handle different possible structures
    let countries = null;

    // Check if data has a pageProps structure
    if (data.pageProps && data.pageProps.countries) {
      countries = data.pageProps.countries;
    }
    // Check if data is directly an array
    else if (Array.isArray(data)) {
      countries = data;
    }
    // Check if data has a data property
    else if (data.data && Array.isArray(data.data)) {
      countries = data.data;
    }

    if (!countries || !Array.isArray(countries)) return null;

    const allFlags = countries
      .filter((country) => {
        // Handle different flag URL formats
        return (
          country.flag || country.flags || country.flagUrl || country.flagSvg
        );
      })
      .map((country) => {
        const flagUrl =
          country.flag ||
          country.flags?.svg ||
          country.flags?.png ||
          country.flagUrl ||
          country.flagSvg;
        const name = country.name?.common || country.name || country.nameCommon;

        return {
          name: name,
          nameUzbek: this.translateToUzbek(name),
          flagUrl: flagUrl,
          code: country.cca2 || country.alpha2Code || country.code,
        };
      });

    // Filter only popular countries
    return this.filterPopularCountries(allFlags);
  }

  /**
   * Filter popular countries (Europe, America, Asia, Middle East)
   */
  filterPopularCountries(allCountries) {
    const popularCountryNames = [
      // Europe
      "France",
      "Germany",
      "Italy",
      "Spain",
      "United Kingdom",
      "Netherlands",
      "Belgium",
      "Switzerland",
      "Austria",
      "Sweden",
      "Norway",
      "Denmark",
      "Finland",
      "Poland",
      "Greece",
      "Portugal",
      "Ireland",
      "Czech Republic",
      "Hungary",
      "Romania",
      "Croatia",
      "Serbia",
      "Bulgaria",
      "Ukraine",
      "Russia",
      "Turkey",
      // America
      "United States",
      "Canada",
      "Mexico",
      "Brazil",
      "Argentina",
      "Chile",
      "Colombia",
      "Peru",
      "Venezuela",
      // Asia
      "China",
      "Japan",
      "India",
      "South Korea",
      "Indonesia",
      "Thailand",
      "Vietnam",
      "Philippines",
      "Malaysia",
      "Singapore",
      "Pakistan",
      "Bangladesh",
      "Saudi Arabia",
      "Iran",
      "Iraq",
      "Uzbekistan",
      "Kazakhstan",
      // Other
      "Australia",
      "New Zealand",
      "South Africa",
      "Egypt",
      "Nigeria",
    ];

    return allCountries.filter((country) =>
      popularCountryNames.includes(country.name)
    );
  }

  /**
   * Translate country name to Uzbek (Latin)
   * This is a simplified translation - you can expand this dictionary
   */
  translateToUzbek(countryName) {
    const translations = {
      France: "Fransiya",
      Japan: "Yaponiya",
      Kazakhstan: "Qozog'iston",
      Germany: "Germaniya",
      "United Kingdom": "Buyuk Britaniya",
      "United States": "Amerika Qo'shma Shtatlari",
      Russia: "Rossiya",
      China: "Xitoy",
      India: "Hindiston",
      Brazil: "Braziliya",
      Italy: "Italiya",
      Spain: "Ispaniya",
      Canada: "Kanada",
      Australia: "Avstraliya",
      "South Korea": "Janubiy Koreya",
      Mexico: "Meksika",
      Argentina: "Argentina",
      Turkey: "Turkiya",
      Poland: "Polsha",
      Netherlands: "Niderlandiya",
      Belgium: "Belgiya",
      Sweden: "Shvetsiya",
      Norway: "Norvegiya",
      Denmark: "Daniya",
      Finland: "Finlandiya",
      Switzerland: "Shveytsariya",
      Austria: "Avstriya",
      Greece: "Gretsiya",
      Portugal: "Portugaliya",
      Egypt: "Misr",
      "South Africa": "Janubiy Afrika",
      Nigeria: "Nigeriya",
      Kenya: "Keniya",
      Morocco: "Marokash",
      Algeria: "Jazoir",
      Tunisia: "Tunis",
      "Saudi Arabia": "Saudiya Arabistoni",
      Iran: "Eron",
      Iraq: "Iroq",
      Israel: "Isroil",
      Pakistan: "Pokiston",
      Bangladesh: "Bangladesh",
      Indonesia: "Indoneziya",
      Thailand: "Tailand",
      Vietnam: "Vyetnam",
      Philippines: "Filippin",
      Malaysia: "Malayziya",
      Singapore: "Singapur",
      "New Zealand": "Yangi Zelandiya",
      Chile: "Chili",
      Colombia: "Kolumbiya",
      Peru: "Peru",
      Venezuela: "Venesuela",
      Ukraine: "Ukraina",
      Romania: "Ruminiya",
      "Czech Republic": "Chexiya",
      Hungary: "Vengriya",
      Ireland: "Irlandiya",
      Croatia: "Xorvatiya",
      Serbia: "Serbiya",
      Bulgaria: "Bolgariya",
      Uzbekistan: "O'zbekiston",
    };

    // Return translation if available, otherwise return original name
    return translations[countryName] || countryName;
  }

  /**
   * Play a game round
   */
  async playRound() {
    if (this.isShuffling || this.isAnimating) {
      return;
    }

    this.isShuffling = true;
    this.isAnimating = true;

    // Show game screen
    this.gameScreen.classList.add("active");

    // Hide countdown and country name initially
    this.countdownContainer.style.display = "flex";
    this.countdownNumber.textContent = "1";
    this.countryNameContainer.classList.remove("visible");
    this.countryName.textContent = "";
    this.infoContainer.style.display = "flex";

    // Show shuffle indicator
    this.shuffleIndicator.classList.add("active");
    gsap.fromTo(
      this.shuffleIndicator,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3 }
    );

    // Play drum roll sound (baraban aylantirish ovozi)
    this.playDrumRollSound();

    // Shuffle animation with random flags
    await this.shuffleFlags();

    // Select final random flag
    const randomIndex = Math.floor(Math.random() * this.flags.length);
    this.currentFlag = this.flags[randomIndex];

    // Show final flag with fade-in animation
    this.flagImage.src = this.currentFlag.flagUrl;
    this.flagImage.alt = this.currentFlag.name;

    // Hide shuffle indicator
    gsap.to(this.shuffleIndicator, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      onComplete: () => {
        this.shuffleIndicator.classList.remove("active");
      },
    });

    // Show flag with GSAP animation - centered, no movement
    // Reset all transforms first
    gsap.set(this.flagImage, {
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: "center center",
    });

    gsap.fromTo(
      this.flagImage,
      { opacity: 0, scale: 0.9, x: 0, y: 0, rotation: 0 },
      {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.5,
        ease: "back.out(1.7)",
        onComplete: () => {
          this.flagImage.classList.add("visible");
          // Ensure flag stays centered - force reset
          gsap.set(this.flagImage, {
            x: 0,
            y: 0,
            rotation: 0,
            clearProps: "all",
          });
          this.startCountdown();
        },
      }
    );
  }

  /**
   * Shuffle flags animation - flag stays centered, only rotates and scales
   */
  async shuffleFlags() {
    const shuffleDuration = 0.7 + Math.random() * 0.3; // 0.7-1.0 seconds
    const shuffleCount = 10 + Math.floor(Math.random() * 6); // 10-15 flags shown
    const interval = shuffleDuration / shuffleCount;

    // Create timeline for shuffle animation
    const tl = gsap.timeline();

    // Ensure flag container is centered - NO MOVEMENT
    gsap.set(this.flagImage, {
      x: 0,
      y: 0,
      transformOrigin: "center center",
      position: "relative",
    });

    for (let i = 0; i < shuffleCount; i++) {
      const randomFlag =
        this.flags[Math.floor(Math.random() * this.flags.length)];

      tl.to(this.flagImage, {
        duration: interval,
        rotation: 360 * (i % 2 === 0 ? 1 : -1),
        scale: 0.6,
        opacity: 0.4,
        x: 0, // Force no horizontal movement
        y: 0, // Force no vertical movement
        ease: "power2.inOut",
        onStart: () => {
          this.flagImage.src = randomFlag.flagUrl;
        },
      });
    }

    // Reset rotation and prepare for final flag - stay centered, NO MOVEMENT
    tl.to(this.flagImage, {
      rotation: 0,
      scale: 0.9,
      opacity: 0,
      x: 0,
      y: 0,
      duration: 0.2,
    });

    // Final reset to ensure no movement
    tl.set(this.flagImage, {
      x: 0,
      y: 0,
      rotation: 0,
    });

    await tl;
  }

  /**
   * Start countdown
   */
  startCountdown() {
    this.isShuffling = false;
    let count = 1;

    // Show countdown container
    this.countdownContainer.style.display = "flex";
    this.countdownNumber.textContent = count;
    this.countryNameContainer.classList.remove("visible");

    // Animate countdown number appearance
    gsap.fromTo(
      this.countdownNumber,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );

    this.countdownInterval = setInterval(() => {
      count--;

      if (count > 0) {
        // Animate number change
        gsap.to(this.countdownNumber, {
          scale: 0,
          opacity: 0,
          duration: 0.2,
          onComplete: () => {
            this.countdownNumber.textContent = count;
            gsap.to(this.countdownNumber, {
              scale: 1,
              opacity: 1,
              duration: 0.3,
              ease: "back.out(1.7)",
            });
          },
        });
      } else {
        // Countdown finished - show country name instead of speaking
        clearInterval(this.countdownInterval);
        gsap.to(this.countdownNumber, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            this.countdownContainer.style.display = "none";
            this.showCountryName();
          },
        });
      }
    }, 1000);
  }

  /**
   * Show country name (instead of TTS)
   */
  showCountryName() {
    if (!this.currentFlag) return;

    // Hide countdown and show country name
    this.countryName.textContent = this.currentFlag.nameUzbek;
    this.countryNameContainer.classList.add("visible");

    // Animate country name appearance
    gsap.fromTo(
      this.countryNameContainer,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );

    // Reset animation state - ready for next round
    this.isAnimating = false;
  }

  /**
   * Reset for next round - hide country name and prepare for new round
   */
  resetForNextRound() {
    // Hide country name
    gsap.to(this.countryNameContainer, {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        this.countryNameContainer.classList.remove("visible");
        this.countryName.textContent = "";
      },
    });

    // Reset flag image
    gsap.to(this.flagImage, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      onComplete: () => {
        this.flagImage.src = "";
        this.flagImage.classList.remove("visible");
        this.isAnimating = false;
      },
    });
  }
}

// ============================================
// Initialize Game
// ============================================

// Wait for voices to be loaded (required for some browsers)
let voicesLoaded = false;

if ("speechSynthesis" in window) {
  // Chrome loads voices asynchronously
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
    };
  } else {
    voicesLoaded = true;
  }
}

// Initialize game when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Small delay to ensure voices are loaded
  setTimeout(() => {
    window.flagGame = new FlagGame();
  }, 100);
});

// Handle page visibility change (pause/resume speech)
document.addEventListener("visibilitychange", () => {
  if (document.hidden && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});
