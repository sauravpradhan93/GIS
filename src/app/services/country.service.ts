import { Injectable } from '@angular/core';
import { AngularFireDatabase, AngularFireList, AngularFireObject } from '@angular/fire/database';  // Firebase modules for Database, Data list and Single object

@Injectable({
    providedIn: 'root'
})

export class CountryService {
    countriesRef: AngularFireList<any>;    // Reference to Student data list, its an Observable
    // Inject AngularFireDatabase Dependency in Constructor
    constructor(private db: AngularFireDatabase) { }

    GetCountriesList() {
        this.countriesRef = this.db.list('/');
        return this.countriesRef;
    }

}