class FlagGame {
  constructor() {
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

    this.flags = [];
    this.isLoading = false;
    this.isAnimating = false;
    this.isShuffling = false;
    this.currentFlag = null;
    this.countdownInterval = null;

    this.audioContext = null;
    this.initSound();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createParticles();
    this.updateCursor();
  }

  initSound() {
    try {
      this.audioContext = null;
    } catch (error) {
      console.warn("Audio context not available:", error);
    }
  }

  playDrumRollSound() {
    try {
      if (!this.audioContext || this.audioContext.state === "closed") {
        this.audioContext = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      const now = this.audioContext.currentTime;
      const duration = 0.8;
      const steps = 12;
      for (let i = 0; i < steps; i++) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const biquadFilter = this.audioContext.createBiquadFilter();
        oscillator.connect(biquadFilter);
        biquadFilter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        biquadFilter.type = "lowpass";
        biquadFilter.frequency.value = 200;
        oscillator.type = "sawtooth";
        const startTime = now + (i * duration) / steps;
        const progress = i / steps;
        const baseFreq = 80;
        const freqVariation = 40 * Math.sin(progress * Math.PI * 2);
        const freq = baseFreq + freqVariation + (Math.random() * 10 - 5);
        oscillator.frequency.setValueAtTime(freq, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(
          freq * 0.6,
          startTime + 0.08
        );
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

  setupEventListeners() {
    this.enterButton.addEventListener("click", () => this.startGame());
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        if (this.startScreen.classList.contains("hidden")) {
          if (!this.isShuffling) {
            this.playRound();
          }
        } else {
          this.startGame();
        }
      }
    });
    document.addEventListener("mousemove", (e) => this.updateCursorPosition(e));
    this.enterButton.addEventListener("mouseenter", () => {
      this.customCursor.classList.add("hover");
    });
    this.enterButton.addEventListener("mouseleave", () => {
      this.customCursor.classList.remove("hover");
    });
  }

  updateCursorPosition(e) {
    this.customCursor.style.left = e.clientX + "px";
    this.customCursor.style.top = e.clientY + "px";
  }

  updateCursor() {
    if (window.matchMedia("(pointer: fine)").matches) {
      this.customCursor.style.display = "block";
    } else {
      this.customCursor.style.display = "none";
      document.body.style.cursor = "default";
    }
  }

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

  async startGame() {
    if (this.isAnimating || this.isShuffling || this.isLoading) {
      return;
    }
    gsap.to(this.startScreen, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.startScreen.classList.add("hidden");
      },
    });
    if (this.flags.length === 0) {
      await this.loadFlags();
    } else {
      this.playRound();
    }
  }

  async loadFlags() {
    this.isLoading = true;
    this.loadingScreen.classList.add("active");
    try {
      const apiEndpoints = [
        {
          url: "https://restcountries.com/v3.1/all?fields=name,flags,cca2",
          parser: (data) => this.parseRestCountriesV3(data),
        },
        {
          url: "https://restcountries.com/v3.1/all",
          parser: (data) => this.parseRestCountriesV3(data),
        },
        {
          url: "https://next-js-countries-eight.vercel.app/_next/data/iLjXAfUjjvB63POmLec0M/index.json",
          parser: (data) => this.parseNextJsCountries(data),
        },
        {
          url: "https://restcountries.com/v2/all",
          parser: (data) => this.parseRestCountriesV2(data),
        },
      ];
      let flags = null;
      let lastError = null;
      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API: ${endpoint.url}`);
          const response = await fetch(endpoint.url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const responseData = await response.json();
          if (
            responseData.status === 400 ||
            responseData.message === "Not Found" ||
            responseData._embedded?.errors
          ) {
            throw new Error(responseData.message || "API error");
          }
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
      const errorMessage = error.message?.includes("fields")
        ? "API sozlamalari o'zgardi. Iltimos, biroz kutib, qayta urinib ko'ring."
        : "Bayroqlarni yuklashda xatolik yuz berdi. Internet aloqasini tekshiring va sahifani yangilang.";
      alert(errorMessage);
      this.isLoading = false;
      this.loadingScreen.classList.remove("active");
      this.startScreen.classList.remove("hidden");
      gsap.to(this.startScreen, {
        opacity: 1,
        duration: 0.5,
      });
    }
  }

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
    return this.filterPopularCountries(allFlags);
  }

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
    return this.filterPopularCountries(allFlags);
  }

  parseNextJsCountries(data) {
    let countries = null;
    if (data.pageProps && data.pageProps.countries) {
      countries = data.pageProps.countries;
    }
    else if (Array.isArray(data)) {
      countries = data;
    }
    else if (data.data && Array.isArray(data.data)) {
      countries = data.data;
    }
    if (!countries || !Array.isArray(countries)) return null;
    const allFlags = countries
      .filter((country) => {
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
    return this.filterPopularCountries(allFlags);
  }

  filterPopularCountries(allCountries) {
    const popularCountryNames = [
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
      "United States",
      "Canada",
      "Mexico",
      "Brazil",
      "Argentina",
      "Chile",
      "Colombia",
      "Peru",
      "Venezuela",
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
    return translations[countryName] || countryName;
  }

  async playRound() {
    if (this.isShuffling || this.isAnimating) {
      return;
    }
    this.isShuffling = true;
    this.isAnimating = true;
    this.gameScreen.classList.add("active");
    this.countdownContainer.style.display = "flex";
    this.countdownNumber.textContent = "1";
    this.countryNameContainer.classList.remove("visible");
    this.countryName.textContent = "";
    this.infoContainer.style.display = "flex";
    this.shuffleIndicator.classList.add("active");
    gsap.fromTo(
      this.shuffleIndicator,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.3 }
    );
    this.playDrumRollSound();
    await this.shuffleFlags();
    const randomIndex = Math.floor(Math.random() * this.flags.length);
    this.currentFlag = this.flags[randomIndex];
    this.flagImage.src = this.currentFlag.flagUrl;
    this.flagImage.alt = this.currentFlag.name;
    gsap.to(this.shuffleIndicator, {
      opacity: 0,
      scale: 0.8,
      duration: 0.3,
      onComplete: () => {
        this.shuffleIndicator.classList.remove("active");
      },
    });
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

  async shuffleFlags() {
    const shuffleDuration = 0.7 + Math.random() * 0.3;
    const shuffleCount = 10 + Math.floor(Math.random() * 6);
    const interval = shuffleDuration / shuffleCount;
    const tl = gsap.timeline();
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
        x: 0,
        y: 0,
        ease: "power2.inOut",
        onStart: () => {
          this.flagImage.src = randomFlag.flagUrl;
        },
      });
    }
    tl.to(this.flagImage, {
      rotation: 0,
      scale: 0.9,
      opacity: 0,
      x: 0,
      y: 0,
      duration: 0.2,
    });
    tl.set(this.flagImage, {
      x: 0,
      y: 0,
      rotation: 0,
    });
    await tl;
  }

  startCountdown() {
    this.isShuffling = false;
    let count = 1;
    this.countdownContainer.style.display = "flex";
    this.countdownNumber.textContent = count;
    this.countryNameContainer.classList.remove("visible");
    gsap.fromTo(
      this.countdownNumber,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" }
    );
    this.countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
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

  showCountryName() {
    if (!this.currentFlag) return;
    this.countryName.textContent = this.currentFlag.nameUzbek;
    this.countryNameContainer.classList.add("visible");
    gsap.fromTo(
      this.countryNameContainer,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    );
    this.isAnimating = false;
  }

  resetForNextRound() {
    gsap.to(this.countryNameContainer, {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        this.countryNameContainer.classList.remove("visible");
        this.countryName.textContent = "";
      },
    });
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

let voicesLoaded = false;

if ("speechSynthesis" in window) {
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      voicesLoaded = true;
    };
  } else {
    voicesLoaded = true;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    window.flagGame = new FlagGame();
  }, 100);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
});
