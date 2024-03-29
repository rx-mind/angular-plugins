import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Musician } from '../musician.model';

@Component({
  selector: 'rx-mind-musician-list',
  templateUrl: './musician-list.component.html',
  styleUrls: ['./musician-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicianListComponent {
  @Input() musicians: Musician[] = [];
  @Input() isLoading = false;
}
