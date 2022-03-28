/**
 * Update a v0.3.0 world to 0.4.0. This is made primarily through adding
 * the matchID property to skills and weapons, to match them against eachother.
 */
export const v040Migrate = async () => {
  let items = [];
  let actors = [];
  let tokens = [];

  /**
   * Function to migrate a single item document to 0.4.0 data structure. Returns the updateData.
   * @param {object} item Item to check for migration.
   * @returns {Promise}
   */
  const _migrateSkill = async item => {
    let newData = {};
    if (item.type === "skill") {
      if (item.data.data.matchID === undefined || item.data.data.matchID === "") {
        newData._id = item.id;
        newData["data.matchID"] = randomID();
      }
    }
    return newData;
  };

  /**
   *  Function to migrate single data to 0.4.0 data structure. Returns the updateData.
   * @param {object} weapon The weapon object to check for migration.
   * @param {object} updateData The already present skilldata, for copying MatchIDs from.
   */
  const _migrateWeapon = async (weapon, updateData) => {
    let newData = {};
    if (weapon.type === "skill") {
      console.log("SKILL IN WEAPONS!");
      throw new Error("SKILL IN WEAPONS!");
    }
    for (const i of updateData) {
      const skill = game.items.get(i._id);
      const nameComparison = await _compareNames(weapon.data.data.attackSkill.value, skill.name);

      if (nameComparison) {
        for (const s of updateData) {
          if (s._id === skill.id) {

            newData._id = weapon.id;
            newData["data.attackSkill.value"] = s["data.matchID"];
          }
        }
      }
    }
    return newData;
  };

  /**
   * Compares two names, removing punctuation and making them lowercase.
   * @param {string} nameOne
   * @param {string} nameTwo
   */
  const _compareNames = async (nameOne, nameTwo) => {
    let a = nameOne
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();
    let b = nameTwo
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
      .replace(/\s+/g, "")
      .toLowerCase();

    if (a === b) {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Helper function for the Actor migration process. Migrates a single actor document.
   * @param {object} actor The actor to be migrated.
   * @param {Array} items An array of world-level updates to perform. Used to copy matchID from.
   * @returns {Promise} Returns updateData to be applied.
   */
  const _migrateActor = async (actor, items) => {
    let newData = {};
    let itemArray = [];
    let actorUpdate = {};
    for (const actorItem of actor.items.contents) {
      try {

        if (actorItem.type === "skill") {
          for (const i of items) {
            let skill = game.items.get(i._id);
            if (skill.type === "skill") {
              const nameComparison = await _compareNames(actorItem.name, skill.name);
              if (nameComparison) {
                for (const s of items) {
                  if (s._id === skill.id) {
                    newData._id = actorItem.id;
                    newData["data.matchID"] = s["data.matchID"];
                  }
                }
              }
            }
          }
        } else if (actorItem.type === "meleeWeapon" || actorItem.type === "rangedWeapon") {
          newData = await _migrateWeapon(actorItem, items);
        }
        if (itemArray.indexOf(newData) === -1 && Object.keys(newData).length > 0) {
          itemArray.push(newData); // BUG: This is where things get buggered.
          console.warn(itemArray, newData);
        }
      } catch(err) {
        console.error(`Item migration failed for actor item ${actorItem.name}`, err);
      }
    }
    if (itemArray.length > 0) {
      actorUpdate = {
        _id: actor.id,
        itemArray: itemArray
      };
    }
    return actorUpdate;
  };

  /**
   * Migrate world-residing (item-directory) items to 0.4, adding MatchId property.
   * First iterates through skills to give them MatchID properties, then moves on to
   * weapons to copy said MatchIDs to.
   * @returns {promise} Returns a promise of data to migrated.
   */
  const _migrateV040Items = async () => {
    let updateData = [];
    /**
     * Start with skills.
     */
    for (const item of game.items.contents) {
      try {
        if (item.type === "skill") {
          const newData = await _migrateSkill(item);

          if (!isObjectEmpty(newData)) {
            updateData.push(newData);
          }
        }
      } catch(err) {
        console.error(`Item migration failed for ${item.name}`, err);
      }
    }
    /**
     * Move on to weapons.
     */
    for (const item of game.items.contents) {
      try {
        if (item.type === "meleeWeapon" || item.type === "rangedWeapon") {
          const newData = await _migrateWeapon(item, updateData);

          if (!isObjectEmpty(newData)) {
            updateData.push(newData);
          }
        }
      } catch(err) {
        console.error(`Item migration failed for ${item.name}`, err);
      }
    }
    return updateData;
  };

  /**
   * Function to migrate actor-residing items, using data from the world-residing item update.
   * @param {object} items Updatedata from the items update.
   * @returns {Promise} Returns updateData to be applied.
   */
  const _migrateV040Actors = async items => {
    let updateData = [];

    for (const actor of game.actors.contents) {
      try {
        let actorUpdateData = await _migrateActor(actor, items);

        if (!isObjectEmpty(actorUpdateData)) {
          updateData.push(actorUpdateData);
        }
      } catch(err) {
        console.error(`Item migration failed for ${actor.name}`, err);
      }
    }
    // Return actor array for all actors via promise.
    return updateData;
  };

  /**
   Function to migrate token-residing items, using data from the world-residing item update.
   * @param {object} items Updatedata from the items update.
   * @returns {Promise} Returns updateData to be applied.
   */
  const _migrateV040Tokens = async function(items) {
    let updateData = [];

    return updateData;
  };

  items = await _migrateV040Items();
  actors = await _migrateV040Actors(items);
  // Tokens = await _migrateV040Tokens(items);

  const newData = {
    items,
    actors,
    tokens
  };
  return newData;
};
