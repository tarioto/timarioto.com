import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService]
})
export class AppComponent implements OnInit {
  constructor(
    private messageService: MessageService,
    public translate: TranslateService
  ) {
    translate.addLangs(['en-US', 'it']);
    translate.setDefaultLang('en-US');

    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en-US|it/) ? browserLang : 'en-US');
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
