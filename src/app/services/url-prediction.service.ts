import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UrlFeatures } from '../models/url-features.model';

export interface DataikuPredictionResponse {
  result: {
    prediction: string | number;
    probaPercentile: number;
    probas: { [label: string]: number };
    ignored: boolean;
  };
  timing: Record<string, number>;
  apiContext: {
    serviceId: string;
    endpointId: string;
    serviceGeneration: string;
  };
}

interface DataikuOnlyUrlSpecsFeatures {
  //NoOfOtherSpecialCharsInURL: string;
  LetterRatioInURL: string;
  //SpacialCharRatioInURL: string;
  DegitRatioInURL: string;
  NoOfLettersInURL: string;
  NoOfDegitsInURL: string;
  TLD: string;
  URLLength: number;
  NoOfSubDomain: string;
  CharContinuationRate: string;
  DomainLength: string;
  TLDLength: string;
  Domain: string;
  NoOfQMarkInURL: string;
  NoOfEqualsInURL: string;
  NoOfAmpersandInURL: string;
  IsDomainIP: string;
}

interface DataikuPredictionRequest {
  features: DataikuOnlyUrlSpecsFeatures;
}

@Injectable({
  providedIn: 'root'
})
export class UrlPredictionService {
  private readonly apiUrl =
    'https://dss.ga-fl.net/public/api/v1/OnlyURLSpecs/prediction/predict';

  constructor(private http: HttpClient) {}

  predict(features: UrlFeatures): Observable<DataikuPredictionResponse> {
    const payload: DataikuPredictionRequest = {
      features: {
       // NoOfOtherSpecialCharsInURL:
       //   String(features.NoOfOtherSpecialCharsInURL),
        LetterRatioInURL: String(features.LetterRatioInURL),
        //SpacialCharRatioInURL: String(features.SpacialCharRatioInURL),
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
      }
    };

    return this.http.post<DataikuPredictionResponse>(this.apiUrl, payload);
  }
}
