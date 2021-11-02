import {
    cd10
} from "./module/config.js";
import CD10Item from "./module/CD10Item.js";
import CD10Actor from "./module/CD10Actor.js";
import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";
import CD10NamedCharacterSheet from "./module/sheets/CD10NamedCharacterSheet.js";
import CD10MookCharacterSheet from "./module/sheets/CD10MookCharacterSheet.js";

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/cd10_dev/templates/partials/character-stat-block.hbs",
        "systems/cd10_dev/templates/partials/character-description-block.hbs",
        "systems/cd10_dev/templates/partials/weapon-card.hbs",
        "systems/cd10_dev/templates/partials/armor-card.hbs",
        "systems/cd10_dev/templates/partials/skill-list.hbs",
        "systems/cd10_dev/templates/partials/spell-list.hbs",
        "systems/cd10_dev/templates/partials/combat-tab.hbs",
        "systems/cd10_dev/templates/partials/inventory-list.hbs",
        "systems/cd10_dev/templates/partials/generic-item-data.hbs",
        "systems/cd10_dev/templates/partials/small-weapon-stats.hbs",
        "systems/cd10_dev/templates/partials/small-armor-stats.hbs",
        "systems/cd10_dev/templates/partials/small-skill-stats.hbs",
        "systems/cd10_dev/templates/partials/small-trait-stats.hbs",
        "systems/cd10_dev/templates/partials/small-spell-stats.hbs"
    ];

    return loadTemplates(templatePaths);
}
Hooks.once("init", function() {
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
        label: "CD10 Hero/Villain Sheet"
    });

    Actors.registerSheet("cd10", CD10MookCharacterSheet, {
        types: ["mook"],
        makeDefault: true,
        label: "CD10 Mook/Monster Sheet"
    });

    /* Load Handlebars helpers and partials */
    preloadHandlebarsTemplates();

    Handlebars.registerHelper("times", function(n, content) {
        /* Handlebars helper to run a for-loop. Used to render dots on sheets. */

        let result = "";
        for (let i = 0; i < n; ++i) {
            content.data.index = i + 1;
            result += content.fn(i);
        }

        return result;
    });

    console.log("==== CD10 | Pushing TinyMCE CSS ====");
    CONFIG.TinyMCE.content_css.push(`systems/cd10_dev/less/cd10_tinymcemods.css`);
});