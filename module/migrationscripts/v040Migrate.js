/**
 * Update a v0.3.0 world to 0.4.0. This is made primarily through adding
 * the matchID property to skills and weapons, to match them against eachother.
 */
export async function v040Migrate() {
  let items = [];
  let actors = [];
  let tokens = [];

  /**
   * Migrate world-residing (item-directory) items to 0.4, adding MatchId property.
   * First iterates through skills to give them MatchID properties, then moves on to
   * weapons to copy said MatchIDs to.
   * @returns {promise} Returns a promise of data to migrated.
   */
  const _migrateV040Items = async function() {
    let updateData = [];
    /**
     * Start with skills.
     */
    for (const item of game.items.contents) {
      if (item.type === "skill") {
        let newData = _migrateSkill(item);

        if (!isObjectEmpty(newData)) {
          updateData.push(newData);
        }
      }
    }
    /**
     * Move on to weapons.
     */
    for (const item of game.items.contents) {
      if (item.type === "meleeWeapon" || item.type === "rangedWeapon") {
        let newData = _migrateWeapon(item, updateData);

        if (!isObjectEmpty(newData)) {
          updateData.push(newData);
        }
      }
    }
    return updateData;
  };

  /**
   * Function to migrate actor-residing items, using data from the world-residing item update.
   * @param {object} items Updatedata from the items update.
   * @returns {object} Returns updateData to be applied.
   */
  const _migrateV040Actors = async function(items) {
    let updateData = [];
    for (const actor of game.actors.contents) {
      let actorUpdateData = _migrateActor(actor, items);

      if (!isObjectEmpty(actorUpdateData)) {
        updateData.push(actorUpdateData);
      }
    }
    return updateData;
  };

  /**
   Function to migrate token-residing items, using data from the world-residing item update.
   * @param {object} items Updatedata from the items update.
   * @returns {object} Returns updateData to be applied.
   */
  const _migrateV040Tokens = async function(items) {
    let updateData = [];

    return updateData;
  };

  /**
   * Function to migrate a single item document to 0.4.0 data structure. Returns the updateData.
   * @param {object} item Item to check for migration.
   * @returns {object}
   */
  const _migrateSkill = async function(item) {
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
   *  Migrates a single actor document.
   * @param {object} actor The actor to be migrated.
   * @param {Array} items An array of world-level updates to perform. Used to copy matchID from.
   * @returns {object} Returns updateData to be applied.
   */
  function _migrateActor(actor, items) {
    let newData = {};
    let itemArray = [];
    let actorUpdate = {};
    for (const actorItem of actor.items.contents) {
      if (actorItem.type === "skill") {
        for (let i; i > items.length; i++) {
          const skill = game.items.get(updateData[i]._id);
          const nameComparison = _compareNames(actorItem.name, skill.name);

          if (nameComparison) {
            let matchID;
            items.forEach(s => {
              if (s._id === skill.id) {
                matchID = s["data.matchID"];
              }
            });
            newData._id = actorItem.id;
            newData["data.matchID"] = matchID;
          }
        }
      } else if (actorItem.type === "meleeWeapon" || actorItem.type === "rangedWeapon") {
        newData = _migrateWeapon(actorItem, items);
      }
      if (itemArray.indexOf(newData) === -1) {
        itemArray.push(newData);
      }
    }
    actorUpdate = {
      _id: actor.id,
      itemArray: itemArray
    };
    return actorUpdate;
  }

  /**
   *  Function to migrate single data to 0.4.0 data structure. Returns the updateData.
   * @param {object} weapon The weapon object to check for migration.
   * @param {object} updateData The already present skilldata, for copying MatchIDs from.
   */
  async function _migrateWeapon(weapon, updateData) {
    let newData = {};
    if (weapon.type === "meleeWeapon" || weapon.type === "rangedWeapons") {
      for (let i = 0; i < updateData.length; i++) {
        const skill = game.items.get(updateData[i]._id);
        const nameComparison = _compareNames(weapon.data.data.attackSkill.value, skill.name);
        if (nameComparison) {
          let matchID;
          updateData.forEach(s => {
            if (s._id === skill.id) {
              matchID = s["data.matchID"];
            }
          });
          newData._id = weapon.id;
          newData["data.attackSkill.value"] = matchID;
        }
      }
    }
    return newData;
  }

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

  items = await _migrateV040Items();
  actors = await _migrateV040Actors(items);
  tokens = await _migrateV040Tokens(items);

  const newData = {
    items,
    actors,
    tokens,
    exitCode: 0
  };
  console.log("v0.4.0 Data", newData);
  return newData;
}
