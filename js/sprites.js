// --- Cookie Helpers ---
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

// --- Sound Helpers ---
function applySoundSettings() {
    const isSoundOn = getCookie('soundEnabled') !== '0'; // Defaults to true if not set
    const isIPhone = /iPhone/i.test(navigator.userAgent);
    
    const bubblingVid = document.getElementById('bubbling-video');
    const explosionVid = document.getElementById('explosion-video');
    
    if (bubblingVid) {
        // Bubbling is always muted on iPhone regardless of user setting, to allow looping playback
        bubblingVid.muted = !isSoundOn || isIPhone;
    }
    if (explosionVid) {
        explosionVid.muted = !isSoundOn;
    }
}

/**
 * ASSET MANAGEMENT & SPRITE MAPS
 */
const ASSET_PATHS = {
    CAULDRON_BG: 'assets/cauldron_board.png',
    CHIPS: 'assets/tokens.png',
    UTILS: 'assets/utils.png',
    CHARACTERS: 'assets/characters.png',
    UTILS_EXP: 'assets/utils_exp.png',
    ACHIEVEMENTS: 'assets/achievements.png'
};

// Exact fractional coordinates for the 6x4 layout
const CHIP_SPRITE_MAP = {
    'WHITE_1':  { x: 0/6, y: 0/4, w: 1/6, h: 1/4 },
    'WHITE_2':  { x: 1/6, y: 0/4, w: 1/6, h: 1/4 },
    'WHITE_3':  { x: 2/6, y: 0/4, w: 1/6, h: 1/4 },
    'ORANGE_1': { x: 4/6, y: 0/4, w: 1/6, h: 1/4 },
    'ORANGE_6': { x: 5/6, y: 0/4, w: 1/6, h: 1/4 },
    
    'GREEN_1':  { x: 0/6, y: 1/4, w: 1/6, h: 1/4 },
    'GREEN_2':  { x: 1/6, y: 1/4, w: 1/6, h: 1/4 },
    'GREEN_4':  { x: 2/6, y: 1/4, w: 1/6, h: 1/4 },
    'PURPLE_1': { x: 4/6, y: 1/4, w: 1/6, h: 1/4 },
    'BLACK_1':  { x: 5/6, y: 1/4, w: 1/6, h: 1/4 },
    
    'BROWN_0':  { x: 0/6, y: 2/4, w: 1/6, h: 1/4 },
    'BROWN_1':  { x: 1/6, y: 2/4, w: 1/6, h: 1/4 },
    'BROWN_2':  { x: 2/6, y: 2/4, w: 1/6, h: 1/4 },
    'YELLOW_1': { x: 3/6, y: 2/4, w: 1/6, h: 1/4 },
    'YELLOW_2': { x: 4/6, y: 2/4, w: 1/6, h: 1/4 },
    'YELLOW_4': { x: 5/6, y: 2/4, w: 1/6, h: 1/4 },
    
    'RED_1':    { x: 0/6, y: 3/4, w: 1/6, h: 1/4 },
    'RED_2':    { x: 1/6, y: 3/4, w: 1/6, h: 1/4 },
    'RED_4':    { x: 2/6, y: 3/4, w: 1/6, h: 1/4 },
    'BLUE_1':   { x: 3/6, y: 3/4, w: 1/6, h: 1/4 },
    'BLUE_4':   { x: 4/6, y: 3/4, w: 1/6, h: 1/4 }
};

// Utility Sprite Mappings updated for the new irregular layout
const UTILS_MAP = {
    FLASK_FULL  : { x: 0.00, y: 0.02, w: 0.16, h: 0.47 }, 
    FLASK_EMPTY : { x: 0.17, y: 0.01, w: 0.16, h: 0.47 }, 
    RUBY        : { x: 0.35, y: 0.06, w: 0.11, h: 0.31 }, 
    COIN        : { x: 0.48, y: 0.02, w: 0.16, h: 0.44 }, 
    SACK        : { x: 0.34, y: 0.54, w: 0.13, h: 0.35 }, 
    DROPLET     : { x: 0.51, y: 0.54, w: 0.08, h: 0.34 }, 
    RAT         : { x: 0.62, y: 0.54, w: 0.09, h: 0.33 }, 
    VP          : { x: 0.73, y: 0.53, w: 0.14, h: 0.36 },
    MONOCLE     : { x: 0.68, y: 0.06, w: 0.15, h: 0.42 }
};

const UTILS_EXP_MAP = {
    WATERING_CAN: { x: 0, y: 0, w: 0.5, h: 0.5 },
    LOLLIPOP: { x: 0.5, y: 0, w: 0.5, h: 0.5 },
    SKULL: { x: 0, y: 0.5, w: 0.5, h: 0.5 },
    WIZARD_HAT: { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }
};

const ACHIEVEMENT_MAP = {
    'MEGA_PUMPKIN':    { x: 0/4, y: 0/2, w: 1/4, h: 1/2 },
    'POINT_MAXXING':   { x: 1/4, y: 0/2, w: 1/4, h: 1/2 },
    'KABOOM':          { x: 2/4, y: 0/2, w: 1/4, h: 1/2 },
    'TIE_FIGHTER':     { x: 3/4, y: 0/2, w: 1/4, h: 1/2 },
    'BIG_SPENDER':     { x: 0/4, y: 1/2, w: 1/4, h: 1/2 },
    'META_CHARLATAN':  { x: 1/4, y: 1/2, w: 1/4, h: 1/2 },
    'STAY_HYDRATED':   { x: 2/4, y: 1/2, w: 1/4, h: 1/2 },
    'RAT_VICHYSSOISE': { x: 3/4, y: 1/2, w: 1/4, h: 1/2 },
    'WEBMASTER':       { url: './assets/ach_webmaster.png' },
    'SEANCE_MASTER':   { url: './assets/ach_seance_master.png' }
};

// 8x4 Grid Constants for Characters
const CHAR_ROW = { 'WIZARD': 0, 'WITCH': 1, 'BARD': 2, 'CHILD': 3, 'PRINCESS': 4, 'VOODOO_LADY': 5, 'GARDENER': 6, 'MONK': 7 };
const MOOD_COL = { 'SMIRK': 0, 'CONCERN': 1, 'DISAPPOINTMENT': 2, 'TRIUMPHANT': 3 };

class AssetManager {
    constructor() {
        this.images = {};
    }
    async loadAll() {
        const promises = Object.entries(ASSET_PATHS).map(([key, path]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => { this.images[key] = img; resolve(); };
                img.onerror = () => { console.warn(`Missing asset: ${path}`); resolve(); }; // Fail softly
                img.src = path;
            });
        });
        await Promise.all(promises);
        return this.images;
    }
}

// --- CSS Generation Helpers for UI Elements ---
function getChipSpriteStyle(typeId, value) {
    const def = CHIP_SPRITE_MAP[`${typeId}_${value}`];
    if (!def) return '';
    const posX = def.w < 1 ? (def.x / (1 - def.w)) * 100 : 0;
    const posY = def.h < 1 ? (def.y / (1 - def.h)) * 100 : 0;
    return `background-image: url('${ASSET_PATHS.CHIPS}'); background-size: ${100/def.w}% ${100/def.h}%; background-position: ${posX}% ${posY}%; background-repeat: no-repeat;`;
}

function getUtilSpriteStyle(utilKey) {
    const def = UTILS_MAP[utilKey];
    if (!def) return '';
    const posX = def.w < 1 ? (def.x / (1 - def.w)) * 100 : 0;
    const posY = def.h < 1 ? (def.y / (1 - def.h)) * 100 : 0;
    return `background-image: url('${ASSET_PATHS.UTILS}'); background-size: ${100/def.w}% ${100/def.h}%; background-position: ${posX}% ${posY}%; background-repeat: no-repeat;`;
}

function getUtilExpSpriteStyle(utilKey) {
    const def = UTILS_EXP_MAP[utilKey];
    if (!def) return '';
    const posX = def.w < 1 ? (def.x / (1 - def.w)) * 100 : 0;
    const posY = def.h < 1 ? (def.y / (1 - def.h)) * 100 : 0;
    return `background-image: url('${ASSET_PATHS.UTILS_EXP}'); background-size: ${100/def.w}% ${100/def.h}%; background-position: ${posX}% ${posY}%; background-repeat: no-repeat;`;
}

function getCharacterSpriteStyle(charName, moodName) {
    if (charName === 'ENGINEER') return '';
    const row = CHAR_ROW[charName] || 0;
    const col = MOOD_COL[moodName] || 0;
    // For an 8x4 grid, the background size is 400% (cols) by 800% (rows)
    const x = col * 33.3333;
    const y = row * 14.2857;
    return `background-image: url('${ASSET_PATHS.CHARACTERS}'); background-size: 400% 800%; background-position: ${x}% ${y}%; background-repeat: no-repeat;`;
}

function getAchievementSpriteStyle(achId) {
    const def = ACHIEVEMENT_MAP[achId];
    if (!def) return '';
    if (def.url) {
        return `background-image: url('${def.url}'); background-size: cover; background-position: center; background-repeat: no-repeat;`;
    }
    const posX = def.w < 1 ? (def.x / (1 - def.w)) * 100 : 0;
    const posY = def.h < 1 ? (def.y / (1 - def.h)) * 100 : 0;
    return `background-image: url('${ASSET_PATHS.ACHIEVEMENTS}'); background-size: ${100/def.w}% ${100/def.h}%; background-position: ${posX}% ${posY}%; background-repeat: no-repeat;`;
}

function getCharacterFallbackEmoji(charName) {
    const CHAR_EMOJIS = {
        'WIZARD': '🧙‍♂️', 'WITCH': '🧙‍♀️', 'MONK': '👨🏼‍🦲', 'CHILD': '🧒',
        'PRINCESS': '👸', 'VOODOO_LADY': '🧟‍♀️', 'BARD': '🪕', 'GARDENER': '🧑‍🌾',
        'ENGINEER': '👷'
    };
    return CHAR_EMOJIS[charName] || '👤';
}

function getAchievementFallbackEmoji(achId) {
    const EMOJIS = {
        'MEGA_PUMPKIN': '🎃', 'POINT_MAXXING': '💯', 'KABOOM': '💥', 'TIE_FIGHTER': '⚔️',
        'BIG_SPENDER': '💸', 'META_CHARLATAN': '🛠️', 'STAY_HYDRATED': '💧', 'RAT_VICHYSSOISE': '🐀',
        'WEBMASTER': '🕸️', 'SEANCE_MASTER': '👻'
    };
    return EMOJIS[achId] || '🏆';
}

// --- Helper to determine the mood of a player based on state ---
function getPlayerMood(player, isGameOver, isWinner) {
    isGameOver = isGameOver || false;
    isWinner = isWinner || false;
    if (isGameOver) return isWinner ? 'TRIUMPHANT' : 'DISAPPOINTMENT';
    if (player.exploded) return 'DISAPPOINTMENT';
    if (player.hasStopped) return 'SMIRK';
    if (player.currentWhiteValue > 3) return 'CONCERN';
    return 'SMIRK';
}
