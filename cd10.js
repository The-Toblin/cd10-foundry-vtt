import {
    cd10
} from "./module/config.js";

import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";
import CD10NamedCharacterSheet from "./module/sheets/CD10NamedCharacterSheet.js";
import CD10MookCharacterSheet from "./module/sheets/CD10MookCharacterSheet.js";

async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/cd10/templates/partials/character-stat-block.hbs",
        "systems/cd10/templates/partials/character-description-block.hbs",
        "systems/cd10/templates/partials/weapon-card.hbs",
        "systems/cd10/templates/partials/armor-card.hbs"
    ];

    return loadTemplates(templatePaths);
}
Hooks.once("init", function() {
    console.log("CD10 | Initialising CD10 RPG System");

    CONFIG.cd10 = cd10;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("cd10", CD10ItemSheet, {
        makeDefault: true
    });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("cd10", CD10NamedCharacterSheet, {
        types: ["hero", "nemesis"],
        makeDefault: true,
        label: "CD10 Hero/Villain Sheet"
    });
    Actors.registerSheet("cd10", CD10MookCharacterSheet, {
        types: ["fodder", "monster"],
        makeDefault: true,
        label: "CD10 Mook/Monster Sheet"
    });

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
});