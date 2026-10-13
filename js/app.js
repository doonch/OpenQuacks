document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });

        window.onload = async () => {
            // --- I18N Loading ---
            window.I18N = {};
            window.t = function(key, defaultStr) {
                return window.I18N[key] !== undefined ? window.I18N[key] : defaultStr;
            };

            const LANG_FLAGS = { en: '🇺🇸', es: '🇪🇸', he: '🇮🇱', ar: '🇸🇦', fa: '🇮🇷', pl: '🇵🇱', de: '🇩🇪', uk: '🇺🇦', el: '🇬🇷', ga: '🇮🇪', ja: '🇯🇵', pt: '🇧🇷', zh: '🇨🇳', hi: '🇮🇳', am: '🇪🇹', tr: '🇹🇷' };
            const urlParams = new URLSearchParams(window.location.search);
            
            let lang = urlParams.get('lang') || getCookie('selectedLanguage');
            if (!lang) {
                // Detect browser language (e.g., 'es-ES' -> 'es'), fallback to 'en' if not supported
                const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
                lang = LANG_FLAGS[browserLang] ? browserLang : 'en';
            }
            
            document.documentElement.dir = ['he', 'ar', 'fa'].includes(lang) ? 'rtl' : 'ltr';

            if (lang) {
                try {
                    const response = await fetch(`lang/${lang}.json`);
                    if (response.ok) {
                        window.I18N = await response.json();
                    }
                } catch (e) {
                    console.warn(`Could not load translations for lang=${lang}`, e);
                }
            }

            // Apply static DOM translations
            document.querySelectorAll('[data-i18n]').forEach(el => {
                const key = el.getAttribute('data-i18n');
                if (window.I18N[key]) {
                    el.innerHTML = window.I18N[key];
                }
            });
            document.querySelectorAll('[data-i18n-title]').forEach(el => {
                const key = el.getAttribute('data-i18n-title');
                if (window.I18N[key]) {
                    el.title = window.I18N[key];
                }
            });

            // --- iOS/iPhone Video Audio Fix & Sound Init ---
            applySoundSettings();
            
            // iOS Video Wake-up Hack: Force decode engines to start on the very first user interaction
            const wakeUpVideos = () => {
                const bVid = document.getElementById('bubbling-video');
                const eVid = document.getElementById('explosion-video');
                if (bVid) {
                    bVid.play().catch(()=>{}); 
                }
                if (eVid) {
                    eVid.load(); 
                }
                window.removeEventListener('touchstart', wakeUpVideos, true);
                window.removeEventListener('click', wakeUpVideos, true);
            };
            window.addEventListener('touchstart', wakeUpVideos, true);
            window.addEventListener('click', wakeUpVideos, true);

            initGameData();

            // 1. Initialize AssetManager and wait for graphics
            const assetManager = new AssetManager();
            window.GAME_ASSETS = await assetManager.loadAll();
            
            // 2. Hide loading screen
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) loadingOverlay.style.display = 'none';

            // 3. Boot Game and Check Character Selection
            const savedBookSet = parseInt(getCookie('selectedBookSet')) || 1;
            const initSelectEl = document.getElementById('settings-book-select');
            if (initSelectEl) initSelectEl.value = String(savedBookSet);
            const savedPowersCookie = getCookie('useCharacterPowers');
            const savedPowers = savedPowersCookie === null ? true : savedPowersCookie === '1';
            const gameConfig = { numAIs: 2, bookSet: savedBookSet, useCharacterPowers: savedPowers }; 
            const gameController = new GameController(gameConfig);
            const uiManager = new QuacksUIManager(gameController, window.GAME_ASSETS);
            
            const isDebug = window.location.href.includes('debug=1');
            let savedChar = getCookie('selectedCharacter');
            if (savedChar === 'ENGINEER' && !isDebug) {
                savedChar = null;
            }
            
            if (!savedChar) {
                // Mandatory selection - pauses game start until user picks
                uiManager.showCharacterSelect(true);
            } else {
                // Pre-selected - setup and start immediately
                gameController.setupPlayers(savedChar);
                gameController.startGame();
                
                const forceHelp = window.location.href.includes('help=1');
                const hasSeenHelp = getCookie('hasSeenHelp');
                
                if (forceHelp || !hasSeenHelp) {
                    uiManager.tutorialStep = 1;
                    uiManager.updateTutorialUI();
                } else {
                    uiManager.playStartAnimation();
                }
            }

            // --- Language Selector Setup ---
            const langGrid = document.getElementById('lang-grid');
            const currentLangParam = lang;
            
            document.getElementById('btn-lang').innerText = LANG_FLAGS[currentLangParam] || '🇺🇸';

            Object.keys(LANG_FLAGS).forEach(l => {
                const btn = document.createElement('div');
                btn.style.cssText = `width: 60px; height: 60px; border-radius: 8px; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 2rem; cursor: pointer; border: 2px solid ${l === currentLangParam ? 'gold' : 'transparent'}; transition: all 0.2s;`;
                btn.innerText = LANG_FLAGS[l];
                btn.onclick = async () => {
                    document.documentElement.dir = ['he', 'ar', 'fa'].includes(l) ? 'rtl' : 'ltr';
                    setCookie('selectedLanguage', l, 365); // Save preference for PWA reloads
                    
                    try {
                        const response = await fetch(`lang/${l}.json`);
                        if (response.ok) {
                            window.I18N = await response.json();
                        } else {
                            window.I18N = {};
                        }
                    } catch (e) {
                        console.warn(`Could not load translations for lang=${l}`, e);
                        window.I18N = {};
                    }
                    
                    document.querySelectorAll('[data-i18n]').forEach(el => {
                        const key = el.getAttribute('data-i18n');
                        if (window.I18N[key]) el.innerHTML = window.I18N[key];
                    });
                    document.querySelectorAll('[data-i18n-title]').forEach(el => {
                        const key = el.getAttribute('data-i18n-title');
                        if (window.I18N[key]) el.title = window.I18N[key];
                    });
                    
                    initGameData();
                    gameController.books = gameController.config.bookSet === 4 ? INGREDIENT_BOOKS_SET_4 : (gameController.config.bookSet === 3 ? INGREDIENT_BOOKS_SET_3 : (gameController.config.bookSet === 2 ? INGREDIENT_BOOKS_SET_2 : INGREDIENT_BOOKS_SET_1));
                    
                    // Update active fortune card reference for the UI string update
                    if (gameController.currentFortuneCard) {
                        gameController.currentFortuneCard = FORTUNE_CARDS.find(c => c.id === gameController.currentFortuneCard.id) || gameController.currentFortuneCard;
                    }

                    // Update Player names locally
                    gameController.players.forEach(p => {
                        if (p.isHuman) {
                            p.name = t('ui_you', 'You');
                        } else {
                            const charNameKey = 'char_' + p.character.toLowerCase();
                            const fallbackName = p.character.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
                            const localizedCharName = t(charNameKey, fallbackName);
                            p.name = `${localizedCharName}`;
                        }
                    });
                    
                    uiManager.updateFullUI();
                    if (document.getElementById('shop-modal').style.display === 'flex') {
                        uiManager.renderShopUI();
                    }
                    
                    document.getElementById('btn-lang').innerText = LANG_FLAGS[l];
                    document.getElementById('lang-modal').style.display = 'none';
                    
                    Array.from(langGrid.children).forEach((child, idx) => {
                        child.style.border = Object.keys(LANG_FLAGS)[idx] === l ? '2px solid gold' : '2px solid transparent';
                    });
                    
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('lang', l);
                    window.history.pushState({}, '', newUrl);
                };
                langGrid.appendChild(btn);
            });

            document.getElementById('btn-lang').addEventListener('click', () => {
                document.getElementById('lang-modal').style.display = 'flex';
            });
            document.getElementById('btn-close-lang').addEventListener('click', () => {
                document.getElementById('lang-modal').style.display = 'none';
            });
        };

        // --- PWA & Offline Support ---
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then((registration) => {
                        console.log('ServiceWorker registration successful with scope: ', registration.scope);
                        registration.update();
                    }, (err) => {
                        console.log('ServiceWorker registration failed: ', err);
                    });
            });
        }

        // --- PWA Install UX ---
        (function setupInstallUX() {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches
                              || window.matchMedia('(display-mode: fullscreen)').matches
                              || window.navigator.standalone === true;
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            const installSection = document.getElementById('install-section');
            const installBtn = document.getElementById('btn-install');
            const installIosBtn = document.getElementById('btn-install-ios');
            const iosModal = document.getElementById('ios-install-modal');
            const closeIosBtn = document.getElementById('btn-close-ios-install');

            if (!installSection || !installBtn || !installIosBtn || !iosModal || !closeIosBtn) return;

            let deferredPrompt = null;

            // If we're already running as an installed PWA, hide everything.
            if (isStandalone) {
                installSection.style.display = 'none';
                return;
            }

            // iOS Safari: no beforeinstallprompt event — show manual instructions button.
            if (isIOS) {
                installSection.style.display = 'block';
                installIosBtn.style.display = 'block';
            }

            // Android / Chromium: capture the prompt for later use.
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                installSection.style.display = 'block';
                installBtn.style.display = 'block';
            });

            // Hide install UI once the app is installed.
            window.addEventListener('appinstalled', () => {
                deferredPrompt = null;
                installBtn.style.display = 'none';
                installIosBtn.style.display = 'none';
                installSection.style.display = 'none';
            });

            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                try {
                    deferredPrompt.prompt();
                    await deferredPrompt.userChoice;
                } catch (e) {
                    console.log('Install prompt failed:', e);
                }
                deferredPrompt = null;
                installBtn.style.display = 'none';
            });

            installIosBtn.addEventListener('click', () => {
                iosModal.style.display = 'flex';
            });
            closeIosBtn.addEventListener('click', () => {
                iosModal.style.display = 'none';
            });
            iosModal.addEventListener('click', (e) => {
                if (e.target === iosModal) iosModal.style.display = 'none';
            });

            // --- First-visit install nudge banner ---
            // Shown once after the tutorial completes if the platform supports
            // a guided install (iOS Safari OR Chromium with beforeinstallprompt
            // captured). Dismissed via the "Later" button = cookie set, never
            // auto-shown again. The Settings -> Install section remains
            // available for users who change their mind.
            const banner = document.getElementById('install-nudge-banner');
            const bannerYes = document.getElementById('btn-install-nudge-yes');
            const bannerNo = document.getElementById('btn-install-nudge-no');

            function maybeShowInstallNudge() {
                if (!banner) return;
                if (isStandalone) return;
                if (typeof getCookie === 'function' && getCookie('quacks_install_nudge_seen') === '1') return;
                // Only show if we have a way to actually guide the user to install.
                const canGuideInstall = isIOS || !!deferredPrompt;
                if (!canGuideInstall) return;
                banner.style.display = 'flex';
            }

            function dismissInstallNudge() {
                if (typeof setCookie === 'function') setCookie('quacks_install_nudge_seen', '1', 365);
                if (banner) banner.style.display = 'none';
            }

            // Expose so the tutorial-dismissal hook can trigger us same-session.
            window.__maybeShowInstallNudge = maybeShowInstallNudge;

            if (bannerYes) {
                bannerYes.addEventListener('click', async () => {
                    if (isIOS) {
                        iosModal.style.display = 'flex';
                    } else if (deferredPrompt) {
                        try {
                            deferredPrompt.prompt();
                            await deferredPrompt.userChoice;
                        } catch (e) {
                            console.log('Install prompt failed:', e);
                        }
                        deferredPrompt = null;
                    }
                    dismissInstallNudge();
                });
            }
            if (bannerNo) {
                bannerNo.addEventListener('click', dismissInstallNudge);
            }

            // Returning visitor: tutorial was completed in a previous session.
            if (typeof getCookie === 'function' && getCookie('hasSeenHelp') === 'true') {
                maybeShowInstallNudge();
            }
        })();
