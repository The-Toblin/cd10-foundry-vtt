/* TODO: Rewrite necessary. For each grand step, gather the necessary item updates in an updateData object array.
Keep adding to said array until ALL updates necessary have been gathered.
Then send the whole thing to an update function that performs the actual updates. */

/* Check necessary upgrades that need to be done, then trigger world migration */
export default async function MigrateWorld(currentVersion) {
  console.log("==== CD10 | Migration needed! Starting migration. ====");
  /* Check how old the system is and determine which update routines need to be ran. */
  let v040 = !currentVersion || isNewerVersion("0.4.0", currentVersion);

  if (v040) {
    console.log("==== CD10 | Beginning v0.4.0 migration!");
    v040Migrate();
    console.log("==== CD10 | v0.4.0 migration completed!");
  }

  return;
}

/* Version 0.4.x migration, adding MatchID to skills and weapons */
async function v040Migrate() {
  const updateData = _migrateV040Skills();
  /*_migrateV040Weapons();*/
  _performMigration("Item", updateData.itemUpdateData, "world");
  game.actors.forEach((gameActor) => {
    updateData.listOfActors.forEach((listActor) => {
      if (gameActor.id === listActor._id) {
        _performMigration("Item", listActor, "actor");
      }
    });
  });

  function _migrateV040Skills() {
    /* World-residing skills */
    let listOfActors = [],
      itemUpdateData = [];

    for (let item of game.items.contents) {
      if (item.type === "skill") {
        console.log(`==== CD10 | Migrating Item entity ${item.name}`);
        itemUpdateData.push(_addMatchIDtoSkill(item));
      }
    }

    /* Character-residing skills */
    for (let actor of game.actors.contents) {
      let actorItems = [];
      actor.items.forEach((item) => {
        if (item.type === "skill") {
          console.log(
            `==== CD10 | Migrating Item entity ${item.name} belonging to ${actor.name}`
          );
          let actorItemUpdateData = _copyMatchIDtoEmbeddedSkill(
            item,
            itemUpdateData
          );
          if (Object.keys(actorItemUpdateData).length > 1) {
            actorItems.push(actorItemUpdateData);
          }
        }
      });
      let actorObj = { _id: actor.id, itemsArray: actorItems };
      listOfActors.push(actorObj);
    }

    function _addMatchIDtoSkill(item) {
      /* Add a randomized, persistent ID to all skills so they can be matched against weapons. */
      let itemUpdateData = {};
      if (
        typeof item.data.data.matchID === "undefined" ||
        item.data.data.matchID === ""
      ) {
        itemUpdateData = {
          _id: item.id,
          data: {
            matchID: randomID(),
          },
        };
      } else {
        let setMatchID = item.data.data.matchID;
        itemUpdateData = { _id: item.id, data: { matchID: setMatchID } };
      }

      return itemUpdateData;
    }

    function _copyMatchIDtoEmbeddedSkill(item, worldSkillList) {
      /* Find skills on the character that has a world-residing 'master' and copy its matchID to the character's skill. */
      let actorItemUpdateData = {},
        skillName = item.name
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
          .replace(/\s+/g, "")
          .toLowerCase();

      worldSkillList.forEach((skill) => {
        let s = game.items.get(skill._id);
        if (s.type === "skill") {
          let compareName = s.name
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .replace(/\s+/g, "")
            .toLowerCase();
          if (skillName === compareName) {
            if (typeof s.data.data.matchID === "undefined") {
              ui.notifications.error(
                `CRITICAL FAILURE! MatchID for skill ${s.name} is undefined!`
              );
              return;
            } else {
              if (item.data.data.matchID != s.data.data.matchID) {
                actorItemUpdateData = {
                  _id: item.id,
                  data: {
                    matchID: s.data.data.matchID,
                  },
                };
              }
              return;
            }
          }
        }
      });
      return actorItemUpdateData;
    }

    let updateData = {
      itemUpdateData: itemUpdateData,
      listOfActors: listOfActors,
    };

    return updateData;
  }

  function _migrateV040Weapons() {
    /* Migrate weapons, adding the proper matchID from the skills used to their `attackskill` property. */
    /* World-residing weapons */
    for (let item of game.items.contents) {
      if (item.type === "meleeWeapon" || item.type === "rangedWeapon") {
        console.log(`==== CD10 | Migrating Item entity ${item.name}`);
        _copyMatchIDtoWeapon(item);
      }
    }

    /* Character-residing weapons */
    for (let actor of game.actors.contents) {
      actor.items.forEach((item) => {
        if (item.type === "meleeWeapon" || item.type === "rangedWeapon") {
          console.log(
            `==== CD10 | Migrating Item entity ${item.name} belonging to ${actor.name}`
          );
          _copyMatchIDtoWeapon(item);
        }
      });
    }

    async function _copyMatchIDtoWeapon(item) {
      /* Find the weapon's 'attackSkill' property and compare it to skills on the character. Copy the matchID from the character's skill. */
      let actorItemUpdateData = {},
        itemUpdateData = {};

      let attackSkillName = item.data.data.attackSkill.value
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

      if (item.isEmbedded) {
        let actor = item.parent;
        actor.items.forEach((i) => {
          if (
            i.name
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, "")
              .toLowerCase() === attackSkillName
          ) {
            item.update({
              "data.attackSkill.value": i.data.data.matchID,
            });
            console.log(
              `Copied matchID to`,
              item.name,
              `belonging to ${item.parent.name}`
            );
          }
        });
      } else {
        game.items.forEach((i) => {
          if (
            i.name
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, "")
              .toLowerCase() === attackSkillName
          ) {
            item.update({
              "data.attackSkill.value": i.data.data.matchID,
            });
          }
        });
      }

      return;
    }

    return;
  }

  async function _performMigration(documentType, updateData, updateType) {
    if (updateType === "world") {
      await Item.updateDocuments(updateData);
    } else if (updateType === "actor") {
      const actor = game.actors.get(updateData._id);
      console.log(actor.name, updateData.itemsArray);
      await actor.updateEmbeddedDocuments(documentType, updateData.itemsArray);
    }
  }
}
