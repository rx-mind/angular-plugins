import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'rx-mind-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'examples-data-cs-pagination';
}
