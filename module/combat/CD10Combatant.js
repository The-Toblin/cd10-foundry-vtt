export default class CD10Combatant extends Combatant {
  _getInitiativeFormula(combatant) {
    let baseFormula = super._getInitiativeFormula(combatant);
    const actor = game.actors.get(this.data.actorId);
    let skillValue,
      modifier = actor.getModifier;

    actor.items.forEach((w) => {
      if (w.type === "meleeWeapon" || w.type === "rangedWeapon") {
        if (w.data.data.isEquipped.value) {
          actor.items.forEach((s) => {
            if (s.type === "skill") {
              if (s.data.data.matchID === w.data.data.attackSkill.value) {
                skillValue = s.data.data.skillLevel.value;
                skillName = s.name;
              }
            }
          });
        }
      }
    });

    if (skillValue != null) {
      baseFormula += ` + ${skillValue}`;
    }
    if (modifier > 0) {
      baseFormula += ` - ${modifier}`;
    }

    return baseFormula;
  }
}
