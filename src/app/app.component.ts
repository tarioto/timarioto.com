import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { NgcCookieConsentService } from 'ngx-cookieconsent';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    public translateService: TranslateService,
    private cookieService: CookieService,
    private ccService: NgcCookieConsentService
  ) { }

  ngOnInit() {
    this.translateService.addLangs(['en', 'it']);
    this.translateService.setDefaultLang('en');
    const fromCookie = this.cookieService.get('language');
    console.log(fromCookie, 'fromCookie');
    const browserLang = this.translateService.getBrowserLang();
    if (fromCookie !== '') {
      this.translateService.use(fromCookie);
    } else {
      if (browserLang.match(/en|it/)) {
        this.translateService.use(browserLang);
        this.cookieService.set('language', browserLang);
      } else {
        this.translateService.use('en');
        this.cookieService.set('language', 'en');
      }
    }
    this.translateService
      .get(['cookie.header', 'cookie.message', 'cookie.dismiss', 'cookie.allow', 'cookie.deny', 'cookie.link', 'cookie.policy'])
      .subscribe(data => {

        this.ccService.getConfig().content = this.ccService.getConfig().content || {} ;
        // Override default messages with the translated ones
        this.ccService.getConfig().content.header = data['cookie.header'];
        this.ccService.getConfig().content.message = data['cookie.message'];
        this.ccService.getConfig().content.dismiss = data['cookie.dismiss'];
        this.ccService.getConfig().content.allow = data['cookie.allow'];
        this.ccService.getConfig().content.deny = data['cookie.deny'];
        this.ccService.getConfig().content.link = data['cookie.link'];
        this.ccService.getConfig().content.policy = data['cookie.policy'];

        this.ccService.destroy(); // remove previous cookie bar (with default messages)
        this.ccService.init(this.ccService.getConfig()); // update config with translated messages
      });

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

      }, 1000);
    }
  }
}
