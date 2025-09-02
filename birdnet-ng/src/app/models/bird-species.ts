import { BirdDetection } from "./bird-detection.model";

export class BirdSpecies {
    Com_Name: string;
    Sci_Name: string;
    numberDetections?: number;
    numberDaysDetection?: number;
    percentDaily?: number;
    percentTotal?: number;
    rarity?: string;
    detectionDatesCount?: any;

    imageUrl?: string;

    constructor(data: any) {
        this.Com_Name = data.Com_Name;
        this.Sci_Name = data.Sci_Name;
        this.numberDetections = data.numberDetections;
        this.numberDaysDetection = data.numberDaysDetection;
        this.percentDaily = data.percentDaily;
        this.percentTotal = data.percentTotal;
        this.detectionDatesCount = data.detectionDatesCount;


        if (this.percentDaily !== undefined) {
            if (this.percentDaily < 15) {
                this.rarity = 'Very Rare';
            } else if (this.percentDaily < 50) {
                this.rarity = 'Rare';
            } else if (this.percentDaily >= 50 && this.percentDaily <= 75) {
                this.rarity = 'Common';
            } else {
                this.rarity = 'Very Common';
            }
        }

        this.imageUrl = "birds/" + data.Sci_Name.replace(" ", "_") + ".jpg";
    }
}
