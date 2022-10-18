/**
 * Extend the basic Die to show custom CD10 icons on a d10.
 * @extends {Die}
 */
export class CeleniaDie extends Die {
  constructor(termData = {}) {
    const explode = game.settings.get("cd10", "explodingNines") ? "x" : "xo";
    termData.modifiers = [
      `${explode}9`
    ];
    termData.faces = 10;

    super(termData);
  }

  /** @override */
  static DENOMINATION = "r";

  roll() {
    const roll = {result: undefined, active: true, zero: false, nines: 0};
    roll.result = Math.ceil(CONFIG.Dice.randomUniform() * this.faces);

    if (roll.result === 10 && !roll.zero) {
      roll.result = 0;
      roll.zero = true;
      roll.success = false;
    }

    if (roll.result === 9) {
      roll.nines += 1;
    }
    this.results.push(roll);
    return roll;
  }

  /**
   * Explode the Die, rolling additional results for any values which match the target set.
   * If no target number is specified, explode the highest possible result.
   * Explosion can be a "small explode" using a lower-case x or a "big explode" using an upper-case "X"
   *
   * @param {string} modifier     The matched modifier query
   * @param {boolean} recursive   Explode recursively, such that new rolls can also explode?
   */
  explode(modifier, {recursive=true}={}) {

    // Match the "explode" or "explode once" modifier
    const rgx = /xo?([0-9]+)?([<>=]+)?([0-9]+)?/i;
    const match = modifier.match(rgx);
    if ( !match ) return false;
    let [max, comparison, target] = match.slice(1);

    // If no comparison or target are provided, treat the max as the target value
    if ( max && !(target || comparison) ) {
      target = max;
      max = null;
    }

    // Determine target values
    target = Number.isNumeric(target) ? parseInt(target) : this.faces;
    comparison = comparison || "=";

    // Determine the number of allowed explosions
    max = Number.isNumeric(max) ? parseInt(max) : null;

    // Recursively explode until there are no remaining results to explode
    let checked = 0;
    const initial = this.results.length;
    while ( checked < this.results.length ) {
      let r = this.results[checked];
      checked++;
      if (!r.active) continue;

      // Maybe we have run out of explosions
      if ( (max !== null) && (max <= 0) ) break;

      // Determine whether to explode the result and roll again!
      if ( DiceTerm.compareResult(r.result, comparison, target) ) {
        r.exploded = true;
        this.roll();
        if ( max !== null ) max -= 1;
      }

      // Limit recursion
      if ( !recursive && (checked === initial) ) break;
      if ( checked > 1000 ) throw new Error("Maximum recursion depth for exploding dice roll exceeded");
    }
  }

  /**
   * @param modifier
   * @see {@link Die#explode}
   */
  explodeOnce(modifier) {
    return this.explode(modifier, {recursive: false});
  }
}
