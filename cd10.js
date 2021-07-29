import {
    cd10
} from "./module/config.js";

import CD10ItemSheet from "./module/sheets/CD10ItemSheet.js";

Hooks.once("init", function() {
    console.log("CD10 | Initialising CD10 RPG System");

    CONFIG.cd10 = cd10;

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("cd10", CD10ItemSheet, {
        makeDefault: true
    });
});