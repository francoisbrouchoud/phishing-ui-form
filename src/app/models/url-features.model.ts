export interface UrlFeatures {
  [x: string]: any;
  // URL brute utilisée pour les stats
  URL: string;
  URLLength: number;

  // Host complet, y compris "www"
  Domain: string;
  DomainLength: number;

  // IP ou nom de domaine
  IsDomainIP: number;

  // Dernier label du host (ex: com, fr, io, app, 123 pour une IP)
  TLD: string;
  TLDLength: number;

  // Nombre de sous-domaines = max(0, nb_labels - 2)
  NoOfSubDomain: number;

  // Caractères
  NoOfLettersInURL: number;
  LetterRatioInURL: number;

  NoOfDegitsInURL: number;
  DegitRatioInURL: number;

  NoOfEqualsInURL: number;
  NoOfQMarkInURL: number;
  NoOfAmpersandInURL: number;
  NoOfOtherSpecialCharsInURL: number;

  // (otherSpecials + ? + & + =) / URLLength
  SpecialCharRatioInURL: number;

  // Continuité des classes de caractères (lettre / chiffre / autre)
  CharContinuationRate: number;
}
