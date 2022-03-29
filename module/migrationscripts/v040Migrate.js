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
   * @param {string} itemId The ID of the item being checked.
   * @param {object} itemData ItemData to check for migration.
   * @returns {Promise}
   */
  const _migrateSkill = async (itemId, itemData) => {
    let newData = {};
    if (itemData.matchID === undefined || itemData.matchID === "") {
      newData._id = itemId;
      newData["data.matchID"] = randomID();
    }
    return newData;
  };

  /**
   *  Function to migrate single data to 0.4.0 data structure. Returns the updateData.
   * @param {string} weaponId The ID of the weapon to check.
   * @param {object} weaponData The weapon data to check for migration.
   * @param {object} worldItemData The already present skilldata, for copying MatchIDs from.
   */
  const _migrateWeapon = async (weaponId, weaponData, worldItemData) => {
    let newData = {};
    for (const worldItem of worldItemData) {
      const skill = game.items.get(worldItem._id);
      if (weaponData.attackSkill?.value === undefined) {
        console.warn(`Weapon ${weaponData.name} does not have an attackskill value!`, weaponData);
        return;
      }
      const nameComparison = await _compareNames(weaponData.attackSkill.value, skill.name);

      if (nameComparison) {
        if (worldItem._id === skill.id) {
          newData._id = weaponId;
          newData["data.attackSkill.value"] = worldItem["data.matchID"];
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
   * @param {string} actorId The actorId to be migrated.
   * @param {Array} actorItems An array of the actor's owned items, with ids.
   * @param {Array} worldItems An array of world-level updates to perform. Used to copy matchID from.
   * @returns {Promise} Returns updateData to be applied.
   */
  const _migrateActor = async (actorId, actorItems, worldItems) => {
    let itemArray = [];
    let actorUpdate = {};
    for (const item of actorItems) {
      let newData = {};
      try {
        if (item.data.hasOwnProperty("teachable")) {
          for (const worldSkill of worldItems) {
            const worldSkillObject = game.items.get(worldSkill._id);
            if (worldSkillObject.type === "skill") {
              let itemName = null;
              // Fetch the item from the actor or token. Since we don't know if it's an actor
              // or token, we have to test.
              for (const actor of game.actors.contents) {
                if (actorId === actor.id) {
                  itemName = actor.items.get(item.id).name;
                }
              }
              if (itemName === null) {
                for (const scene of game.scenes.contents) {
                  for (const token of scene.tokens.contents) {
                    if (actorId === token.data._id) {
                      for (const tokenItem of token.data.actorData.items) {
                        if (item.id === tokenItem._id) {
                          itemName = tokenItem.name;
                        }
                      }
                    }
                  }
                }
              }
              const nameComparison = await _compareNames(itemName, worldSkillObject.name);
              if (nameComparison) {
                if (worldSkill._id === worldSkillObject.id) {
                  newData._id = item.id;
                  newData["data.matchID"] = worldSkill["data.matchID"];
                }
              }
            }
          }
        } else if (item.data.hasOwnProperty("attackSkill")) {
          newData = await _migrateWeapon(item.id, item.data, worldItems);
        }
        if (itemArray.indexOf(newData) === -1 && Object.keys(newData).length > 0) {
          itemArray.push(newData);
        }
      } catch(err) {
        console.error(`Item migration failed for actor item ${item.name}`, err);
      }
    }
    if (itemArray.length > 0) {
      actorUpdate = {
        _id: actorId,
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
          const newData = await _migrateSkill(item.id, item.data.data);

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
          const newData = await _migrateWeapon(item.id, item.data.data, updateData);

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
   * @param {object} worldItems Updatedata from the items update.
   * @returns {Promise} Returns updateData to be applied.
   */
  const _migrateV040Actors = async worldItems => {
    let updateData = [];

    for (const actor of game.actors.contents) {
      let actorItemArray = [];
      try {
        for (const actorItem of actor.items) {
          actorItemArray.push({ id: actorItem.id, data: actorItem.data.data });
        }
        let actorUpdateData = await _migrateActor(actor.id, actorItemArray, worldItems);
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
   * @param {object} worldItems Updatedata from the items update.
   * @returns {Promise} Returns updateData to be applied.
   */
  const _migrateV040Tokens = async worldItems => {
    let updateData = [];
    for (const scene of game.scenes.contents) {
      for (const token of scene.tokens) {
        let newData = [];
        let tokenItemArray = [];
        if (!token.isLinked) {
          try {
            if (token.data.actorData?.items !== undefined) {
              for (const tokenItem of token.data.actorData.items) {
                tokenItemArray.push({ id: tokenItem._id, data: tokenItem.data });
              }
              if (tokenItemArray.length > 0) {
                newData = await _migrateActor(token.id, tokenItemArray, worldItems);
              }
              if (!isObjectEmpty(newData)) {
                updateData.push(newData);
              }
            }
          } catch(err) {
            console.error(`Item migration failed for token ${token.name}`, err);
          }
        }
      }
    }
    // Return actor array for all actors via promise.
    return updateData;
  };

  items = await _migrateV040Items();
  actors = await _migrateV040Actors(items);
  tokens = await _migrateV040Tokens(items);

  const newData = {
    items,
    actors,
    tokens
  };
  return newData;
};
