export default class CD10ItemSheet extends ItemSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            width: 560,
            height: 380,
            classes: ["cd10", "sheet", "item"]
        });

    }

    get template() {
        return `systems/cd10/templates/sheets/${this.item.data.type}-sheet.hbs`;
    }

    getData() {
        const baseData = super.getData();
        let sheetData = {
            owner: this.item.isOwner,
            editable: this.isEditable,
            item: baseData.item,
            data: baseData.item.data.data,
            config: CONFIG.cd10
        };

        return sheetData;
    }
}