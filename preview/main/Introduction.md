**Project Architecture & Global State Setup**

Goal: Establish the tech stack, define the core data structures, and create the basic layout for a desktop browser.
Prompt Content:
Markdown
I want to build a browser-based, single-player board game called "Open Quacks," inspired by "The Quacks of Quedlinburg."


**Tech Stack & Constraints:**
* Use modern HTML5, CSS3 (Flexbox/Grid), and vanilla JavaScript (ES6+).
* Use HTML Canvas for the main gameplay area (the cauldron), as it involves complex spiral positioning.
* The target platform is a desktop computer browser (wide viewport).
* The code must be modular, object-oriented, and heavily commented.
* Avoid external game engines like Phaser for now; let's stick to native browser APIs.


**Game Overview:**
It is a 9-round push-your-luck bag-building game. 1 human player competes against 1 to 3 configurable AI opponents. Players draw ingredient chips from bags to place on a spiral track in their cauldron.


**Task 1: Architecture & Layout**


1.  **Create the basic HTML structure:**
    * A main container for the game.
    * A large central area for the main game board (showing round progress, available ingredient books for purchase, victory point track).
    * A prominent lower section for the Human Player's Area (Cauldron canvas, current bag inventory count, Flask status, action buttons like "Draw" and "Stop").
    * A side panel (right side) summarizing the status of the AI Opponents (their current score, how far they brewed this round, if they exploded).


2.  **Define Global Game State (JavaScript):**
    * Create a main `GameController` class that manages the 9 rounds and current phase (Brewing vs Evaluation).
    * Create a `Player` class. It needs properties for: `isHuman` (boolean), `victoryPoints`, `rubies`, `money`, `flaskActive` (boolean), `dropletPosition` (int), `ratTails` (int), and an Inventory array for their ingredient bag.
    * Initialize the human player and placeholder AI players.
    * Define a configuration object allowing setup for 1, 2, or 3 AI opponents.


3.  **Define Ingredient Constants:**
    * Create a constant data structure defining the basic ingredient types: White (Boomberry), Orange (Pumpkin), Red (Toadstool), Yellow (Mandrake), Green (Spider), Blue (Ghost), Purple (Moth), Black (Crow Skull).
    * Define their available values (chips are usually numbered 1, 2, or 4, except some specials).


**Output Requirement:**
Provide the HTML, CSS, and initial JS setup defining these structures and laying out the empty containers on the screen.

PROMPT 2: The Brewing Phase Engine (The Core Loop)
Goal: Implement the mechanics of drawing chips, placing them on the spiral track, checking for explosions, and stopping.
Prompt Content:
(Builds on previous code)
Markdown
**Task 2: The Brewing Engine**


Now we implement the core gameplay loop for the Human player's brewing phase.


1.  **Starting Inventory:** In the `GameController` initialization, ensure every player starts with the standard bag: 1x Green-1, 1x Orange-1, 4x White-1, 2x White-2, 1x White-3.


2.  **The Cauldron Track Logic (Crucial):**
    * The cauldron is a spiral track. Position 0 is the center. The track spirals outwards.
    * Implement logic to calculate the next position. If a player draws a chip with value '2', it is placed 2 spaces ahead of the previous chip.
    * The starting position is determined by the player's `dropletPosition`.


3.  **The Draw Action:**
    * Implement a "Draw Ingredient" button function for the human player.
    * It should pick a random ingredient from their current bag inventory.
    * Remove it from the bag temporarily and place it on the Cauldron Canvas at the correct next position on the spiral track. *Note: For now, just render a colored circle with a number on the canvas.*


4.  **Explosion Logic:**
    * Track the sum of "White" (Boomberry) chips played in the current brew.
    * If the sum exceeds 7, the cauldron EXPLODES.
    * If exploded, the player is forced to stop brewing immediately. They cannot draw more. Mark them visually as "Exploded."


5.  **Stop Action & The Flask:**
    * Implement a "Stop Brewing" button. If pressed, the brewing phase ends for the player.
    * Implement the Flask: If the last drawn chip was White, before drawing again or stopping, the player can click their Flask UI element to return that White chip to the bag. The Flask is then used (inactive) until recharged.


6.  **AI Placeholder:** For this step, AI players should automatically draw until their white sum is >= 6, then stop.


**Output Requirement:**
Update the JS to handle the drawing logic, canvas rendering of chips on a spiral path, explosion checking, and the stop/flask buttons.


PROMPT 3: The Evaluation Phase (Scoring & Economy)
Goal: Implement the complex sequence of events that happens after everyone stops brewing.
Prompt Content:
(Builds on previous code)
Markdown
**Task 3: The Evaluation Phase**


Once all players have stopped brewing, the Round proceeds to Evaluation. This must happen in a strict order.


Create a function `runEvaluationPhase()` in the GameController that steps through these:


1.  **Determine Scoring Space:** For each player, identify the space directly *after* their last placed chip. The value written on that space on the board determines their gained Victory Points (VP) and Money for the round.
    * *Important:* If a player Exploded, they must choose: take VPs OR take Money. They cannot have both. (Implement a simple UI dialog for the human player to choose if exploded). Non-exploded players get both.


2.  **Bonus Die:** The player who reached the furthest on the track (if not exploded) rolls a bonus die for a small reward (e.g., 1 VP, 1 Ruby, move droplet). (Implement a placeholder randomizer for this).


3.  **Chip Actions (Placeholder):** Some chips (Black, Green, Purple) have end-of-round effects. Create empty hook functions for these for now (e.g., `evaluateBlackChips()`), we will implement specific books later.


4.  **Rubies:** Any player whose scoring space has a ruby icon gains 1 ruby.


5.  **Update Scores:** Add earned VPs to the global tracker.


6.  **Buying Phase:**
    * Create a shop UI displaying available ingredients for purchase (Orange, Red, Yellow, Green, Blue, Purple, Black) and their costs.
    * Players spend the Money earned this round.
    * Rules: Players can buy up to 2 ingredients of *different* colors.
    * Purchased ingredients are added to their bag for the next round.


7.  **Cleanup:** All played chips return to the player's bag. Flasks are recharged if a Ruby is spent.


**Output Requirement:**
Implement the state transitions for the evaluation phase, the scoring logic based on track position, handling the explosion penalty choice, and the basic UI for the buying phase.


PROMPT 4: Game Flow, Rats, and Fortune Tellers
Goal: Tie the rounds together, implement catch-up mechanics, and add round-start variability.
Prompt Content:
(Builds on previous code)
Markdown
**Task 4: Round Structure and Catch-up Mechanics**


1.  **Round Management:** Ensure the `GameController` loops through 9 rounds. Update a UI display showing the current Round number (1/9).


2.  **The Rats (Catch-up Mechanic):**
    * At the very start of a round (before brewing), calculate Rat Tails.
    * Find the Leading Player (highest VP).
    * For every other player, count how many "rat tails" are visible on the VP track between them and the Leader.
    * Their starting position on the cauldron spiral is moved forward by that many spaces for this round only. Update the brewing logic to account for this temporary start offset.


3.  **Fortune Teller Cards:**
    * Create a data array of at least 10 simple Fortune Teller card effects (e.g., "Immediately gain 1 Ruby," "If you don't explode this round, gain extra 2 VP," "Roll the bonus die now").
    * At the start of each round, pick one random card, display it in the UI, and apply its effect immediately or set a flag for its conditional effect later in the round.


**Output Requirement:**
Implement the 9-round loop structure, the logic for calculating and applying Rat Tails offsets at the start of rounds, and the basic system for drawing and displaying Fortune Teller cards.


PROMPT 5: Ingredient Books and Specific Round Triggers
Goal: Implement the variable powers of ingredients and events that happen at specific rounds.
Prompt Content:
(Builds on previous code)
Markdown
**Task 5: Ingredient Books & Timed Events**


This is the most complex part of the logic. We need variable chip effects.


1.  **Ingredient Book Architecture:**
    * Refactor the chip evaluation logic. Instead of hardcoded effects, create an `IngredientBookRegistry`.
    * For each color (Red, Yellow, Green, Blue, Purple, Black), we need different "sets" of rules (Set 1, Set 2, etc., as per the board game).
    * Implement "Set 1" for all colors as the default configuration.
    * *Example Check:* Red chips usually give immediate bonus moves on the track if the bag has enough orange chips. Blue chips usually allow drawing X, picking 1, and putting the rest back.


2.  **Implementing Triggers within the phases:**
    * Update the Brewing Phase to check for "Immediate" effects when a chip is drawn (e.g., Red and Blue books often trigger here).
    * Update the Evaluation Phase to check for "End of Round" effects (e.g., Green, Purple, Black books often trigger here).


3.  **Specific Round Timed Events:**
    * Modify the Buying Phase UI so Yellow (Mandrake) chips are only purchasable after Round 2 ends (start of Round 3 buying phase).
    * Modify the Buying Phase UI so Blue (Ghost) chips are only purchasable after Round 3 ends.
    * **Round 5 Trigger:** At the *end* of Round 5 evaluation, automatically add one 1-value White (Boomberry) chip to every player's bag.


4.  **Final Round (Round 9):**
    * At the end of Round 9 evaluation, players can spend remaining Rubies and Money for VPs (standard rate: 5 money = 1 VP, 2 rubies = 1 VP).
    * Display a "Game Over" screen announcing the winner.


**Output Requirement:**
Refactor the code to handle swappable Ingredient Book logic for at least "Set 1" of all colors. Implement the round-gating for purchasing Mandrakes/Ghosts and the automatic Boomberry add in Round 5. Implement final scoring.

Part 2: The Graphics

These prompts are designed to create the visual assets the code above will need.
Style Guide (Mental Note for AI): Hand-drawn, watercolor and ink, whimsical medieval cartoon town, slightly textured paper feel. Warm color palette.
IMAGE PROMPT 1: The Human Player's Cauldron (Main Board)
Prompt:
A top-down photograph of a hand-drawn, cartoon medieval alchemist's cauldron printed on textured board game cardboard. The cauldron is a large bronze pot occupying most of the frame. Inside the pot, a swirling spiral path made of circular spaces starts from the dead center and winds outwards to the rim. There are roughly 50-60 circular spaces along the path. Some spaces along the path have small, hand-drawn icons and numbers written on them (representing money values and victory points). The liquid background inside the pot is a bubbling, swirling green brew. Around the outside rim of the bronze pot are small slots to hold tokens. The overall art style is whimsical, watercolor and ink medieval fantasy.

Generate a top-down photograph of a hand-drawn, cartoon medieval alchemist's cauldron printed on textured board game cardboard. The cauldron is a large bronze pot, which is the main object of this image and must be shown in its entirety. The liquid background inside the pot is a bubbling, swirling green brew. The overall art style is whimsical, watercolor and ink medieval fantasy.
The entire cauldron is visible, including the rim, with a little extra space to the edge of the generated image. In that extra space we can see a light wooden floor, in the same style. Inside the pot, a swirling spiral path made of circular spaces starts from the center and winds outwards to the rim. These spaces are intended as placeholders for the tokens which were generated separately. These placeholders are not perfect circles, rather they look like bubbles in the liquid. There are exactly 55 such placeholders along the path. The token placeholders along the path have numbers written on them (representing money values and victory points) The placeholder at the very middle of the cauldron has the value “0”, representing money, the one next to it on the outward spiral has the value “1”, and so on, with each placeholder showing a number that’s equal or one more than the previous. In addition, for some placeholders, there is also a red ruby drawn on the bottom right corner of the placeholder, but such that it does not cover the numeric value. Finally, starting from the 7th placeholder (going from the middle outward), on every placeholder there is an additional numeric value representing “victory points”. These appear as a yellowish scroll with a number imprinted on it. The following list describes the values that should appear on each placeholder, in the order going from the center and spiraling out toward the rim. There must be a clear spiral path of placeholders going from the very middle to the rim, such that it’s always obvious where the next placeholder is. Do not put the placeholders in multiple concentric circles, rather in a single spiraling path. Placeholder 0 is at the very middle. See reference image for how there should be a spiral of placeholders.
Follow the table below which describes the values on each placeholder. Each row in the table explains which artifacts should be drawn on a placeholder. The data is organized in four columns: “Placeholder index” - where index 0 is the central placeholder, index 1 is just next to 0, index 2 is just next to index 1 going in an outward spiral from the center, and index 54 is close to the rim. “Money Value” is the number written on the placeholder. “Ruby?” indicates whether or not there should be a red ruby drawn on the bottom right. “VP” indicates the number of victory points, if that number is not “None”, then this number should appear on a yellowish scroll on the bottom left corner of the placeholder bubble.
For example, the line “0 | 0 | no | None” means that the inner-most placeholder should have the number “0” written in it, have NO ruby and NO scroll with victory points. The line “9 | 6 | yes | 1” means that the placeholder that you get to when counting 9 from the middle and going in a spiral, should have the number “6” written on it, should have a red ruby at the bottom right and a yellowish scroll with the number 1 at the bottom left.

Placeholder index | Money value | Ruby? | VP
```python
import math
rubies = {5, 9, 13, 16, 20, 24, 30, 34, 36, 40, 42, 46, 50, 52}
ruby = lambda i : "yes" if i in rubies else "no"
money = lambda i : math.ceil(i*0.64)
def vp(i):
 if i<=5:
  return 0
 if i<=9:
  return 1
 if i<=14:
  return 2
 if i<=17:
  return 3
 if i<=21:
  return 4
 if i<=26:
  return 5
 if i<=31:
  return 6
 if i<=36:
  return 7
 if i<=41:
  return 8
 if i<=46:
  return 9
 if i<=51:
  return 10
 return 12


for i in range(55):
 print(f’{i} | {money(i)} | {ruby(i)} | {vp(i)}’)
```


IMAGE PROMPT 2: Ingredient Chips (Tokens)
Prompt:
A collection of hand-drawn, circular cardboard board game tokens, viewed top-down. Each token has a thick border and a clear numeric value (1, 2, or 3) written prominently on it.
White Token: A white circle with a cartoon drawing of white "boom berries" (like mistletoe) and the number '1', '2', or '3'.
Orange Token: An orange circle with a cartoon pumpkin drawing and the number '1' or '6'.
Red Token: A red circle with a red toadstool mushroom drawing and the number '1', '2', or '4'.
Yellow Token: A yellow circle with a gnarled mandrake root drawing and the number '1', '2', or '4'.
Green Token: A green circle with a cartoon spider drawing and the number '1', '2', or '4'.
Blue Token: A blue circle with a cute cartoon ghost drawing and the number '1', '2', or '4'.
Purple Token: A purple circle with a moth drawing and the number '1'.
Black Token: A dark grey circle with a crow skull drawing and the number '1'.
The style is consistent: hand-drawn ink and watercolor.
IMAGE PROMPT 3: Utility Items (Flask, Ruby, Droplet, Rats)
Prompt:
Generate an image of a set of hand-drawn board game components in a medieval cartoon style. The elements are spaced out from each other, to allow for a video game to use them as separate assets. The output should be a PNG with a transparent background.
The Flask (Full): A cardboard token shaped like a glass alchemist's flask filled with purple liquid, sealed with a cork.
The Flask (Empty): The same flask token, but the glass is empty and cracked, looking used.
Ruby: A small, irregularly cut red gemstone token, sparkling cartoonishly.
Droplet Token: A teardrop-shaped wooden meeple painted blue, representing water.
Rat Token: A small cardboard token shaped like a brown rat's tail.
VP Scroll: A small yellowish scroll, unrolled open.


IMAGE PROMPT 4: UI Elements (Books and Background)
Prompt:
Hand-drawn UI elements for a fantasy board game. The output should be a PNG with a transparent background.
Background: A wide view of a whimsical, cluttered medieval alchemist's laboratory, drawn in watercolor and ink. Shelves filled with weird bottles, dried herbs hanging from wooden beams, a fireplace in the back. It should look like a painted backdrop for a webpage.
Ingredient Book Frame: An empty, open medieval leather-bound book with blank, aged parchment pages. It is designed to have text overlaid onto it later. There are colored bookmarks sticking out (red, blue, green, yellow, purple, black).

The Integration Prompt (for Gemini Canvas)
Task: Visual Asset Integration & Canvas Refactoring
"Now that the core logic is functional, I want to replace the placeholder shapes and colors with the final hand-drawn graphic assets. Please refactor the code to implement an Asset Loader and update the rendering engine.
1. Asset Mapping:
Assume all images are in an assets/ folder. Please create a constant ASSET_PATHS object that maps game IDs to these filenames:
CAULDRON_BG: 'assets/cauldron_board.png'
CHIPS: ‘assets/tokens.png’. This image should be used with CSS image sprites to get the actual ingredient tokens.
UTILS: ‘assets/utils.png’. This image also contains sprites for in-game elements: flask_empty, flask_full, droplet, ruby, victory_point, rat.
2. Implement an Image Preloader:
Create an AssetManager class or function that ensures all images are fully loaded before the GameController starts the first round. Add a simple 'Loading...' overlay to the HTML that disappears once Promise.all resolves for all images.
3. Refactor Cauldron Rendering:
Update the drawCauldron() function on the HTML5 Canvas:
Background: Instead of a green fill, use ctx.drawImage() to draw the CAULDRON_BG as the base layer.
Chips: Instead of drawing circles (ctx.arc), draw the corresponding ingredient chip image. Center the image on the spiral path coordinates. Scale the images so they fit neatly within the track spaces.
Text Overlay: Keep the numeric value of the chip drawn in a small, stylish font on top of the chip image if the value isn't already baked into the graphic.
4. Update UI Elements (CSS/HTML):
The Flask: Replace the button/div with an <img> tag or a background-image. Toggle the source between flask_full and flask_empty based on the flaskActive state.
Counters: Use the ruby and victory_point icons next to their respective numeric totals in the player's status bar.
Ingredient Books: Use the ingredient_book_bg as the background for the shop/market UI. Use CSS padding to ensure the text fits inside the 'pages' of the drawn book.
5. Smooth Transitions:
Add a simple fade-in effect when a chip is drawn, so it doesn't just 'pop' onto the canvas instantly.
Output Requirement:
Please provide the updated AssetManager code and the revised rendering functions for the Canvas and UI."




