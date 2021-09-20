import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { FourZeroFourComponent } from './four-zero-four/four-zero-four.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '404', component: FourZeroFourComponent },
  { path: '**', redirectTo: '404' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
