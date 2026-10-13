/**
 * GAME LOGIC & STATE
 */
class QuacksPlayer {
    constructor(name, isHuman, game, charName = 'CHILD') {
        this.name = name; this.isHuman = isHuman; this.game = game;
        this.character = charName;
        this.victoryPoints = 0; this.rubies = 0; this.money = 0;
        this.flaskActive = true; this.dropletPosition = 0; this.ratTails = 0;
        this.displayDropletPosition = 0;
        this.inventory = []; this.bag = []; this.cauldron = [];
        
        // Explicitly initialize round states here to prevent UI errors on first load
        this.currentBrewValue = 0;
        this.currentWhiteValue = 0;
        this.exploded = false;
        this.explodedAt = null;
        this.hasStopped = false;
        this.specialPowerUsed = false;
        this.specialPowerActive = false;
        this.explosionLimitOffset = 0;
        this.moneySpentThisRound = 0;

        const startChips = [
            { type: INGREDIENTS.WHITE, value: 1 }, { type: INGREDIENTS.WHITE, value: 1 },
            { type: INGREDIENTS.WHITE, value: 1 }, { type: INGREDIENTS.WHITE, value: 1 },
            { type: INGREDIENTS.WHITE, value: 2 }, { type: INGREDIENTS.WHITE, value: 2 },
            { type: INGREDIENTS.WHITE, value: 3 }, { type: INGREDIENTS.ORANGE, value: 1 },
            { type: INGREDIENTS.GREEN, value: 1 }
        ];
        this.inventory = startChips.map(c => ({ ...c }));
    }

    prepareForNewRound() {
        this.bag = [...this.inventory]; this.cauldron = []; this.exploded = false;
        this.explodedAt = null;
        this.specialPowerActive = false;
        this.explosionLimitOffset = 0;
        this.consecutiveBlueCount = 0;
        this.currentBrewValue = this.dropletPosition + this.ratTails;
        this.currentWhiteValue = 0; this.hasStopped = false;
        this.moneySpentThisRound = 0;
    }

    buyChip(t, v, cost) {
        if (this.money >= cost) { this.money -= cost; this.inventory.push({ type: t, value: v }); return true; } return false;
    }

    drawChip(forcedIndex) {
        forcedIndex = forcedIndex !== undefined ? forcedIndex : null;
        if (this.hasStopped || this.exploded || this.bag.length === 0) return;

        const drawIndex = forcedIndex !== null ? forcedIndex : Math.floor(Math.random() * this.bag.length);
        const chip = this.bag.splice(drawIndex, 1)[0];
        
        const newPosition = this.currentBrewValue + chip.value;
        // Add timestamp for fade animation
        const placedChip = { ...chip, spaceIndex: newPosition, drawnAt: Date.now() };

        this.cauldron.push(placedChip);
        this.currentBrewValue = newPosition;
        
        if (chip.type.id === 'BLUE') {
            this.consecutiveBlueCount = (this.consecutiveBlueCount || 0) + 1;
            if (this.isHuman && this.consecutiveBlueCount >= 4 && !this.exploded && this.game.uiManager) {
                this.game.uiManager.unlockAchievement('SEANCE_MASTER');
            }
        } else {
            this.consecutiveBlueCount = 0;
        }

        if (chip.type.id === 'WHITE') this.currentWhiteValue += chip.value;

        if (this.game.uiManager) {
            this.game.uiManager.addLog(`<span style="color:${this.isHuman ? 'gold' : '#ccc'}">[${this.name}]</span> drew <strong style="color:${chip.type.color}">${chip.type.name} ${chip.value}</strong>`);
        }

        const book = this.game.books[chip.type.id];
        if (book && book.immediate) book.immediate(this, placedChip);

        const currentThreshold = this.game.config.explosionThreshold + (this.explosionLimitOffset || 0);
        if (this.currentWhiteValue > currentThreshold) { 
            this.exploded = true; 
            this.explodedAt = Date.now();
            this.hasStopped = true; 
            if (this.game.uiManager) {
                this.game.uiManager.addLog(`<span style="color:#ff4444; font-weight:bold;">💥 [${this.name}] exploded!</span>`);
            }
        } else if (this.bag.length === 0) {
            this.hasStopped = true; // Automatically stop if the bag is empty
        }
    }

    useFlask() {
        if (!this.flaskActive || this.cauldron.length === 0 || this.exploded || this.hasStopped) return false;
        const lastChip = this.cauldron[this.cauldron.length - 1];
        if (lastChip.type.id !== 'WHITE') return false;

        this.cauldron.pop();
        this.currentBrewValue -= lastChip.value; this.currentWhiteValue -= lastChip.value;
        this.bag.push({ type: lastChip.type, value: lastChip.value });
        this.flaskActive = false; 
        
        if (this.game.uiManager) {
            this.game.uiManager.addLog(`<span style="color:${this.isHuman ? 'gold' : '#ccc'}">[${this.name}]</span> used the flask.`);
        }
        
        return true;
    }

    getExplosionProbability(explosionThreshold) {
        if (this.bag.length === 0) return 0;
        const deadlyChips = this.bag.filter(c => c.type.id === 'WHITE' && (this.currentWhiteValue + c.value > explosionThreshold)).length;
        return deadlyChips / this.bag.length;
    }
}

class GameController {
    constructor(config) {
        this.config = { totalRounds: 9, numAIs: 2, explosionThreshold: 7, bookSet: 1, orangeExtraSpace: false, useCharacterPowers: false, ...config };
        this.round = 1; this.phase = 'Brewing'; this.players = []; 
        this.books = this.config.bookSet === 4 ? INGREDIENT_BOOKS_SET_4 : (this.config.bookSet === 3 ? INGREDIENT_BOOKS_SET_3 : (this.config.bookSet === 2 ? INGREDIENT_BOOKS_SET_2 : INGREDIENT_BOOKS_SET_1));
    }

    setupPlayers(humanCharName) {
        humanCharName = humanCharName || 'WITCH';
        this.players = []; // Reset players list
        this.humanPlayer = new QuacksPlayer(t('ui_you', 'You'), true, this, humanCharName);
        this.players.push(this.humanPlayer);
        
        const allChars = ['WITCH', 'WIZARD', 'MONK', 'CHILD', 'PRINCESS', 'VOODOO_LADY', 'BARD', 'GARDENER'];
        const availableChars = allChars.filter(c => c !== humanCharName);
        
        // Randomly shuffle available characters for AIs
        for (let i = availableChars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableChars[i], availableChars[j]] = [availableChars[j], availableChars[i]];
        }
        
        for(let i=1; i<=this.config.numAIs; i++) {
            const charId = availableChars[i-1];
            const charNameKey = 'char_' + charId.toLowerCase();
            const fallbackName = charId.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ');
            
            const localizedCharName = typeof t === 'function' ? t(charNameKey, fallbackName) : fallbackName;
            
            this.players.push(new QuacksPlayer(`${localizedCharName}`, false, this, charId));
        }

        // Apply character powers if enabled
        if (this.config.useCharacterPowers) {
            this.players.forEach(p => {
                const power = CHARACTER_POWERS[p.character];
                if (power && power.applyStart) {
                    power.applyStart(p);
                }
            });
        }
    }

    startGame() { this.round = 1; this.startRound(); }

    startRound() {
        this.phase = 'Brewing';
        this.config.explosionThreshold = 7; // Reset threshold in case it was altered
        this.config.orangeExtraSpace = false; // Reset the extra space flag
        
        if (this.uiManager) {
            this.uiManager.addLog(`<div style="margin-top: 15px; padding-bottom: 2px; border-bottom: 1px solid #4a4e69; color: var(--accent); font-weight: bold; text-transform: uppercase;">Day ${this.round} of ${this.config.totalRounds}</div>`);
        }

        // Day 6 specific rule: Everyone gets a new White-1 token before the round begins
        if (this.round === 6) {
            this.players.forEach(p => {
                p.inventory.push({ type: INGREDIENTS.WHITE, value: 1 });
                if (p.isHuman && this.uiManager) {
                    this.uiManager.queueSackAnimation({ typeId: 'WHITE', value: 1, color: '#ffffff', textCol: '#000000' });
                }
            });
        }

        const forceHelp = window.location.href.includes('help=1');
        const hasSeenHelp = getCookie('hasSeenHelp');
        const isTutorial = (this.round === 1) && (forceHelp || !hasSeenHelp);

        if (!isTutorial) {
            this.currentFortuneCard = FORTUNE_CARDS[Math.floor(Math.random() * FORTUNE_CARDS.length)];
            if (this.uiManager) this.uiManager.addLog(`🎴 Fortune Card: "${this.currentFortuneCard.text}"`);
            if (this.currentFortuneCard.type === 'immediate') this.currentFortuneCard.apply(this);
        } else {
            this.currentFortuneCard = null;
        }

        const maxVp = Math.max(...this.players.map(p => p.victoryPoints));
        this.players.forEach(p => {
            p.ratTails = p.victoryPoints === maxVp ? 0 : VP_RAT_SPACES.filter(s => s > p.victoryPoints && s <= maxVp).length;
            
            if (p.ratTails > 0 && this.uiManager) {
                this.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received ${p.ratTails} Rat Tails.`);
            }

            p.prepareForNewRound();
            
            if (p.isHuman && p.ratTails >= 20 && this.uiManager) {
                this.uiManager.unlockAchievement('RAT_VICHYSSOISE');
            }
        });

        if(this.uiManager) {
            this.uiManager.sortPlayers();
            this.uiManager.updateFullUI();
            if (this.round > 1 || this.uiManager.hasPlayedStartAnimation) {
                this.uiManager.playQueuedSackAnimations();
                this.uiManager.playDropletAnimation();
            }
        }

        // Start AI loops
        this.players.filter(p => !p.isHuman).forEach(p => {
            this.runAIBrewing(p);
        });
    }
    
    async runAIBrewing(p) {
        const riskThresholds = {
            'WIZARD': 0.25,
            'WITCH': 0.25,
            'MONK': 0.1,
            'PRINCESS': 0.1,
            'CHILD': 0.5,
            'GARDENER': 0.5,
            'BARD': 0.3,
            'VOODOO_LADY': 0.3
        };

        // AI Gardener Power Logic
        if (this.config.useCharacterPowers && p.character === 'GARDENER' && !p.specialPowerUsed && this.phase === 'Brewing') {
            p.specialPowerUsed = true;
            if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> used Miracle Grow.`);
            let upgradedColors = [];
            const plantTypes = ['ORANGE', 'RED', 'YELLOW']; // AI NEVER upgrades WHITE
            const upgradeMap = { 'ORANGE_1': 6, 'RED_1': 2, 'RED_2': 4, 'YELLOW_1': 2, 'YELLOW_2': 4 };
            
            // Sort by value ascending so AI upgrades lowest value chips first
            const plants = p.inventory.filter(item => plantTypes.includes(item.type.id)).sort((a, b) => a.value - b.value);
            for (let item of plants) {
                if (upgradedColors.length >= 2) break;
                const key = `${item.type.id}_${item.value}`;
                if (upgradeMap[key] && !upgradedColors.includes(item.type.id)) {
                    if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> upgraded <strong style="color:${item.type.color}">${item.type.name} ${item.value}</strong> to <strong style="color:${item.type.color}">${item.type.name} ${upgradeMap[key]}</strong>`);
                    item.value = upgradeMap[key];
                    upgradedColors.push(item.type.id);
                }
            }
        }
        
        // AI Voodoo Lady Power Logic
        if (this.config.useCharacterPowers && p.character === 'VOODOO_LADY' && !p.specialPowerUsed && this.phase === 'Brewing') {
            // Try to aggressively sacrifice highest white possible
            const bagWhites = p.bag.filter(c => c.type.id === 'WHITE').sort((a,b) => b.value - a.value);
            for (let w of bagWhites) {
                const neededVal = w.value * 2;
                const nwToken = p.bag.find(c => c.type.id !== 'WHITE' && c.value === neededVal);
                if (nwToken) {
                    p.specialPowerUsed = true;
                    if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> used Voodoo Sacrifice, discarding <strong style="color:${w.type.color}">${w.type.name} ${w.value}</strong> and <strong style="color:${nwToken.type.color}">${nwToken.type.name} ${nwToken.value}</strong>.`);
                    p.bag.splice(p.bag.indexOf(w), 1);
                    p.bag.splice(p.bag.indexOf(nwToken), 1);
                    p.inventory.splice(p.inventory.indexOf(w), 1);
                    p.inventory.splice(p.inventory.indexOf(nwToken), 1);
                    break;
                }
            }
        }

        // AI Wizard Power Logic
        if (this.config.useCharacterPowers && p.character === 'WIZARD' && !p.specialPowerUsed && this.phase === 'Brewing') {
            if (p.cauldron.length > 0) {
                const lastChip = p.cauldron[p.cauldron.length - 1];
                if (lastChip.type.id !== 'WHITE' && lastChip.value >= 2) {
                    p.specialPowerUsed = true;
                    if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> used Phantom Clone.`);
                    // Clone 1
                    let np = p.currentBrewValue + lastChip.value;
                    let clone1 = { ...lastChip, spaceIndex: np, drawnAt: Date.now() };
                    p.cauldron.push(clone1);
                    p.currentBrewValue = np;
                    let book = this.books[clone1.type.id];
                    if (book && book.immediate) book.immediate(p, clone1);

                    // Clone 2
                    np = p.currentBrewValue + lastChip.value;
                    let clone2 = { ...lastChip, spaceIndex: np, drawnAt: Date.now() + 100 };
                    p.cauldron.push(clone2);
                    p.currentBrewValue = np;
                    book = this.books[clone2.type.id];
                    if (book && book.immediate) book.immediate(p, clone2);
                }
            }
        }

        while (!p.hasStopped && !p.exploded && p.bag.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Break out if game state has fundamentally changed while awaiting
            if (this.phase !== 'Brewing' || p.hasStopped || p.exploded) break;

            const thresholdT = riskThresholds[p.character] !== undefined ? riskThresholds[p.character] : 0.25;
            const currentThreshold = this.config.explosionThreshold + (p.explosionLimitOffset || 0);
            const probExplode = p.getExplosionProbability(currentThreshold);

            if (probExplode >= thresholdT) { 
                if (this.config.useCharacterPowers && p.character === 'MONK' && !p.specialPowerUsed) {
                    p.specialPowerUsed = true;
                    if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> used Meditation.`);
                    p.explosionLimitOffset = (p.explosionLimitOffset || 0) + 3;
                    continue; // Skip the stop, re-evaluate with the new threshold next tick
                }
                p.hasStopped = true; 
                if (this.uiManager) {
                    const rewards = this.uiManager.getProjectedRewards(p);
                    this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> sold potion for ${rewards.vp} VP and ${rewards.money} Money.`);
                }
            } else {
                p.drawChip();
                if (p.hasStopped && !p.exploded && this.uiManager) {
                    const rewards = this.uiManager.getProjectedRewards(p);
                    this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> bag empty, sold potion for ${rewards.vp} VP and ${rewards.money} Money.`);
                }
            }
            
            if (this.uiManager) this.uiManager.updateFullUI();
        }
        
        if (!p.exploded && !p.hasStopped) p.hasStopped = true;
        if (this.uiManager) this.uiManager.updateFullUI();
        this.checkBrewingPhaseEnd();
    }

    checkBrewingPhaseEnd() { 
        if (this.phase === 'Brewing' && this.players.every(p => p.hasStopped)) {
            this.runEvaluationPhase(); 
        }
    }

    runEvaluationPhase() {
        this.phase = 'Evaluation';
        
        let eligiblePlayers = [];
        const nonExploded = this.players.filter(p => !p.exploded);
        
        if (nonExploded.length > 0) {
            const maxBrew = Math.max(...nonExploded.map(p => p.currentBrewValue || 0));
            eligiblePlayers = nonExploded.filter(p => (p.currentBrewValue || 0) === maxBrew);
        }

        let humanRolled = false;
        let humanResultFace = null;
        let humanMoney = 0;

        eligiblePlayers.forEach(p => {
            const face = BONUS_DIE_FACES[Math.floor(Math.random() * BONUS_DIE_FACES.length)];
            face.apply(p);
            if (this.uiManager) {
                this.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> rolled the bonus die and received ${face.text}`);
            }
            if (p.isHuman) {
                humanRolled = true;
                humanResultFace = face;
                const trackSpace = TRACK_REWARDS[Math.min(p.currentBrewValue || 0, TRACK_REWARDS.length - 1)];
                humanMoney = trackSpace.money;
            }
        });

        if (humanRolled && this.uiManager) {
            this.uiManager.showBonusDieModal(humanResultFace, humanMoney);
        } else {
            this.continueEvaluationPhase();
        }
    }

    async continueEvaluationPhase() {
        this.players.forEach(p => {
            const trackSpace = TRACK_REWARDS[Math.min(p.currentBrewValue || 0, TRACK_REWARDS.length - 1)];
            p.roundVP = trackSpace.vp; p.roundMoney = trackSpace.money; p.roundRuby = trackSpace.ruby;
        });

        if (this.currentFortuneCard && this.currentFortuneCard.type === 'conditional') this.currentFortuneCard.evaluate(this);

        for (const p of this.players) {
            for (const color of Object.keys(this.books)) {
                if (this.books[color] && this.books[color].endOfRound) {
                    await this.books[color].endOfRound(p); 
                }
            }
            if (p.isHuman && !p.exploded && this.uiManager) {
                const greenCount = p.cauldron.filter(c => c.type.id === 'GREEN').length;
                if (greenCount >= 12) {
                    this.uiManager.unlockAchievement('WEBMASTER');
                }
            }
            if (p.roundRuby) p.rubies += 1;
            if (!p.isHuman) {
                if (p.exploded) { 
                    if (this.config.useCharacterPowers && p.character === 'WITCH' && !p.specialPowerUsed) {
                        p.specialPowerUsed = true;
                        p.victoryPoints += p.roundVP;
                        p.money += p.roundMoney;
                        if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> exploded but used Witch's Brew and received ${p.roundVP} VP and ${p.roundMoney} Money.`);
                        const face = BONUS_DIE_FACES[Math.floor(Math.random() * BONUS_DIE_FACES.length)];
                        face.apply(p);
                        if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> rolled the bonus die and received ${face.text}`);
                    } else {
                        if (this.round > 6) {
                            p.victoryPoints += p.roundVP; 
                            if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> exploded and received ${p.roundVP} VP.`);
                        } else {
                            p.money += p.roundMoney; 
                            if (this.uiManager) this.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> exploded and received ${p.roundMoney} Money.`);
                        }
                    }
                }
                else { p.victoryPoints += p.roundVP; p.money += p.roundMoney; }
            }
        }

        if (this.humanPlayer.exploded) {
            if(this.uiManager) this.uiManager.showExplosionModal(this.humanPlayer.roundVP, this.humanPlayer.roundMoney);
        } else {
            this.humanPlayer.victoryPoints += this.humanPlayer.roundVP; this.humanPlayer.money += this.humanPlayer.roundMoney;
            if(this.uiManager) this.uiManager.startBuyingPhase();
        }
    }

    endRound() {
        if (this.round === 9) {
            if (this.uiManager) this.uiManager.addLog(`<div style="margin-top: 15px; padding-bottom: 2px; border-bottom: 1px solid #4a4e69; color: var(--accent); font-weight: bold; text-transform: uppercase;">Final Scoring</div>`);
            this.players.forEach(p => { 
                p.finalMoney = p.money;
                p.finalRubies = p.rubies;
                p.convertedVP = Math.floor(p.money / 5) + Math.floor(p.rubies / 2);
                p.victoryPoints += p.convertedVP; 
                
                if (this.uiManager) {
                    this.uiManager.addLog(`End of Game: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> converted ${p.money} Money and ${p.rubies} Rubies into ${p.convertedVP} VP. Final score: ${p.victoryPoints} VP.`);
                }
            });
            if (this.uiManager) { 
                this.uiManager.sortPlayers(); 
                this.uiManager.updateFullUI();
                this.uiManager.showGameOver(); 
                document.getElementById('ui-phase').innerText = `(${t('phase_evaluation', 'Evaluation')})`; 
            }
            return;
        }
        
        this.players.forEach(p => p.money = 0); // Reset money only if the game is continuing
        this.round++; this.startRound();
    }
}
