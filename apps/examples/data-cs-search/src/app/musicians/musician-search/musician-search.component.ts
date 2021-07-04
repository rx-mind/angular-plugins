import { ChangeDetectionStrategy, Component, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'rx-mind-musician-search',
  templateUrl: './musician-search.component.html',
  styleUrls: ['./musician-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MusicianSearchComponent {
  searchControl = new FormControl('');

  @Input() set query(query: string) {
    this.searchControl.setValue(query, { emitEvent: false });
  }

  @Output() search = this.searchControl.valueChanges.pipe(
    debounceTime(300),
    distinctUntilChanged()
  );
}
