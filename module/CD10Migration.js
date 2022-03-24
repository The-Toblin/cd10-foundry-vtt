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
      console.warn("==== CD10 | v0.3.0 migration failed! Aborting!");
      ui.notifications.error("Migration failed! Check logs and try again!");
      return;
    } else {
      if (newData.actors !== undefined) {
        updateData.actors = newData.actors;
      }
      if (newData.items !== undefined) {
        updateData.items = newData.items;
      }
      if (newData.tokens !== undefined) {
        updateData.tokens = newData.tokens;
      }
      console.log("==== CD10 | v0.3.0 migration completed! ====");
    }
  }

  if (updateData.items.length > 0) {
    _performMigration("items", updateData.items);
  }
  if (updateData.actors.length > 0) {
    game.actors.forEach((a) => {
      updateData.actors.forEach((ac) => {
        if (a.id === ac._id) {
          _performMigration("actors", ac);
        }
      });
    });
  }
  if (updateData.tokens.length > 0) {
    _performMigration("tokens", updateData.tokens);
  }
}

/**
 * Perform the actual migration of data by calling Foundry's update functions.
 * @param {string} type  The type of migration to be made. Actor, item or token.
 * @param {Array} updateData  Contains the data to apply to the update.
 */
async function _performMigration(type, updateData) {
  /* Do things with the data */
  if (type === "items") {
    updateData.forEach((item) => {
      let i = game.items.get(item._id);
      console.log("Source:",i.name, i.data._source.data)
      console.log("Data:",i.name, i.data.data)
    });
    await Item.updateDocuments(updateData);
  } else if (type === "actors") {
    const actor = game.actors.get(updateData._id);
    await actor.updateEmbeddedDocuments("Item", updateData.itemArray);
  }
}

/**
 * Function to perform migration from old version up to v0.3 standard.
 * Primarly acts on items, splitting weapons into two, as well as armor
 * into two.
 */
function _v030Migrate() {
  let items = [];
  let actors = [];
  let tokens = [];

  items = _migrateV030Items();
  actors = _migrateV030Actors();
  tokens = _migrateV030Tokens();

  /**
   * Scans all world-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class.
   */
  function _migrateV030Items() {
    let itemArray = [];
    let itemUpdateData = {};

    for (const i of game.items.contents) {
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
    let itemUpdateData = {};

    for (const a of game.actors.contents) {
      let actorUpdates = {};
      for (const i of a.items.contents) {
        let itemArray = [];
        itemUpdateData = _migrateItem(i);
        if (Object.keys(itemUpdateData).length > 0) {
          itemArray.push(itemUpdateData);
        }
        if (itemArray.length > 0) {
          actorUpdates["_id"] = a.id;
          actorUpdates["itemArray"] = itemArray;
        }
      }

      if (Object.keys(actorUpdates).length > 0) {
        actorUpdateArray.push(actorUpdates);
      }
    }
    return actorUpdateArray;
  }
  /**
   * Scans all token-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class, using _migrateItem.
   */
  function _migrateV030Tokens() {
    let actorUpdateArray = [];
    let itemUpdateData;
    let actorUpdates;

    for (const s of game.scenes.contents) {
      for (const t of s.tokens) {
        let actorUpdates = {};
        if (!t.isLinked) {
          for (let i of t.actor.items.contents) {
            let itemArray = [];
            itemUpdateData = _migrateItem(i);
            if (Object.keys(itemUpdateData).length > 0) {
              itemArray.push(itemUpdateData);
            }
            if (itemArray.length > 0) {
              actorUpdates = {
                _id: t.id,
                itemArray: itemArray
              };
            }
          }
        }
        if (Object.keys(actorUpdates).length > 0) {
          actorUpdateArray.push(actorUpdates);
        }
      }
    }

    return actorUpdates;
  }
  /**
   * Takes an item object and tests if it needs updating from old datamodel, pre-v0.3.0.
   * @param {object} i Item object to be tested.
   * @returns {object}
   */
  function _migrateItem(i) {
    let itemUpdateData = {};
    if (i.type === "weapon") {
      let ranged = i.data.data.isRanged?.value;
      if (ranged) {
        itemUpdateData = {
          _id: i.id,
          type: "rangedWeapon"
        };
      } else if (!ranged) {
        itemUpdateData = {
          _id: i.id,
          type: "meleeWeapon"
        };
      }
    } else if (i.type === "armor") {
      let shield = i.data.data.isShield?.value;
      if (shield) {
        itemUpdateData["_id"] = i.id;
        itemUpdateData["type"] = "shield";
      } else if (!shield && shield !== undefined) {
        itemUpdateData["_id"] = i.id;
        itemUpdateData["type"] = "armor";
      }
    }

    if (i.data.data.isRanged?.value !== undefined) {
      itemUpdateData["data.-=isRanged"] = null;
    }
    if (i.data.data.isShield?.value !== undefined) {
      itemUpdateData["data.-=isShield"] = null;
    }

    return itemUpdateData;
  }

  const newData = {
    items,
    actors,
    tokens,
    exitCode: 0
  };
  return newData;
}

/**
 * Update a v0.3.0 world to 0.4.0. This is made primarily through adding
 * the matchID property to skills and weapons, to match them against eachother.
 */
function _v040Migrate() {
  let newData = {
    items: {},
    actors: {},
    tokens: {},
    exitCode: 1
  };

  /**
   * Compares two names, removing punctuation and making them lowercase.
   * @param {string} nameOne
   * @param {string} nameTwo
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
