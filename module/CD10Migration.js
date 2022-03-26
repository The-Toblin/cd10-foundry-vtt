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

  let newData = {
    exitCode: 1
  };
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

  if (v030) {
    /*
     * Version 0.3.0 mostly brought with it small changes, but the template change
     * from `weapon` to `meleeWeapon` and `rangedWeapon` and `armor` into `shield`
     * as well makes it necessary to change all this.
     */
    console.log("==== CD10 | Beginning v0.3.0 migration! ====");
    newData = await v030Migrate();
    if (newData.exitCode !== 0) {
      console.warn("==== CD10 | v0.3.0 migration failed! Aborting!");
      ui.notifications.error("Migration failed! Check logs and try again!");
      return;
    } else {
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
    newData = await v040Migrate();
    if (newData.exitCode !== 0) {
      console.warn("==== CD10 | v0.4.0 migration failed! Aborting!");
      ui.notifications.error("Migration failed! Check logs and try again!");
      return;
    } else {
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
    }
  }

  const updateData = _joinUpdates(v030Data, v040Data);

  console.log("the finalized UpdateData:", updateData);

  if (updateData.items.length > 0) {
    _performMigration("items", updateData.items);
  }
  if (updateData.actors.length > 0) {
    game.actors.forEach(a => {
      updateData.actors.forEach(ac => {
        if (a.id === ac._id) {
          _performMigration("actors", ac);
        }
      });
    });
  }
/**
  If (updateData.tokens.length > 0) {
    _performMigration("tokens", updateData.tokens);
  }
 */
}

/**
 * A function to join all updates into one object.
 * @param {object} updateObjectOne
 * @param {object} updateObjectTwo
 * @returns {object} Joined updateobject, with all needed updates.
 */
async function _joinUpdates(updateObjectOne, updateObjectTwo) {
  let updateData = {
    actors: [],
    items: [],
    tokens: []
  };

  const joinedItems = _joinItems(updateObjectOne.items, updateObjectTwo.items);
  const joinedActors = _joinActors(updateObjectOne.actors, updateObjectTwo.actors);

  updateData.items = joinedItems;
  updateData.actors = joinedActors;

  /**
   * Joins two arrays, updating contents as necessary for updating.
   * @param {Array} firstArray
   * @param {Array} secondArray
   * @returns {Array} Returns the joined array.
   */
  function _joinItems(firstArray, secondArray) {
    let joinedData = [];


    firstArray.forEach(one => {
      secondArray.forEach(two => {
        if (one._id === two._id) {
          joinedData.push({ ...one, ...two });
        }
      });
    });

    joinedData.forEach(a => {
      firstArray.forEach(b => {
        if (joinedData.indexOf(b) === -1) {
          joinedData.push(b);
        }
      });
    });
    joinedData.forEach(a => {
      secondArray.forEach(b => {
        if (joinedData.indexOf(b) === -1) {
          joinedData.push(b);
        }
      });
    });
    console.log("ARRAYS:", firstArray, secondArray, joinedData);
    return joinedData;
  }
  /**
   * Joins two update objects, updating contents as necessary for updating.
   * @param {Object} firstObject
   * @param {Object} secondObject
   * @returns {Object} Returns the joined object.
   */
  function _joinActors(firstObject, secondObject) {
    let joinedActorData = [];
    let joinedData = {};

    firstObject.forEach(one => {
      secondObject.forEach(two => {
        if (one._id === two._id) {
          joinedData = _joinItems(one.itemArray, two.itemArray);
          let updateData = {
            _id: one._id,
            itemArray: joinedData
          };
          if (joinedActorData.indexOf(updateData) === -1) {
            joinedActorData.push(updateData);
          }
        }
      });
    });

    console.log("OBJECTS", firstObject, secondObject, joinedActorData);
    return joinedActorData;
  }
  /**
   *
   */
  function _joinTokens() {
    let joinedData = [];

    return joinedData;
  }

  return updateData;
}

/**
 * Perform the actual migration of data by calling Foundry's update functions.
 * @param {string} type  The type of migration to be made. Actor, item or token.
 * @param {Array} updateData  Contains the data to apply to the update.
 */
async function _performMigration(type, updateData) {
  /* Do things with the data */
  if (type === "items") {
    // Await Item.updateDocuments(updateData);
  } else if (type === "actors") {
    const actor = game.actors.get(updateData._id);
    // Await actor.updateEmbeddedDocuments("Item", updateData.itemArray);
  }
}
