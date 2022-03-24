/**
 * Once cd10.js has determined migration needs to be done at all
 * this takes the version number and checks what kind of migration
 * is necessary based on the version of the world.
 * @param {string} currentVersion The current system version
 */
export default async function MigrateWorld(currentVersion) {
  const v030 = !currentVersion || isNewerVersion("0.3.8", currentVersion);
  const v040 = !currentVersion || isNewerVersion("0.4.0", currentVersion);

  let updateData = {
    actors: [],
    tokens: [],
    items: []
  };
  let newData;

  if (v030) {
    /*
     * Version 0.3.0 mostly brought with it small changes, but the template change
     * from `weapon` to `meleeWeapon` and `rangedWeapon` and `armor` into `shield`
     * as well makes it necessary to change all this.
     */
    console.log("==== CD10 | Beginning v0.3.0 migration! ====");
    newData = _v030Migrate();
    if (newData.exitCode !== 0) {
      console.log("==== CD10 | v0.3.0 migration failed! Aborting!");
      ui.notifications.error("Migration failed! Check logs and try again!");
      return;
    } else {
      updateData.actors.push(newData.actors);
      updateData.tokens.push(newData.tokens);
      updateData.items.push(newData.items);
      console.log("==== CD10 | v0.3.0 migration completed! ====");
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
    newData = _v040Migrate();
    if (newData.exitCode !== 0) {
      console.log("==== CD10 | v0.4.0 migration failed! Aborting!");
      ui.notifications.error("Migration failed! Check logs and try again!");
      return;
    } else {
      console.log("==== CD10 | v0.4.0 migration completed! ====");
      updateData.actors.push(newData.actors);
      updateData.tokens.push(newData.tokens);
      updateData.items.push(newData.items);
    }
  }

  _performMigration(type, updateData);
}

/**
 * Perform the actual migration of data by calling Foundry's update functions.
 * @param {string} type  The type of migration to be made. Actor, item or token.
 * @param {Array} updateData  Contains the data to apply to the update.
 */
async function _performMigration(type, updateData) {
  /* Do things with the data */
  console.log(`Type is ${type} and data is`, updateData);
}

/**
 * Function to perform migration from old version up to v0.3 standard.
 * Primarly acts on items, splitting weapons into two, as well as armor
 * into two.
 */
function _v030Migrate() {
  let newData;

  newData.items = _migrateV030Items();
  newData.actors = _migrateV030Actors();
  newData.tokens = _migrateV030Tokens();

  /**
   * Scans all world-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class.
   */
  function _migrateV030Items() {
    let itemArray = [];
    let itemUpdateData = {};

    for (let i of game.items.contents) {
      itemUpdateData = _migrateItem(i);
      if (Object.keys(itemUpdateData).length > 0) {
        itemArray.push(itemUpdateData);
      }
    }
    return itemArray;
  }
  /**
   * Scans all actor-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class, using _migrateItems.
   */
  function _migrateV030Actors() {
    let actorUpdateArray = [];

    for (let a of game.actors.content) {
      let actorUpdates = {};
      for (let i of a.items.content) {
        let itemArray = [];
        itemUpdateData = _migrateItem(i);
        if (Object.keys(itemUpdateData).length > 0) {
          itemArray.push(itemUpdateData);
        }
        if (itemArray.length > 0) {
          actorUpdates = {
            _id: a.id,
            itemsArray: itemArray
          };
        }
      }
      if (Object.keys(actorUpdates).length > 0) {
        actorUpdateArray.push(actorUpdates);
      }
    }
    return actorUpdates;
  }
  /**
   * Scans all token-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class, using _migrateV030Items.
   */
  function _migrateV030Tokens() {}
  /**
   * Takes an item object and tests if it needs updating from old datamodel, pre-v0.3.0.
   * @param {object} i 
   * @returns {object}
   */
  function _migrateItem(i) {
    if (i.type === "weapon") {
      let ranged = i.data.data?.isRanged.value;
      if (ranged) {
        itemUpdateData = {
          _id: i.id,
          type: "rangedWeapon",
          "data.-=isRanged": null
        };
      } else if (!ranged) {
        itemUpdateData = {
          _id: i.id,
          type: "meleeWeapon",
          "data.-=isRanged": null
        };
      }
    } else if (i.type === "armor") {
      let shield = i.data.data?.isShield.value;
      if (shield) {
        itemUpdateData = {
          _id: i.id,
          type: "shield",
          "data.-=isShield": null
        };
      } else if (!shield) {
        itemUpdateData = {
          _id: i.id,
          type: "armor",
          "data.-=isShield": null
        };
      }
    }
    return itemUpdateData;
  }

  newData.exitCode = 0;
  return newData;
}

/**
 *
 * @param updateData
 */
function _v040Migrate() {
  let newData;

  /**
   *
   * @param nameOne
   * @param nameTwo
   */
  function _compareNames(nameOne, nameTwo) {
    let a = nameOne
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
    let b = nameTwo
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

    if (a === b) {
      return true;
    } else {
      return false;
    }
  }

  newData.exitCode = 0;
  return newData;
}
