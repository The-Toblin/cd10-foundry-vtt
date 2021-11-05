export default class CD10Item extends Item {

    get acceptedAmmoList() {
        return this.actor.sheet.ammoList.filter(a => a.data.ammoType == this.data.data.acceptedAmmo)
    }

}