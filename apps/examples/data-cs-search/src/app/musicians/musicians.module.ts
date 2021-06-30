import { NgModule } from '@angular/core';
import { MusiciansComponent } from './musicians.component';
import { MusicianListComponent } from './musician-list/musician-list.component';
import { MusicianSearchComponent } from './musician-search/musician-search.component';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MusiciansMaterialModule } from './musicians-material.module';

@NgModule({
  declarations: [MusiciansComponent, MusicianListComponent, MusicianSearchComponent],
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, MusiciansMaterialModule],
  exports: [MusiciansComponent],
})
export class MusiciansModule {}
