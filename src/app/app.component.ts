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
import { UrlPredictionService, DataikuPredictionResponse } from './services/url-prediction.service';
import { UrlFeatures } from './models/url-features.model';

interface DataikuResult {
  prediction: string;
  probaPercentile: number;
  probas: { [label: string]: number };
  ignored: boolean;
}

interface DataikuTiming {
  preProcessing: number;
  wait: number;
  enrich: number;
  preparation: number;
  prediction: number;
  postProcessing: number;
}

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

  // Dataiku
  isLoadingPrediction = false;
  predictionResult: DataikuResult | null = null;
  predictionTiming: DataikuTiming | null = null;

  constructor(
    private urlFeatureExtractor: UrlFeatureExtractorService,
    private urlPredictionService: UrlPredictionService
  ) {}

  /**
   * Étape 1 : analyser l’URL et remplir les features (local, pas d’appel HTTP).
   */
  analyze(): void {
    this.errorMessage = '';
    this.predictionResult = null;
    this.predictionTiming = null;
    this.isLoadingPrediction = false;

    const rawUrl = this.urlControl.value || '';

    if (!rawUrl.trim()) {
      this.errorMessage = 'Veuillez saisir une URL.';
      this.features = null;
      return;
    }

    try {
      this.features = this.urlFeatureExtractor.extract(rawUrl);
    } catch (e: any) {
      this.errorMessage = e?.message || 'Erreur lors de l’analyse de l’URL.';
      this.features = null;
    }
  }

  /**
   * Étape 2 : envoyer les features (possiblement éditées) à Dataiku.
   */
  predict(): void {
    if (!this.features) {
      return;
    }

    this.errorMessage = '';
    this.predictionResult = null;
    this.predictionTiming = null;
    this.isLoadingPrediction = true;

    this.urlPredictionService.predict(this.features).subscribe({
      next: (resp: DataikuPredictionResponse) => {
        this.isLoadingPrediction = false;

        if (resp && resp.result) {
          this.predictionResult = {
            prediction: String(resp.result.prediction),
            probaPercentile: resp.result.probaPercentile,
            probas: resp.result.probas,
            ignored: resp.result.ignored
          };
        }

        if (resp && resp.timing) {
          this.predictionTiming = {
            preProcessing: resp.timing['preProcessing'],
            wait: resp.timing['wait'],
            enrich: resp.timing['enrich'],
            preparation: resp.timing['preparation'],
            prediction: resp.timing['prediction'],
            postProcessing: resp.timing['postProcessing']
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
    this.predictionResult = null;
    this.predictionTiming = null;
    this.isLoadingPrediction = false;
  }

  getProba(label: string): number | null {
    if (!this.predictionResult || !this.predictionResult.probas) {
      return null;
    }
    const value = this.predictionResult.probas[label];
    return typeof value === 'number' ? value : null;
  }
}
