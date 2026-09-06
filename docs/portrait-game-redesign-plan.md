# Tablet Portrait Game Redesign Plan

## 1. Redesign Goals

This branch redesigns the project from a landscape web/tablet UI into a tablet portrait game UI. The first implementation target remains the web browser, but the layout should be structured so it can later move toward a mobile or tablet app shell without rewriting the core screens.

The target aspect ratio is tablet portrait 3:4 / iPad portrait. On desktop browsers, the app should appear as a centered iPad portrait game frame rather than a full-width web dashboard. The visual direction should closely follow casual kids tablet game references: layered background art, character art, panel images, button art, and large touch targets.

Important terminology:

- `tablet portrait` means the device is upright, with height greater than width.
- The target aspect ratio is width:height = 3:4.
- This is not tablet landscape.
- This is not a full-width desktop web layout.
- The app should appear as a centered iPad-like portrait frame inside the browser.

This branch should reduce visible features, not add more. Existing game systems and data should be preserved where possible, while complex or non-MVP surfaces are hidden from the UI. The goal is a clearer loop: train, earn coins, buy items, care for dinosaurs, hatch and collect.

The UI should move away from generic CSS card layouts. Screens should be composed like game scenes, with background, panels, buttons, icons, and characters placed as layered assets. Dynamic text and numbers must remain React-rendered text above the images, not baked into image files.

## 2. Target Screen Standard

- Primary aspect ratio: tablet portrait 3:4 / iPad portrait
- Width is always smaller than height in the primary frame.
- Reference design sizes: `768x1024`, `820x1093`, `834x1112`, or `1024x1366`
- High-resolution asset production size: `1536x2048` or another 3:4 tablet scale
- App container max width: around `820px`
- App height: `100dvh`
- Desktop behavior: center the tablet portrait app frame in the browser
- Tablet behavior: prioritize the 768-834px portrait width range
- Phone behavior: remain usable where possible, but phone layout is a secondary goal

The first technical target should be a `PortraitAppShell`, `TabletAppShell`, or equivalent wrapper that constrains the current app into a 3:4 tablet portrait frame. This allows existing systems to continue running while screens are replaced one by one.

## 3. Bottom Tab Structure

The redesign branch reduces the bottom navigation to five visible tabs.

Visible tabs:

- Training
- My Dinosaur
- Shop
- Dex
- Settings

Hidden tabs:

- Playground
- Adventure
- Hatchery as an independent tab
- Other temporary tabs

Important structure decision:

- Hatchery is not a bottom tab.
- Hatchery becomes a child screen inside the My Dinosaur tab.
- The navigation relationship is `My Dinosaur > Hatchery`.
- Closing or leaving Hatchery returns to the My Dinosaur tab.

Playground and Adventure code/data should not be deleted in the first pass. They should be hidden or left as future/disabled surfaces.

## 4. Core Game Flow

The target loop for this branch is:

1. The child solves abacus problems in Training.
2. Training completion grants coins.
3. The child spends coins in Shop.
4. Purchased items are used for the dinosaur, growth, recovery, or care.
5. Shop sells fragment items required to unlock rare eggs or specific eggs.
6. Collecting fragments unlocks a rare egg or target dinosaur egg.
7. Hatchery is accessed inside My Dinosaur.
8. Hatched dinosaurs are registered in Dex.
9. Dex shows collection progress.
10. The child returns to Training to earn more coins.

This loop should be visible in navigation and result actions. Training completion should offer direct paths to retry, Shop, or My Dinosaur.

## 5. Reward Structure Changes

The current training result shows several reward and stat changes. This branch simplifies the visible reward model.

Directly awarded and displayed after training:

- Coins only

Do not directly display after training:

- Dinosaur EXP reward
- Happiness change
- Stamina change
- Random item reward

Existing internal systems for EXP, happiness, stamina, inventory, and item rewards should not be deleted immediately. They may remain available for My Dinosaur, item usage, tuning, or later expansion. The UI should simply stop presenting training as a multi-reward settlement screen.

## 6. Coin Economy

Coins become the main bridge between Training and the rest of the game.

Coin uses:

- Buy food
- Buy recovery items
- Buy costumes
- Buy egg fragments
- Buy rare egg unlock fragments

Example shop categories:

- Food items
- Stamina recovery items
- Happiness items
- Costumes
- Normal eggs
- Rare egg fragments
- Specific dinosaur egg fragments

The first implementation should keep the economy simple and readable. Avoid adding complex probability tables or time gates in this pass.

## 7. Rare Egg And Fragment System

This branch should prefer fragment collection over directly granting rare eggs.

Example rules:

- Collect 10 rare egg fragments to unlock 1 rare egg.
- Collect 20 specific dinosaur fragments to unlock that dinosaur egg.
- Fragments can be purchased in Shop with coins.
- Later, fragments can also come from events or quests.

First pass scope:

- Define simple data shape and UI flow.
- Avoid complex random probability systems.
- Avoid adding event or quest systems yet.
- Keep Hatchery as a child screen of My Dinosaur.

## 8. Tab Roles

### Training

- Abacus problem solving
- Minimal problem count and difficulty controls
- Training result gives coins only
- Completion actions: retry, go to Shop, go to My Dinosaur
- Preserve problem generation, answer checking, and BLE input logic

### My Dinosaur

- Emotional center of the app
- Shows the selected main dinosaur large
- Supports feeding and care item use
- Shows current status
- Provides a button to enter Hatchery
- Hatchery close action returns here

### Shop

- Sells items for coins
- Includes food, recovery items, costumes, egg fragments
- Purchased items go to inventory
- Items are then used from My Dinosaur or related child UI

### Dex

- Shows discovered dinosaurs
- Shows silhouettes for undiscovered dinosaurs
- Shows collection status by habitat, region, or rarity
- Hatched dinosaurs are registered here
- Layout should be tablet portrait first, not desktop grid-first or phone-width first

### Settings

- Fifth bottom tab in the portrait MVP
- Uses a compact tablet-friendly list, not the full desktop settings layout
- Keeps essential training controls visible:
  - digit size: one-digit, two-digit, three-digit
  - number count inside a problem: 3 to 8
  - operation mode: add, subtract, mixed add/subtract
  - Bluetooth abacus connection/testing entry
- More advanced developer settings can remain hidden in code for now

### Hatchery

- Child screen inside My Dinosaur
- Shows owned eggs
- Supports hatching
- Registers hatched dinosaurs in Dex
- Close/back returns to My Dinosaur
- Not shown in bottom navigation

## 9. Playground Handling

Playground is blocked for this branch MVP.

- Remove from bottom navigation.
- Do not delete existing code/data in the first pass.
- It can remain hidden or marked as future/coming soon.
- It is outside the first MVP scope.

## 10. UI Direction

The UI should feel like a portrait casual dinosaur game.

Key direction:

- Tablet portrait game screen
- Large layered background art
- Character-centered screens
- Image-based panels and buttons
- React-rendered text on top of image assets
- Large bottom game buttons
- Compact top HUD for profile, coins, dex, and settings-like actions
- Avoid generic web dashboard/card composition

Dynamic text and numbers must remain in code:

- Dinosaur name
- Level
- Coins
- EXP/status values
- Training problem text
- Shop prices
- Dex counts

Images should provide frames, mood, and game feel, not dynamic content.

## 11. Asset Strategy

Expected asset categories:

- Background images
- Character images
- Panel images
- Button images
- Icon images
- Tab button images
- Dex card frame images
- Egg and shop item images

Assets should be layered in React/CSS:

- Background image at the screen layer
- Character image as a main focal layer
- Panel images as information containers
- Buttons as image or styled game button layers
- Text and values rendered above assets

Prefer transparent PNG assets for panels, buttons, and characters. Use `object-contain` for character and panel assets where distortion is risky. Use `object-cover` for full-scene backgrounds when cropping is acceptable.

## 12. Existing Code To Preserve

Reuse these systems where possible:

- Abacus problem generation logic
- Answer checking logic
- BLE input logic
- Coin reward logic
- Dinosaur data structure
- Dex discovery structure
- Item and inventory structure
- Egg and dinosaur unlock structures

Refactoring is allowed when it helps isolate UI from logic, but logic behavior should not be rewritten during the first screen conversion.

## 13. Existing UI To Reduce Or Hide

Reduce or hide:

- Landscape layout
- Six-or-more bottom tabs
- Playground
- Adventure
- Complex training result rewards
- Direct item rewards from training
- Excessive settings options
- Desktop-style Dex layout
- Desktop/tablet card-heavy screen composition

The first implementation should hide before deleting. Deletion can happen after the portrait MVP proves the new structure.

## 14. First Implementation Scope

### Step 1: Planning And Scope Lock

- Create this document.
- Confirm five bottom tabs.
- Define Hatchery as My Dinosaur child screen.
- Hide Playground, Adventure, Hatchery tab, and other temporary tabs.

### Step 2: Tablet Portrait App Frame

- Create the tablet portrait app frame.
- Use a centered `max-width` around `820px`.
- Use `height: 100dvh`.
- Prefer `aspect-ratio: 3 / 4` where it can fit the browser viewport cleanly.
- Keep PC browser display as an iPad portrait app frame.
- Recommended initial screen: My Dinosaur.
- Training can remain reachable from the bottom tab.

All primary screens will be redesigned around this tablet portrait baseline:

- Home
- Training
- My Dinosaur
- Shop
- Dex
- Settings

Phone support remains a later responsive pass, not the first design target.

### Step 3: My Dinosaur Portrait Screen

- Rebuild My Dinosaur as a portrait game scene.
- Place selected dinosaur as the visual center.
- Use background, character, and panel assets as layers.
- Include feed/item actions.
- Include Hatchery entry button.

### Step 4: Training Portrait Screen

- Rebuild Training for portrait.
- Keep problem readability and input reliability.
- Keep BLE input.
- Show coins as the only training reward.
- Completion actions: retry, Shop, My Dinosaur.

### Step 5: Shop Simplification

- Rebuild Shop as a tablet portrait shop.
- Group items into clear categories.
- Include food, recovery items, costumes, egg fragments.
- Keep purchases tied to the existing inventory and coin systems.

### Step 6: Dex Portrait Screen

- Rebuild Dex for vertical collection browsing.
- Show discovered dinosaurs and silhouettes.
- Add simple collection progress by rarity/habitat if data is already available.

## 15. Suggested Next Code Plan

Before large UI changes, make small structural changes that reduce risk.

Recommended file order:

1. `src/App.tsx`
   - Introduce tablet portrait app shell constraints.
   - Reduce visible bottom tabs to Training, My Dinosaur, Shop, Dex.
   - Set My Dinosaur as the recommended initial tab for this branch.
   - Route Hatchery as a child state under My Dinosaur instead of a bottom tab.

2. Bottom tab component area in `src/App.tsx`
   - Extract tab metadata if needed.
   - Replace wide tab layout with large portrait game buttons.
   - Hide Playground, Adventure, Hatchery, and other temporary tabs from visible tabs.

3. `src/components/screens/DinosaurRoomScreen.tsx`
   - Treat this as the first full tablet portrait screen conversion.
   - Add Hatchery child entry action.
   - Keep feeding, inventory, and selected dinosaur data intact.

4. `src/components/screens/HatcheryScreen.tsx`
   - Convert to a child screen that can be opened from My Dinosaur.
   - Ensure back/close returns to My Dinosaur.
   - Preserve hatching and discovery registration logic.

5. Training-related UI in `src/App.tsx` and `src/hooks/useTrainingSession.ts`
   - Keep generation and checking logic.
   - Simplify visible result rewards to coins only.
   - Hide EXP/happiness/stamina reward display from training completion.

6. `src/components/screens/ShopScreen.tsx` and item config files
   - Simplify shop categories.
   - Add or expose fragment items through existing inventory structure.
   - Keep coin purchase flow.

7. `src/components/screens/DexScreen.tsx`
   - Convert from desktop-style layout to portrait collection browsing.
   - Preserve discovered/undiscovered state.

8. Asset organization
   - Add portrait-specific asset folders as needed.
   - Keep dynamic text out of images.
   - Prefer reusable panel/button/image-layer components after two or more screens share the same pattern.

## 16. Open Decisions

- Whether My Dinosaur or Training should be the default first tab. Recommendation: My Dinosaur, because it creates emotional context before training.
- Whether Settings should expose full desktop settings or a compact tablet list. Recommendation: expose Settings as the fifth bottom tab, but keep it compact for MVP.
- Whether egg fragments live as regular inventory items or a separate fragment record. Recommendation: use inventory items first, then split later only if the economy becomes more complex.
- Whether normal eggs can be bought directly. Recommendation: allow normal eggs directly, require fragments for rare/specific eggs.

## 17. Non-Goals For This Branch MVP

- New adventure system
- New playground interactions
- Complex gacha probability system
- Event/quest reward system
- Native mobile/tablet packaging
- Full redesign of every screen in the first commit

The first success criterion is a clear tablet portrait game loop using existing logic: My Dinosaur, Training, Shop, Dex, and Hatchery as a child screen.
