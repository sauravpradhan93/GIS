import { Component, OnInit } from '@angular/core';
import { NewsService } from '../services/news.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css']
})
export class NewsComponent implements OnInit {
Aarticles:Array<any>;
Ssources:Array<any>;
  constructor(private newsService:NewsService) { }

  ngOnInit(){
    this.newsService.getArticles().subscribe(data=>this.Aarticles=data['articles']);
    this.newsService.getSources().subscribe(data=> this.Ssources = data['sources']);
  }
//searchNews(source){
  //this.newsService.getArticlesID(source).subscribe(data=>this.Aarticles=data['article']);
//}
}
