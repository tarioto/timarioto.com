import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faLinkedinIn } from '@fortawesome/free-brands-svg-icons';

@NgModule({
  declarations: [],
  imports: [
    CommonModule
  ]
})
export class FontawesomeIconsModule {
  constructor() {
    // Add an icon to the library for convenient access in other components
    library.add(faLinkedinIn);
  }
}
