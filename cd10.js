import {
    cd10
} from "./module/config.js";

import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";
import CD10NamedCharacterSheet from "./module/sheets/CD10NamedCharacterSheet.js";

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
        makeDefault: true
    });

    preloadHandlebarsTemplates();

    Handlebars.registerHelper("times", function(n, content) {
        let result = "";
        for (let i = 0; i < n; ++i) {
            result += content.fn(i);
        }

        return result;
    });
});