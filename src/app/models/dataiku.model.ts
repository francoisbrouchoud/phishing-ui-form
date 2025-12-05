export interface DataikuPredictionResponse {
  result: {
    prediction: string | number;
    probaPercentile: number;
    probas: Record<string, number>;
    ignored: boolean;
  };
  timing: Record<string, number>;
  apiContext: {
    serviceId: string;
    endpointId: string;
    serviceGeneration: string;
  };
}

/**
 * Payload envoyé à Dataiku pour OnlyURLSpecs.
 */
export interface DataikuOnlyUrlSpecsFeatures {
  NoOfOtherSpecialCharsInURL: string;
  LetterRatioInURL: string;
  SpacialCharRatioInURL: string;
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

export interface DataikuPredictionRequest {
  features: DataikuOnlyUrlSpecsFeatures;
}

export interface DataikuResult {
  prediction: string;
  probaPercentile: number;
  probas: Record<string, number>;
  ignored: boolean;
}

