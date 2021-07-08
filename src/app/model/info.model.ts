export class InfoModel{
public deaths:number;
public cases:number;
public country:string;

constructor(country:string,death:number, cases:number){
    this.country=country;
    this.deaths=death;
this.cases=cases;

 }
}