import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  constructor(
    private messageService: MessageService,
    public translate: TranslateService,
    private cookieService: CookieService
  ) {
    translate.addLangs(['en', 'it']);
    translate.setDefaultLang('en');
    const fromCookie = this.cookieService.get('language');
    console.log(fromCookie, 'fromCookie');
    const browserLang = translate.getBrowserLang();
    if (fromCookie !== '') {
      translate.use(fromCookie);
    } else {
      if (browserLang.match(/en|it/)) {
        translate.use(browserLang);
        this.cookieService.set('language', browserLang);
      } else {
        translate.use('en');
        this.cookieService.set('language', 'en');
      }
    }
  }

  ngOnInit() {
    // Detects if device is on iOS
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };

    // Detects if device is in standalone mode
    const isInStandaloneMode = () =>
      'standalone' in (window as any).navigator &&
      (window as any).navigator.standalone;

    // Checks if should display install popup notification:
    if (isIos() && !isInStandaloneMode()) {
      setTimeout(() => {
        this.messageService.add({
          severity: 'success',
          summary: 'Install this app on your device.',
          detail: 'Tap the share icon and then Add to homescreen'
        });
      }, 1000);
    }
  }
}
