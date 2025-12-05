import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { UrlFeatures } from '../models/url-features.model';
import {
  DataikuPredictionRequest,
  DataikuPredictionResponse,
  DataikuOnlyUrlSpecsFeatures
} from '../models/dataiku.model';

@Injectable({
  providedIn: 'root'
})
export class UrlPredictionService {
  private readonly apiUrl =
    'https://dss.ga-fl.net/public/api/v1/OnlyURLSpecs/prediction/predict';

  constructor(private readonly http: HttpClient) {}

  predict(features: UrlFeatures): Observable<DataikuPredictionResponse> {
    const payload: DataikuPredictionRequest = {
      features: this.mapToDataikuFeatures(features)
    };

    return this.http.post<DataikuPredictionResponse>(this.apiUrl, payload);
  }

  private mapToDataikuFeatures(features: UrlFeatures): DataikuOnlyUrlSpecsFeatures {
    return {
      NoOfOtherSpecialCharsInURL: String(features.NoOfOtherSpecialCharsInURL),
      LetterRatioInURL: String(features.LetterRatioInURL),
      SpacialCharRatioInURL: String(features.SpacialCharRatioInURL),
      DegitRatioInURL: String(features.DegitRatioInURL),
      NoOfLettersInURL: String(features.NoOfLettersInURL),
      NoOfDegitsInURL: String(features.NoOfDegitsInURL),
      TLD: features.TLD,
      URLLength: features.URLLength,
      NoOfSubDomain: String(features.NoOfSubDomain),
      CharContinuationRate: String(features.CharContinuationRate),
      DomainLength: String(features.DomainLength),
      TLDLength: String(features.TLDLength),
      Domain: features.Domain,
      NoOfQMarkInURL: String(features.NoOfQMarkInURL),
      NoOfEqualsInURL: String(features.NoOfEqualsInURL),
      NoOfAmpersandInURL: String(features.NoOfAmpersandInURL),
      IsDomainIP: String(features.IsDomainIP)
    };
  }
}
