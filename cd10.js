import { cd10 } from "./module/config.js";
import CD10Migration from "./module/CD10Migration.js";
import CD10Item from "./module/CD10Item.js";
import CD10Actor from "./module/CD10Actor.js";
import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";
import CD10NamedCharacterSheet from "./module/sheets/CD10NamedCharacterSheet.js";
import CD10MookCharacterSheet from "./module/sheets/CD10MookCharacterSheet.js";

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/cd10/templates/partials/sheet-tabs/character-stat-block.hbs",
    "systems/cd10/templates/partials/sheet-tabs/character-description-block.hbs",
    "systems/cd10/templates/partials/sheet-tabs/skill-list.hbs",
    "systems/cd10/templates/partials/sheet-tabs/spell-list.hbs",
    "systems/cd10/templates/partials/sheet-tabs/combat-tab.hbs",
    "systems/cd10/templates/partials/sheet-tabs/inventory-list.hbs",
    "systems/cd10/templates/partials/equipment-cards/weapon-card.hbs",
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
    "systems/cd10/templates/partials/item-sheet-components/small-ammo-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-skill-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-trait-stats.hbs",
    "systems/cd10/templates/partials/item-sheet-components/small-spell-stats.hbs",
    "systems/cd10/templates/partials/spell-card.hbs",
  ];

  return loadTemplates(templatePaths);
}

function registerSystemSettings() {
  /* Register the settings for the system. */
  /* Setup how damage types are to be handled. If Simple is selected, each weapon defaults
        to their highest value. */
  game.settings.register("cd10", "systemDamageTypes", {
    config: true,
    scope: "world",
    name: "SETTINGS.damageTypes.name",
    hint: "SETTINGS.damageTypes.label",
    type: String,
    choices: {
      simple: "Single damage type",
      standard: "Slash, Blunt, Pierce",
      complex: "Slash, Blunt, Pierce, Energy",
    },
    default: "b",
  });

  game.settings.register("cd10", "systemModernity", {
    config: true,
    scope: "world",
    name: "SETTINGS.modernity.name",
    hint: "SETTINGS.modernity.label",
    type: Boolean,
    default: false,
  });

  /* Option to use barter. Defaults to coinage. */
  game.settings.register("cd10", "systemBarter", {
    config: true,
    scope: "world",
    name: "SETTINGS.barter.name",
    hint: "SETTINGS.barter.label",
    type: Boolean,
    default: false,
  });
  /* Option to choose if item, weapon and skill descriptions
        should be dumped to chat on use. */
  game.settings.register("cd10", "systemDumpDescriptions", {
    config: true,
    scope: "world",
    name: "SETTINGS.dumpDescriptions.name",
    hint: "SETTINGS.dumpDescriptions.label",
    type: Boolean,
    default: true,
  });

  /* Check if migration is needed */
  game.settings.register("cd10", "systemMigrationVersion", {
    config: false,
    scope: "world",
    type: String,
    default: "",
  });
}

Hooks.once("init", function () {
  console.log("==== CD10 | Initialising CD10 RPG System ====");

  /* Setup Config */
  CONFIG.cd10 = cd10;
  CONFIG.Item.documentClass = CD10Item;
  CONFIG.Actor.documentClass = CD10Actor;

  /* Register Sheets */
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("cd10", CD10ItemSheet, {
    makeDefault: true,
  });

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("cd10", CD10NamedCharacterSheet, {
    types: ["named"],
    makeDefault: true,
    label: "CD10 Hero/Villain Sheet",
  });

  Actors.registerSheet("cd10", CD10MookCharacterSheet, {
    types: ["mook"],
    makeDefault: true,
    label: "CD10 Mook/Monster Sheet",
  });

  /* Load Handlebars helpers and partials */
  preloadHandlebarsTemplates();
  /* Register all system settings for CD10 */
  registerSystemSettings();

  Handlebars.registerHelper("times", function (n, content) {
    /* Handlebars helper to run a for-loop. Used to render dots on sheets. */

    let result = "";
    for (let i = 0; i < n; ++i) {
      content.data.index = i + 1;
      result += content.fn(i);
    }

    return result;
  });

  Handlebars.registerHelper("highest", function (slash, blunt, pierce, energy) {
    /* Helper for converting a 4 damage type weapon into a simple, single type weapon if simple
                       damage model is set. */
    let highest = Math.max(slash, blunt, pierce, energy);
    return highest;
  });

  Handlebars.registerHelper("skills", function() {
        let skills = [];
        game.items.forEach((s) => {
            skills.push(s.name);
        });
    return skills;
  });

  console.log("==== CD10 | Pushing TinyMCE CSS ====");
  CONFIG.TinyMCE.content_css.push(`systems/cd10/less/cd10_tinymcemods.css`);
});

Hooks.once("ready", function () {
  if (!game.user.isGM) {
    return;
  }

  console.log("==== CD10 | Checking versions ====");

  const currentVersion = game.settings.get("cd10", "systemMigrationVersion");
  const NEEDS_MIGRATION_VERSION = "0.4.0";
  let needsMigration =
    !currentVersion || isNewerVersion(NEEDS_MIGRATION_VERSION, currentVersion);

  if (needsMigration) {
    CD10Migration(currentVersion);

    console.log(
      "==== CD10 | Updating settings version to",
      game.system.data.version,
      "from",
      currentVersion,
      "===="
    );
    game.settings.set(
      "cd10",
      "systemMigrationVersion",
      game.system.data.version
    );
    return;
  } else {
    console.log("==== CD10 | System up to date! Migration not needed. ====");
  }
});
