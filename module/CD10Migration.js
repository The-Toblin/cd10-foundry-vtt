/* Check necessary upgrades that need to be done, then trigger world migration */
export default function MigrateWorld(currentVersion) {
  console.log("==== CD10 | Migration needed! Starting migration. ====");
  /* Check how old the system is and determine which update routines need to be ran. */
  let v030 = !currentVersion || isNewerVersion("0.3.0", currentVersion);
  let v040 = !currentVersion || isNewerVersion("0.4.0", currentVersion);

  if (v030) {
    console.log("==== CD10 | Beginning v0.3.0 migration!");
    v030Migrate();
    console.log("==== CD10 | v0.3.0 migration completed!");
  }

  if (v040) {
    console.log("==== CD10 | Beginning v0.4.0 migration!");
    v040Migrate();
    console.log("==== CD10 | v0.4.0 migration completed!");
  }

  return;
}

/* Version 0.3.x migration, splitting 'weapon' into melee and ranged variations, add armor hit locations and split armor into armor and shields. */
function v030Migrate() {
  /* World-residing items */
  for (let item of game.items.contents) {
    console.log(`==== CD10 | Migrating Item entity ${item.name}`);
    if (item.type === "skill") {
      _addPhysicalSkillValue(item);
    } else if (item.type === "weapon") {
      _splitWeaponType(item);
    } else if (item.type === "armor") {
      _splitArmorType(item);
    }
  }

  /* Character-residing items */
  for (let actor of game.actors.contents) {
    actor.items.forEach((item) => {
      console.log(
        `==== CD10 | Migrating Item entity ${item.name} belonging to ${actor.name}`
      );
      if (item.type === "skill") {
        _addPhysicalSkillValue(item);
      } else if (item.type === "weapon") {
        _splitWeaponType(item);
      } else if (item.type === "armor") {
        _splitArmorType(item);
      }
    });
  }

  function _addPhysicalSkillValue(item) {
    /* Add 'isPhysical' property to skills and default it to 'false'. */
    if (item.data.data.isPhysical?.value === "undefined") {
      item.update({
        data: {
          isPhysical: {
            value: false,
          },
        },
      });
    }

    return;
  }

  function _splitWeaponType(item) {
    /* Split 'weapon' type into 'meleeWeapon' and 'rangedWeapon' based on 'isRanged' property, then blank 'isRanged' property as deprecated. */
    if (item.data.data.isRanged.value) {
      item.update({
        type: "rangedWeapon",
        "data.-=isRanged": null,
      });
    } else if (!item.data.data.isRanged.value) {
      item.update({
        type: "meleeWeapon",
        "data.-=isRanged": null,
      });
    }

    return;
  }

  function _splitArmorType(item) {
    /* Split 'armor' type into 'armor' and 'shield' based on 'isShield' property, then blank 'isShield' property as deprecated.
     * In addition, determine coverage areas for the armor and split them into separate properties.
     */
    if (item.data.data.isShield.value) {
      item.update({
        type: "shield",
        "data.-=isShield": null,
      });
    } else if (!item.data.data.isShield.value) {
      let head = false,
        body = false,
        legs = false,
        arms = false;
      let coverage = item.data.data.coverage.value;

      if (coverage === "All" || coverage === "all") {
        head = body = arms = legs = true;
      }
      if (
        coverage === "Chest" ||
        coverage === "Torso" ||
        coverage === "chest" ||
        coverage === "torso"
      ) {
        body = true;
      }
      if (coverage === "Head" || coverage === "head") {
        head = true;
      }
      if (coverage === "Legs" || coverage === "legs") {
        legs = true;
      }
      if (coverage === "Arms" || coverage === "arms") {
        arms = true;
      }
      if (coverage === "torsoArms") {
        arms = body = true;
      }

      item.update({
        type: "armor",
        "data.-=isShield": null,
        "data.coverage.head.value": head,
        "data.coverage.body.value": body,
        "data.coverage.arms.value": arms,
        "data.coverage.legs.value": legs,
        "data.coverage.-=value": null,
      });
    }

    return;
  }

  return;
}

/* Version 0.4.x migration, adding MatchID to skills and weapons */
function v040Migrate() {
  _migrateV040Skills();
  _migrateV040Weapons();
  _migrateV040WeaponsWithShieldSkill();

  function _migrateV040Skills() {
    /* World-residing skills */
    for (let item of game.items.contents) {
      if (item.type === "skill") {
        console.log(`==== CD10 | Migrating Item entity ${item.name}`);
        _addMatchIDtoSkill(item);
      }
    }

    /* Character-residing skills */
    for (let actor of game.actors.contents) {
      actor.items.forEach((item) => {
        if (item.type === "skill") {
          console.log(
            `==== CD10 | Migrating Item entity ${item.name} belonging to ${actor.name}`
          );
          _copyMatchIDtoEmbeddedSkill(item);
        }
      });
    }

    function _addMatchIDtoSkill(item) {
      /* Add a randomized, persistent ID to all skills so they can be matched against weapons. */
      if (typeof item.data.data.matchID?.value === "undefined") {
        console.log(`==== CD10 | Adding matchID to ${item.name}`);
        item.update({
          "data.matchID": {
            value: randomID(),
          },
        });
      }

      return;
    }

    function _copyMatchIDtoEmbeddedSkill(item) {
      /* Find skills on the character that has a world-residing 'master' and copy its matchID to the character's skill. */
      let skillName = item.name
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase();

      game.items.forEach((s) => {
        if (s.type === "skill") {
          let compareName = s.name
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .replace(/\s+/g, "")
            .toLowerCase();
          if (skillName === compareName) {
            if (s.data.data.matchID?.value === "undefined") {
              ui.notifications.error(
                `CRITICAL FAILURE! MatchID for skill ${s.name} belonging to ${s.parent.name} is undefined!`
              );
              return;
            }
            item.update({
              "data.matchID.value": s.data.data.matchID.value,
            });
          }
        }
      });

      return;
    }

    return;
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

    function _copyMatchIDtoWeapon(item) {
      /* Find the weapon's 'attackSkill' property and compare it to skills on the character. Copy the matchID from the character's skill. */
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
              "data.attackSkill.value": i.data.data.matchID.value,
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
              "data.attackSkill.value": i.data.data.matchID.value,
            });
            console.log(`Copied matchID to`, item.name);
          }
        });
      }

      return;
    }

    return;
  }

  function _migrateV040WeaponsWithShieldSkill() {
    /* Migrate weapons, adding the proper matchID from the skills used to their `shieldSkill` property. */
    /* World-residing weapons */
    for (let item of game.items.contents) {
      if (
        item.type === "meleeWeapon" &&
        item.data.data.shieldSkill?.value != "undefined"
      ) {
        console.log(`==== CD10 | Migrating Item entity ${item.name}`);
        _copyShieldSkillMatchID(item);
      }
    }

    /* Character-residing weapons */
    for (let actor of game.actors.contents) {
      actor.items.forEach((item) => {
        if (
          item.type === "meleeWeapon" &&
          item.data.data.shieldSkill?.value != "undefined"
        ) {
          console.log(
            `==== CD10 | Migrating Item entity ${item.name} belonging to ${item.parent.name}`
          );
          _copyShieldSkillMatchID(item);
        }
      });
    }

    function _copyShieldSkillMatchID(item) {
      /* Find the weapon's 'shieldSkill' property and compare it to skills on the character. Copy the matchID from the character's skill. */
      let shieldSkillName = item.data.data.shieldSkill.value
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
              .toLowerCase() === shieldSkillName
          ) {
            item.update({
              "data.shieldSkill.value": i.data.data.matchID.value,
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
              .toLowerCase() === shieldSkillName
          ) {
            item.update({
              "data.shieldSkill.value": i.data.data.matchID.value,
            });
            console.log(`Copied matchID to`, item.name);
          }
        });
      }

      return;
    }

    return;
  }

  return;
}
