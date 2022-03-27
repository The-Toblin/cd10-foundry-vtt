import { v030Migrate } from "./migrationscripts/v030Migrate.js";
import { v040Migrate } from "./migrationscripts/v040Migrate.js";

/**
 * Once cd10.js has determined migration needs to be done at all
 * this takes the version number and checks what kind of migration
 * is necessary based on the version of the world.
 * @param {string} currentVersion The current system version
 */
export default async function MigrateWorld(currentVersion) {
  const v030 = !currentVersion || isNewerVersion("0.3.9", currentVersion);
  const v040 = !currentVersion || isNewerVersion("0.4.0", currentVersion);

  let v030Data = {
    actors: [],
    items: [],
    tokens: []
  };
  let v040Data = {
    actors: [],
    items: [],
    tokens: []
  };
  let newData = {
    actors: [],
    items: [],
    tokens: []
  };

  if (v030) {
    /*
     * Version 0.3.0 mostly brought with it small changes, but the template change
     * from `weapon` to `meleeWeapon` and `rangedWeapon` and `armor` into `shield`
     * as well makes it necessary to change all this.
     */
    console.log("==== CD10 | Beginning v0.3.0 migration! ====");
    try {
      newData = await v030Migrate();
      if (newData.actors !== undefined) {
        v030Data.actors = newData.actors;
      }
      if (newData.items !== undefined) {
        v030Data.items = newData.items;
      }
      if (newData.tokens !== undefined) {
        v030Data.tokens = newData.tokens;
      }
      console.log("==== CD10 | v0.3.0 migration completed! ====");
    } catch(err) {
      console.error("==== CD10 | v0.3.0 migration failed! Aborting!");
      ui.notifications.error("v0.3.0 Migration failed! Check logs and try again!");
      return;
    }
  }

  if (v040) {
    /*
     * Version 0.4 removes a lot of excess in preparation for the re-design. Following Beyond Reality's
     * design blog, we're removing hit location settings as well as all the `coverage` data from armors.
     * In addition, we're introducing equipment restrictions in line with the re-design, in preparation
     * for the re-design transfer. Only one weapon, armor and shield can be equipped at any time.
     * This also simplifies roll calculations.
     */
    console.log("==== CD10 | Beginning v0.4.0 migration! ====");
    try {
      newData = await v040Migrate();
      if (newData.actors !== undefined) {
        v040Data.actors = newData.actors;
      }
      if (newData.items !== undefined) {
        v040Data.items = newData.items;
      }
      if (newData.tokens !== undefined) {
        v040Data.tokens = newData.tokens;
      }
      console.log("==== CD10 | v0.4.0 migration completed! ====");
    } catch(err) {
      console.error("==== CD10 | v0.4.0 migration failed! Aborting!");
      ui.notifications.error("v0.4.0 Migration failed! Check logs and try again!");
      return;
    }
  }

  /**
   * Perform the actual migration of data by calling Foundry's update functions.
   * @param {string} type  The type of migration to be made. Actor, item or token.
   * @param {Array} updateData  Contains the data to apply to the update.
   */
  const _performMigration = async (type, updateData) => {
    /* Do things with the data */
    if (type === "items") {
      console.log("Migrating world items.");
      await Item.updateDocuments(updateData);
    } else if (type === "actors") {
      const actor = game.actors.get(updateData._id);
      console.log(`Migrating items belonging to ${actor.name}`);
      await actor.updateEmbeddedDocuments("Item", updateData.itemArray);
    }
  };

  /**
   * Arrays need to be joined before the updates can be applied.
   */

  console.log("v0.3.0 Data", v030Data);
  console.log("v0.4.0 Data", v040Data);
  /**
   * Call the functions to finalize updates.
   */
  if (v030Data.items.length > 0) {
    await _performMigration("items", v030Data.items);
  }

  if (Object.keys(v030Data.actors).length > 0) {
    for (const a of v030Data.actors) {
      await _performMigration("actors", a);
    }
  }
  /**
  If (v030Data.tokens.length > 0) {
    _performMigration("tokens", v030Data.tokens);
  }
   */
  if (v040Data.items.length > 0) {
    await _performMigration("items", v040Data.items);
  }

  if (Object.keys(v040Data.actors).length > 0) {
    for (const a of v040Data.actors) {
      await _performMigration("actors", a);
    }
  }
  /**
  If (v040Data.tokens.length > 0) {
    _performMigration("tokens", v040Data.tokens);
  }
   */
}
