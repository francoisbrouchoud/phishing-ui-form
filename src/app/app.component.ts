import { Component, inject } from '@angular/core';
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
import { UrlPredictionService } from './services/url-prediction.service';
import { UrlFeatures } from './models/url-features.model';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule, MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import {
  DataikuResult,
  DataikuPredictionResponse
} from './models/dataiku.model';

type DataikuClassLabel = '0' | '1';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatDividerModule,
    MatProgressSpinner,
    MatButtonToggleModule
],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  readonly title = 'Analyseur d’URL';

  readonly urlControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required]
  });

  features: UrlFeatures | null = null;
  errorMessage = '';

  securityLevel: number = 1;

  isLoadingPrediction = false;
  predictionResult: DataikuResult | null = null;

  private readonly urlFeatureExtractor = inject(UrlFeatureExtractorService);
  private readonly urlPredictionService = inject(UrlPredictionService);

  formatSecurityLabel(value: number): string {
    switch (value) {
      case 0: return 'Bas (Tolérant)';
      case 1: return 'Normal';
      case 2: return 'Haute Sécurité';
      default: return `${value}`;
    }
  }
  
  get currentSecurityLabel(): string {
    return this.formatSecurityLabel(this.securityLevel);
  }
  
  analyze(): void {
    this.resetPredictionState();
    this.errorMessage = '';

    const rawUrl = this.urlControl.value.trim();

    if (!rawUrl) {
      this.urlControl.markAsTouched();
      this.errorMessage = 'Veuillez saisir une URL.';
      this.features = null;
      return;
    }

    try {
      this.features = this.urlFeatureExtractor.extract(rawUrl);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Erreur lors de l’analyse de l’URL.';
      this.errorMessage = message;
      this.features = null;
    }
  }

  predict(): void {
    if (!this.features) {
      return;
    }

    this.errorMessage = '';
    this.isLoadingPrediction = true;
    this.predictionResult = null;

    this.urlPredictionService.predict(this.features).subscribe({
      next: (resp: DataikuPredictionResponse) => {
        this.isLoadingPrediction = false;

        if (resp?.result) {
          this.predictionResult = {
            prediction: String(resp.result.prediction),
            probaPercentile: resp.result.probaPercentile,
            probas: resp.result.probas,
            ignored: resp.result.ignored
          };
        }
      },
      error: (err) => {
        console.error('Erreur Dataiku', err);
        this.isLoadingPrediction = false;
        this.errorMessage =
          'Erreur lors de l’appel au service de prédiction Dataiku.';
      }
    });
  }

  clearUrl(): void {
    this.urlControl.setValue('');
    this.features = null;
    this.errorMessage = '';
    this.resetPredictionState();
  }

  getProba(label: DataikuClassLabel): number | null {
    if (!this.predictionResult?.probas) {
      return null;
    }
    const value = this.predictionResult.probas[label];
    return typeof value === 'number' ? value : null;
  }

  private resetPredictionState(): void {
    this.isLoadingPrediction = false;
    this.predictionResult = null;

  }
}
