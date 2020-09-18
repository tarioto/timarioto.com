import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  constructor(
    public translate: TranslateService,
    private cookieService: CookieService
  ) {}

  ngOnInit(): void {}

  changeLang(selectedLang): void {
    this.translate.use(selectedLang);
    this.cookieService.set('language', selectedLang);
  }
}
