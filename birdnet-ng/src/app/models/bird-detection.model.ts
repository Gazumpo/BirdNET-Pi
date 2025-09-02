
export class BirdDetection {
    Date: string;
    Time: string;
    Sci_Name: string;
    Com_Name: string;
    Confidence: number;
    Lat: number;
    Lon: number;
    Cutoff: number;
    Week: number;
    Sens: number;
    Overlap: number;
    File_Name: string;

    birdsongUrl: string;
    imageUrl?: string;

    constructor(data: any) {
        this.Date = data.Date;
        this.Time = data.Time;
        this.Sci_Name = data.Sci_Name;
        this.Com_Name = data.Com_Name;
        this.Confidence = data.Confidence;
        this.Lat = data.Lat;
        this.Lon = data.Lon;
        this.Cutoff = data.Cutoff;
        this.Week = data.Week;
        this.Sens = data.Sens;
        this.Overlap = data.Overlap;
        this.File_Name = data.File_Name;

        this.birdsongUrl = 'http://birdnet.local:3000/' + data.Date + '/' + data.Com_Name.replaceAll(" ", "_") + '/' + data.File_Name;
        this.imageUrl = "birds/" + data.Sci_Name.replace(" ", "_") + ".jpg";
    }
}
