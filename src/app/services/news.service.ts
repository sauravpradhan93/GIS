import {HttpClient} from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class NewsService{
constructor(private http:HttpClient){}
key="5d7c3457266c4f7baefca900e6066924";
getSources(){
    return this.http.get('https://newsapi.org/v2/sources?language=en&apiKey='+this.key);
 }
 getArticles(){
  return this.http.get('https://newsapi.org/v2/top-headlines?q=coronavirus&apiKey='+this.key);
 }
// getArticlesID(source: String){
  //return this.http.get('https://newsapi.org/v2/top-headlines?sources='+source+'&apiKey='+this.key);
// }
}

