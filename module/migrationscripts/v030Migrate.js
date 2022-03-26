/**
 * Function to perform migration from old version up to v0.3 standard.
 * Primarly acts on items, splitting weapons into two, as well as armor
 * into two.
 */
export function v030Migrate() {
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
      let itemArray = [];
      for (const i of a.items.contents) {
        itemUpdateData = _migrateItem(i);
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
        if (actorUpdateArray.indexOf(actorUpdates) === -1) {
          actorUpdateArray.push(actorUpdates);
        }
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
          if (t.actor === null) {
            return;
          }
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
        itemUpdateData._id = i.id;
        itemUpdateData.type = "shield";
      } else if (!shield && shield !== undefined) {
        itemUpdateData._id = i.id;
        itemUpdateData.type = "armor";
      }
    }

    if (i.data.data.isRanged?.value !== undefined) {
      itemUpdateData._id = i.id;
      itemUpdateData["data.-=isRanged"] = null;
    }
    if (i.data.data.isShield?.value !== undefined) {
      itemUpdateData._id = i.id;
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
  console.log("v0.3.0 Data", newData);
  return newData;
}
