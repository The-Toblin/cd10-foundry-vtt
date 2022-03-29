/**
 * Function to perform migration from old version up to v0.3 standard.
 * Primarly acts on items, splitting weapons into two, as well as armor
 * into two.
 */
export const v030Migrate = async () => {
  let items = [];
  let actors = [];
  let tokens = [];

  /**
   * Helper function that takes an item object and tests if it needs updating from old datamodel, pre-v0.3.0.
   * @param {object} i Item object to be tested.
   * @returns {Promise}
   */
  const _migrateItem = async i => {
    let updateData = {};
    try {
      if (i.type === "weapon") {
        let ranged = i.data.data.isRanged?.value;
        if (ranged) {
          updateData = {
            _id: i.id,
            type: "rangedWeapon"
          };
        } else if (!ranged) {
          updateData = {
            _id: i.id,
            type: "meleeWeapon"
          };
        }
      } else if (i.type === "armor") {
        let shield = i.data.data.isShield?.value;
        if (shield) {
          updateData._id = i.id;
          updateData.type = "shield";
        } else if (!shield && shield !== undefined) {
          updateData._id = i.id;
          updateData.type = "armor";
        }
      }

      if (i.data.data.isRanged?.value !== undefined) {
        updateData._id = i.id;
        updateData["data.-=isRanged"] = null;
      }
      if (i.data.data.isShield?.value !== undefined) {
        updateData._id = i.id;
        updateData["data.-=isShield"] = null;
      }
    } catch(err) {
      console.error(`Item update failed for item ${i.name}`, err);
    }
    return updateData;
  };

  /**
   * Scans all world-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class.
   */
  const _migrateV030Items = async () => {
    let updateData = [];
    let newData = {};

    for (const i of game.items.contents) {
      try {
        newData = await _migrateItem(i);
        if (Object.keys(newData).length > 0) {
          updateData.push(newData);
        }
      } catch(err) {
        console.error(`Item migration failed for ${i.name}`, err);
      }
    }
    return updateData;
  };
  /**
   * Scans all actor-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class, using _migrateItems.
   */
  const _migrateV030Actors = async () => {
    let updateData = [];
    let itemUpdateData = {};

    for (const a of game.actors.contents) {
      let actorUpdates = {};
      let itemArray = [];
      for (const i of a.items.contents) {
        itemUpdateData = await _migrateItem(i);
        if (Object.keys(itemUpdateData).length > 0) {
          if (itemArray.indexOf(itemUpdateData) === -1) {
            itemArray.push(itemUpdateData);
          }
        }
        if (itemArray.length > 0) {
          actorUpdates._id = a.id;
          actorUpdates.itemArray = itemArray;
        }
      }

      if (Object.keys(actorUpdates).length > 0) {
        if (updateData.indexOf(actorUpdates) === -1) {
          updateData.push(actorUpdates);
        }
      }
    }
    return updateData;
  };
  /**
   * Scans all token-residing items in inventory and checks for weapons or armor
   * and splits it into the proper class, using _migrateItem.
   * @returns {Promise} Returns a promise<array> with updateData to be applied.
   */
  const _migrateV030Tokens = async () => {
    let actorUpdateArray = [];
    let itemUpdateData;
    let updateData;

    for (const scene of game.scenes.contents) {
      for (const token of scene.tokens) {
        let actorUpdates = {};
        if (!token.isLinked) {
          if (token.actor === null) {
            return;
          }
          for (const item of token.actor.items.contents) {
            try {
              let itemArray = [];
              itemUpdateData = await _migrateItem(item);
              if (Object.keys(itemUpdateData).length > 0) {
                itemArray.push(itemUpdateData);
              }
              if (itemArray.length > 0) {
                actorUpdates = {
                  _id: token.id,
                  itemArray: itemArray
                };
              }
            } catch(err) {
              console.error(`Item migration failed for token item ${item.name}`, err);
            }
          }
        }
        if (Object.keys(actorUpdates).length > 0) {
          actorUpdateArray.push(actorUpdates);
        }
      }
    }

    return updateData;
  };

  items = await _migrateV030Items();
  actors = await _migrateV030Actors();
  tokens = await _migrateV030Tokens();

  const newData = {
    items,
    actors,
    tokens
  };
  return newData;
};
