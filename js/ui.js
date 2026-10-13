        class QuacksUIManager {
            constructor(gameController, assets) {
                this.game = gameController; this.game.uiManager = this;
                this.assets = assets;
                this.canvas = document.getElementById('cauldron-canvas');
                this.ctx = this.canvas.getContext('2d');
                this.wrapper = document.getElementById('cauldron-wrapper');
                this.spiralSpaces = []; this.shopCart = [];
                this.sackAnimations = [];
                this.pendingSackAnimations = [];
                this.isAnimatingDroplet = false;
                this.dropletAnimStartPos = 0;
                this.dropletAnimEndPos = 0;
                this.dropletAnimStartTime = 0;
                this.helpSlideIndex = 0;
                this.showTrackValues = false;
                this.hasPlayedStartAnimation = false;
                this.isWitchBonusDie = false;
                this.tutorialStep = 0; // State for interactive onboarding
                this.displayPlayers = []; // Cached sorting order
                
                this.isDebug = window.location.href.includes('debug=1');
                this.showEventLog = getCookie('showEventLog') === '1'; // Default is disabled
                this.unlockedAchievements = JSON.parse(getCookie('quacks_achievements') || '{}');

                const consoleEl = document.getElementById('game-console');
                if (consoleEl) {
                    consoleEl.style.display = this.showEventLog ? 'flex' : 'none';
                }

                if (Object.keys(this.unlockedAchievements).length > 0) {
                    document.getElementById('btn-achievements').style.display = 'flex';
                }

                // Initialize the monocle icon style BEFORE resizing so it persists
                const monocleEl = document.getElementById('ui-monocle-icon');
                if (monocleEl) {
                    monocleEl.style.cssText = `display: inline-block; ${getUtilSpriteStyle('MONOCLE')}`;
                }

                this.bindEvents(); 
                this.handleResize();
                this.startAnimationLoop(); // Continuous loop for fades
            }

            addLog(msg) {
                const consoleEl = document.getElementById('game-console');
                if (!consoleEl) return;
                const entry = document.createElement('div');
                entry.style.cssText = "padding: 2px 0; border-bottom: 1px solid rgba(255,255,255,0.05); line-height: 1.3;";
                entry.innerHTML = msg;
                consoleEl.appendChild(entry);
                consoleEl.scrollTop = consoleEl.scrollHeight;
            }

            sortPlayers() {
                this.displayPlayers = [...this.game.players].sort((a, b) => b.victoryPoints - a.victoryPoints);
            }

            unlockAchievement(id) {
                if (this.unlockedAchievements[id]) return;

                this.unlockedAchievements[id] = {
                    date: new Date().toLocaleDateString(),
                    char: this.game.humanPlayer.character,
                    set: this.game.config.bookSet,
                    powers: this.game.config.useCharacterPowers ? t('ach_yes', 'Yes') : t('ach_no', 'No')
                };

                setCookie('quacks_achievements', JSON.stringify(this.unlockedAchievements), 365);

                document.getElementById('btn-achievements').style.display = 'flex';

                const def = ACHIEVEMENTS_DEF[id];
                document.getElementById('toast-title').innerText = `${t('ach_unlocked', 'Achievement Unlocked:')} ${t(def.titleKey, def.defaultTitle)}`;
                document.getElementById('toast-desc').innerText = t(def.descKey, def.defaultDesc);

                const iconEl = document.getElementById('toast-icon');
                const spriteStyle = getAchievementSpriteStyle(id);
                if (window.GAME_ASSETS && window.GAME_ASSETS.ACHIEVEMENTS && window.GAME_ASSETS.ACHIEVEMENTS.naturalWidth > 0 && spriteStyle) {
                    iconEl.style.cssText = `width: 100px; height: 100px; margin: 0 auto 15px auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(255,215,0,0.4); ${spriteStyle}`;
                    iconEl.innerText = '';
                } else {
                    iconEl.style.cssText = `width: 80px; height: 80px; margin: 0 auto 10px auto; font-size: 4rem; display: flex; align-items: center; justify-content: center;`;
                    iconEl.innerText = getAchievementFallbackEmoji(id);
                }

                const toast = document.getElementById('achievement-toast');
                toast.style.display = 'flex';
                setTimeout(() => { toast.style.display = 'none'; }, 4000);
            }

            showAchievementsModal() {
                const listEl = document.getElementById('achievements-list');
                listEl.innerHTML = '';

                Object.keys(this.unlockedAchievements).forEach(id => {
                    const data = this.unlockedAchievements[id];
                    const def = ACHIEVEMENTS_DEF[id];

                    const charNameKey = 'char_' + data.char.toLowerCase();
                    const fallbackName = data.char.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
                    const localizedCharName = t(charNameKey, fallbackName);

                    const spriteStyle = getAchievementSpriteStyle(id);
                    const hasSprite = window.GAME_ASSETS && window.GAME_ASSETS.ACHIEVEMENTS && window.GAME_ASSETS.ACHIEVEMENTS.naturalWidth > 0 && spriteStyle;
                    const iconHtml = hasSprite 
                        ? `<div style="width: 60px; height: 60px; border-radius: 8px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.5); ${spriteStyle}"></div>`
                        : `<div style="width: 60px; height: 60px; flex-shrink: 0; font-size: 3rem; display: flex; align-items: center; justify-content: center;">${getAchievementFallbackEmoji(id)}</div>`;

                    const itemDiv = document.createElement('div');
                    itemDiv.style.cssText = "background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; border-left: 4px solid gold; display: flex; gap: 15px; align-items: center;";
                    itemDiv.innerHTML = `
                        ${iconHtml}
                        <div style="flex: 1;">
                            <h3 style="color: gold; margin-bottom: 5px; font-size: 1.1rem;">${t(def.titleKey, def.defaultTitle)}</h3>
                            <p style="font-size: 0.9rem; color: #ddd; margin-bottom: 8px;">${t(def.descKey, def.defaultDesc)}</p>
                            <div style="font-size: 0.8rem; color: #aaa; display: flex; gap: 15px; flex-wrap: wrap;">
                                <span>📅 ${t('ach_date', 'Date:')} ${data.date}</span>
                                <span>🎭 ${t('ach_char', 'Character:')} ${localizedCharName}</span>
                                <span>📖 ${t('ach_set', 'Rules Set:')} ${data.set}</span>
                                <span>✨ ${t('ach_powers', 'Powers:')} ${data.powers}</span>
                            </div>
                        </div>
                    `;
                    listEl.appendChild(itemDiv);
                });

                document.getElementById('achievements-modal').style.display = 'flex';
            }

            startAnimationLoop() {
                const loop = () => { this.renderCanvas(); requestAnimationFrame(loop); };
                loop();
            }

            queueSackAnimation(chipDef) {
                this.pendingSackAnimations.push(chipDef);
            }

            playQueuedSackAnimations() {
                this.pendingSackAnimations.forEach((chipDef, i) => {
                    this.animateToSack(chipDef, i * 200);
                });
                this.pendingSackAnimations = [];
            }

            animateToSack(chipDef, delay = 0) {
                this.sackAnimations.push({
                    chipDef: chipDef,
                    startTime: Date.now() + delay,
                    duration: 800 // Milliseconds for the chip to drop into the sack
                });
            }

            playDropletAnimation() {
                const p = this.game.humanPlayer;
                if (p && p.displayDropletPosition !== undefined && p.displayDropletPosition !== p.dropletPosition) {
                    this.dropletAnimStartPos = p.displayDropletPosition;
                    this.dropletAnimEndPos = p.dropletPosition;
                    this.dropletAnimStartTime = Date.now();
                    this.isAnimatingDroplet = true;
                } else if (p && p.displayDropletPosition === undefined) {
                    p.displayDropletPosition = p.dropletPosition;
                }
            }

            playStartAnimation() {
                if (this.hasPlayedStartAnimation) return;
                this.hasPlayedStartAnimation = true;
                
                const startChips = [
                    { typeId: 'WHITE', value: 1, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'WHITE', value: 1, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'WHITE', value: 1, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'WHITE', value: 1, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'WHITE', value: 2, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'WHITE', value: 2, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'WHITE', value: 3, color: '#ffffff', textCol: '#000000' },
                    { typeId: 'ORANGE', value: 1, color: '#ff8c00', textCol: '#ffffff' },
                    { typeId: 'GREEN', value: 1, color: '#008000', textCol: '#ffffff' }
                ];
                
                startChips.forEach((chip) => {
                    this.queueSackAnimation(chip);
                });
                this.playQueuedSackAnimations();
                this.playDropletAnimation();
            }

            playExplosionVideo() {
                return new Promise((resolve) => {
                    const vid = document.getElementById('explosion-video');
                    vid.currentTime = 0;
                    
                    vid.onerror = () => { resolve(); };
                    vid.onended = () => { vid.currentTime = 0; };

                    vid.play().then(() => {
                        // Resolve the promise after 1 full loop so the evaluation modal can appear
                        let durationMs = 2000;
                        if (vid.duration && !isNaN(vid.duration) && isFinite(vid.duration)) {
                            durationMs = vid.duration * 1000;
                        }
                        setTimeout(resolve, durationMs);
                    }).catch(e => {
                        console.warn("Could not play explosion video:", e);
                        resolve();
                    });
                });
            }

            updateTutorialUI() {
                const overlay = document.getElementById('tutorial-overlay');
                const tooltip = document.getElementById('tutorial-tooltip');
                const skipBtn = document.getElementById('tutorial-skip-btn');
                
                // Clear previous highlights
                document.querySelectorAll('.tutorial-highlight').forEach(el => {
                    el.classList.remove('tutorial-highlight', 'tutorial-relative');
                    if (el.id === 'cauldron-canvas') el.style.position = '';
                });
                
                if (this.tutorialStep === 0) {
                    overlay.style.opacity = '0';
                    tooltip.style.opacity = '0';
                    if (skipBtn) {
                        skipBtn.style.opacity = '0';
                        skipBtn.style.pointerEvents = 'none';
                    }
                    setTimeout(() => {
                        if (this.tutorialStep === 0) {
                            overlay.style.display = 'none';
                            tooltip.style.display = 'none';
                            if (skipBtn) skipBtn.style.display = 'none';
                        }
                    }, 300);
                    return;
                }
                
                if (tooltip.style.display === 'none' || tooltip.style.display === '') {
                    tooltip.style.display = 'block';
                }
                if (skipBtn) {
                    skipBtn.innerText = t('btn_skip', 'Skip');
                    if (skipBtn.style.display === 'none' || skipBtn.style.display === '') {
                        skipBtn.style.display = 'block';
                    }
                    void skipBtn.offsetWidth;
                    skipBtn.style.opacity = '1';
                    skipBtn.style.pointerEvents = 'auto';
                }
                
                // The overlay blocks all interactions on the page. We conditionally hide it if a modal is managing the dark background.
                if (this.tutorialStep === 2.5 || this.tutorialStep === 3 || this.tutorialStep === 4) {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        if (this.tutorialStep === 2.5 || this.tutorialStep === 3 || this.tutorialStep === 4) {
                            overlay.style.display = 'none';
                        }
                    }, 300);
                } else {
                    if (overlay.style.display === 'none' || overlay.style.display === '') {
                        overlay.style.display = 'block';
                    }
                    void overlay.offsetWidth; // force reflow
                    overlay.style.opacity = '1';
                }
                
                let targetEl, text, pos;

                if (this.tutorialStep === 1) {
                    targetEl = document.getElementById('ui-sack');
                    text = t('tut_step1', "Tap the sack to draw your first ingredient!");
                    pos = 'top';
                } else if (this.tutorialStep === 1.5) {
                    targetEl = document.getElementById('ui-sack');
                    text = t('tut_step15', "Ingredients you draw are added to your cauldron. Keep tapping the sack to brew your potion!");
                    pos = 'top';
                    const canvasEl = document.getElementById('cauldron-canvas');
                    if (canvasEl) {
                        canvasEl.classList.add('tutorial-highlight');
                        canvasEl.style.position = 'relative'; // Ensure z-index applies
                    }
                } else if (this.tutorialStep === 2) {
                    targetEl = document.getElementById('btn-sell-potion');
                    text = t('tut_step2', "Great job! You can keep drawing, but if you draw too many Boomberries, you explode! Let's play it safe and click Sell.");
                    pos = 'right';
                    const canvasEl = document.getElementById('cauldron-canvas');
                    if (canvasEl) {
                        canvasEl.classList.add('tutorial-highlight');
                        canvasEl.style.position = 'relative';
                    }
                    const boomMeter = document.getElementById('ui-boomberry-meter');
                    if (boomMeter) boomMeter.classList.add('tutorial-highlight');
                } else if (this.tutorialStep === 2.5) {
                    targetEl = document.getElementById('btn-sell-confirm');
                    text = t('tut_step25', "Confirm selling your potion!");
                    pos = 'top';
                } else if (this.tutorialStep === 3) {
                    const shopItems = document.querySelectorAll('.shop-item');
                    targetEl = Array.from(shopItems).find(el => el.innerText.includes('Pumpkin') || el.innerText.includes('Cost: 3') || el.innerText.includes('3'));
                    if (!targetEl && shopItems.length > 0) targetEl = shopItems[0];
                    text = t('tut_step3', "You earned Money! Buy this Pumpkin to make your bag stronger for the next round.");
                    pos = 'bottom';
                } else if (this.tutorialStep === 4) {
                    targetEl = document.getElementById('btn-finish-buying');
                    text = t('tut_step4', "Click Next Round to continue and start Day 2!");
                    pos = 'top';
                    if (targetEl) {
                        // Scroll modal to bottom so the button is fully visible before positioning tooltip
                        targetEl.scrollIntoView({ block: 'nearest' });
                    }
                } else if (this.tutorialStep === 5) {
                    targetEl = document.getElementById('ui-sack');
                    text = t('tut_step5', "Your bag now has more ingredients! Keep brewing and selling potions to get the highest score by Day 9.");
                    pos = 'top';
                } else if (this.tutorialStep === 6) {
                    targetEl = null;
                    text = t('tut_step6', "There's more to explore! Check out the Flask to undo Boomberries, tap your character card to change avatars, keep an eye on your opponents, and adjust settings in the top right. Tap anywhere to start playing!");
                    pos = 'center';

                    ['flask-section', 'human-character', 'side-panel', 'btn-settings'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.classList.add('tutorial-highlight', 'tutorial-relative');
                    });
                }

                if (targetEl) {
                    targetEl.classList.add('tutorial-highlight');
                    // Add safe positioning context so z-index functions correctly above overlays
                    if (targetEl.id === 'btn-sell-confirm' || targetEl.id === 'btn-finish-buying' || targetEl.classList.contains('shop-item')) {
                        targetEl.classList.add('tutorial-relative');
                    }
                    this.positionTooltip(targetEl, tooltip, text, pos);
                } else if (pos === 'center') {
                    tooltip.innerText = text;
                    tooltip.style.top = '50%';
                    tooltip.style.left = '50%';
                    tooltip.style.transform = 'translate(-50%, -50%)';
                    tooltip.style.bottom = 'auto';
                    tooltip.style.right = 'auto';
                }
                
                void tooltip.offsetWidth; // force reflow
                tooltip.style.opacity = '1';
            }

            positionTooltip(targetEl, tooltipEl, text, pos) {
                tooltipEl.innerText = text;
                const rect = targetEl.getBoundingClientRect();
                
                // Reset styling
                tooltipEl.style.top = 'auto'; tooltipEl.style.bottom = 'auto';
                tooltipEl.style.left = 'auto'; tooltipEl.style.right = 'auto';
                tooltipEl.style.transform = 'none';

                const offset = 20;

                // Simple collision-aware dynamic placement relative to element
                if (pos === 'top') {
                    tooltipEl.style.bottom = `${window.innerHeight - rect.top + offset}px`;
                    tooltipEl.style.left = `${rect.left + rect.width/2}px`;
                    tooltipEl.style.transform = `translateX(-50%)`;
                } else if (pos === 'bottom') {
                    tooltipEl.style.top = `${rect.bottom + offset}px`;
                    tooltipEl.style.left = `${rect.left + rect.width/2}px`;
                    tooltipEl.style.transform = `translateX(-50%)`;
                } else if (pos === 'right') {
                    tooltipEl.style.top = `${rect.top + rect.height/2}px`;
                    tooltipEl.style.left = `${rect.right + offset}px`;
                    tooltipEl.style.transform = `translateY(-50%)`;
                }
            }

            async handlePlayerDraw(e) {
                const canDraw = !this.game.humanPlayer.exploded && !this.game.humanPlayer.hasStopped && this.game.humanPlayer.bag.length > 0;
                if (!canDraw) return;

                if (this.isDebug && e && e.shiftKey) {
                    this.showDebugDrawModal();
                    return;
                }
                
                let advanceToStep6 = false;
                if (this.tutorialStep === 5) {
                    this.tutorialStep = 6;
                    advanceToStep6 = true;
                }

                const wasExploded = this.game.humanPlayer.exploded;
                this.game.humanPlayer.drawChip(); 

                if (!wasExploded && !this.game.humanPlayer.exploded && this.game.humanPlayer.hasStopped) {
                    const rewards = this.getProjectedRewards(this.game.humanPlayer);
                    this.addLog(`<span style="color:gold">[${this.game.humanPlayer.name}]</span> bag empty, sold potion for ${rewards.vp} VP and ${rewards.money} Money.`);
                }

                if (this.tutorialStep === 1 && this.game.humanPlayer.cauldron.length === 1) {
                    this.tutorialStep = 1.5;
                    this.updateTutorialUI();
                } else if ((this.tutorialStep === 1 || this.tutorialStep === 1.5) && this.game.humanPlayer.cauldron.length >= 3) {
                    this.tutorialStep = 2;
                    this.updateTutorialUI();
                } else if (advanceToStep6) {
                    this.updateTutorialUI();
                }
                
                this.updateFullUI();

                // If the latest draw caused an explosion, play the video before triggering the evaluation phase
                if (!wasExploded && this.game.humanPlayer.exploded) {
                    await this.playExplosionVideo();
                }

                // Trigger evaluation check if they exploded or ran out of chips
                if (this.game.humanPlayer.exploded || this.game.humanPlayer.hasStopped) {
                    this.game.checkBrewingPhaseEnd();
                }
            }

            bindEvents() {
                window.addEventListener('click', (e) => {
                    if (this.tutorialStep === 6) {
                        e.stopPropagation();
                        e.preventDefault();
                        this.tutorialStep = 0;
                        setCookie('hasSeenHelp', 'true', 365);
                        this.updateTutorialUI();
                        // First-visit player just finished the tutorial — show
                        // the install nudge banner if their platform supports
                        // a guided install and they haven't dismissed it before.
                        if (typeof window.__maybeShowInstallNudge === 'function') {
                            window.__maybeShowInstallNudge();
                        }
                    }
                }, true); // Capture phase intercepts the click before it activates anything else

                window.addEventListener('resize', () => {
                    this.handleResize();
                    if (this.tutorialStep > 0) this.updateTutorialUI();
                });

                const skipBtn = document.getElementById('tutorial-skip-btn');
                if (skipBtn) {
                    skipBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.tutorialStep = 0;
                        setCookie('hasSeenHelp', 'true', 365);
                        this.updateTutorialUI();
                        this.updateFullUI();
                        if (typeof window.__maybeShowInstallNudge === 'function') {
                            window.__maybeShowInstallNudge();
                        }
                    });
                }

                const sackEl = document.getElementById('ui-sack');
                if (sackEl) {
                    sackEl.addEventListener('click', (e) => {
                        if (this.tutorialStep === 2) return; // Prevent drawing if they need to click Sell in tutorial
                        
                        const canDraw = !this.game.humanPlayer.exploded && !this.game.humanPlayer.hasStopped && this.game.humanPlayer.bag.length > 0;
                        if (canDraw || (this.isDebug && e.shiftKey)) {
                            this.handlePlayerDraw(e);
                        }
                    });
                }
                
                document.getElementById('btn-sell-potion').addEventListener('click', () => {
                    if (this.game.humanPlayer.hasStopped || this.game.humanPlayer.exploded) return;
                    if (this.tutorialStep === 1 || this.tutorialStep === 1.5) return; // Block selling prematurely
                    
                    if (this.tutorialStep === 2) {
                        this.tutorialStep = 2.5;
                        this.updateTutorialUI();
                    }

                    const h = this.game.humanPlayer;
                    const humanRewards = this.getProjectedRewards(h);
                    
                    let brewHtml = ``;
                    if (humanRewards.vp > 0) {
                        brewHtml += `<strong style="color: #f5f5f5;">${humanRewards.vp}</strong><span style="width: 24px; height: 24px; display: inline-block; margin-left: 5px; margin-right: 15px; ${getUtilSpriteStyle('VP')}"></span>`;
                    }
                    brewHtml += `<strong style="color: gold;">${humanRewards.money}</strong><span style="width: 24px; height: 24px; display: inline-block; margin-left: 5px; margin-right: 15px; ${getUtilSpriteStyle('COIN')}"></span>`;
                    if (humanRewards.rubies > 0) {
                        if (humanRewards.rubies > 1) {
                            brewHtml += `<strong style="color: #ff4444;">${humanRewards.rubies}</strong>`;
                        }
                        brewHtml += `<span style="width: 24px; height: 24px; display: inline-block; margin-left: 5px; margin-right: 0; ${getUtilSpriteStyle('RUBY')}"></span>`;
                    }

                    document.getElementById('sell-modal-value').innerHTML = brewHtml;
                    document.getElementById('sell-modal').style.display = 'flex';
                });

                document.getElementById('btn-sell-confirm').addEventListener('click', () => {
                    if (this.tutorialStep === 2.5) {
                        this.tutorialStep = 3;
                    }
                    
                    document.getElementById('sell-modal').style.display = 'none';
                    this.game.humanPlayer.hasStopped = true; 
                    
                    const rewards = this.getProjectedRewards(this.game.humanPlayer);
                    this.addLog(`<span style="color:gold">[${this.game.humanPlayer.name}]</span> sold potion for ${rewards.vp} VP and ${rewards.money} Money.`);

                    this.updateFullUI(); 
                    this.game.checkBrewingPhaseEnd();
                });

                document.getElementById('btn-sell-cancel').addEventListener('click', () => {
                    if (this.tutorialStep > 0) return; // Disable cancel during tutorial
                    document.getElementById('sell-modal').style.display = 'none';
                });

                const flaskIconEl = document.getElementById('ui-flask-icon');
                if (flaskIconEl) {
                    flaskIconEl.addEventListener('click', () => { 
                        if (this.tutorialStep > 0) return;
                        if(this.game.humanPlayer.useFlask()) this.updateFullUI(); 
                    });
                }

                document.getElementById('btn-witch-brew').addEventListener('click', () => {
                    const h = this.game.humanPlayer;
                    h.specialPowerUsed = true;
                    this.addLog(`<span style="color:gold">[${h.name}]</span> exploded but used Witch's Brew and received ${h.roundVP} VP and ${h.roundMoney} Money.`);
                    h.victoryPoints += h.roundVP;
                    h.money += h.roundMoney;
                    document.getElementById('explosion-modal').style.display = 'none';

                    const face = BONUS_DIE_FACES[Math.floor(Math.random() * BONUS_DIE_FACES.length)];
                    face.apply(h);
                    this.addLog(`<span style="color:gold">[${h.name}]</span> rolled the bonus die and received ${face.text}`);

                    this.isWitchBonusDie = true;
                    this.showBonusDieModal(face, h.roundMoney);
                });

                document.getElementById('btn-meditation')?.addEventListener('click', () => {
                    if (this.tutorialStep > 0) return;
                    const h = this.game.humanPlayer;
                    if (this.game.config.useCharacterPowers && h.character === 'MONK' && !h.specialPowerUsed && !h.exploded && !h.hasStopped && this.game.phase === 'Brewing') {
                        h.specialPowerUsed = true;
                        this.addLog(`<span style="color:gold">[${h.name}]</span> used Meditation.`);
                        h.explosionLimitOffset = (h.explosionLimitOffset || 0) + 3;
                        this.updateFullUI();
                    }
                });

                document.getElementById('btn-miracle-gro')?.addEventListener('click', () => {
                    if (this.tutorialStep > 0) return;
                    const h = this.game.humanPlayer;
                    if (this.game.config.useCharacterPowers && h.character === 'GARDENER' && !h.specialPowerUsed && !h.exploded && !h.hasStopped && this.game.phase === 'Brewing') {
                        h.specialPowerUsed = true; // Use it up
                        this.addLog(`<span style="color:gold">[${h.name}]</span> used Miracle Grow.`);
                        this.showMiracleGroModal();
                        this.updateFullUI(); // Hide button
                    }
                });

                document.getElementById('btn-sugar-rush')?.addEventListener('click', () => {
                    if (this.tutorialStep > 0) return;
                    const h = this.game.humanPlayer;
                    if (this.game.config.useCharacterPowers && h.character === 'CHILD' && !h.specialPowerUsed && !h.exploded && !h.hasStopped && this.game.phase === 'Brewing') {
                        h.specialPowerUsed = true; // Use it up
                        this.addLog(`<span style="color:gold">[${h.name}]</span> used Sugar Rush.`);
                        this.showSugarRushModal();
                        this.updateFullUI(); // Hide button
                    }
                });

                document.getElementById('btn-voodoo-sac')?.addEventListener('click', () => {
                    if (this.tutorialStep > 0) return;
                    const h = this.game.humanPlayer;
                    if (this.game.config.useCharacterPowers && h.character === 'VOODOO_LADY' && !h.specialPowerUsed && !h.exploded && !h.hasStopped && this.game.phase === 'Brewing') {
                        this.showVoodooSacModal();
                    }
                });

                document.getElementById('btn-phantom-clone').addEventListener('click', async () => {
                    if (this.tutorialStep > 0) return;
                    const h = this.game.humanPlayer;
                    if (this.game.config.useCharacterPowers && h.character === 'WIZARD' && !h.specialPowerUsed && !h.exploded && !h.hasStopped && h.cauldron.length > 0) {
                        h.specialPowerUsed = true;
                        this.addLog(`<span style="color:gold">[${h.name}]</span> used Phantom Clone.`);
                        const lastChip = h.cauldron[h.cauldron.length - 1];
                        const wasExploded = h.exploded;

                        // Clone 1
                        let newPosition = h.currentBrewValue + lastChip.value;
                        let placedChip1 = { ...lastChip, spaceIndex: newPosition, drawnAt: Date.now() };
                        h.cauldron.push(placedChip1);
                        h.currentBrewValue = newPosition;
                        if (placedChip1.type.id === 'WHITE') h.currentWhiteValue += placedChip1.value;
                        let book = this.game.books[placedChip1.type.id];
                        if (book && book.immediate) book.immediate(h, placedChip1);

                        // Clone 2
                        newPosition = h.currentBrewValue + lastChip.value;
                        let placedChip2 = { ...lastChip, spaceIndex: newPosition, drawnAt: Date.now() + 100 };
                        h.cauldron.push(placedChip2);
                        h.currentBrewValue = newPosition;
                        if (placedChip2.type.id === 'WHITE') h.currentWhiteValue += placedChip2.value;
                        book = this.game.books[placedChip2.type.id];
                        if (book && book.immediate) book.immediate(h, placedChip2);

                        const currentThreshold = this.game.config.explosionThreshold + (h.explosionLimitOffset || 0);
                        if (h.currentWhiteValue > currentThreshold) { 
                            h.exploded = true; 
                            h.explodedAt = Date.now();
                            h.hasStopped = true; 
                        }

                        this.updateFullUI();
                        
                        if (!wasExploded && h.exploded) {
                            await this.playExplosionVideo();
                        }
                        if (h.exploded || h.hasStopped) {
                            this.game.checkBrewingPhaseEnd();
                        }
                    }
                });

                document.getElementById('btn-choose-vp').addEventListener('click', () => { 
                    this.game.humanPlayer.victoryPoints += this.game.humanPlayer.roundVP; 
                    this.addLog(`<span style="color:gold">[${this.game.humanPlayer.name}]</span> exploded and received ${this.game.humanPlayer.roundVP} VP.`);
                    document.getElementById('explosion-modal').style.display = 'none'; 
                    this.startBuyingPhase(); 
                });
                
                document.getElementById('btn-choose-money').addEventListener('click', () => { 
                    this.game.humanPlayer.money += this.game.humanPlayer.roundMoney; 
                    this.addLog(`<span style="color:gold">[${this.game.humanPlayer.name}]</span> exploded and received ${this.game.humanPlayer.roundMoney} Money.`);
                    document.getElementById('explosion-modal').style.display = 'none'; 
                    this.startBuyingPhase(); 
                });
                
                document.getElementById('btn-finish-buying').addEventListener('click', () => { 
                    let advanceTutorial = false;
                    if (this.tutorialStep === 4) {
                        this.tutorialStep = 5;
                        advanceTutorial = true;
                    }

                    document.getElementById('shop-modal').style.display = 'none'; 
                    this.game.humanPlayer.specialPowerActive = false; // Reset charm at end of shop phase
                    
                    // Queue the items bought during this shopping phase into the sack
                    this.shopCart.forEach((item) => {
                        this.queueSackAnimation({ 
                            typeId: item.type.id, 
                            value: item.value, 
                            color: item.type.color, 
                            textCol: item.type.textCol 
                        });
                    });

                    this.game.endRound(); 

                    if (advanceTutorial) {
                        setTimeout(() => this.updateTutorialUI(), 500); // Wait for the new round setup and UI rendering
                    }
                });
                
                document.getElementById('btn-close-bag').addEventListener('click', () => { 
                    document.getElementById('bag-modal').style.display = 'none'; 
                });

                document.getElementById('btn-close-miracle-gro')?.addEventListener('click', () => { 
                    const miracleModal = document.getElementById('miracle-gro-modal');
                    if (miracleModal) miracleModal.style.display = 'none'; 
                });
                
                document.getElementById('btn-close-debug-draw')?.addEventListener('click', () => { 
                    const debugModal = document.getElementById('debug-draw-modal');
                    if (debugModal) debugModal.style.display = 'none'; 
                });

                document.getElementById('btn-bonus-die-ok').addEventListener('click', () => { 
                    document.getElementById('bonus-die-modal').style.display = 'none'; 
                    if (this.isWitchBonusDie) {
                        this.isWitchBonusDie = false;
                        this.startBuyingPhase();
                    } else {
                        this.game.continueEvaluationPhase(); 
                    }
                });

                document.getElementById('btn-achievements').addEventListener('click', () => { this.showAchievementsModal(); });
                document.getElementById('btn-close-achievements').addEventListener('click', () => { document.getElementById('achievements-modal').style.display = 'none'; });

                document.getElementById('btn-settings').addEventListener('click', () => { this.showSettings(); });
                document.getElementById('btn-close-settings').addEventListener('click', () => { document.getElementById('settings-modal').style.display = 'none'; });
                
                // Help button exclusively summons the 8-slide modal now
                document.getElementById('btn-help').addEventListener('click', () => { this.showHelpModal(); });
                document.getElementById('btn-book').addEventListener('click', () => { this.showBookModal(); });
                document.getElementById('btn-close-book').addEventListener('click', () => { document.getElementById('book-modal').style.display = 'none'; });
                
                document.getElementById('btn-close-help').addEventListener('click', () => { 
                    document.getElementById('help-modal').style.display = 'none'; 
                });
                
                document.getElementById('btn-help-prev').addEventListener('click', () => {
                    if (this.helpSlideIndex > 0) {
                        this.helpSlideIndex--;
                        this.renderHelpSlide();
                    }
                });
                document.getElementById('btn-help-next').addEventListener('click', () => {
                    if (this.helpSlideIndex < 7) {
                        this.helpSlideIndex++;
                        this.renderHelpSlide();
                    }
                });

                document.getElementById('ui-human-face').addEventListener('click', () => {
                    if (this.tutorialStep > 0) return;
                    this.showCharacterSelect(false);
                });

                document.getElementById('btn-toggle-values').addEventListener('click', () => {
                    this.showTrackValues = !this.showTrackValues;
                    this.renderCanvas();
                });

                document.getElementById('btn-play-again').addEventListener('click', () => {
                    document.getElementById('game-over-modal').style.display = 'none';
                    // Re-setup players to wipe out old states, keeping the same chosen character
                    this.game.setupPlayers(this.game.humanPlayer.character);
                    this.hasPlayedStartAnimation = false;
                    // Start game loop again
                    this.game.startGame();
                    this.playStartAnimation();
                });
            }

            showDebugDrawModal() {
                const p = this.game.humanPlayer;
                const container = document.getElementById('debug-draw-items');
                container.innerHTML = '';
                
                p.bag.forEach((item, index) => {
                    const chipStyle = getChipSpriteStyle(item.type.id, item.value);
                    const el = document.createElement('div');
                    el.className = 'chip-icon';
                    el.style.cssText = chipStyle || `background-color: ${item.type.color};`;
                    el.style.cursor = 'pointer';
                    if (!chipStyle) el.innerText = item.value;
                    el.title = `${item.type.name} (${item.value})`; 
                    
                    el.onclick = async () => {
                        this.unlockAchievement('META_CHARLATAN');
                        document.getElementById('debug-draw-modal').style.display = 'none';
                        p.victoryPoints = 0; // Penalty for picking token
                        this.addLog(`🛠️ <span style="color:gold">[${p.name}]</span> used a cheat to place <strong style="color:${item.type.color}">${item.type.name} ${item.value}</strong> (VP penalized to 0)`);
                        
                        const wasExploded = p.exploded;
                        p.drawChip(index);
                        this.updateFullUI();
                        
                        if (!wasExploded && p.exploded) {
                            await this.playExplosionVideo();
                        }
                        if (p.exploded || p.hasStopped) {
                            this.game.checkBrewingPhaseEnd();
                        }
                    };
                    container.appendChild(el);
                });

                const modal = document.getElementById('debug-draw-modal');
                if (modal) modal.style.display = 'flex';
            }

            showMiracleGroModal() {
                const h = this.game.humanPlayer;
                const container = document.getElementById('miracle-gro-items');
                if (!container) return;
                container.innerHTML = '';
                
                let upgradedColors = [];
                const plantTypes = ['WHITE', 'ORANGE', 'RED', 'YELLOW'];
                const upgradeMap = { 
                    'WHITE_1': 2, 'WHITE_2': 3, 
                    'ORANGE_1': 6, 
                    'RED_1': 2, 'RED_2': 4, 
                    'YELLOW_1': 2, 'YELLOW_2': 4 
                };

                // Get all plant tokens from inventory
                const plants = h.inventory.filter(item => plantTypes.includes(item.type.id));
                plants.sort((a,b) => a.type.id.localeCompare(b.type.id));

                const elements = plants.map(item => {
                    const el = document.createElement('div');
                    el.className = 'chip-icon';
                    container.appendChild(el);
                    return { el, item };
                });

                const updateView = () => {
                    elements.forEach(({ el, item }) => {
                        const key = `${item.type.id}_${item.value}`;
                        const canUpgrade = !!upgradeMap[key] && upgradedColors.length < 2 && !upgradedColors.includes(item.type.id);
                        
                        const chipStyle = getChipSpriteStyle(item.type.id, item.value);
                        el.style.cssText = `width: 50px; height: 50px; transition: opacity 0.2s; ${chipStyle || `background-color: ${item.type.color};`}`;
                        if (!chipStyle) {
                            el.innerText = item.value;
                            el.style.color = item.type.textCol;
                        } else {
                            el.innerText = '';
                        }
                        
                        el.style.cursor = canUpgrade ? 'pointer' : 'not-allowed';
                        el.style.opacity = canUpgrade ? '1' : '0.5';

                        el.onclick = canUpgrade ? () => {
                            upgradedColors.push(item.type.id);
                            el.classList.add('flip-vertical');
                            
                            setTimeout(() => {
                                // We replace the object itself in inventory & bag so it doesn't break references in cauldron
                                const invIndex = h.inventory.indexOf(item);
                                if (invIndex !== -1) {
                                    h.inventory[invIndex] = { type: item.type, value: upgradeMap[key] };
                                }
                                
                                const bagIndex = h.bag.indexOf(item);
                                if (bagIndex !== -1) {
                                    h.bag[bagIndex] = { type: item.type, value: upgradeMap[key] };
                                }
                                
                                this.addLog(`<span style="color:gold">[${h.name}]</span> upgraded <strong style="color:${item.type.color}">${item.type.name} ${item.value}</strong> to <strong style="color:${item.type.color}">${item.type.name} ${upgradeMap[key]}</strong>`);
                                item.value = upgradeMap[key]; // Update local item for UI re-render
                                
                                updateView(); // re-evaluates all disabled states
                                setTimeout(() => el.classList.remove('flip-vertical'), 200);
                            }, 200); // Trigger the swap at 90 degrees (halfway through 0.4s animation)
                        } : null;
                    });
                };

                updateView();
                const modal = document.getElementById('miracle-gro-modal');
                if (modal) modal.style.display = 'flex';
            }

            showGhostUpgradeModal(upgradeableItems) {
                return new Promise((resolve) => {
                    const h = this.game.humanPlayer;
                    const container = document.getElementById('ghost-upgrade-items');
                    if (!container) { resolve(false); return; }
                    container.innerHTML = '';

                    upgradeableItems.forEach(({ chip, toVal }) => {
                        const elWrapper = document.createElement('div');
                        elWrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border-radius: 8px; transition: background 0.2s; border: 2px solid transparent;";
                        
                        elWrapper.addEventListener('mouseenter', () => { elWrapper.style.backgroundColor = 'rgba(255,255,255,0.1)'; elWrapper.style.borderColor = 'gold'; });
                        elWrapper.addEventListener('mouseleave', () => { elWrapper.style.backgroundColor = 'transparent'; elWrapper.style.borderColor = 'transparent'; });
                        
                        const originalStyle = getChipSpriteStyle(chip.type.id, chip.value);
                        const upgradeStyle = getChipSpriteStyle(chip.type.id, toVal);
                        
                        elWrapper.innerHTML = `
                            <div dir="ltr" style="display: flex; align-items: center; gap: 15px;">
                                <div class="chip-icon" style="width: 50px; height: 50px; ${originalStyle || `background-color: ${chip.type.color};`}">${!originalStyle ? chip.value : ''}</div>
                                <span style="color: gold; font-weight: bold; font-size: 1.5rem;">➔</span>
                                <div class="chip-icon" style="width: 50px; height: 50px; ${upgradeStyle || `background-color: ${chip.type.color};`}">${!upgradeStyle ? toVal : ''}</div>
                            </div>
                        `;

                        elWrapper.onclick = () => {
                            // Apply the upgrade to the player's permanent bag
                            const invIndex = h.inventory.findIndex(i => i.type.id === chip.type.id && i.value === chip.value);
                            if (invIndex !== -1) h.inventory[invIndex] = { type: chip.type, value: toVal };
                            
                            const bagIndex = h.bag.findIndex(i => i.type.id === chip.type.id && i.value === chip.value);
                            if (bagIndex !== -1) h.bag[bagIndex] = { type: chip.type, value: toVal };
                            
                            this.addLog(`<span style="color:gold">[${h.name}]</span> upgraded <strong style="color:${chip.type.color}">${chip.type.name} ${chip.value}</strong> to <strong style="color:${chip.type.color}">${chip.type.name} ${toVal}</strong>`);
                            document.getElementById('ghost-upgrade-modal').style.display = 'none';
                            resolve(true); 
                        };
                        container.appendChild(elWrapper);
                    });

                    const skipBtn = document.getElementById('btn-skip-ghost-upgrade');
                    if (skipBtn) {
                        skipBtn.onclick = () => {
                            this.addLog(`<span style="color:gold">[${h.name}]</span> skipped their Ghostly Exchange.`);
                            document.getElementById('ghost-upgrade-modal').style.display = 'none';
                            resolve(false); // User chose not to upgrade anything
                        };
                    }

                    document.getElementById('ghost-upgrade-modal').style.display = 'flex';
                });
            }

            showGhostGazeModal(peekedItems) {
                const h = this.game.humanPlayer;
                const modal = document.getElementById('ghost-gaze-modal');
                const container = document.getElementById('ghost-gaze-items');
                if (!container || !modal) return;
                container.innerHTML = '';

                peekedItems.forEach(({ chip }) => {
                    const elWrapper = document.createElement('div');
                    elWrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border-radius: 8px; transition: transform 0.2s, background 0.2s; border: 2px solid transparent;";
                    elWrapper.addEventListener('mouseenter', () => { elWrapper.style.backgroundColor = 'rgba(255,255,255,0.1)'; elWrapper.style.borderColor = 'gold'; elWrapper.style.transform = 'scale(1.08)'; });
                    elWrapper.addEventListener('mouseleave', () => { elWrapper.style.backgroundColor = 'transparent'; elWrapper.style.borderColor = 'transparent'; elWrapper.style.transform = 'scale(1)'; });

                    const chipStyle = getChipSpriteStyle(chip.type.id, chip.value);
                    const chipEl = document.createElement('div');
                    chipEl.className = 'chip-icon';
                    chipEl.style.cssText = `width: 55px; height: 55px; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.5); ${chipStyle || `background-color: ${chip.type.color};`}`;
                    if (!chipStyle) {
                        chipEl.innerText = chip.value;
                        chipEl.style.display = 'flex';
                        chipEl.style.alignItems = 'center';
                        chipEl.style.justifyContent = 'center';
                        chipEl.style.color = chip.type.textCol || 'white';
                        chipEl.style.fontWeight = 'bold';
                        chipEl.style.fontSize = '1.3rem';
                    }

                    const label = document.createElement('div');
                    label.style.cssText = `font-size: 0.85rem; font-weight: bold; color: ${chip.type.color === '#ffffff' ? '#ddd' : chip.type.color}; text-shadow: 1px 1px 0 #000;`;
                    label.innerText = `${chip.type.name} ${chip.value}`;

                    elWrapper.appendChild(chipEl);
                    elWrapper.appendChild(label);

                    elWrapper.onclick = async () => {
                        modal.style.display = 'none';
                        const bagIndex = h.bag.indexOf(chip);
                        if (bagIndex !== -1) {
                            this.addLog(`<span style="color:gold">[${h.name}]</span> gazed into the bag and chose <strong style="color:${chip.type.color}">${chip.type.name} ${chip.value}</strong>`);
                            const wasExploded = h.exploded;
                            h.drawChip(bagIndex);
                            this.updateFullUI();
                            if (!wasExploded && h.exploded) {
                                await this.playExplosionVideo();
                            }
                            if (h.exploded || h.hasStopped) {
                                this.game.checkBrewingPhaseEnd();
                            }
                        }
                    };
                    container.appendChild(elWrapper);
                });

                const passBtn = document.getElementById('btn-pass-ghost-gaze');
                if (passBtn) {
                    passBtn.onclick = () => {
                        modal.style.display = 'none';
                        this.addLog(`<span style="color:gold">[${h.name}]</span> gazed into the bag and returned all chips.`);
                        this.updateFullUI();
                        if (h.bag.length === 0) {
                            h.hasStopped = true;
                            this.game.checkBrewingPhaseEnd();
                        }
                    };
                }

                modal.style.display = 'flex';
            }

            showSugarRushModal() {
                const h = this.game.humanPlayer;
                const container = document.getElementById('sugar-rush-items');
                if (!container) return;
                
                let bagCopy = [...h.bag];
                for (let i = bagCopy.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [bagCopy[i], bagCopy[j]] = [bagCopy[j], bagCopy[i]];
                }
                const peekTokens = bagCopy.slice(0, 5);
                
                let selectedTokens = []; // array of { chipObj, order }
                
                const updateView = () => {
                    container.innerHTML = '';
                    peekTokens.forEach(item => {
                        const el = document.createElement('div');
                        el.className = 'chip-icon';
                        el.style.position = 'relative';
                        
                        const chipStyle = getChipSpriteStyle(item.type.id, item.value);
                        el.style.cssText = `width: 50px; height: 50px; cursor: pointer; transition: transform 0.1s; ${chipStyle || `background-color: ${item.type.color};`}`;
                        if (!chipStyle) {
                            el.innerText = item.value;
                            el.style.color = item.type.textCol;
                        }
                        
                        const selIndex = selectedTokens.findIndex(s => s.chipObj === item);
                        if (selIndex !== -1) {
                            const overlay = document.createElement('div');
                            overlay.style.cssText = `position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; background: var(--accent); color: white; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #1a1a2e; font-weight: bold;`;
                            overlay.innerText = selectedTokens[selIndex].order;
                            el.appendChild(overlay);
                            el.style.transform = 'scale(0.9)';
                            el.style.opacity = '0.8';
                        }
                        
                        el.onclick = () => {
                            if (selIndex !== -1) {
                                selectedTokens.splice(selIndex, 1);
                                selectedTokens.forEach((s, idx) => s.order = idx + 1);
                            } else {
                                selectedTokens.push({ chipObj: item, order: selectedTokens.length + 1 });
                            }
                            updateView();
                        };
                        container.appendChild(el);
                    });
                };
                
                updateView();
                
                const doneBtn = document.getElementById('btn-close-sugar-rush');
                if (doneBtn) {
                    doneBtn.onclick = async () => {
                        document.getElementById('sugar-rush-modal').style.display = 'none';
                        
                        selectedTokens.sort((a,b) => a.order - b.order);
                        for (let sel of selectedTokens) {
                            if (h.exploded || h.hasStopped) break;
                            
                            let currentIndex = h.bag.indexOf(sel.chipObj);
                            if (currentIndex !== -1) {
                                const wasExploded = h.exploded;
                                h.drawChip(currentIndex);
                                this.updateFullUI();
                                
                                if (!wasExploded && h.exploded) {
                                    await this.playExplosionVideo();
                                }
                            }
                        }
                        
                        if (h.exploded || h.hasStopped) {
                            this.game.checkBrewingPhaseEnd();
                        }
                    };
                }
                
                document.getElementById('sugar-rush-modal').style.display = 'flex';
            }

            showVoodooSacModal() {
                const h = this.game.humanPlayer;
                const container = document.getElementById('voodoo-sac-items');
                if (!container) return;
                
                let selectedWhite = null;
                let selectedNonWhite = null;

                const bagItems = h.bag.filter(item => 
                    item.type.id === 'WHITE' || (item.type.id !== 'WHITE' && item.value > 1)
                );

                bagItems.sort((a, b) => {
                    if (a.type.id === 'WHITE' && b.type.id !== 'WHITE') return -1;
                    if (a.type.id !== 'WHITE' && b.type.id === 'WHITE') return 1;
                    if (a.type.id === b.type.id) return a.value - b.value;
                    return a.type.id.localeCompare(b.type.id);
                });

                const updateView = () => {
                    container.innerHTML = '';
                    bagItems.forEach((item) => {
                        const isWhite = item.type.id === 'WHITE';
                        const isSelected = (isWhite && selectedWhite === item) || (!isWhite && selectedNonWhite === item);
                        
                        let isClickable = true;
                        
                        if (isWhite) {
                            if (selectedWhite && selectedWhite !== item) isClickable = false;
                            if (selectedNonWhite && item.value * 2 !== selectedNonWhite.value) isClickable = false;
                        } else {
                            if (selectedNonWhite && selectedNonWhite !== item) isClickable = false;
                            if (selectedWhite && item.value !== selectedWhite.value * 2) isClickable = false;
                        }

                        const el = document.createElement('div');
                        el.className = 'chip-icon';
                        const chipStyle = getChipSpriteStyle(item.type.id, item.value);
                        el.style.cssText = `width: 50px; height: 50px; transition: transform 0.1s, opacity 0.2s; ${chipStyle || `background-color: ${item.type.color};`}`;
                        
                        if (!chipStyle) {
                            el.innerText = item.value;
                            el.style.color = item.type.textCol;
                        }

                        if (isClickable) {
                            el.style.cursor = 'pointer';
                            el.style.opacity = '1';
                        } else {
                            el.style.cursor = 'not-allowed';
                            el.style.opacity = '0.3';
                        }

                        if (isSelected) {
                            el.style.transform = 'scale(1.1)';
                            el.style.boxShadow = '0 0 10px gold';
                            el.style.border = '2px solid gold';
                        }

                        if (isClickable) {
                            el.onclick = () => {
                                if (isSelected) {
                                    if (isWhite) selectedWhite = null;
                                    else selectedNonWhite = null;
                                } else {
                                    if (isWhite) selectedWhite = item;
                                    else selectedNonWhite = item;
                                }
                                updateView();
                            };
                        }
                        container.appendChild(el);
                    });

                    const doneBtn = document.getElementById('btn-close-voodoo-sac');
                    if (doneBtn) {
                        doneBtn.disabled = !(selectedWhite && selectedNonWhite);
                    }
                };

                updateView();

                const doneBtn = document.getElementById('btn-close-voodoo-sac');
                if (doneBtn) {
                    const newBtn = doneBtn.cloneNode(true);
                    doneBtn.parentNode.replaceChild(newBtn, doneBtn);
                    newBtn.onclick = () => {
                        if (selectedWhite && selectedNonWhite) {
                            h.bag.splice(h.bag.indexOf(selectedWhite), 1);
                            h.bag.splice(h.bag.indexOf(selectedNonWhite), 1);
                            h.inventory.splice(h.inventory.indexOf(selectedWhite), 1);
                            h.inventory.splice(h.inventory.indexOf(selectedNonWhite), 1);

                            h.specialPowerUsed = true;
                            this.addLog(`<span style="color:gold">[${h.name}]</span> used Voodoo Sacrifice, discarding <strong style="color:${selectedWhite.type.color}">${selectedWhite.type.name} ${selectedWhite.value}</strong> and <strong style="color:${selectedNonWhite.type.color}">${selectedNonWhite.type.name} ${selectedNonWhite.value}</strong>.`);
                            document.getElementById('voodoo-sac-modal').style.display = 'none';
                            this.updateFullUI();
                        }
                    };
                }
                
                const cancelBtn = document.getElementById('btn-cancel-voodoo-sac');
                if (cancelBtn) {
                    cancelBtn.onclick = () => {
                        document.getElementById('voodoo-sac-modal').style.display = 'none';
                    };
                }

                document.getElementById('voodoo-sac-modal').style.display = 'flex';
            }

            showCharacterSelect(isMandatory = false) {
                const grid = document.getElementById('char-select-grid');
                grid.innerHTML = '';
                const chars = ['WITCH', 'WIZARD', 'MONK', 'CHILD', 'PRINCESS', 'VOODOO_LADY', 'BARD', 'GARDENER'];
                const isDebug = this.isDebug || window.location.href.includes('debug=1');
                if (isDebug) {
                    chars.push('ENGINEER');
                }
                
                chars.forEach(charName => {
                    const btn = document.createElement('div');
                    const isCurrent = (!isMandatory && this.game.humanPlayer && this.game.humanPlayer.character === charName);
                    
                    if (charName === 'ENGINEER') {
                        btn.style.cssText = `width: 70px; height: 90px; border-radius: 8px; border: 3px solid ${isCurrent ? 'gold' : 'transparent'}; cursor: pointer; background-color: rgba(255,215,0,0.15); transition: all 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(255,215,0,0.2);`;
                        btn.innerHTML = `
                            <span style="font-size: 2.5rem; line-height: 1;">👷</span>
                            <span style="font-size: 0.65rem; color: gold; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Engineer</span>
                        `;
                    } else {
                        btn.style.cssText = `width: 70px; height: 90px; border-radius: 8px; border: 3px solid ${isCurrent ? 'gold' : 'transparent'}; cursor: pointer; background-color: rgba(0,0,0,0.5); transition: border-color 0.2s; display: flex; align-items: center; justify-content: center; font-size: 3rem; ${getCharacterSpriteStyle(charName, 'SMIRK')}`;
                        btn.innerHTML = (window.GAME_ASSETS && window.GAME_ASSETS.CHARACTERS && window.GAME_ASSETS.CHARACTERS.naturalWidth > 0) ? '' : getCharacterFallbackEmoji(charName);
                    }
                    const fallbackName = charName.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
                    btn.title = t('char_' + charName.toLowerCase(), fallbackName);
                    
                    btn.addEventListener('click', () => {
                        setCookie('selectedCharacter', charName, 365);
                        
                        if (isMandatory) {
                            document.getElementById('char-select-modal').style.display = 'none';
                            this.game.setupPlayers(charName);
                            this.game.startGame();
                            this.updateFullUI();
                            
                            const forceHelp = window.location.href.includes('help=1');
                            const hasSeenHelp = getCookie('hasSeenHelp');
                            if (forceHelp || !hasSeenHelp) {
                                this.tutorialStep = 1;
                                this.updateTutorialUI();
                            } else {
                                this.playStartAnimation();
                            }
                        } else {
                            // Swap dynamically mid-game without closing the modal immediately to allow further setting tweaks
                            const oldChar = this.game.humanPlayer.character;
                            if (oldChar !== charName) {
                                this.game.humanPlayer.character = charName;
                                const conflictAI = this.game.players.find(p => !p.isHuman && p.character === charName);
                                if (conflictAI) {
                                    conflictAI.character = oldChar; // Swap AI to old human char
                                    const charNameKey = 'char_' + oldChar.toLowerCase();
                                    const fallbackName = oldChar.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
                                    
                                    const localizedCharName = typeof t === 'function' ? t(charNameKey, fallbackName) : fallbackName;
                                    
                                    conflictAI.name = `${localizedCharName}`;
                                }
                                this.showCharacterSelect(false); // Refresh grid styles
                                this.updateFullUI();
                            }
                        }
                    });
                    
                    btn.addEventListener('mouseenter', () => { if (btn.style.borderColor !== 'gold') btn.style.borderColor = '#e94560'; });
                    btn.addEventListener('mouseleave', () => { if (!isCurrent) btn.style.borderColor = 'transparent'; });
                    
                    grid.appendChild(btn);
                });

                const closeBtn = document.getElementById('btn-close-char-select');
                if (isMandatory) {
                    closeBtn.style.display = 'none';
                } else {
                    closeBtn.style.display = 'block';
                    closeBtn.onclick = () => { document.getElementById('char-select-modal').style.display = 'none'; };
                }
                
                const modal = document.getElementById('char-select-modal');
                if (modal) {
                    // Allow closing the modal by clicking on the overlay background (if not mandatory)
                    modal.onclick = (e) => {
                        if (e.target === modal && !isMandatory) {
                            modal.style.display = 'none';
                        }
                    };
                    modal.style.display = 'flex';
                }
            }

            showSettings() {
                // Book Set Settings
                const selectEl = document.getElementById('settings-book-select');
                if (selectEl) {
                    selectEl.value = String(this.game.config.bookSet || 1);
                    selectEl.onchange = (e) => {
                        const val = parseInt(e.target.value);
                        setCookie('selectedBookSet', val, 365);
                        this.game.config.bookSet = val;
                        this.game.books = val === 4 ? INGREDIENT_BOOKS_SET_4 : (val === 3 ? INGREDIENT_BOOKS_SET_3 : (val === 2 ? INGREDIENT_BOOKS_SET_2 : INGREDIENT_BOOKS_SET_1));
                        this.addLog(`⚙️ Switched ingredient rules to <strong>Set ${val}</strong>`);
                        this.updateFullUI();
                    };
                }
                
                // Character Powers Setting
                const powersCheckbox = document.getElementById('settings-powers-checkbox');
                if (powersCheckbox) {
                    powersCheckbox.checked = this.game.config.useCharacterPowers || false;
                    powersCheckbox.onchange = (e) => {
                        const val = e.target.checked;
                        setCookie('useCharacterPowers', val ? '1' : '0', 365);
                        this.game.config.useCharacterPowers = val;
                        this.updateFullUI();
                    };
                }

                // Sound Setting
                const soundCheckbox = document.getElementById('settings-sound-checkbox');
                if (soundCheckbox) {
                    soundCheckbox.checked = getCookie('soundEnabled') !== '0';
                    soundCheckbox.onchange = (e) => {
                        const val = e.target.checked;
                        setCookie('soundEnabled', val ? '1' : '0', 365);
                        applySoundSettings();
                    };
                }

                // Event Log Setting
                const consoleCheckbox = document.getElementById('settings-console-checkbox');
                if (consoleCheckbox) {
                    consoleCheckbox.checked = this.showEventLog;
                    consoleCheckbox.onchange = (e) => {
                        const val = e.target.checked;
                        setCookie('showEventLog', val ? '1' : '0', 365);
                        this.showEventLog = val;
                        const consoleEl = document.getElementById('game-console');
                        if (consoleEl) consoleEl.style.display = val ? 'flex' : 'none';
                    };
                }

                const modal = document.getElementById('settings-modal');
                if (modal) modal.style.display = 'flex';
            }

            showBookModal() {
                const listEl = document.getElementById('book-rules-list');
                listEl.innerHTML = '';
                const isDebug = this.isDebug || window.location.href.includes('debug=1');
                
                Object.keys(this.game.books).forEach(colorId => {
                    if (colorId === 'BROWN' && !isDebug) return;
                    const ingDef = INGREDIENTS[colorId];
                    const bookDef = this.game.books[colorId];
                    
                    if (ingDef && bookDef) {
                        const chipStyle = getChipSpriteStyle(colorId, 1);
                        
                        const itemDiv = document.createElement('div');
                        itemDiv.style.cssText = "display: flex; gap: 15px; align-items: flex-start; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);";
                        
                        itemDiv.innerHTML = `
                            <div class="chip-icon" style="flex: none; width: 40px; height: 40px; ${chipStyle || `background-color: ${ingDef.color};`}"></div>
                            <div>
                                <div style="font-weight: bold; color: ${ingDef.color === '#ffffff' || ingDef.color === '#000000' ? '#ddd' : ingDef.color}; text-shadow: 1px 1px 0px #000;">${ingDef.name}</div>
                                <div style="font-size: 0.9rem; color: #ccc; margin-top: 4px; line-height: 1.4;">${bookDef.description}</div>
                            </div>
                        `;
                        listEl.appendChild(itemDiv);
                    }
                });
                
                document.getElementById('book-modal').style.display = 'flex';
            }

            showHelpModal() {
                this.helpSlideIndex = 0;
                this.renderHelpSlide();
                document.getElementById('help-modal').style.display = 'flex';
            }

            renderHelpSlide() {
                const contentEl = document.getElementById('help-slide-content');
                const indicatorEl = document.getElementById('help-slide-indicator');
                
                const hasSprite = window.GAME_ASSETS && window.GAME_ASSETS.UTILS && window.GAME_ASSETS.UTILS.naturalWidth > 0;
                const emptyFlask = hasSprite ? `<div style="width:30px; height:45px; ${getUtilSpriteStyle('FLASK_EMPTY')}"></div>` : `<div style="width:30px; height:45px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; opacity: 0.5;">🧪</div>`;
                const fullFlask = hasSprite ? `<div style="width:30px; height:45px; ${getUtilSpriteStyle('FLASK_FULL')}"></div>` : `<div style="width:30px; height:45px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem;">🧪</div>`;
                
                const slides = [
                    {
                        text: t('help_slide_1', "Press the SACK to draw random ingredients into your cauldron."),
                        html: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px;">
                            <div style="width: 60px; height: 60px; ${getUtilSpriteStyle('SACK')}"></div>
                        </div>`
                    },
                    {
                        text: t('help_slide_2', "Press the 💲 button to stop brewing and sell your potion. Sell before drawing too many Boomberries (white tokens), or your cauldron will explode!"),
                        html: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px; font-weight: bold; font-size: 1.5rem;">
                            8 x <div class="chip-icon" style="${getChipSpriteStyle('WHITE', 1)}"></div> = <span style="font-size: 2rem; margin-left: 5px;">💥</span>
                        </div>`
                    },
                    {
                        text: t('help_slide_3', "Ingredients you draw from your bag get added from the blue droplet, in an outward spiral. The more you add, the more rewards you get!"),
                        html: `<div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
                            <img src="assets/spiral_demo.png" alt="Spiral Demo" style="max-height: 140px; border-radius: 8px; border: 2px solid var(--panel-border);">
                        </div>`
                    },
                    {
                        text: t('help_slide_4', "At the end of each day, spend money to buy more ingredients. These ingredients make your brew more powerful!"),
                        html: `<div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 15px; flex-wrap: wrap;">
                            <div class="chip-icon" style="${getChipSpriteStyle('ORANGE', 1)}"></div>
                            <div class="chip-icon" style="${getChipSpriteStyle('RED', 1)}"></div>
                            <div class="chip-icon" style="${getChipSpriteStyle('GREEN', 1)}"></div>
                            <div class="chip-icon" style="${getChipSpriteStyle('YELLOW', 1)}"></div>
                            <div class="chip-icon" style="${getChipSpriteStyle('PURPLE', 1)}"></div>
                            <div class="chip-icon" style="${getChipSpriteStyle('BLACK', 1)}"></div>
                            <div class="chip-icon" style="${getChipSpriteStyle('BLUE', 1)}"></div>
                        </div>`
                    },
                    {
                        text: t('help_slide_5', "Use the FLASK to take back a boomberry into your bag. You may only use the flask immediately after drawing a boomberry, and you cannot use the flask if your brew exploded! You can refill your flask for a price."),
                        html: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px; font-weight: bold;">
                            ${emptyFlask} + 
                            <div style="width:25px; height:25px; ${getUtilSpriteStyle('RUBY')}"></div> + 
                            <div style="width:25px; height:25px; ${getUtilSpriteStyle('RUBY')}"></div> = 
                            ${fullFlask}
                        </div>`
                    },
                    {
                        text: t('help_slide_6', "The DROPLET is where you start brewing from. Adding droplets makes your brew more valuable, but they cost rubies!"),
                        html: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px; font-weight: bold;">
                            <div style="width:25px; height:25px; ${getUtilSpriteStyle('RUBY')}"></div> + 
                            <div style="width:25px; height:25px; ${getUtilSpriteStyle('RUBY')}"></div> = 
                            <div style="width:30px; height:45px; ${getUtilSpriteStyle('DROPLET')}"></div>
                        </div>`
                    },
                    {
                        text: t('help_slide_7', "Get free RAT TAILS if you are far behind the leader. These ingredients give you a temporary boost, so you could catch up with your opponents!"),
                        html: `<div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 15px;">
                            <div style="width:40px; height:40px; ${getUtilSpriteStyle('RAT')}"></div>
                        </div>`
                    },
                    {
                        text: t('help_slide_8', "The game goes on for 9 rounds. At the end of the last day, whoever has the most VP is the winner!"),
                        html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px; margin-top: 15px;">
                            <div style="font-size: 3rem;">🏆</div>
                            <button onclick="setCookie('hasSeenHelp', '', -1); location.reload();" style="padding: 8px 16px; background-color: #00b4d8; width: auto; margin-top: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">${t('btn_play_tutorial', 'Play the tutorial')}</button>
                        </div>`
                    }
                ];

                const slide = slides[this.helpSlideIndex];
                contentEl.innerHTML = `<div>${slide.text}</div>${slide.html}`;
                indicatorEl.innerText = `${this.helpSlideIndex + 1} / ${slides.length}`;
                
                document.getElementById('btn-help-prev').disabled = this.helpSlideIndex === 0;
                document.getElementById('btn-help-next').disabled = this.helpSlideIndex === slides.length - 1;
            }

            showBonusDieModal(face, money) {
                const descEl = document.getElementById('bonus-die-desc');
                if (descEl) {
                    descEl.innerHTML = `${t('modal_die_desc', "You brewed the best potion this round!")} (${money} <span style="width: 14px; height: 14px; display: inline-block; vertical-align: middle; ${getUtilSpriteStyle('COIN')}"></span>)`;
                }
                
                let iconHtml = '';
                if (face.isChip) {
                    iconHtml = `<div class="chip-icon" style="width: 40px; height: 40px; ${getChipSpriteStyle(face.typeId, face.value)}"></div>`;
                } else {
                    iconHtml = `<div style="width: 40px; height: 40px; ${getUtilSpriteStyle(face.icon)}"></div>`;
                }

                document.getElementById('bonus-die-result').innerHTML = `${iconHtml}<span>${face.text}</span>`;
                document.getElementById('bonus-die-modal').style.display = 'flex';
                this.updateFullUI();
            }

            showExplosionModal(vp, money) {
                document.getElementById('expl-vp-val').innerText = vp; 
                document.getElementById('expl-money-val').innerText = money;
                document.getElementById('expl-money-icon').style.cssText = `width: 20px; height: 20px; display: inline-block; ${getUtilSpriteStyle('COIN')}`;
                
                const h = this.game.humanPlayer;
                const witchBtn = document.getElementById('btn-witch-brew');
                if (this.game.config.useCharacterPowers && h.character === 'WITCH' && !h.specialPowerUsed) {
                    witchBtn.style.display = 'block';
                } else {
                    witchBtn.style.display = 'none';
                }

                document.getElementById('explosion-modal').style.display = 'flex';
            }

            showGameOver() {
                const sortedPlayers = [...this.game.players].sort((a,b) => b.victoryPoints - a.victoryPoints);
                const titleEl = document.getElementById('game-over-title');
                
                if (sortedPlayers[0] === this.game.humanPlayer) {
                    titleEl.innerText = t('ui_you_win', "🏆 You win! 🏆");
                    
                    if (this.game.humanPlayer.victoryPoints > 70) {
                        this.unlockAchievement('POINT_MAXXING');
                    }
                    
                    const tiedPlayers = sortedPlayers.filter(p => p.victoryPoints === sortedPlayers[0].victoryPoints);
                    if (tiedPlayers.length >= 3) {
                        this.unlockAchievement('TIE_FIGHTER');
                    }
                } else {
                    titleEl.innerText = t('modal_game_over_title', "🏆 Game Over 🏆");
                }

                const scores = sortedPlayers.map((p, i) => {
                    const isWinner = (i === 0);
                    const faceMood = getPlayerMood(p, true, isWinner);
                    const faceStyle = getCharacterSpriteStyle(p.character, faceMood);
                    const emojiStr = (window.GAME_ASSETS && window.GAME_ASSETS.CHARACTERS && window.GAME_ASSETS.CHARACTERS.naturalWidth > 0 && p.character !== 'ENGINEER') ? '' : getCharacterFallbackEmoji(p.character);
                    
                    // Extract the converted amounts
                    const moneyVP = Math.floor(p.money / 5);
                    const rubyVP = Math.floor(p.rubies / 2);
                    const baseVP = p.victoryPoints - moneyVP - rubyVP; // Back-calculate the base VP before conversion
                    
                    return `<div style="display: flex; flex-direction: column; padding: 10px 15px; background: ${i%2===0?'rgba(255,255,255,0.1)':'transparent'}; border-radius: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 55px; height: 70px; border-radius: 50%; border: 2px solid ${isWinner ? 'gold' : '#666'}; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; overflow: hidden; ${faceStyle}">${emojiStr}</div>
                                <span>${isWinner ? '👑 ' : ''}${p.name}</span>
                            </div>
                            <strong style="color: var(--accent); font-size: 1.2em;">${p.victoryPoints} ${t('vp', 'VP')}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: #aaa; border-top: 1px dashed rgba(255,255,255,0.2); padding-top: 5px;">
                            <span>${t('base', 'Base:')} <strong style="color: #f5f5f5;">${baseVP}</strong></span>
                            <span style="display: flex; align-items: center;">${t('money', 'Money')} <span style="width: 14px; height: 14px; display: inline-block; margin: 0 4px; ${getUtilSpriteStyle('COIN')}"></span> (${p.money}): <strong style="color: gold; margin-left: 2px;">+${moneyVP}</strong></span>
                            <span>${t('ruby_plural', 'Rubies')} (${p.rubies}): <strong style="color: #ff4444;">+${rubyVP}</strong></span>
                        </div>
                    </div>`;
                }).join('');
                
                document.getElementById('final-scores').innerHTML = scores; document.getElementById('game-over-modal').style.display = 'flex';
            }

            showBagModal(player = null) {
                const p = player || this.game.humanPlayer;
                const container = document.getElementById('bag-items');
                container.innerHTML = '';
                
                const titleEl = document.getElementById('bag-modal-title');
                if (p.isHuman) {
                    titleEl.innerHTML = `<span style="width: 30px; height: 30px; display: inline-block; ${getUtilSpriteStyle('SACK')}"></span> ${t('modal_bag_title', "What's in my bag?")}`;
                } else {
                    titleEl.innerHTML = `<span style="width: 30px; height: 30px; display: inline-block; ${getUtilSpriteStyle('SACK')}"></span> ${p.name}${t('msg_bag_debug', "'s bag (Debug)")}`;
                }

                // Sort inventory for better visualization (by type, then value)
                const sortedInventory = [...p.inventory].sort((a, b) => {
                    if (a.type.id === b.type.id) return a.value - b.value;
                    return a.type.id.localeCompare(b.type.id);
                });

                sortedInventory.forEach(item => {
                    const chipStyle = getChipSpriteStyle(item.type.id, item.value);
                    const el = document.createElement('div');
                    el.className = 'chip-icon';
                    el.style.cssText = chipStyle || `background-color: ${item.type.color};`;
                    if (!chipStyle) el.innerText = item.value;
                    el.title = `${item.type.name} (${item.value})`; // Tooltip on hover
                    container.appendChild(el);
                });

                document.getElementById('bag-modal').style.display = 'flex';
            }

            startBuyingPhase() {
                if (this.game.round === 9) { this.game.endRound(); return; }
                this.shopCart = [];
                this.game.humanPlayer.moneySpentThisRound = 0;

                // Engineer bonus: 100 gold and 50 rubies upon entering the shopping phase
                if (this.game.humanPlayer.character === 'ENGINEER') {
                    this.game.humanPlayer.money += 100;
                    this.game.humanPlayer.rubies += 50;
                    this.addLog(`🛠️ <span style="color:gold">[${this.game.humanPlayer.name}]</span> received 100 Gold and 50 Rubies!`);
                }
                
                this.game.players.forEach(p => {
                    if (!p.isHuman) { 
                        if (p.character === 'ENGINEER') {
                            p.money += 100;
                            p.rubies += 50;
                        }

                        // AI Bard Power Logic
                        if (this.game.config.useCharacterPowers && p.character === 'BARD' && !p.specialPowerUsed) {
                            p.specialPowerUsed = true;
                            p.specialPowerActive = true;
                            this.addLog(`<span style="color:#ccc">[${p.name}]</span> used Bard's Charm.`);
                            p.rubies += 3;
                        }

                        // AI Princess Power Logic
                        if (this.game.config.useCharacterPowers && p.character === 'PRINCESS' && !p.specialPowerUsed) {
                            // Princess waits for late game or when she's rich to maximize doubling!
                            if (this.game.round >= 8 || p.money >= 20) {
                                p.specialPowerUsed = true;
                                p.specialPowerActive = true;
                                this.addLog(`<span style="color:#ccc">[${p.name}]</span> used Royal Decree.`);
                                p.money *= 2;
                            }
                        }

                        const discount = (p.character === 'BARD' && p.specialPowerActive) ? 1 : 0;
                        const dropCost = Math.max(1, 2 - discount); // Floor at 1 to prevent infinite loops for AI

                        // AI constantly buys droplets as long as it has enough rubies
                        while (p.rubies >= dropCost) {
                            p.rubies -= dropCost;
                            p.dropletPosition++;
                            this.addLog(`<span style="color:#ccc">[${p.name}]</span> bought Droplet Upgrade for ${dropCost} Rubies.`);
                        }

                        let boughtColors = [];
                        const isAIEngineer = (p.character === 'ENGINEER');
                        const maxBuys = isAIEngineer ? 99 : ((p.character === 'PRINCESS' && p.specialPowerActive) ? 3 : 2);
                        
                        // AI can buy up to 2 chips (or 3 for Princess, unlimited for Engineer)
                        for (let i = 0; i < maxBuys; i++) {
                            const catalog = isAIEngineer ? [
                                ...SHOP_CATALOG,
                                { type: INGREDIENTS.BROWN, value: 0, cost: 2 },
                                { type: INGREDIENTS.BROWN, value: 1, cost: 4 },
                                { type: INGREDIENTS.BROWN, value: 2, cost: 8 },
                                { type: INGREDIENTS.WHITE, value: 1, cost: 3 },
                                { type: INGREDIENTS.WHITE, value: 2, cost: 6 },
                                { type: INGREDIENTS.WHITE, value: 3, cost: 9 }
                            ] : SHOP_CATALOG;

                            // Find all available ingredients that the AI can afford, hasn't bought the color of yet, and are unlocked this round
                            const available = catalog.filter(item => {
                                if (!isAIEngineer) {
                                    if (item.type.id === 'YELLOW' && this.game.round <= 2) return false;
                                    if (item.type.id === 'BLUE' && this.game.round <= 3) return false;
                                    if (boughtColors.includes(item.type.id)) return false;
                                }
                                return item.cost <= p.money;
                            });
                            
                            if (available.length > 0) {
                                // Sort descending by cost to find the most expensive affordable item
                                available.sort((a, b) => b.cost - a.cost);
                                const buy = available[0];
                                p.buyChip(buy.type, buy.value, buy.cost);
                                boughtColors.push(buy.type.id);
                                this.addLog(`<span style="color:#ccc">[${p.name}]</span> bought <strong style="color:${buy.type.color}">${buy.type.name} ${buy.value}</strong> for ${buy.cost} Money.`);
                            } else {
                                break; // Break out if no affordable items are left
                            }
                        }
                        p.specialPowerActive = false; // Reset at end of their buying phase
                    }
                });
                this.renderShopUI(); document.getElementById('shop-modal').style.display = 'flex'; this.updateFullUI();
                
                // Triggers shopping tutorial if active
                if (this.tutorialStep === 3) this.updateTutorialUI();
            }

            renderShopUI() {
                const h = this.game.humanPlayer;
                const isEngineer = (h.character === 'ENGINEER');
                document.getElementById('shop-money').innerText = h.money; 
                document.getElementById('shop-rubies').innerText = h.rubies;
                document.getElementById('shop-money-icon').style.cssText = `width: 24px; height: 24px; display: inline-block; margin-left: 5px; ${getUtilSpriteStyle('COIN')}`;
                document.getElementById('shop-ruby-icon').style.cssText = `width: 24px; height: 24px; display: inline-block; ${getUtilSpriteStyle('RUBY')}`;

                const shopItems = document.getElementById('shop-items'); 
                if (!shopItems) return;
                shopItems.innerHTML = '';
                
                const cartColors = this.shopCart.map(c => c.type.id);
                const discount = (h.character === 'BARD' && h.specialPowerActive) ? 1 : 0;
                const maxBuys = (h.character === 'PRINCESS' && h.specialPowerActive) ? 3 : 2;
                
                const shopDescEl = document.getElementById('shop-desc-text');
                if (shopDescEl) {
                    if (isEngineer) {
                        shopDescEl.innerText = t('shop_desc_engineer', 'Buy all tokens with no limitations — unlimited purchases, and multiple of any color!');
                    } else if (h.character === 'PRINCESS' && h.specialPowerActive) {
                        shopDescEl.innerText = t('shop_desc_princess', 'Buy up to 3 ingredients of different colors. Ruby items have no limits!');
                    } else {
                        shopDescEl.innerText = t('shop_desc', 'Buy up to 2 ingredients of different colors. Ruby items have no limits!');
                    }
                }
                
                const catalog = isEngineer ? [
                    ...SHOP_CATALOG,
                    { type: INGREDIENTS.BROWN, value: 0, cost: 2 },
                    { type: INGREDIENTS.BROWN, value: 1, cost: 4 },
                    { type: INGREDIENTS.BROWN, value: 2, cost: 8 },
                    { type: INGREDIENTS.WHITE, value: 1, cost: 3 },
                    { type: INGREDIENTS.WHITE, value: 2, cost: 6 },
                    { type: INGREDIENTS.WHITE, value: 3, cost: 9 }
                ] : SHOP_CATALOG;

                catalog.forEach(item => {
                    if (!isEngineer) {
                        if ((item.type.id === 'YELLOW' && this.game.round <= 2) || (item.type.id === 'BLUE' && this.game.round <= 3)) return;
                    }
                    
                    const el = document.createElement('div');
                    const disabled = isEngineer
                        ? h.money < item.cost
                        : (h.money < item.cost || this.shopCart.length >= maxBuys || cartColors.includes(item.type.id));
                    el.className = `shop-item ${disabled ? 'disabled' : ''}`;
                    
                    const chipStyle = getChipSpriteStyle(item.type.id, item.value);
                    
                    const book = this.game.books[item.type.id];
                    let desc = book ? book.description : "";
                    if (item.type.id === 'ORANGE') desc = t('book_orange', "Standard ingredient. Adds value to your brew but has no special effect.");
                    if (item.type.id === 'BROWN') desc = t('book_brown', "Special bug ingredient. Crawls ahead with precision.");
                    
                    el.innerHTML = `<div class="chip-icon" style="${chipStyle || `background-color: ${item.type.color};`}">${!chipStyle ? item.value : ''}</div>
                                    <div style="font-size: 0.8em; font-weight: bold;">${item.type.name}</div>
                                    <div style="font-size: 0.9em; color: gold; display: flex; align-items: center; justify-content: center;">${t('cost', 'Cost:')} ${item.cost} <span style="width: 16px; height: 16px; display: inline-block; margin-left: 4px; ${getUtilSpriteStyle('COIN')}"></span></div>
                                    <div class="tooltip">${desc}</div>`;

                    if (!disabled) el.addEventListener('click', () => { 
                        if (h.buyChip(item.type, item.value, item.cost)) { 
                            h.moneySpentThisRound = (h.moneySpentThisRound || 0) + item.cost;
                            
                            this.addLog(`<span style="color:gold">[${h.name}]</span> bought <strong style="color:${item.type.color}">${item.type.name} ${item.value}</strong> for ${item.cost} Money.`);
                            
                            if (item.type.id === 'ORANGE' && item.value === 6) {
                                this.unlockAchievement('MEGA_PUMPKIN');
                            }
                            if (h.moneySpentThisRound > 56) {
                                this.unlockAchievement('BIG_SPENDER');
                            }

                            if (this.tutorialStep === 3) this.tutorialStep = 4;
                            this.shopCart.push(item); 
                            this.renderShopUI(); 
                        } 
                    });
                    shopItems.appendChild(el);
                });

                // --- Special Ruby Upgrades ---

                // 0. Bard's Charm Power
                if (this.game.config.useCharacterPowers && h.character === 'BARD' && (!h.specialPowerUsed || h.specialPowerActive)) {
                    const bardEl = document.createElement('div');
                    bardEl.className = `shop-item ${h.specialPowerActive ? 'disabled' : ''}`;
                    bardEl.innerHTML = `
                        <div style="font-size: 2rem; display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; margin-bottom: 5px;">🪕</div>
                        <div style="font-size: 0.8em; font-weight: bold;">${t('shop_bard_title', "Bard's Charm")}</div>
                        <div style="font-size: 0.9em; color: #ff4444;">${t('cost', 'Cost:')} ${t('shop_free', 'Free')}</div>
                        <div class="tooltip">${t('shop_bard_desc', 'Charm the shopkeeper! Gain 3 Rubies immediately, and get a 1-Ruby discount on all Ruby upgrades this round. (Once per game)')}</div>
                    `;
                    if (!h.specialPowerActive) {
                        bardEl.addEventListener('click', () => {
                            h.specialPowerUsed = true;
                            h.specialPowerActive = true;
                            this.addLog(`<span style="color:gold">[${h.name}]</span> used Bard's Charm.`);
                            h.rubies += 3;
                            this.renderShopUI();
                        });
                    }
                    shopItems.appendChild(bardEl);
                }

                // 0.1 Princess's Royal Decree Power
                if (this.game.config.useCharacterPowers && h.character === 'PRINCESS' && (!h.specialPowerUsed || h.specialPowerActive)) {
                    const princessEl = document.createElement('div');
                    princessEl.className = `shop-item ${h.specialPowerActive ? 'disabled' : ''}`;
                    princessEl.innerHTML = `
                        <div style="font-size: 2rem; display: flex; align-items: center; justify-content: center; width: 35px; height: 35px; margin-bottom: 5px;">👑</div>
                        <div style="font-size: 0.8em; font-weight: bold;">${t('shop_princess_title', 'Royal Decree')}</div>
                        <div style="font-size: 0.9em; color: #ff4444;">${t('cost', 'Cost:')} ${t('shop_free', 'Free')}</div>
                        <div class="tooltip">${t('shop_princess_desc', 'Double your current money and buy up to 3 ingredients instead of 2! (Once per game)')}</div>
                    `;
                    if (!h.specialPowerActive) {
                        princessEl.addEventListener('click', () => {
                            h.specialPowerUsed = true;
                            h.specialPowerActive = true;
                            this.addLog(`<span style="color:gold">[${h.name}]</span> used Royal Decree.`);
                            h.money *= 2;
                            this.renderShopUI();
                        });
                    }
                    shopItems.appendChild(princessEl);
                }

                // 1. Droplet Upgrade
                const dropCost = Math.max(0, 2 - discount);
                const dropletEl = document.createElement('div');
                const canAffordDroplet = h.rubies >= dropCost;
                dropletEl.className = `shop-item ${!canAffordDroplet ? 'disabled' : ''}`;
                dropletEl.innerHTML = `
                    <div style="width: 25px; height: 35px; ${getUtilSpriteStyle('DROPLET')}"></div>
                    <div style="font-size: 0.8em; font-weight: bold;">${t('shop_drop_title', 'Droplet Upgrade')}</div>
                    <div style="font-size: 0.9em; color: #ff4444; display: flex; align-items: center; justify-content: center;">${t('cost', 'Cost:')} ${dropCost} <span style="width: 16px; height: 16px; display: inline-block; margin-left: 4px; ${getUtilSpriteStyle('RUBY')}"></span></div>
                    <div class="tooltip">${t('shop_drop_desc', 'Move your starting droplet forward by 1 space permanently. Can be purchased multiple times.')}</div>
                `;
                if (canAffordDroplet) {
                    dropletEl.addEventListener('click', () => {
                        h.rubies -= dropCost;
                        h.dropletPosition++;
                        this.addLog(`<span style="color:gold">[${h.name}]</span> bought Droplet Upgrade for ${dropCost} Rubies.`);
                        if (h.dropletPosition >= 18) {
                            this.unlockAchievement('STAY_HYDRATED');
                        }
                        this.renderShopUI();
                    });
                }
                shopItems.appendChild(dropletEl);

                // 2. Flask Refill
                const flaskCost = Math.max(0, 2 - discount);
                const flaskEl = document.createElement('div');
                const canAffordFlask = h.rubies >= flaskCost && !h.flaskActive;
                flaskEl.className = `shop-item ${!canAffordFlask ? 'disabled' : ''}`;
                
                const hasSpriteUtils = window.GAME_ASSETS && window.GAME_ASSETS.UTILS && window.GAME_ASSETS.UTILS.naturalWidth > 0;
                const flaskIconHtml = hasSpriteUtils 
                    ? `<div style="width: 25px; height: 35px; ${getUtilSpriteStyle(h.flaskActive ? 'FLASK_FULL' : 'FLASK_EMPTY')}"></div>`
                    : `<div style="width: 25px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; opacity: ${h.flaskActive ? 1 : 0.5};">🧪</div>`;

                flaskEl.innerHTML = `
                    ${flaskIconHtml}
                    <div style="font-size: 0.8em; font-weight: bold;">${t('shop_flask_title', 'Refill Flask')}</div>
                    <div style="font-size: 0.9em; color: #ff4444; display: flex; align-items: center; justify-content: center;">${t('cost', 'Cost:')} ${flaskCost} <span style="width: 16px; height: 16px; display: inline-block; margin-left: 4px; ${getUtilSpriteStyle('RUBY')}"></span></div>
                    <div class="tooltip">${h.flaskActive ? t('shop_flask_desc_full', 'Your flask is already full.') : t('shop_flask_desc_empty', 'Refill your empty flask so it can be used again.')}</div>
                `;
                if (canAffordFlask) {
                    flaskEl.addEventListener('click', () => {
                        h.rubies -= flaskCost;
                        h.flaskActive = true;
                        this.addLog(`<span style="color:gold">[${h.name}]</span> refilled Flask for ${flaskCost} Rubies.`);
                        this.renderShopUI();
                    });
                }
                shopItems.appendChild(flaskEl);

                // 3. View Bag
                const bagCost = Math.max(0, 1 - discount);
                const bagEl = document.createElement('div');
                const canAffordBag = h.rubies >= bagCost;
                bagEl.className = `shop-item ${!canAffordBag ? 'disabled' : ''}`;
                bagEl.innerHTML = `
                    <div style="width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; margin-bottom: 5px; ${getUtilSpriteStyle('SACK')}"></div>
                    <div style="font-size: 0.8em; font-weight: bold;">${t('shop_bag_view', 'View Bag')}</div>
                    <div style="font-size: 0.9em; color: #ff4444; display: flex; align-items: center; justify-content: center;">${t('cost', 'Cost:')} ${bagCost === 0 ? t('shop_free', 'Free') : bagCost + ' <span style="width: 16px; height: 16px; display: inline-block; margin-left: 4px; ' + getUtilSpriteStyle('RUBY') + '"></span>'}</div>
                    <div class="tooltip">${t('shop_bag_desc', 'Peek inside your bag to see all your tokens (played, unplayed, and newly purchased).')}</div>
                `;
                if (canAffordBag) {
                    bagEl.addEventListener('click', () => {
                        h.rubies -= bagCost;
                        if (bagCost > 0) this.addLog(`<span style="color:gold">[${h.name}]</span> paid ${bagCost} Ruby to view Bag.`);
                        this.renderShopUI();
                        this.showBagModal(); // Calls default, which is human player
                    });
                }
                shopItems.appendChild(bagEl);
                
                if (this.tutorialStep >= 3) {
                    // Slight delay to ensure DOM is updated and sizes exist before positioning tooltips
                    setTimeout(() => this.updateTutorialUI(), 50); 
                }
            }

            handleResize() {
                const rect = this.wrapper.getBoundingClientRect();
                this.canvas.width = rect.width; this.canvas.height = rect.height;
                this.generateSpiral();
                
                // Dynamically resize overlay buttons relative to the canvas
                const baseSize = Math.min(this.canvas.width, this.canvas.height);
                const offsetX = (this.canvas.width - baseSize) / 2;
                const offsetY = (this.canvas.height - baseSize) / 2;
                const btnSize = baseSize * 0.15;
                
                const toggleBtn = document.getElementById('btn-toggle-values');
                if (toggleBtn) {
                    toggleBtn.style.width = `${btnSize}px`;
                    toggleBtn.style.height = `${btnSize}px`;
                    toggleBtn.style.top = `${offsetY + 10}px`;
                    toggleBtn.style.left = `${offsetX + 10}px`;
                }
                
                const monocleIcon = document.getElementById('ui-monocle-icon');
                if (monocleIcon) {
                    monocleIcon.style.width = `${btnSize * 0.65}px`;
                    monocleIcon.style.height = `${btnSize * 0.65}px`;
                }
                
                const sellBtn = document.getElementById('btn-sell-potion');
                if (sellBtn) {
                    sellBtn.style.width = `${btnSize}px`;
                    sellBtn.style.height = `${btnSize}px`;
                    sellBtn.style.fontSize = `${btnSize * 0.5}px`;
                    sellBtn.style.bottom = `${offsetY + 10}px`;
                    sellBtn.style.left = `${offsetX + 10}px`;
                }

                const liveBrew = document.getElementById('ui-live-brew-value');
                if (liveBrew) {
                    liveBrew.style.bottom = `${offsetY + 10 + btnSize + 10}px`; // Place it exactly 10px above the dynamically sized sell button
                    liveBrew.style.left = `${offsetX + 10}px`;
                    liveBrew.style.fontSize = `${btnSize * 0.25}px`;
                }

                const meter = document.getElementById('ui-boomberry-meter');
                if (meter) {
                    meter.style.width = `${baseSize * 0.3}px`;
                    meter.style.height = `${btnSize * 0.45}px`; // Scaled relative to the corner buttons
                    meter.style.borderRadius = `${btnSize * 0.25}px`;
                    meter.style.top = `${offsetY + 10}px`;
                    meter.style.right = `${offsetX + 10}px`;
                }
                const meterText = document.getElementById('ui-boomberry-text');
                if (meterText) {
                    meterText.style.fontSize = `${btnSize * 0.25}px`;
                }

                const sack = document.getElementById('ui-sack');
                if (sack) {
                    sack.style.width = `${btnSize}px`;
                    sack.style.height = `${btnSize}px`;
                    sack.style.bottom = `${offsetY + 10}px`;
                    sack.style.right = `${offsetX + 10}px`;
                }
                const bagCount = document.getElementById('ui-bag-count');
                if (bagCount) {
                    bagCount.style.fontSize = `${btnSize * 0.35}px`;
                }
            }

            generateSpiral() {
                this.spiralSpaces = [];
                const w = this.canvas.width, h = this.canvas.height;
                const centerX = w / 2, centerY = h / 2;
                
                // --- TUNABLE CONSTANTS FOR THE SPIRAL ---
                const baseSize = Math.min(w, h);
                
                // Tweak these values to perfectly align with your background image:
                const spaceDist = baseSize * 0.075;     // Distance between bubbles along the path (lower = closer together)
                const armDistance = baseSize * 0.088;   // Distance between the spiral's outer rings (lower = tighter loops)
                const startRadius = baseSize * 0.03;    // Offset from exact center for the first spaces
                const angleOffset = Math.PI * -0.4;     // Rotates the entire spiral to match the image's starting angle
                // ----------------------------------------
                
                let r = startRadius; 
                let theta = 0;
                
                // Space 0 (The Droplet starting position) adjusted to the bg image
                this.spiralSpaces.push({ x: centerX + baseSize / 23, y: centerY - baseSize / 80 });

                // Archimedean spiral formula: r = a + b*theta
                const b = armDistance / (2 * Math.PI);
                
                for (let i = 1; i <= 55; i++) {
                    // Prevent divide-by-zero on the first step if startRadius is 0
                    let dTheta = spaceDist / (r === 0 ? 1 : r); 
                    theta += dTheta;
                    
                    r = startRadius + (b * theta);
                    
                    // Add angleOffset to match the rotation of the hand-drawn artwork
                    const drawAngle = theta + angleOffset;
                    
                    this.spiralSpaces.push({ 
                        x: centerX + r * Math.cos(drawAngle), 
                        y: centerY + r * Math.sin(drawAngle) 
                    });
                }
            }

            // Canvas Engine helper to extract sprite sub-images
            drawSprite(imgAsset, mapDef, dx, dy, dw, dh) {
                if(this.assets[imgAsset] && this.assets[imgAsset].complete && this.assets[imgAsset].naturalWidth > 0) {
                    const img = this.assets[imgAsset];
                    this.ctx.drawImage(img, mapDef.x * img.width, mapDef.y * img.height, mapDef.w * img.width, mapDef.h * img.height, dx, dy, dw, dh);
                    return true;
                }
                return false;
            }

            renderCanvas() {
                const w = this.canvas.width, h = this.canvas.height;
                const baseSize = Math.min(w, h); // Use baseSize for relative scaling of all elements
                
                this.ctx.clearRect(0, 0, w, h);
                this.ctx.fillStyle = '#22223b'; this.ctx.fillRect(0, 0, w, h);

                if (!this.game || !this.game.humanPlayer) return;

                const player = this.game.humanPlayer; // Renamed hPlayer to player
                const bubblingVid = document.getElementById('bubbling-video');
                const explosionVid = document.getElementById('explosion-video');
                let drawBubbling = false;
                let drawExplosion = false;
                let elementAlpha = 1.0;

                // Determine if we should draw the bubbling video or explosion video
                if (player && player.exploded) {
                    if (explosionVid && explosionVid.readyState >= 2) drawExplosion = true;
                    if (player.explodedAt) {
                        const age = Date.now() - player.explodedAt;
                        // Safe bounds to prevent Safari globalAlpha DOMExceptions
                        elementAlpha = Math.max(0, Math.min(1.0, 1.0 - (age / 1000.0))); 
                        if (isNaN(elementAlpha)) elementAlpha = 1.0;
                    }
                    if (bubblingVid && !bubblingVid.paused) bubblingVid.pause();
                } else if (player && player.currentWhiteValue > 3 && bubblingVid && bubblingVid.readyState >= 2) {
                    drawBubbling = true;
                    if (bubblingVid.paused) bubblingVid.play().catch(e => console.warn("Bubbling video play error:", e));
                } else {
                    if (bubblingVid && !bubblingVid.paused) bubblingVid.pause();
                }

                // 1. Draw Background Image or Video
                if (drawExplosion && explosionVid) {
                    const scale = Math.min(w / explosionVid.videoWidth, h / explosionVid.videoHeight);
                    const dw = explosionVid.videoWidth * scale, dh = explosionVid.videoHeight * scale;
                    this.ctx.drawImage(explosionVid, (w - dw) / 2, (h - dh) / 2, dw, dh);
                } else if (drawBubbling && bubblingVid) {
                    const scale = Math.min(w / bubblingVid.videoWidth, h / bubblingVid.videoHeight);
                    const dw = bubblingVid.videoWidth * scale, dh = bubblingVid.videoHeight * scale;
                    this.ctx.drawImage(bubblingVid, (w - dw) / 2, (h - dh) / 2, dw, dh);
                } else if (this.assets.CAULDRON_BG && this.assets.CAULDRON_BG.complete && this.assets.CAULDRON_BG.naturalWidth > 0) {
                    const img = this.assets.CAULDRON_BG;
                    const scale = Math.min(w / img.width, h / img.height); // Use Math.min to prevent cropping
                    const dw = img.width * scale, dh = img.height * scale;
                    this.ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
                } else {
                    // Fallback
                    this.ctx.beginPath(); this.ctx.arc(w/2, h/2, Math.min(w, h) * 0.48, 0, Math.PI * 2);
                    this.ctx.strokeStyle = '#4a4e69'; this.ctx.lineWidth = 10; this.ctx.stroke();
                }
                
                // Wrap rendering of state elements in save/restore to fix Safari blending quirks
                this.ctx.save(); 
                
                if (elementAlpha > 0) {
                    this.ctx.globalAlpha = elementAlpha;

                    // Define relative sizes for board elements
                    const trackPointSize = baseSize * 0.02;
                    const rubySize = baseSize * 0.055;
                    const rubyOffset = rubySize / 2;
                    const dropletSize = baseSize * 0.07;
                    const dropletOffset = dropletSize / 2;
                    const ratSize = baseSize * 0.06;
                    const ratOffset = ratSize / 2;
                    const chipSize = baseSize * 0.085;
                    const chipOffset = chipSize / 2;

                    // 2. Draw Track indicators (Debug/Fallback only, invisible if image is used)
                    if (!this.assets.CAULDRON_BG || !this.assets.CAULDRON_BG.complete) {
                        this.spiralSpaces.forEach((pos, idx) => {
                            this.ctx.beginPath(); this.ctx.arc(pos.x, pos.y, trackPointSize, 0, Math.PI * 2);
                            this.ctx.fillStyle = '#3a3f58'; this.ctx.fill();
                            if(idx % 5 === 0 && idx > 0) { this.ctx.fillStyle = '#6a6e8f'; this.ctx.font = `${trackPointSize}px Arial`; this.ctx.fillText(idx, pos.x - trackPointSize/2, pos.y - trackPointSize*1.2); }
                        });
                    }

                    // 2.5 Draw Rubies on the track spaces
                    this.spiralSpaces.forEach((pos, idx) => {
                        if (idx < TRACK_REWARDS.length && TRACK_REWARDS[idx].ruby) {
                            if (!this.drawSprite('UTILS', UTILS_MAP.RUBY, pos.x - rubyOffset, pos.y - rubyOffset, rubySize, rubySize)) {
                                // Fallback
                                this.ctx.beginPath(); this.ctx.arc(pos.x, pos.y, rubySize * 0.4, 0, Math.PI * 2);
                                this.ctx.fillStyle = '#e63946'; this.ctx.fill();
                            }
                        }
                    });

                    // 3. Draw Droplet & Rat
                    let currentDropletIndex = player.displayDropletPosition !== undefined ? player.displayDropletPosition : player.dropletPosition;
                    
                    if (this.isAnimatingDroplet) {
                        const now = Date.now();
                        const progress = Math.min(1.0, (now - this.dropletAnimStartTime) / 1000.0);
                        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
                        
                        currentDropletIndex = this.dropletAnimStartPos + (this.dropletAnimEndPos - this.dropletAnimStartPos) * ease;
                        
                        if (progress >= 1.0) {
                            this.isAnimatingDroplet = false;
                            player.displayDropletPosition = player.dropletPosition;
                            currentDropletIndex = player.dropletPosition;
                        }
                    } else {
                        if (player.displayDropletPosition === undefined) {
                            player.displayDropletPosition = player.dropletPosition;
                        }
                    }

                    const idxFloor = Math.floor(currentDropletIndex);
                    const idxCeil = Math.ceil(currentDropletIndex);
                    const tIdx = currentDropletIndex - idxFloor;

                    let dpX = 0, dpY = 0;
                    if (idxFloor === idxCeil || !this.spiralSpaces[idxCeil]) {
                        const dp = this.spiralSpaces[idxFloor] || this.spiralSpaces[this.spiralSpaces.length - 1];
                        if (dp) { dpX = dp.x; dpY = dp.y; }
                    } else {
                        const p1 = this.spiralSpaces[idxFloor];
                        const p2 = this.spiralSpaces[idxCeil];
                        dpX = p1.x + (p2.x - p1.x) * tIdx;
                        dpY = p1.y + (p2.y - p1.y) * tIdx;
                    }

                    if (dpX !== 0 && dpY !== 0) {
                        if(!this.drawSprite('UTILS', UTILS_MAP.DROPLET, dpX - dropletOffset, dpY - dropletOffset, dropletSize, dropletSize)) {
                            this.ctx.beginPath(); this.ctx.arc(dpX, dpY, dropletSize * 0.4, 0, Math.PI * 2);
                            this.ctx.fillStyle = '#00b4d8'; this.ctx.fill();
                        }
                    }

                    if(player.ratTails > 0) {
                        const ratIndex = currentDropletIndex + player.ratTails;
                        const rFloor = Math.floor(ratIndex);
                        const rCeil = Math.ceil(ratIndex);
                        const rT = ratIndex - rFloor;

                        let rpX = 0, rpY = 0;
                        if (rFloor === rCeil || !this.spiralSpaces[rCeil]) {
                            const rp = this.spiralSpaces[rFloor] || this.spiralSpaces[this.spiralSpaces.length - 1];
                            if (rp) { rpX = rp.x; rpY = rp.y; }
                        } else {
                            const p1 = this.spiralSpaces[rFloor];
                            const p2 = this.spiralSpaces[rCeil];
                            rpX = p1.x + (p2.x - p1.x) * rT;
                            rpY = p1.y + (p2.y - p1.y) * rT;
                        }

                        if (rpX !== 0 && rpY !== 0) {
                            if(!this.drawSprite('UTILS', UTILS_MAP.RAT, rpX - ratOffset, rpY - ratOffset, ratSize, ratSize)) {
                                this.ctx.font = `${ratSize * 0.6}px Arial`; this.ctx.fillText('🐀', rpX - ratOffset*0.5, rpY + ratOffset*0.5);
                            }
                        }
                    }

                    // Calculate display count (subtracting currently animating chips)
                    const displayBagCount = Math.max(0, player.bag.length - this.sackAnimations.length);
                    const bagCountEl = document.getElementById('ui-bag-count');
                    if (bagCountEl && bagCountEl.innerText !== String(displayBagCount)) {
                        bagCountEl.innerText = displayBagCount;
                    }

                    // 4. Draw Track Values (if toggled) - Moved here so chips render on top
                    if (this.showTrackValues) {
                        this.ctx.save();
                        this.ctx.globalAlpha = elementAlpha;
                        this.ctx.textBaseline = 'middle';
                        const fontSize = Math.max(10, baseSize * 0.02);
                        this.ctx.font = `bold ${fontSize}px Arial`;
                        this.ctx.textAlign = 'center';

                        this.spiralSpaces.forEach((pos, idx) => {
                            if (idx >= TRACK_REWARDS.length) return;
                            const reward = TRACK_REWARDS[idx];
                            if (reward.money === 0 && reward.vp === 0) return;

                            const hasVp = reward.vp > 0;
                            const moneyText = `${reward.money}`;
                            const vpText = `${reward.vp}`;
                            
                            const mWidth = this.ctx.measureText(moneyText).width;
                            const vpWidth = hasVp ? this.ctx.measureText(vpText).width : 0;
                            const tw = Math.max(mWidth, vpWidth) + 12;
                            const th = hasVp ? (fontSize * 2 + 10) : (fontSize + 8);
                            const rx = pos.x - tw/2;
                            const ry = pos.y - th/2;

                            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                            this.ctx.beginPath();
                            this.ctx.moveTo(rx + 6, ry);
                            this.ctx.lineTo(rx + tw - 6, ry);
                            this.ctx.quadraticCurveTo(rx + tw, ry, rx + tw, ry + 6);
                            this.ctx.lineTo(rx + tw, ry + th - 6);
                            this.ctx.quadraticCurveTo(rx + tw, ry + th, rx + tw - 6, ry + th);
                            this.ctx.lineTo(rx + 6, ry + th);
                            this.ctx.quadraticCurveTo(rx, ry + th, rx, ry + th - 6);
                            this.ctx.lineTo(rx, ry + 6);
                            this.ctx.quadraticCurveTo(rx, ry, rx + 6, ry);
                            this.ctx.fill();

                            if (hasVp) {
                                this.ctx.fillStyle = 'gold';
                                this.ctx.fillText(moneyText, pos.x, pos.y - fontSize * 0.45);
                                this.ctx.fillStyle = '#f5f5f5';
                                this.ctx.fillText(vpText, pos.x, pos.y + fontSize * 0.55);
                            } else {
                                this.ctx.fillStyle = 'gold';
                                this.ctx.fillText(moneyText, pos.x, pos.y);
                            }
                        });
                        this.ctx.restore();
                    }

                    // NEW: Draw Sack Animations
                    const offsetX = (w - baseSize) / 2;
                    const offsetY = (h - baseSize) / 2;
                    const sackSize = baseSize * 0.15;
                    const sackX = w - offsetX - sackSize - 10; // Corresponds exactly to CSS right: offsetX + 10px
                    const sackY = h - offsetY - sackSize - 10; // Corresponds exactly to CSS bottom: offsetY + 10px
                    
                    const now = Date.now();
                    this.sackAnimations = this.sackAnimations.filter(anim => {
                        const age = now - anim.startTime;
                        if (age < 0) return true; // Delayed start
                        if (age >= anim.duration) return false;

                        const progress = age / anim.duration;
                        const easeIn = progress * progress; // Accelerate downward
                        
                        const currentX = sackX + sackSize / 2;
                        const startY = -chipSize;
                        const targetY = sackY + sackSize / 2;
                        const currentY = startY + (targetY - startY) * easeIn;

                        this.ctx.globalAlpha = elementAlpha;
                        
                        const cDef = CHIP_SPRITE_MAP[`${anim.chipDef.typeId}_${anim.chipDef.value}`];
                        const imgChips = this.assets.CHIPS;
                        if (cDef && imgChips && imgChips.complete && imgChips.naturalWidth > 0) {
                            const sx = cDef.x * imgChips.width;
                            const sy = cDef.y * imgChips.height;
                            const sw = cDef.w * imgChips.width;
                            const sh = cDef.h * imgChips.height;
                            
                            this.ctx.drawImage(imgChips, sx, sy, sw, sh, currentX - chipOffset, currentY - chipOffset, chipSize, chipSize);
                        } else {
                            // Fallback circles
                            this.ctx.beginPath(); this.ctx.arc(currentX, currentY, chipSize * 0.4, 0, Math.PI*2);
                            this.ctx.fillStyle = anim.chipDef.color || '#ffffff'; this.ctx.fill();
                            this.ctx.fillStyle = anim.chipDef.textCol || '#000000'; this.ctx.font = `bold ${chipSize * 0.4}px Arial`;
                            this.ctx.fillText(anim.chipDef.value, currentX - chipSize*0.1, currentY + chipSize*0.15);
                        }
                        return true;
                    });

                    // 5. Draw Placed Chips (with Animation, Fade-In and Global Fade-Out)
                    player.cauldron.forEach(chip => {
                        const pos = this.spiralSpaces[chip.spaceIndex];
                        if (!pos) return;

                        // Animation Math
                        const animDuration = 600;
                        const age = chip.drawnAt ? Date.now() - chip.drawnAt : animDuration;
                        const progress = Math.min(1.0, Math.max(0, age / animDuration));
                        const easeOut = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
                        
                        // Start position just above the sack
                        const startX = sackX + sackSize / 2;
                        const startY = sackY - chipSize / 2;
                        
                        const currentX = startX + (pos.x - startX) * easeOut;
                        const currentY = startY + (pos.y - startY) * easeOut;

                        // Fade-in over the first 300ms
                        const chipAlpha = Math.min(1.0, Math.max(0, age / 300.0));
                        this.ctx.globalAlpha = Number((elementAlpha * chipAlpha).toFixed(3)); // Combine safely

                        const cDef = CHIP_SPRITE_MAP[`${chip.type.id}_${chip.value}`];
                        const imgChips = this.assets.CHIPS;
                        if (cDef && imgChips && imgChips.complete && imgChips.naturalWidth > 0) {
                            const sx = cDef.x * imgChips.width;
                            const sy = cDef.y * imgChips.height;
                            const sw = cDef.w * imgChips.width;
                            const sh = cDef.h * imgChips.height;
                            
                            this.ctx.drawImage(imgChips, sx, sy, sw, sh, currentX - chipOffset, currentY - chipOffset, chipSize, chipSize);
                        } else {
                            // Fallback circles
                            this.ctx.beginPath(); this.ctx.arc(currentX, currentY, chipSize * 0.4, 0, Math.PI*2);
                            this.ctx.fillStyle = chip.type.color; this.ctx.fill();
                            this.ctx.fillStyle = chip.type.textCol; this.ctx.font = `bold ${chipSize * 0.4}px Arial`;
                            this.ctx.fillText(chip.value, currentX - chipSize*0.1, currentY + chipSize*0.15);
                        }
                    });
                }
                
                this.ctx.restore(); // Safely wipe context state so Safari doesn't carry ghost alphas over
            }

            getProjectedRewards(player) {
                let projectedVP = 0;
                let projectedMoney = 0;
                let projectedRuby = 0;

                const trackSpace = TRACK_REWARDS[Math.min(player.currentBrewValue || 0, TRACK_REWARDS.length - 1)];
                projectedVP += trackSpace.vp;
                projectedMoney += trackSpace.money;
                if (trackSpace.ruby) projectedRuby += 1;

                const bookSet = this.game.config.bookSet || 1;

                if (bookSet === 1) {
                    // Project Purple (Moth) bonuses
                    const mothCount = player.cauldron.filter(c => c.type.id === 'PURPLE').length;
                    if (mothCount >= 3) projectedVP += 2;
                    else if (mothCount >= 1) projectedVP += 1;

                    // Project Black (Crow Skull) bonuses
                    const skullCount = player.cauldron.filter(c => c.type.id === 'BLACK').length;
                    if (skullCount >= 1) {
                        projectedVP += 1;
                        projectedRuby += 1;
                    }

                    // Project Green (Spider) bonuses
                    const len = player.cauldron.length;
                    if (len >= 1 && (player.cauldron[len-1].type.id === 'GREEN' || (len >= 2 && player.cauldron[len-2].type.id === 'GREEN'))) {
                        projectedRuby += 1;
                    }
                } else if (bookSet === 2) {
                    // Project Blue (Ghost) bonuses
                    const blueCount = player.cauldron.filter(c => c.type.id === 'BLUE').length;
                    projectedVP += blueCount;
                    
                    // Project Purple (Moth) bonuses
                    const mothCount = player.cauldron.filter(c => c.type.id === 'PURPLE').length;
                    if (mothCount === 1) {
                        projectedVP += 1;
                    } else if (mothCount === 2) {
                        projectedVP += 1;
                        projectedRuby += 1;
                    } else if (mothCount >= 3) {
                        projectedVP += 2;
                        projectedRuby += 1;
                    }
                } else if (bookSet === 3) {
                    // Project Green (Spider) track-jumping bonus!
                    if (player.currentWhiteValue === 7) {
                        const greenSum = player.cauldron.filter(c => c.type.id === 'GREEN').reduce((acc, c) => acc + c.value, 0);
                        if (greenSum > 0) {
                            const projBrew = (player.currentBrewValue || 0) + greenSum;
                            const newTrack = TRACK_REWARDS[Math.min(projBrew, TRACK_REWARDS.length - 1)];
                            projectedVP = newTrack.vp;
                            projectedMoney = newTrack.money;
                            projectedRuby = newTrack.ruby ? 1 : 0;
                        }
                    }
                } else if (bookSet === 4) {
                    // Project Green (Spider) pair bonuses and unexploded ruby
                    const greenCount = player.cauldron.filter(c => c.type.id === 'GREEN').length;
                    const greenPairs = Math.floor(greenCount / 2);
                    projectedVP += greenPairs;
                    if (!player.exploded && greenCount > 0) {
                        projectedRuby += 1;
                    }

                    // Project Purple (Moth) bonuses
                    const mothCount = player.cauldron.filter(c => c.type.id === 'PURPLE').length;
                    if (mothCount === 1) {
                        projectedRuby += 1;
                    } else if (mothCount === 2) {
                        projectedRuby += 1;
                        projectedVP += 1;
                    } else if (mothCount >= 3) {
                        projectedRuby += 2;
                        projectedVP += 2;
                    }

                    // Project Black (Crow Skull) bonuses
                    const blackCount = player.cauldron.filter(c => c.type.id === 'BLACK').length;
                    if (blackCount > 0) {
                        let maxOtherBlack = 0;
                        this.game.players.forEach(other => {
                            if (other !== player) {
                                const cnt = other.cauldron.filter(c => c.type.id === 'BLACK').length;
                                if (cnt > maxOtherBlack) maxOtherBlack = cnt;
                            }
                        });
                        if (blackCount > maxOtherBlack) {
                            projectedVP += 1;
                        } else if (blackCount === maxOtherBlack) {
                            projectedRuby += 1;
                        }
                    }
                }

                return { vp: projectedVP, money: projectedMoney, rubies: projectedRuby };
            }

            updateFullUI() {
                const human = this.game.humanPlayer;
                if (!human) return;

                // Check Kaboom Achievement
                if (human.exploded && human.currentWhiteValue >= 15) {
                    this.unlockAchievement('KABOOM');
                }

                // Check Stay Hydrated Achievement
                if (human.dropletPosition >= 18) {
                    this.unlockAchievement('STAY_HYDRATED');
                }

                // Check Webmaster Achievement
                if (human.hasStopped && !human.exploded) {
                    const greenCount = human.cauldron.filter(c => c.type.id === 'GREEN').length;
                    if (greenCount >= 12) {
                        this.unlockAchievement('WEBMASTER');
                    }
                }

                // Hide the explosion video when we reset for a new round
                const explVid = document.getElementById('explosion-video');
                if (!human.exploded && !explVid.paused) {
                    explVid.pause();
                    explVid.currentTime = 0;
                }

                // Update human character face box based on their mood
                const humanMood = getPlayerMood(human);
                const humanFaceEl = document.getElementById('ui-human-face');
                if (humanFaceEl) {
                    humanFaceEl.style.cssText = `width: 70px; height: 90px; border-radius: 8px; border: 2px solid var(--panel-border); background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 3rem; ${getCharacterSpriteStyle(human.character, humanMood)}`;
                    humanFaceEl.innerHTML = (window.GAME_ASSETS && window.GAME_ASSETS.CHARACTERS && window.GAME_ASSETS.CHARACTERS.naturalWidth > 0 && human.character !== 'ENGINEER') ? '' : getCharacterFallbackEmoji(human.character);
                }

                const phaseEl = document.getElementById('ui-phase');
                if (phaseEl) phaseEl.innerText = `(${t('ui_phase_prefix', 'Phase:')} ${t('phase_' + this.game.phase.toLowerCase(), this.game.phase)})`;
                
                const roundEl = document.getElementById('ui-round');
                if (roundEl) roundEl.innerText = this.game.round;
                
                const fortuneEl = document.getElementById('ui-fortune-text');
                if (fortuneEl) {
                    if (this.game.currentFortuneCard) {
                        fortuneEl.innerText = `"${this.game.currentFortuneCard.text}"`;
                    } else {
                        fortuneEl.innerText = t('msg_tut_fortune', "The cards are quiet for now...");
                    }
                }

                const humanRewards = this.getProjectedRewards(human);

                const liveBrewEl = document.getElementById('ui-live-brew-value');
                if (liveBrewEl) {
                    if (human.exploded || human.hasStopped) {
                        liveBrewEl.style.opacity = '0';
                    } else {
                        liveBrewEl.style.opacity = '1';
                        let brewHtml = ``;
                        if (humanRewards.vp > 0) {
                            brewHtml += `<strong style="color: #f5f5f5;">${humanRewards.vp}</strong><span style="width: 1.2em; height: 1.2em; display: inline-block; margin-left: 2px; margin-right: 6px; ${getUtilSpriteStyle('VP')}"></span>`;
                        }
                        brewHtml += `<strong style="color: gold;">${humanRewards.money}</strong><span style="width: 1.2em; height: 1.2em; display: inline-block; margin-left: 2px; margin-right: 6px; ${getUtilSpriteStyle('COIN')}"></span>`;
                        if (humanRewards.rubies > 0) {
                            if (humanRewards.rubies > 1) {
                                brewHtml += `<strong style="color: #ff4444;">${humanRewards.rubies}</strong>`;
                            }
                            brewHtml += `<span style="width: 1.2em; height: 1.2em; display: inline-block; margin-left: 2px; ${getUtilSpriteStyle('RUBY')}"></span>`;
                        }
                        liveBrewEl.innerHTML = brewHtml;
                    }
                }

                const sellBtn = document.getElementById('btn-sell-potion');
                if (sellBtn) {
                    sellBtn.disabled = human.exploded || human.hasStopped || this.tutorialStep === 1 || this.tutorialStep === 1.5;
                    
                    // Bonus Die Indicator Logic (Glow the sell button)
                    const nonExploded = this.game.players.filter(p => !p.exploded);
                    let eligibleForDie = false;
                    if (!human.exploded && nonExploded.length > 0) {
                        const maxBrew = Math.max(...nonExploded.map(p => p.currentBrewValue || 0));
                        if ((human.currentBrewValue || 0) === maxBrew) {
                            eligibleForDie = true;
                        }
                    }

                    if (eligibleForDie && !sellBtn.disabled) {
                        sellBtn.style.boxShadow = '0 0 15px gold, inset 0 0 5px gold';
                        sellBtn.style.borderColor = 'gold';
                        sellBtn.title = t('tooltip_sell_winning', "Sell Potion (Currently winning Bonus Die!)");
                    } else {
                        sellBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
                        sellBtn.style.borderColor = '#4a4e69';
                        sellBtn.title = t('tooltip_sell', "Sell Potion");
                    }
                }

                // Boomberry Progress Bar Updates
                const maxThreshold = this.game.config.explosionThreshold + (human.explosionLimitOffset || 0);
                const currentWhite = human.currentWhiteValue;
                const fillPercent = Math.min(100, (currentWhite / maxThreshold) * 100);
                
                const meterFill = document.getElementById('ui-boomberry-fill');
                const meterText = document.getElementById('ui-boomberry-text');
                
                if (meterFill && meterText) {
                    meterFill.style.width = `${fillPercent}%`;
                    meterText.innerText = `${currentWhite} / ${maxThreshold}`;
                    
                    // Transition bar color based on danger level
                    if (currentWhite > maxThreshold) {
                        meterFill.style.backgroundColor = '#ff4444'; // Red (Exploded)
                    } else if (currentWhite >= maxThreshold - 2) {
                        meterFill.style.backgroundColor = '#ffbb33'; // Orange/Yellow (Danger)
                    } else {
                        meterFill.style.backgroundColor = '#ffffff'; // White (Safe)
                    }
                }

                const canDraw = !human.exploded && !human.hasStopped && human.bag.length > 0;
                
                const sackEl = document.getElementById('ui-sack');
                if (sackEl) {
                    sackEl.style.cursor = canDraw ? 'pointer' : 'default';
                    document.getElementById('ui-sack-icon').style.cssText = `width: 100%; height: 100%; pointer-events: none; ${getUtilSpriteStyle('SACK')}`;
                }

                const flaskIconEl = document.getElementById('ui-flask-icon');
                const lastChip = human.cauldron[human.cauldron.length - 1];
                const canFlask = human.flaskActive && !human.exploded && !human.hasStopped && human.cauldron.length > 0 && lastChip && lastChip.type.id === 'WHITE';
                
                if (flaskIconEl) {
                    let flipDeg = human.flaskActive ? '0deg' : '180deg';
                    let transformStyle = `transform: rotateY(${flipDeg})${canFlask ? ' scale(1.05)' : ''};`;
                    let filterStyle = canFlask ? 'filter: drop-shadow(0 0 8px #00b4d8);' : '';
                    
                    const hasSprite = window.GAME_ASSETS && window.GAME_ASSETS.UTILS && window.GAME_ASSETS.UTILS.naturalWidth > 0;
                    
                    if (hasSprite) {
                        flaskIconEl.style.cssText = `width: 60px; height: 70px; cursor: ${canFlask ? 'pointer' : 'default'}; transition: transform 0.4s ease, filter 0.2s ease; ${transformStyle} ${filterStyle} ${getUtilSpriteStyle(human.flaskActive ? 'FLASK_FULL' : 'FLASK_EMPTY')}`;
                        flaskIconEl.innerText = '';
                    } else {
                        flaskIconEl.style.cssText = `width: 60px; height: 70px; cursor: ${canFlask ? 'pointer' : 'default'}; transition: transform 0.4s ease, filter 0.2s ease; ${transformStyle} ${filterStyle} display: flex; align-items: center; justify-content: center; font-size: 2.5rem; opacity: ${human.flaskActive ? 1 : 0.5};`;
                        flaskIconEl.innerText = '🧪';
                    }
                    
                    flaskIconEl.title = canFlask ? t('msg_flask_ready', "Click to use Flask and return the last Boomberry to your bag!") : (!human.flaskActive ? t('msg_flask_empty', "Flask is empty.") : t('msg_flask_invalid', "Can only be used immediately after drawing a Boomberry."));
                }
                
                // Meditation Button Logic (Monk)
                const medBtn = document.getElementById('btn-meditation');
                if (medBtn) {
                    if (this.game.config.useCharacterPowers && human.character === 'MONK' && !human.specialPowerUsed && !human.hasStopped && !human.exploded && this.game.phase === 'Brewing') {
                        medBtn.style.display = 'block';
                    } else {
                        medBtn.style.display = 'none';
                    }
                }

                // Miracle Gro Button Logic (Gardener)
                const mgBtn = document.getElementById('btn-miracle-gro');
                const mgIcon = document.getElementById('ui-miracle-gro-icon');
                if (mgBtn && mgIcon) {
                    if (this.game.config.useCharacterPowers && human.character === 'GARDENER' && !human.specialPowerUsed && !human.hasStopped && !human.exploded && this.game.phase === 'Brewing') {
                        mgBtn.style.display = 'block';
                        if (this.assets.UTILS_EXP && this.assets.UTILS_EXP.naturalWidth > 0) {
                            mgIcon.style.cssText = `width: 100%; height: 100%; ${getUtilExpSpriteStyle('WATERING_CAN')}`;
                            mgIcon.innerText = '';
                        } else {
                            mgIcon.style.cssText = `width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;`;
                            mgIcon.innerText = '💧';
                        }
                    } else {
                        mgBtn.style.display = 'none';
                    }
                }

                // Sugar Rush Button Logic (Child)
                const srBtn = document.getElementById('btn-sugar-rush');
                const srIcon = document.getElementById('ui-sugar-rush-icon');
                if (srBtn && srIcon) {
                    if (this.game.config.useCharacterPowers && human.character === 'CHILD' && !human.specialPowerUsed && !human.hasStopped && !human.exploded && this.game.phase === 'Brewing') {
                        srBtn.style.display = 'block';
                        if (this.assets.UTILS_EXP && this.assets.UTILS_EXP.naturalWidth > 0) {
                            srIcon.style.cssText = `width: 100%; height: 100%; ${getUtilExpSpriteStyle('LOLLIPOP')}`;
                            srIcon.innerText = '';
                        } else {
                            srIcon.style.cssText = `width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;`;
                            srIcon.innerText = '🍭';
                        }
                    } else {
                        srBtn.style.display = 'none';
                    }
                }

                // Voodoo Sacrifice Button Logic (Voodoo Lady)
                const vsBtn = document.getElementById('btn-voodoo-sac');
                const vsIcon = document.getElementById('ui-voodoo-sac-icon');
                if (vsBtn && vsIcon) {
                    if (this.game.config.useCharacterPowers && human.character === 'VOODOO_LADY' && !human.specialPowerUsed && !human.hasStopped && !human.exploded && this.game.phase === 'Brewing') {
                        vsBtn.style.display = 'block';
                        
                        const hasValidNonWhite = human.bag.some(item => item.type.id !== 'WHITE' && item.value > 1);
                        vsBtn.disabled = !hasValidNonWhite;
                        vsBtn.style.opacity = hasValidNonWhite ? '1' : '0.5';
                        vsBtn.style.cursor = hasValidNonWhite ? 'pointer' : 'not-allowed';

                        if (this.assets.UTILS_EXP && this.assets.UTILS_EXP.naturalWidth > 0) {
                            vsIcon.style.cssText = `width: 100%; height: 100%; ${getUtilExpSpriteStyle('SKULL')}`;
                            vsIcon.innerText = '';
                        } else {
                            vsIcon.style.cssText = `width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;`;
                            vsIcon.innerText = '💀';
                        }
                    } else {
                        vsBtn.style.display = 'none';
                    }
                }

                // Phantom Clone Button Logic (Wizard)
                const pcBtn = document.getElementById('btn-phantom-clone');
                const pcIcon = document.getElementById('ui-phantom-clone-icon');
                if (this.game.config.useCharacterPowers && human.character === 'WIZARD' && !human.specialPowerUsed && !human.hasStopped && !human.exploded && this.game.phase === 'Brewing') {
                    pcBtn.style.display = 'block';
                    
                    const hasTokens = human.cauldron.length > 0;
                    pcBtn.disabled = !hasTokens;
                    pcBtn.style.opacity = hasTokens ? '1' : '0.5';
                    pcBtn.style.cursor = hasTokens ? 'pointer' : 'not-allowed';

                    if (this.assets.UTILS_EXP && this.assets.UTILS_EXP.naturalWidth > 0) {
                        pcIcon.style.cssText = `width: 100%; height: 100%; ${getUtilExpSpriteStyle('WIZARD_HAT')}`;
                        pcIcon.innerText = '';
                    } else {
                        pcIcon.style.cssText = `width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;`;
                        pcIcon.innerText = '🧙‍♂️';
                    }
                } else {
                    pcBtn.style.display = 'none';
                }

                const playerListEl = document.getElementById('player-list'); 
                if (playerListEl) {
                    // FLIP Animation: 1. Record old positions
                    const oldPositions = {};
                    Array.from(playerListEl.children).forEach(card => {
                        const id = card.getAttribute('data-player-id');
                        if (id) oldPositions[id] = card.getBoundingClientRect().top;
                    });

                    playerListEl.innerHTML = ''; 
                    
                    // Use cached order instead of sorting dynamically, so cards don't jump around mid-round
                    if (this.displayPlayers.length === 0 && this.game.players.length > 0) {
                        this.sortPlayers();
                    }
                    const sortedPlayers = this.displayPlayers;
                    
                    sortedPlayers.forEach(player => {
                        const status = player.exploded ? t('status_exploded', "EXPLODED!") : (player.hasStopped ? t('status_finished', "Finished") : t('status_brewing', "Brewing..."));
                        const card = document.createElement('div'); card.className = 'player-card';
                        card.setAttribute('data-player-id', player.character);
                        
                        const pRewards = this.getProjectedRewards(player);
                        
                        // Apply AI Explosion Choices to displayed rewards (only zeroing the track rewards, not token bonuses!)
                        if (!player.isHuman && player.exploded) {
                            const witchPowerAvailable = this.game.config.useCharacterPowers && player.character === 'WITCH' && !player.specialPowerUsed;
                            if (!witchPowerAvailable) {
                                const trackSpace = TRACK_REWARDS[Math.min(player.currentBrewValue || 0, TRACK_REWARDS.length - 1)];
                                if (this.game.round > 6) {
                                    pRewards.money -= trackSpace.money; // AI gives up track money late game
                                } else {
                                    pRewards.vp -= trackSpace.vp; // AI gives up track VP early game
                                }
                            }
                        }

                        const pMood = getPlayerMood(player);
                        const pFaceStyle = getCharacterSpriteStyle(player.character, pMood);
                        const emojiStr = (window.GAME_ASSETS && window.GAME_ASSETS.CHARACTERS && window.GAME_ASSETS.CHARACTERS.naturalWidth > 0 && player.character !== 'ENGINEER') ? '' : getCharacterFallbackEmoji(player.character);
                        
                        const isRTL = document.documentElement.dir === 'rtl';
                        let brewHtml = `<div style="margin: 4px 0;">
                            <div style="font-size: 0.85em; color: #ccc;">${t('ui_brew_value', 'Brew Value:')}</div>
                            <div dir="ltr" style="display: flex; align-items: center; flex-wrap: wrap; margin-top: 2px; justify-content: ${isRTL ? 'flex-end' : 'flex-start'};">`;
                        if (pRewards.vp > 0) {
                            brewHtml += `<span style="color: #f5f5f5;">${pRewards.vp}</span><span style="width: 16px; height: 16px; display: inline-block; margin-left: 2px; margin-right: 5px; ${getUtilSpriteStyle('VP')}"></span>`;
                        }
                        brewHtml += `<strong style="color: gold; margin-left: ${pRewards.vp > 0 ? '4px' : '0px'};">${pRewards.money}</strong><span style="width: 16px; height: 16px; display: inline-block; margin-left: 2px; margin-right: 5px; ${getUtilSpriteStyle('COIN')}"></span>`;
                        if (pRewards.rubies > 0) {
                            if (pRewards.rubies > 1) {
                                brewHtml += `<span style="color: #ff4444; margin-left: 4px;">${pRewards.rubies}</span>`;
                            }
                            brewHtml += `<span style="width: 16px; height: 16px; display: inline-block; margin-left: 2px; margin-right: 0; ${getUtilSpriteStyle('RUBY')}"></span>`;
                        }
                        brewHtml += `</div></div>`;

                        const hasSprite = window.GAME_ASSETS && window.GAME_ASSETS.UTILS && window.GAME_ASSETS.UTILS.naturalWidth > 0;
                        const vpIconHtml = hasSprite 
                            ? `<div style="width: 48px; height: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.4rem; font-weight: bold; color: #fff; text-shadow: 1px 1px 3px #000, -1px -1px 3px #000, 1px -1px 3px #000, -1px 1px 3px #000; ${getUtilSpriteStyle('VP')}" title="${t('vp', 'VP')}">${player.victoryPoints}</div>`
                            : `<div style="width: 48px; height: 48px; border-radius: 50%; background-color: #4a4e69; border: 2px solid gold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1.2rem; font-weight: bold; color: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.5);" title="${t('vp', 'VP')}">${player.victoryPoints}</div>`;

                        let rubiesHtml = '';
                        if (player.rubies >= 4) {
                            rubiesHtml = `<strong style="color: #ff4444; font-size: 0.9em; margin-right: 3px;">${player.rubies}</strong><span style="width: 16px; height: 16px; display: inline-block; ${getUtilSpriteStyle('RUBY')}"></span>`;
                        } else {
                            for (let i = 0; i < player.rubies; i++) {
                                rubiesHtml += `<span style="width: 16px; height: 16px; display: inline-block; margin: 0 1px; ${getUtilSpriteStyle('RUBY')}"></span>`;
                            }
                        }

                        card.innerHTML = `
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <div style="width: 70px; height: 90px; border-radius: 6px; border: 2px solid ${player.isHuman ? 'gold' : '#aaa'}; flex-shrink: 0; background-color: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; font-size: 3rem; overflow: hidden; ${pFaceStyle}">${emojiStr}</div>
                                <div style="flex: 1; min-width: 0;">
                                    <strong style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${player.name}</strong>
                                    <div style="font-size: 0.9em; margin-top: 5px;">
                                        ${brewHtml}
                                        <div style="color: ${player.exploded ? '#ff4444' : '#aaaaaa'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${status}</div>
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; flex-shrink: 0; min-width: 48px;">
                                    ${vpIconHtml}
                                    <div dir="ltr" style="display: flex; align-items: center; justify-content: center; min-height: 16px;" title="${player.rubies} ${t('ruby_plural', 'Rubies')}">
                                        ${rubiesHtml}
                                    </div>
                                </div>
                            </div>`;
                        
                        if (this.isDebug) {
                            card.style.cursor = 'pointer';
                            card.title = t('msg_debug_bag', "Shift-click to peek at bag (Debug)");
                            card.addEventListener('click', (e) => {
                                if (e.shiftKey) {
                                    this.showBagModal(player);
                                }
                            });
                        }

                        playerListEl.appendChild(card);
                    });

                    // FLIP Animation: 2. Apply transforms
                    requestAnimationFrame(() => {
                        Array.from(playerListEl.children).forEach(card => {
                            const id = card.getAttribute('data-player-id');
                            if (oldPositions[id] !== undefined) {
                                const newTop = card.getBoundingClientRect().top;
                                const deltaY = oldPositions[id] - newTop;
                                
                                if (deltaY !== 0) {
                                    // Invert: instantly move it back to where it was
                                    card.style.transform = `translateY(${deltaY}px)`;
                                    card.style.transition = 'none';
                                    
                                    // Trigger browser reflow
                                    void card.offsetHeight;
                                    
                                    // Play: smoothly slide it to its new natural position
                                    card.style.transform = '';
                                    card.style.transition = 'transform 0.5s ease-in-out';
                                }
                            }
                        });
                    });
                }
            }
        }
