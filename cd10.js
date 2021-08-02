import {
    cd10
} from "./module/config.js";

import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";
import CD10HeroSheet from "./module/sheets/CD10HeroSheet.js";

Hooks.once("init", function() {
    console.log("CD10 | Initialising CD10 RPG System");

    CONFIG.cd10 = cd10;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("cd10", CD10ItemSheet, {
        makeDefault: true
    });

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("cd10", CD10HeroSheet, {
        makeDefault: true
    });
});