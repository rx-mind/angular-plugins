import { NgModule } from '@angular/core';
import { MusiciansComponent } from './musicians.component';
import { MusicianListComponent } from './musician-list/musician-list.component';
import { MusicianSearchComponent } from './musician-search/musician-search.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [MusiciansComponent, MusicianListComponent, MusicianSearchComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatToolbarModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  exports: [MusiciansComponent],
})
export class MusiciansModule {}
