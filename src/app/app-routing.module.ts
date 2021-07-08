import { RouterModule, Routes } from "@angular/router"
import { NgModule } from '@angular/core'
import { MapComponentComponent } from './map-component/map-component.component'
import { NewsComponent } from './news/news.component'
import { CdcComponent } from './cdc/cdc.component'
const routes: Routes = [
    { path: '', redirectTo: '/map', pathMatch: 'full' },
    { path: 'map', component: MapComponentComponent },
    { path: 'news', component: NewsComponent },
    {path:'cdc',component:CdcComponent}
]
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }

