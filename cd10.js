import { CD10 } from "./module/config.js";
import CD10Item from "./module/CD10Item.js";
import CD10Actor from "./module/CD10Actor.js";
import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";
import CD10MajorCharacterSheet from "./module/sheets/CD10MajorCharacterSheet.js";
import CD10MinorCharacterSheet from "./module/sheets/CD10MinorCharacterSheet.js";
import CD10Combatant from "./module/combat/CD10Combatant.js";

/**
 * Loads HandleBars templates for use in the system.
 */
async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/cd10/templates/partials/sheet-tabs/character-stat-block.hbs",
    "systems/cd10/templates/partials/sheet-tabs/character-description-block.hbs",
    "systems/cd10/templates/partials/sheet-tabs/skill-list.hbs",
    "systems/cd10/templates/partials/sheet-tabs/spell-list.hbs",
    "systems/cd10/templates/partials/sheet-tabs/combat-tab.hbs",
    "systems/cd10/templates/partials/sheet-tabs/inventory-list.hbs",
    "systems/cd10/templates/partials/equipment-cards/meleeWeapon-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/rangedWeapon-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/armor-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/shield-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/small-weapon-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/small-ranged-weapon-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/small-armor-card.hbs",
    "systems/cd10/templates/partials/equipment-cards/small-shield-card.hbs",
    "systems/cd10/templates/partials/item-sheet-components/generic-item-data.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-weapon-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-ranged-weapon-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-armor-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-shield-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-skill-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-trait-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-spell-stats.hbs",
    "systems/cd10/templates/partials/skill-card.hbs"
  ];

  return loadTemplates(templatePaths);
}

/**
 * Register all system settings necessary.
 */
function registerSystemSettings() {
  /* Register the settings for the system. */
  /* Whether to allow infinitely exploding 9's or not. */
  game.settings.register("cd10", "explodingNines", {
    config: true,
    scope: "world",
    name: "SETTINGS.explodingNines.name",
    hint: "SETTINGS.explodingNines.label",
    type: Boolean,
    default: true
  });

  // Whether or not to include rate of fire, magazine and such stats.
  game.settings.register("cd10", "systemModernity", {
    config: true,
    scope: "world",
    name: "SETTINGS.modernity.name",
    hint: "SETTINGS.modernity.label",
    type: Boolean,
    default: false
  });

  // Option to use barter. Defaults to coinage.
  game.settings.register("cd10", "systemBarter", {
    config: true,
    scope: "world",
    name: "SETTINGS.barter.name",
    hint: "SETTINGS.barter.label",
    type: Boolean,
    default: false
  });
  /* Option to choose if item, weapon and skill descriptions
        should be dumped to chat on use. */
  game.settings.register("cd10", "systemDumpDescriptions", {
    config: true,
    scope: "world",
    name: "SETTINGS.dumpDescriptions.name",
    hint: "SETTINGS.dumpDescriptions.label",
    type: Boolean,
    default: true
  });

  // Whether or not to include images in chat messages.
  game.settings.register("cd10", "systemShowImageInChat", {
    config: true,
    scope: "world",
    name: "SETTINGS.showImages.name",
    hint: "SETTINGS.showImages.label",
    type: Boolean,
    default: true
  });

  /* Store version number for migration purposes. */
  game.settings.register("cd10", "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: String,
    default: ""
  });
}

Hooks.once("init", function() {
  console.log("==== CD10 | Initialising CD10 RPG System ====");


  /* Setup Config */
  CONFIG.cd10 = CD10;
  CONFIG.Item.documentClass = CD10Item;
  CONFIG.Actor.documentClass = CD10Actor;
  CONFIG.Combatant.documentClass = CD10Combatant;

  /* Register Sheets */
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("cd10", CD10ItemSheet, {
    makeDefault: true
  });

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("cd10", CD10MajorCharacterSheet, {
    types: ["major"],
    makeDefault: true,
    label: "CD10 Major Character Sheet"
  });

  Actors.registerSheet("cd10", CD10MinorCharacterSheet, {
    types: ["minor"],
    makeDefault: true,
    label: "CD10 Minor Character Sheet"
  });

  /* Load Handlebars helpers and partials */
  preloadHandlebarsTemplates();
  /* Register all system settings for CD10 */
  registerSystemSettings();

  Handlebars.registerHelper("times", function(n, content) {
    /* Handlebars helper to run a for-loop. Used to render dots on sheets. */

    let result = "";
    for (let i = 0; i < n; ++i) {
      content.data.index = i + 1;
      result += content.fn(i);
    }

    return result;
  });

  Handlebars.registerHelper("skills", function() {
    let skills = [];
    game.items.forEach(s => {
      skills.push(s.name);
    });
    return skills;
  });

//  Console.log("==== CD10 | Pushing TinyMCE CSS ====");
//  CONFIG.TinyMCE.content_css.push("systems/cd10/cd10-tinymce.css");
});

// Override the spinning pause Icon with a CD10 Logo.
Hooks.on("renderPause", (_app, html, options) => {
  html.find('img[src="icons/svg/clockwork.svg"]').attr("src", "systems/cd10/assets/icons/cd10-logo-circle.webp");
});

// Change the GM's tag to "Keeper".
Hooks.on("renderPlayerList", html => {
  const players = html.element.find(".player-name");

  for (let player of players) {
    const playerCharacterName = player.innerText;
    const playerName = playerCharacterName.substring(0, playerCharacterName.indexOf("[")).trim();
    const userId = game.users.find(x => x.name === playerName)?.id;
    const user = game.users.get(userId);
    if (user.isGM) {
      player.innerText = `${playerName} [Keeper]`;
    }
  }
});
