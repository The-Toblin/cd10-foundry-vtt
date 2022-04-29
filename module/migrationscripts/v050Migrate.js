export const v050Migrate = async () => {

  const _migrateV050Actors = async updateData => {
    const actorList = [];

    for (const actor of game.actors.contents) {
      const actorData = actor.data.data;
      const actorUpdates = {
        system: {}
      };
      const itemArray = [];

      if (actor.type === "named") {
        actor.type = "major";
        actorUpdates.system = {
          species: actorData.species.value,
          wounds: {
            value: actorData.wounds.value,
            max: 15,
            min: 0
          },
          quote: actorData.quote.value,
          stressing: actorData.stressing.value,
          playerName: actorData.playerName.value,
          exp: actorData.exp.total,
          birthplace: actorData.birthplace.value,
          title: actorData.title.value,
          age: actorData.age.value,
          sex: actorData.sex.value,
          gender: actorData.gender.value,
          notes: actorData.notes.value
        };

      } else if (actor.type === "mook") {
        actor.type = "minor";
        actorUpdates.system = {
          species: actorData.species,
          wounds: {
            value: actorData.wounds.value,
            max: 15,
            min: 0
          },
          quote: actorData.quote,
          stressing: actorData.stressing
        };
      }

      for (const item of actor.items.contents) {
        const itemUpdates = {
          system: {}
        };
        // FIXME: Finish migrating items.
      }

      actorList.push({id: actor.id, actorUpdates}); }
    return actorList;
  };

  const _migrateV050Tokens = async () => {
    const tokenList = [];

    for (const scene of game.scenes.contents) {
      for (const token of scene.tokens) {
        if (token.actor) {
          if (token.actor.data.data.hasOwnProperty("shock")) tokenList.push(token);
        } else if (token._actor) {
          if (token._actor.data.data.hasOwnProperty("shock")) tokenList.push(token);
        }
      }
    }

    return tokenList;
  };

  const updateData = {
    "data.-=shock": null,
    "data.-=morale": null,
    "data.-=attackPrimary": null,
    "data.-=attackSecondary": null,
    "data.-=defensePrimary": null,
    "data.-=defenseSecondary": null,
    "data.-=downAndOut": null,
    "data.-=encumbranceLimit": null,
    "data.-=levelUp": null,
    "data.-=playername": null,
    "data.-=name": null,
    "data.-=totalTraitValue": null,
    "data.-=description": null,
    "data.-=money": null,
    "data.-=family": null,
    "data.-=faith": null,
    "data.-=mainHand": null,
    "data.-=goal": null,
    "data.-=birthplace": null
  };

  const actors = await _migrateV050Actors(updateData);
  const tokens = await _migrateV050Tokens(updateData);

  const newData = {
    actors,
    tokens
  };
  return newData;
};

