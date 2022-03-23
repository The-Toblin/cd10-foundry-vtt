export default async function MigrateWorld(currentVersion) {
  /* Test which migrations need to be done */

  const old = !currentVersion || isNewerVersion("0.1.0", currentVersion),
    v020 = !currentVersion || isNewerVersion("0.2.0", currentVersion),
    v030 = !currentVersion || isNewerVersion("0.3.0", currentVersion),
    v040 = !currentVersion || isNewerVersion("0.4.0", currentVersion);

  let updateData = {
      actors: [],
      tokens: [],
      items: [],
    },
    newData;

  if (old) {
    console.log("==== CD10 | Beginning v0.1.0 migration!");
    newData = _oldMigrate(updateData);
    if (newData.exitCode != 0) {
      console.log("==== CD10 | v0.1.0 migration failed! Aborting!");
      return;
    } else {
      console.log("==== CD10 | v0.1.0 migration completed!");
      updateData.actors.push(newData.actors);
      updateData.tokens.push(newData.tokens);
      updateData.items.push(newData.items);
    }
  }

  if (v020) {
    console.log("==== CD10 | Beginning v0.2.0 migration!");
    newData = _v020Migrate(updateData);
    if (newData.exitCode != 0) {
      console.log("==== CD10 | v0.2.0 migration failed! Aborting!");
      return;
    } else {
      console.log("==== CD10 | v0.2.0 migration completed!");
      updateData.actors.push(newData.actors);
      updateData.tokens.push(newData.tokens);
      updateData.items.push(newData.items);
    }
  }

  if (v030) {
    console.log("==== CD10 | Beginning v0.3.0 migration!");
    newData = _oldMigrate(updateData);
    if (newData.exitCode != 0) {
      console.log("==== CD10 | v0.3.0 migration failed! Aborting!");
      return;
    } else {
      console.log("==== CD10 | v0.3.0 migration completed!");
      updateData.actors.push(newData.actors);
      updateData.tokens.push(newData.tokens);
      updateData.items.push(newData.items);
    }
  }

  if (v040) {
    console.log("==== CD10 | Beginning v0.4.0 migration!");
    newData = _oldMigrate(updateData);
    if (newData.exitCode != 0) {
      console.log("==== CD10 | v0.4.0 migration failed! Aborting!");
      return;
    } else {
      console.log("==== CD10 | v0.4.0 migration completed!");
      updateData.actors.push(newData.actors);
      updateData.tokens.push(newData.tokens);
      updateData.items.push(newData.items);
    }
  }

  _performMigration(type, updateData);
  return;
}

async function _performMigration(type, updateData) {
  /* Do things with the data */
  console.log(`Type is ${type} and data is`, updateData);
}
