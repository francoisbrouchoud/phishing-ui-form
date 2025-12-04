export interface UrlFeatures {
  URL: string;
  URLLength: number;

  Domain: string;
  DomainLength: number;

  IsDomainIP: number;

  TLD: string;
  TLDLength: number;

  NoOfSubDomain: number;

  NoOfLettersInURL: number;
  LetterRatioInURL: number;

  NoOfDegitsInURL: number;
  DegitRatioInURL: number;

  NoOfEqualsInURL: number;
  NoOfQMarkInURL: number;
  NoOfAmpersandInURL: number;

  NoOfOtherSpecialCharsInURL: number;
  SpecialCharRatioInURL: number;

  CharContinuationRate: number;
}
