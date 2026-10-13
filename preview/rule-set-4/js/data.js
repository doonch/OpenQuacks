// --- I18N Localization ---
window.I18N = window.I18N || {};
window.t = function(key, defaultStr) {
    return window.I18N[key] !== undefined ? window.I18N[key] : defaultStr;
};

// Global mutable variables for localized text
var INGREDIENTS, TRACK_REWARDS, VP_RAT_SPACES, FORTUNE_CARDS, BONUS_DIE_FACES, INGREDIENT_BOOKS_SET_1, INGREDIENT_BOOKS_SET_2, INGREDIENT_BOOKS_SET_3, INGREDIENT_BOOKS_SET_4, SHOP_CATALOG, CHARACTER_POWERS, ACHIEVEMENTS_DEF;

function initGameData() {
    INGREDIENTS = {
        WHITE:  { id: 'WHITE', name: t('ing_boomberry', 'Boomberry'), color: '#ffffff', textCol: '#000000', values: [1, 2, 3] },
        ORANGE: { id: 'ORANGE', name: t('ing_pumpkin', 'Pumpkin'), color: '#ff8c00', textCol: '#ffffff', values: [1, 6] },
        RED:    { id: 'RED', name: t('ing_toadstool', 'Toadstool'), color: '#ff0000', textCol: '#ffffff', values: [1, 2, 4] },
        YELLOW: { id: 'YELLOW', name: t('ing_mandrake', 'Mandrake'), color: '#ffd700', textCol: '#000000', values: [1, 2, 4] },
        GREEN:  { id: 'GREEN', name: t('ing_spider', 'Spider'), color: '#008000', textCol: '#ffffff', values: [1, 2, 4] },
        BLUE:   { id: 'BLUE', name: t('ing_ghost', 'Ghost'), color: '#0000ff', textCol: '#ffffff', values: [1, 4] },
        PURPLE: { id: 'PURPLE', name: t('ing_moth', 'Moth'), color: '#800080', textCol: '#ffffff', values: [1] },
        BLACK:  { id: 'BLACK', name: t('ing_crow_skull', 'Crow Skull'), color: '#000000', textCol: '#ffffff', values: [1] },
        BROWN:  { id: 'BROWN', name: t('ing_bug', 'Bug'), color: '#8b4513', textCol: '#ffffff', values: [0, 1, 2] } // Debugging only
    };

    TRACK_REWARDS = Array.from({ length: 60 }, (_, i) => ({
        vp: i >= 2 ? Math.floor((i - 2) / 4) : 0, 
        money: i < 15 ? i : 15 + Math.floor((i-15) / 2),
        ruby: ( i === 5 || i ===  9 || i ===  13 || i ===  16 || i ===  20 || i ===  24 || i ===  28 || i ===  30 || i ===  34 || i ===  36 || i ===  40 || i ===  42 || i ===  46 || i ===  50 || i ===  52)
    }));

    VP_RAT_SPACES = [1, 3, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54];

    FORTUNE_CARDS = [
        { id: 'fortune_ruby', text: t('fortune_ruby', "Everyone gains 1 Ruby."), type: 'immediate', apply: (g) => g.players.forEach(p => p.rubies++) },
        { id: 'fortune_orange_boost', text: t('fortune_orange_boost', "This round, orange tokens move an extra space forward."), type: 'immediate', apply: (g) => g.config.orangeExtraSpace = true },
        { id: 'fortune_money', text: t('fortune_money', "Everyone gains 2 Money."), type: 'immediate', apply: (g) => g.players.forEach(p => p.money += 2) },
        { id: 'fortune_droplet', text: t('fortune_droplet', "Everyone moves their droplet forward 1 space."), type: 'immediate', apply: (g) => g.players.forEach(p => p.dropletPosition++) },
        { id: 'fortune_no_explode', text: t('fortune_no_explode', "If you do not explode this round, gain 2 VP."), type: 'conditional', evaluate: (g) => g.players.forEach(p => { if(!p.exploded) p.victoryPoints += 2; }) },
        { id: 'fortune_exactly_seven', text: t('fortune_exactly_seven', "If your white tokens total is exactly 7 when you stop brewing, move your droplet a space forward."), type: 'conditional', evaluate: (g) => g.players.forEach(p => { if(p.currentWhiteValue === 7) p.dropletPosition++; }) },
        { id: 'fortune_free_flask', text: t('fortune_free_flask', "At the end of the round, refill flask for free."), type: 'conditional', evaluate: (g) => g.players.forEach(p => p.flaskActive = true) },
        { id: 'fortune_explode_limit', text: t('fortune_explode_limit', "The explosion limit is increased to 9 this round."), type: 'immediate', apply: (g) => g.config.explosionThreshold = 9 },
        { id: 'fortune_fewest_vp_spider', text: t('fortune_fewest_vp_spider', "The player(s) with the fewest VP get a Spider token."), type: 'immediate', apply: (g) => {
            const minVp = Math.min(...g.players.map(p => p.victoryPoints));
            g.players.forEach(p => { 
                if(p.victoryPoints === minVp) {
                    p.inventory.push({ type: INGREDIENTS.GREEN, value: 1 });
                    if (p.isHuman && g.uiManager) {
                        g.uiManager.queueSackAnimation({ typeId: 'GREEN', value: 1, color: INGREDIENTS.GREEN.color, textCol: INGREDIENTS.GREEN.textCol });
                    }
                    if(g.uiManager) g.uiManager.addLog(`Fortune: <span style="color:${p.isHuman?'gold':'#ccc'}">[${p.name}]</span> received a Spider token.`);
                }
            });
        }}
    ];

    BONUS_DIE_FACES = [
        { text: t('die_vp1', "1 VP!"), icon: "VP", apply: (p) => p.victoryPoints += 1 },
        { text: t('die_vp2', "2 VP!"), icon: "VP", apply: (p) => p.victoryPoints += 2 },
        { text: t('die_ruby1', "1 Ruby!"), icon: "RUBY", apply: (p) => p.rubies += 1 },
        { text: t('die_drop1', "1 Droplet step!"), icon: "DROPLET", apply: (p) => p.dropletPosition += 1 },
        { text: t('die_pump1', "1 Pumpkin Token!"), isChip: true, typeId: "ORANGE", value: 1, apply: (p) => {
            p.inventory.push({ type: INGREDIENTS.ORANGE, value: 1 });
            if (p.isHuman && p.game.uiManager) p.game.uiManager.queueSackAnimation({ typeId: 'ORANGE', value: 1, color: INGREDIENTS.ORANGE.color, textCol: INGREDIENTS.ORANGE.textCol });
        } },
        { text: t('die_toadstool1', "1 Toadstool!"), isChip: true, typeId: "RED", value: 1, apply: (p) => {
            p.inventory.push({ type: INGREDIENTS.RED, value: 1 });
            if (p.isHuman && p.game.uiManager) p.game.uiManager.queueSackAnimation({ typeId: 'RED', value: 1, color: INGREDIENTS.RED.color, textCol: INGREDIENTS.RED.textCol });
        } }
    ];

    INGREDIENT_BOOKS_SET_1 = {
        ORANGE: { 
            description: t('book_orange', "Standard ingredient. Adds value to your brew but has no special effect."),
            immediate: (p, c) => {
                if (p.game.config.orangeExtraSpace) {
                    p.currentBrewValue += 1;
                    c.spaceIndex += 1;
                }
            }
        },
        WHITE: { description: t('book_white', "If the total value of Boomberries in your cauldron exceeds the explosion limit (usually 7), your cauldron explodes.") },
        BROWN: { description: t('book_brown', "Special bug ingredient. Crawls ahead with precision.") },
        RED: { 
            description: t('book1_red', "If there is at least 1 Pumpkin in your cauldron, move 1 extra space."),
            immediate: (p, c) => { 
                if(p.cauldron.some(ch => ch.type.id === 'ORANGE')) {
                    p.currentBrewValue += 1; 
                    c.spaceIndex += 1; // Update the actual chip's position on the board
                }
            } 
        },
        YELLOW: { 
            description: t('book1_yellow', "If the previous chip was a Boomberry, its white value is cancelled."),
            immediate: (p, c) => { 
                if(p.cauldron.length >= 2 && p.cauldron[p.cauldron.length-2].type.id === 'WHITE') {
                    p.currentWhiteValue = Math.max(0, p.currentWhiteValue - p.cauldron[p.cauldron.length-2].value); 
                    if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Mandrake cancelled the previous Boomberry!`);
                }
            } 
        },
        BLUE: { 
            description: t('book1_blue', "Draw 1 extra chip. If ingredient, place it for free! If Boomberry, return to bag."),
            immediate: (p, c) => { 
                if(p.bag.length > 0) { 
                    const idx = Math.floor(Math.random() * p.bag.length); 
                    const next = p.bag[idx]; 
                    if(next.type.id !== 'WHITE') { 
                        p.bag.splice(idx, 1); 
                        const np = p.currentBrewValue + next.value; 
                        const placedChip = { ...next, spaceIndex: np, drawnAt: Date.now() };
                        p.cauldron.push(placedChip); 
                        p.currentBrewValue = np; 
                        if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Ghost pulled a free <strong style="color:${next.type.color}">${next.type.name} ${next.value}</strong>!`);
                        
                        const nextBook = p.game.books[placedChip.type.id];
                        if (nextBook && nextBook.immediate) nextBook.immediate(p, placedChip);
                    } else {
                        if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Ghost pulled a Boomberry, left it in the bag.`);
                    }
                } 
            } 
        },
        GREEN: { 
            description: t('book1_green', "End of Round: Gain 1 Ruby if your last or second-to-last placed chip is a Spider."),
            endOfRound: (p) => { 
                const len = p.cauldron.length; 
                if(len >= 1 && (p.cauldron[len-1].type.id === 'GREEN' || (len >= 2 && p.cauldron[len-2].type.id === 'GREEN'))) {
                    p.rubies += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 Ruby from Spiders.`);
                }
            } 
        },
        PURPLE: { 
            description: t('book1_purple', "End of Round: 1-2 Moths = 1 VP. 3 or more Moths = 2 VP."),
            endOfRound: (p) => { 
                const cnt = p.cauldron.filter(c => c.type.id === 'PURPLE').length; 
                if(cnt > 0) {
                    const vp = cnt >= 3 ? 2 : 1;
                    p.victoryPoints += vp; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received ${vp} VP from Moths.`);
                }
            } 
        },
        BLACK: { 
            description: t('book1_black', "End of Round: If you placed at least 1 Crow Skull, gain 1 VP and 1 Ruby."),
            endOfRound: (p) => { 
                if(p.cauldron.some(c => c.type.id === 'BLACK')) { 
                    p.victoryPoints += 1; 
                    p.rubies += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 VP and 1 Ruby from Crow Skulls.`);
                } 
            } 
        }
    };

    INGREDIENT_BOOKS_SET_2 = {
        ORANGE: { 
            description: t('book_orange', "Standard ingredient. Adds value to your brew but has no special effect."),
            immediate: (p, c) => {
                if (p.game.config.orangeExtraSpace) {
                    p.currentBrewValue += 1;
                    c.spaceIndex += 1;
                }
            }
        },
        WHITE: { description: t('book_white', "If the total value of Boomberries in your cauldron exceeds the explosion limit (usually 7), your cauldron explodes.") },
        BROWN: { description: t('book_brown', "Special bug ingredient. Crawls ahead with precision.") },
        RED: { 
            description: t('book2_red', "If there are 1 or 2 Pumpkins in your cauldron, move 1 extra space. If 3+, move 2 extra spaces."),
            immediate: (p, c) => { 
                const oranges = p.cauldron.filter(ch => ch.type.id === 'ORANGE').length;
                if (oranges >= 3) { p.currentBrewValue += 2; c.spaceIndex += 2; }
                else if (oranges >= 1) { p.currentBrewValue += 1; c.spaceIndex += 1; }
            } 
        },
        YELLOW: { 
            description: t('book2_yellow', "If the previous chip was a Boomberry, gain 1 Ruby immediately."),
            immediate: (p, c) => { 
                if(p.cauldron.length >= 2 && p.cauldron[p.cauldron.length-2].type.id === 'WHITE') {
                    p.rubies += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Mandrake found a Ruby next to a Boomberry.`);
                }
            } 
        },
        BLUE: { 
            description: t('book2_blue', "End of Round: Gain 1 VP for every Blue chip in your cauldron."),
            endOfRound: (p) => { 
                const count = p.cauldron.filter(ch => ch.type.id === 'BLUE').length; 
                if (count > 0) {
                    p.victoryPoints += count; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received ${count} VP from Ghosts.`);
                }
            } 
        },
        GREEN: { 
            description: t('book2_green', "End of Round: Gain 1 Droplet step if your last placed chip is a Spider."),
            endOfRound: (p) => { 
                const len = p.cauldron.length; 
                if(len >= 1 && p.cauldron[len-1].type.id === 'GREEN') {
                    p.dropletPosition += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 Droplet step from Spiders.`);
                }
            } 
        },
        PURPLE: { 
            description: t('book2_purple', "End of Round: 1 Moth = 1 VP. 2 Moths = 1 VP & 1 Ruby. 3+ Moths = 2 VP & 1 Ruby."),
            endOfRound: (p) => { 
                const cnt = p.cauldron.filter(ch => ch.type.id === 'PURPLE').length;
                if(cnt === 1) { 
                    p.victoryPoints += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 VP from Moths.`);
                } else if(cnt === 2) { 
                    p.victoryPoints += 1; p.rubies += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 VP and 1 Ruby from Moths.`);
                } else if(cnt >= 3) { 
                    p.victoryPoints += 2; p.rubies += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 2 VP and 1 Ruby from Moths.`);
                }
            } 
        },
        BLACK: { 
            description: t('book2_black', "End of Round: If you placed at least 1 Crow Skull, gain 1 Droplet step."),
            endOfRound: (p) => { 
                if(p.cauldron.some(c => c.type.id === 'BLACK')) {
                    p.dropletPosition += 1; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 Droplet step from Crow Skulls.`);
                }
            } 
        }
    };

    INGREDIENT_BOOKS_SET_3 = {
        ORANGE: { 
            description: t('book_orange', "Standard ingredient. Adds value to your brew but has no special effect."),
            immediate: (p, c) => {
                if (p.game.config.orangeExtraSpace) {
                    p.currentBrewValue += 1;
                    c.spaceIndex += 1;
                }
            }
        },
        WHITE: { description: t('book_white', "If the total value of Boomberries in your cauldron exceeds the explosion limit (usually 7), your cauldron explodes.") },
        BROWN: { description: t('book_brown', "Special bug ingredient. Crawls ahead with precision.") },
        RED: { 
            description: t('book3_red', "Add the value of the immediately preceding Boomberry to this Toadstool's movement."),
            immediate: (p, c) => { 
                if (p.cauldron.length >= 2 && p.cauldron[p.cauldron.length - 2].type.id === 'WHITE') {
                    const bonus = p.cauldron[p.cauldron.length - 2].value;
                    p.currentBrewValue += bonus; 
                    c.spaceIndex += bonus; 
                }
            } 
        },
        YELLOW: { 
            description: t('book3_yellow', "1st and 3rd Mandrakes played each increase your explosion limit by +1."),
            immediate: (p, c) => { 
                const count = p.cauldron.filter(ch => ch.type.id === 'YELLOW').length;
                if (count === 1 || count === 3) {
                    p.explosionLimitOffset = (p.explosionLimitOffset || 0) + 1;
                    if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Mandrake increased their explosion limit by 1!`);
                }
            } 
        },
        BLUE: { 
            description: t('book3_blue', "End of Round: Upgrade 1 token. 1 Ghost = 1->2. 2 Ghosts = 2->4. 3+ Ghosts = 1->4."),
            endOfRound: async (p) => { 
                if (p.game.round === 9) return; // Skip upgrading tokens on the final round
                
                const blues = p.cauldron.filter(ch => ch.type.id === 'BLUE').length;
                if (blues === 0) return;
                
                const getBestUpgrade = (chip) => {
                    const vals = INGREDIENTS[chip.type.id].values;
                    let best = null;
                    if (chip.value === 1) {
                        if (blues >= 3 && vals.includes(4)) best = 4;
                        else if (vals.includes(2)) best = 2; 
                    } else if (chip.value === 2) {
                        if (blues >= 2 && vals.includes(4)) best = 4;
                    }
                    return best;
                };

                const upgradeableChips = [];
                const seen = new Set();
                p.cauldron.forEach(c => {
                    const toVal = getBestUpgrade(c);
                    if (toVal !== null) {
                        const key = `${c.type.id}_${c.value}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            upgradeableChips.push({ chip: c, toVal });
                        }
                    }
                });

                if (upgradeableChips.length === 0) return;

                if (p.isHuman && p.game.uiManager) {
                    await p.game.uiManager.showGhostUpgradeModal(upgradeableChips);
                } else {
                    // AI behavior: Automatically upgrade the chip that gives the biggest mathematical jump
                    const safeChips = upgradeableChips.filter(item => item.chip.type.id !== 'WHITE');
                    if (safeChips.length === 0) return;

                    safeChips.sort((a, b) => (b.toVal - b.chip.value) - (a.toVal - a.chip.value));
                    const target = safeChips[0];
                    
                    if (p.game.uiManager) {
                        p.game.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> upgraded <strong style="color:${target.chip.type.color}">${target.chip.type.name} ${target.chip.value}</strong> to <strong style="color:${target.chip.type.color}">${target.chip.type.name} ${target.toVal}</strong>`);
                    }
                    
                    const invIndex = p.inventory.findIndex(i => i.type.id === target.chip.type.id && i.value === target.chip.value);
                    if (invIndex !== -1) p.inventory[invIndex] = { type: target.chip.type, value: target.toVal };
                    const bagIndex = p.bag.findIndex(i => i.type.id === target.chip.type.id && i.value === target.chip.value);
                    if (bagIndex !== -1) p.bag[bagIndex] = { type: target.chip.type, value: target.toVal };
                }
            } 
        },
        GREEN: { 
            description: t('book3_green', "End of Round: If Boomberries total exactly 7, add your Spiders' total value to your brew spaces."),
            endOfRound: (p) => { 
                if (p.currentWhiteValue === 7) {
                    const sum = p.cauldron.filter(c => c.type.id === 'GREEN').reduce((acc, c) => acc + c.value, 0);
                    if (sum > 0) {
                        p.currentBrewValue += sum;
                        const newTrack = TRACK_REWARDS[Math.min(p.currentBrewValue, TRACK_REWARDS.length - 1)];
                        p.roundVP = newTrack.vp; 
                        p.roundMoney = newTrack.money; 
                        p.roundRuby = newTrack.ruby;
                        if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> used Spiders to boost their brew value by ${sum} spaces!`);
                    }
                }
            } 
        },
        PURPLE: { 
            description: t('book3_purple', "End of Round: Gain 1 Droplet if you have more Moths than 1 player, or +1 Droplet & +1 Ruby if more than 2 players."),
            endOfRound: (p) => { 
                const myCount = p.cauldron.filter(c => c.type.id === 'PURPLE').length;
                if (myCount === 0) return;
                let beaten = 0;
                p.game.players.forEach(other => {
                    if (other !== p && myCount > other.cauldron.filter(c => c.type.id === 'PURPLE').length) beaten++;
                });
                if (beaten >= 2) { 
                    p.dropletPosition++; p.rubies++; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> had more moths than ${beaten} other players and received 1 Droplet step and 1 Ruby`);
                }
                else if (beaten === 1) { 
                    p.dropletPosition++; 
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> had more moths than 1 other player and received 1 Droplet step`);
                }
            } 
        },
        BLACK: { 
            description: t('book3_black', "Immediately gain 1 Ruby if placed on a Ruby space."),
            immediate: (p, c) => { 
                const spaceInfo = TRACK_REWARDS[Math.min(c.spaceIndex, TRACK_REWARDS.length - 1)];
                if (spaceInfo && spaceInfo.ruby) {
                    p.rubies++;
                    if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Crow Skull landed on a Ruby space and gained 1 Ruby!`);
                }
            } 
        }
    };

    INGREDIENT_BOOKS_SET_4 = {
        ORANGE: { 
            description: t('book_orange', "Standard ingredient. Adds value to your brew but has no special effect."),
            immediate: (p, c) => {
                if (p.game.config.orangeExtraSpace) {
                    p.currentBrewValue += 1;
                    c.spaceIndex += 1;
                }
            }
        },
        WHITE: { description: t('book_white', "If the total value of Boomberries in your cauldron exceeds the explosion limit (usually 7), your cauldron explodes.") },
        BROWN: { description: t('book_brown', "Special bug ingredient. Crawls ahead with precision.") },
        RED: { 
            description: t('book4_red', "If your cauldron already contains 2+ chips of value 1, move 1 extra space (2 extra spaces if 4+)."),
            immediate: (p, c) => { 
                const priorChips = p.cauldron.slice(0, -1);
                const countOnes = priorChips.filter(ch => ch.value === 1).length;
                let bonus = 0;
                if (countOnes >= 4) {
                    bonus = 2;
                } else if (countOnes >= 2) {
                    bonus = 1;
                }
                if (bonus > 0) {
                    p.currentBrewValue += bonus;
                    c.spaceIndex += bonus;
                    if (p.game.uiManager) p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Toadstool surged forward +${bonus} extra spaces!`);
                }
            } 
        },
        YELLOW: { 
            description: t('book4_yellow', "If the previous chip was a Boomberry, return that Boomberry to your bag, lowering your explosion count."),
            immediate: (p, c) => { 
                if (p.cauldron.length >= 2 && p.cauldron[p.cauldron.length - 2].type.id === 'WHITE') {
                    const whiteChip = p.cauldron.splice(p.cauldron.length - 2, 1)[0];
                    p.currentWhiteValue = Math.max(0, p.currentWhiteValue - whiteChip.value);
                    p.bag.push({ type: whiteChip.type, value: whiteChip.value });
                    if (p.game.uiManager) {
                        p.game.uiManager.addLog(`<span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span>'s Mandrake cleansed <strong style="color:white">Boomberry ${whiteChip.value}</strong> back into the bag!`);
                    }
                }
            } 
        },
        BLUE: { 
            description: t('book4_blue', "Look at the next 2 chips in your bag (4 for Ghost 4). You may place 1 in your cauldron and return the rest."),
            immediate: async (p, c) => { 
                if (p.bag.length === 0) return;
                const peekCount = Math.min(p.bag.length, c.value === 4 ? 4 : 2);
                const peekIndices = [];
                const availableIndices = Array.from({ length: p.bag.length }, (_, i) => i);
                for (let i = 0; i < peekCount; i++) {
                    const randIdx = Math.floor(Math.random() * availableIndices.length);
                    peekIndices.push(availableIndices.splice(randIdx, 1)[0]);
                }
                const peekedChips = peekIndices.map(i => ({ chip: p.bag[i], originalIndex: i }));
                
                if (p.isHuman && p.game.uiManager) {
                    p.game.uiManager.showGhostGazeModal(peekedChips);
                } else {
                    const threshold = p.game.config.explosionThreshold + (p.explosionLimitOffset || 0);
                    const safeChips = peekedChips.filter(item => {
                        if (item.chip.type.id === 'WHITE') {
                            return (p.currentWhiteValue + item.chip.value) <= threshold;
                        }
                        return true;
                    });
                    
                    if (safeChips.length > 0) {
                        safeChips.sort((a, b) => {
                            const aWhite = a.chip.type.id === 'WHITE' ? 1 : 0;
                            const bWhite = b.chip.type.id === 'WHITE' ? 1 : 0;
                            if (aWhite !== bWhite) return aWhite - bWhite;
                            return b.chip.value - a.chip.value;
                        });
                        const chosen = safeChips[0];
                        const realBagIndex = p.bag.indexOf(chosen.chip);
                        if (realBagIndex !== -1) {
                            if (p.game.uiManager) {
                                p.game.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> gazed into the bag and chose <strong style="color:${chosen.chip.type.color}">${chosen.chip.type.name} ${chosen.chip.value}</strong>`);
                            }
                            p.drawChip(realBagIndex);
                        }
                    } else {
                        if (p.game.uiManager) {
                            p.game.uiManager.addLog(`<span style="color:#ccc">[${p.name}]</span> gazed into the bag but passed.`);
                        }
                    }
                }
            } 
        },
        GREEN: { 
            description: t('book4_green', "End of Round: 1 VP for every pair of Spiders. If cauldron did not explode, gain +1 Ruby as well."),
            endOfRound: (p) => { 
                const count = p.cauldron.filter(c => c.type.id === 'GREEN').length;
                const pairs = Math.floor(count / 2);
                if (pairs > 0) {
                    p.victoryPoints += pairs;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received ${pairs} VP from Spider pairs.`);
                }
                if (!p.exploded && count > 0) {
                    p.rubies += 1;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 Ruby from Spiders.`);
                }
            } 
        },
        PURPLE: { 
            description: t('book4_purple', "End of Round: 1 Moth = 1 Ruby. 2 Moths = 1 Ruby & 1 VP. 3+ Moths = 2 Rubies & 2 VP."),
            endOfRound: (p) => { 
                const cnt = p.cauldron.filter(c => c.type.id === 'PURPLE').length;
                if (cnt === 1) {
                    p.rubies += 1;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 Ruby from Moths.`);
                } else if (cnt === 2) {
                    p.rubies += 1;
                    p.victoryPoints += 1;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 1 Ruby and 1 VP from Moths.`);
                } else if (cnt >= 3) {
                    p.rubies += 2;
                    p.victoryPoints += 2;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> received 2 Rubies and 2 VP from Moths.`);
                }
            } 
        },
        BLACK: { 
            description: t('book4_black', "End of Round: Most Crow Skulls = +1 Droplet & +1 VP. Tied for most = +1 Ruby (min 1 Crow Skull)."),
            endOfRound: (p) => { 
                const myCount = p.cauldron.filter(c => c.type.id === 'BLACK').length;
                if (myCount === 0) return;
                
                let maxOther = 0;
                p.game.players.forEach(other => {
                    if (other !== p) {
                        const count = other.cauldron.filter(c => c.type.id === 'BLACK').length;
                        if (count > maxOther) {
                            maxOther = count;
                        }
                    }
                });
                
                if (myCount > maxOther) {
                    p.dropletPosition += 1;
                    p.victoryPoints += 1;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> had the most Crow Skulls (${myCount}) and received 1 Droplet step and 1 VP!`);
                } else if (myCount === maxOther) {
                    p.rubies += 1;
                    if (p.game.uiManager) p.game.uiManager.addLog(`End of round: <span style="color:${p.isHuman ? 'gold' : '#ccc'}">[${p.name}]</span> tied for the most Crow Skulls (${myCount}) and received 1 Ruby!`);
                }
            } 
        }
    };

    SHOP_CATALOG = [
        { type: INGREDIENTS.ORANGE, value: 1, cost: 3 }, { type: INGREDIENTS.ORANGE, value: 6, cost: 22 },
        { type: INGREDIENTS.GREEN, value: 1, cost: 4 }, { type: INGREDIENTS.GREEN, value: 2, cost: 8 }, { type: INGREDIENTS.GREEN, value: 4, cost: 14 },
        { type: INGREDIENTS.RED, value: 1, cost: 4 }, { type: INGREDIENTS.RED, value: 2, cost: 8 }, { type: INGREDIENTS.RED, value: 4, cost: 14 },
        { type: INGREDIENTS.YELLOW, value: 1, cost: 5 }, { type: INGREDIENTS.YELLOW, value: 2, cost: 10 }, { type: INGREDIENTS.YELLOW, value: 4, cost: 16 },
        { type: INGREDIENTS.BLUE, value: 1, cost: 5 }, { type: INGREDIENTS.BLUE, value: 4, cost: 19 },
        { type: INGREDIENTS.PURPLE, value: 1, cost: 9 }, { type: INGREDIENTS.BLACK, value: 1, cost: 10 }
    ];

    CHARACTER_POWERS = {
        WITCH: {}, WIZARD: {}, MONK: {}, CHILD: {},
        PRINCESS: {}, VOODOO_LADY: {}, BARD: {}, GARDENER: {},
        ENGINEER: {}
    };

    ACHIEVEMENTS_DEF = {
        'MEGA_PUMPKIN': { titleKey: 'ach_mega_pumpkin_title', defaultTitle: 'Mega Pumpkin', descKey: 'ach_mega_pumpkin_desc', defaultDesc: 'Purchase a pumpkin 6 token' },
        'POINT_MAXXING': { titleKey: 'ach_point_maxxing_title', defaultTitle: 'Point Maxxing', descKey: 'ach_point_maxxing_desc', defaultDesc: 'Win a game with more than 70 points as any character' },
        'KABOOM': { titleKey: 'ach_kaboom_title', defaultTitle: 'Kaboom!', descKey: 'ach_kaboom_desc', defaultDesc: 'Explode with 15 boomberries in your cauldron' },
        'TIE_FIGHTER': { titleKey: 'ach_tie_fighter_title', defaultTitle: 'Tie Fighter', descKey: 'ach_tie_fighter_desc', defaultDesc: 'Win a 3-way tie breaker' },
        'BIG_SPENDER': { titleKey: 'ach_big_spender_title', defaultTitle: 'Big Spender', descKey: 'ach_big_spender_desc', defaultDesc: 'Spend more than 56 coins in the shop' },
        'META_CHARLATAN': { titleKey: 'ach_meta_charlatan_title', defaultTitle: 'Meta-charlatan', descKey: 'ach_meta_charlatan_desc', defaultDesc: 'Place a token using the debug draw dialog.' },
        'STAY_HYDRATED': { titleKey: 'ach_stay_hydrated_title', defaultTitle: 'Stay Hydrated', descKey: 'ach_stay_hydrated_desc', defaultDesc: 'Achieve 18 or more droplet upgrades' },
        'RAT_VICHYSSOISE': { titleKey: 'ach_rat_vichyssoise_title', defaultTitle: 'Rat Vichyssoise', descKey: 'ach_rat_vichyssoise_desc', defaultDesc: 'Get 20 or more rat tails in a single round' },
        'WEBMASTER': { titleKey: 'ach_webmaster_title', defaultTitle: 'Webmaster', descKey: 'ach_webmaster_desc', defaultDesc: 'Finish an unexploded cauldron with 12 or more Green chips' },
        'SEANCE_MASTER': { titleKey: 'ach_seance_master_title', defaultTitle: 'Séance Master', descKey: 'ach_seance_master_desc', defaultDesc: 'Chain 4 consecutive Ghost placements without exploding' }
    };
}
