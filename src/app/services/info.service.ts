import { InfoModel } from '../model/info.model';
import { Observable } from 'rxjs/Observable';
import { AngularFirestoreCollection, AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class InfoService {

    infocollection: AngularFirestoreCollection<InfoModel>;
    infos: Observable<InfoModel[]>;

    constructor(public fbs: AngularFirestore) {
        this.infocollection = this.fbs.collection<InfoModel>('infos');
        this.infos = this.infocollection.valueChanges();
    }

    getInfo() {
        return this.infos;
    }

}


