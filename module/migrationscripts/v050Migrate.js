export const v050Migrate = async () => {

  const _migrateV050Actors = async () => {
    const actorList = [];

    for (const actor of game.actors.contents) {
      if (actor.data.data.hasOwnProperty("shock")) actorList.push(actor);
    }
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
    "data.-=money": null
  };

  const actors = await _migrateV050Actors();
  const tokens = await _migrateV050Tokens();

  const newData = {
    actors,
    tokens,
    updateData
  };
  return newData;
};

