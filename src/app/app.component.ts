import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  ReactiveFormsModule,
  Validators,
  FormsModule
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';

import { UrlFeatureExtractorService } from './services/url-feature-extractor.service';
import { UrlFeatures } from './models/url-features.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,          // ⬅️ AJOUT ICI
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Analyseur d’URL';

  urlControl = new FormControl('', [Validators.required]);
  features: UrlFeatures | null = null;
  errorMessage = '';

  constructor(private urlFeatureExtractor: UrlFeatureExtractorService) {}

  analyze(): void {
    console.log('analyze called');   // ⬅️ mets plutôt log que error
    this.errorMessage = '';
    this.features = null;

    const rawUrl = this.urlControl.value || '';

    if (!rawUrl.trim()) {
      this.errorMessage = 'Veuillez saisir une URL.';
      return;
    }

    try {
      this.features = this.urlFeatureExtractor.extract(rawUrl);
      console.log('URL analysée :', rawUrl);
      console.log('features :', this.features);
    } catch (e: any) {
      this.errorMessage = e?.message || 'Erreur lors de l’analyse de l’URL.';
    }
  }

  clearUrl(): void {
    this.urlControl.setValue('');
    this.features = null;
    this.errorMessage = '';
  }
}
