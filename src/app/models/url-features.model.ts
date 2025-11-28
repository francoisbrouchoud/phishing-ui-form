export interface UrlFeatures {
  URL: string;
  URLLength: number;

  Domain: string;
  DomainLength: number;

  TLD: string;
  TLDLength: number;

  NoOfSubDomain: number;
  IsDomainIP: number;

  NoOfLettersInURL: number;
  NoOfDegitsInURL: number;
  NoOfOtherSpecialCharsInURL: number;

  LetterRatioInURL: number;
  DegitRatioInURL: number;
  SpacialCharRatioInURL: number;

  CharContinuationRate: number;

  NoOfQMarkInURL: number;
  NoOfEqualsInURL: number;
  NoOfAmpersandInURL: number;
}
