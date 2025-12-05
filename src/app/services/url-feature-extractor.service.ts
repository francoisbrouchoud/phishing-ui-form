import { Injectable } from '@angular/core';
import { UrlFeatures } from '../models/url-features.model';

@Injectable({
  providedIn: 'root'
})
export class UrlFeatureExtractorService {

  extract(rawUrl: string): UrlFeatures {
    const normalized = this.normalizeUrl(rawUrl);

    let urlObj: URL;
    try {
      urlObj = new URL(normalized);
    } catch {
      throw new Error('URL invalide');
    }

    const fullUrl = urlObj.href;
    const URLLength = normalized.length;

    const domain = urlObj.hostname;
    const DomainLength = domain.length;

    // Culcul NoOfLettersInURL : domaine (sans www) + path + query + fragment
    const domainWithoutWww = domain.startsWith('www.') ? domain.substring(4) : domain;
    const pathPart = urlObj.pathname || '';
    const searchPart = urlObj.search ? urlObj.search.substring(1) : '';
    const hashPart = urlObj.hash ? urlObj.hash.substring(1) : '';
    const hostPathQueryFragment = domainWithoutWww + pathPart + searchPart + hashPart;
    const lettersInHostPathQueryFragment = hostPathQueryFragment.replace(/[^A-Za-z]/g, '');
    const NoOfLettersInURL = lettersInHostPathQueryFragment.length;

    const isIp = this.isIpAddress(domain);
    const IsDomainIP = isIp ? 1 : 0;

    const tld = this.extractTld(domain);
    const TLD = tld;
    const TLDLength = tld.length;

    const NoOfSubDomain = this.countSubdomains(domain);

    const charStats = this.computeCharacterStats(fullUrl);

    const LetterRatioInURL = URLLength > 0 ? Math.round((NoOfLettersInURL / URLLength) * 1000) / 1000 : 0;

    const DegitRatioInURL = URLLength > 0 ? Math.round((charStats.digits / URLLength) * 1000) / 1000 : 0;

    const NoOfOtherSpecialCharsInURL = this.computeNoOfOtherSpecialChars(urlObj);

    const specialForRatio = NoOfOtherSpecialCharsInURL + charStats.qMarks + charStats.equals + charStats.ampersands;

    const SpacialCharRatioInURL = URLLength > 0 ? Math.round((specialForRatio / URLLength) * 1000) / 1000 : 0;

    const CharContinuationRate = this.computeCharContinuationRateFromDomain(domain, tld);


    const features: UrlFeatures = {
      URL: fullUrl,
      URLLength,

      Domain: domain,
      DomainLength,
      IsDomainIP,

      TLD,
      TLDLength,
      NoOfSubDomain,

      NoOfLettersInURL,

      LetterRatioInURL,

      NoOfDegitsInURL: charStats.digits,
      DegitRatioInURL,

      NoOfEqualsInURL: charStats.equals,
      NoOfQMarkInURL: charStats.qMarks,
      NoOfAmpersandInURL: charStats.ampersands,

      NoOfOtherSpecialCharsInURL,

      CharContinuationRate,
      SpacialCharRatioInURL
    };

    return features;
  }


  private normalizeUrl(raw: string): string {
    const trimmed = (raw || '').trim();
    if (!trimmed) {
      return trimmed;
    }

    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return 'https://' + trimmed;
    }
  }

  /**
   * TLD = dernier label du hostname, ex:
   *  - "ipfs.io" -> "io"
   */
  private extractTld(hostname: string): string {
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length === 0) {
      return '';
    }
    return parts[parts.length - 1];
  }

  /**
   * Nombre de sous-domaines: max(0, nb_labels - 2)
   * Ex:
   *  - "www.dlrect-smtb.jp.ap1.ib.commetryx.com" -> 7 labels => 5
   */
  private countSubdomains(hostname: string): number {
    const parts = hostname.split('.').filter(Boolean);
    if (parts.length <= 2) {
      return 0;
    }
    return parts.length - 2;
  }

  /**
   * Détection IPv4 / IPv6 (simplifiée pour notre cas d'usage)
   */
  private isIpAddress(hostname: string): boolean {
    // IPv4
    const ipv4Regex =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    if (ipv4Regex.test(hostname)) {
      return true;
    }

    // IPv6
    if (hostname.includes(':')) {
      return true;
    }

    return false;
  }


  /**
  * Compte les lettres, chiffres, caractères spéciaux, '?', '=', '&'.
  *
  * - NoOfDegitsInURL       : tous les chiffres 0–9
  * - NoOfEqualsInURL       : '='
  * - NoOfQMarkInURL        : '?'
  * - NoOfAmpersandInURL    : '&'
  * - NoOfOtherSpecialChars : tous les caractères
  *   qui ne sont NI lettre, NI chiffre, NI '&', NI '?', NI '='
  *
  */
  private computeCharacterStats(url: string): {
    digits: number;
    otherSpecials: number;
    qMarks: number;
    equals: number;
    ampersands: number;
  } {
    let digits = 0;
    let otherSpecials = 0;
    let qMarks = 0;
    let equals = 0;
    let ampersands = 0;

    const len = url.length;

    for (let i = 0; i < len; i++) {
      const c = url[i];

      const isDigit = /[0-9]/.test(c);

      if (isDigit) {
        digits++;
        continue;
      }

      if (c === '?') {
        qMarks++;
        continue;
      }
      if (c === '=') {
        equals++;
        continue;
      }
      if (c === '&') {
        ampersands++;
        continue;
      }

      otherSpecials++;
    }

    return {
      digits,
      otherSpecials,
      qMarks,
      equals,
      ampersands
    };
  }


    /**
  * Normalise le domaine pour le calcul de CharContinuationRate,
  * à partir de Domain et éventuellement TLD, pour se rapprocher
  * du calcul du dataset original PhiUSIIL.
  *
  * Hypothèse :
  *  - Domain peut être "www.example.com" ou "example.com"
  *  - TLD peut être "com", "co.uk", etc.
  *  - On enlève le TLD et "www." pour obtenir un SLD approximatif
  */
  private normalizeDomainForCharCont(domain: string | null | undefined,
    tld?: string | null): string {
    if (!domain) {
      return "";
    }

    let d = domain.trim().toLowerCase();

    // Enlever le préfixe "www."
    if (d.startsWith("www.")) {
      d = d.substring(4);
    }

    // Si on a un TLD, on essaie de l'enlever à la fin
    if (tld && tld.trim().length > 0) {
      const t = tld.trim().toLowerCase();
      if (d.endsWith("." + t)) {
        d = d.substring(0, d.length - t.length - 1); // enlever ".tld"
      } else if (d === t) {
        // cas bizarre, mais au cas où
        d = "";
      }
    } else {
      // Pas de TLD fourni : si le domaine contient encore des points,
      // on enlève la dernière partie comme TLD probable.
      const lastDot = d.lastIndexOf(".");
      if (lastDot > 0) {
        d = d.substring(0, lastDot);
      }
    }

    // À ce stade, d est censé représenter le SLD (ou approché)
    return d;
  }

  /**
  * Retourne la longueur max de runs consécutifs pour
  *  - lettres (L_alpha)
  *  - chiffres (L_digit)
  *  - autres (L_special)
  * dans une chaîne donnée.
  */
  private longestRunsByClass(s: string): { L_alpha: number; L_digit: number; L_special: number } {
    let L_alpha = 0;
    let L_digit = 0;
    let L_special = 0;

    let currentClass: 'L' | 'D' | 'S' | null = null;
    let currentLen = 0;

    const isLetter = (c: string) => /[A-Za-z]/.test(c);
    const isDigit = (c: string) => /[0-9]/.test(c);

    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      let cls: 'L' | 'D' | 'S';

      if (isLetter(c)) {
        cls = 'L';
      } else if (isDigit(c)) {
        cls = 'D';
      } else {
        cls = 'S';
      }

      if (cls === currentClass) {
        currentLen++;
      } else {
        // On clôt le run précédent
        if (currentClass === 'L') {
          L_alpha = Math.max(L_alpha, currentLen);
        } else if (currentClass === 'D') {
          L_digit = Math.max(L_digit, currentLen);
        } else if (currentClass === 'S') {
          L_special = Math.max(L_special, currentLen);
        }

        // On démarre un nouveau run
        currentClass = cls;
        currentLen = 1;
      }
    }

    // Clôturer le dernier run
    if (currentClass === 'L') {
      L_alpha = Math.max(L_alpha, currentLen);
    } else if (currentClass === 'D') {
      L_digit = Math.max(L_digit, currentLen);
    } else if (currentClass === 'S') {
      L_special = Math.max(L_special, currentLen);
    }

    return { L_alpha, L_digit, L_special };
  }

  /**
  * Reproduction en TypeScript de la méthode Python
  * compute_char_continuation_rate_from_row,
  * mais en version "domain + tld" plutôt que "row".
  *
  * Formule :
  *   (L_alpha_max + L_digit_max + L_special_max) / len(SLD)
  */
  private computeCharContinuationRateFromDomain(domain: string | null | undefined,
    tld?: string | null): number {
    const sld = this.normalizeDomainForCharCont(domain, tld);

    if (!sld || sld.length === 0) {
      return 0.0;
    }

    const { L_alpha, L_digit, L_special } = this.longestRunsByClass(sld);
    const denom = sld.length;

    if (denom === 0) {
      return 0.0;
    }

    return (L_alpha + L_digit + L_special) / denom;
  }



  // Helper pour décoder les entités HTML (&amp; -> &, etc.)
  private htmlUnescape(value: string): string {
    if (!value) {
      return '';
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
  }

  /**
   * Reproduction de la logique Python :
   *
   * def normalize_url_for_special_chars(url):
   *   - strip
   *   - remove ^[a-zA-Z]+://
   *   - remove ^www\.
   *   - urllib.parse.unquote
   *   - html.unescape
   *
   * def count_other_special_chars(url):
   *   - pour chaque char de l'URL normalisée :
   *       si lettre ou chiffre -> skip
   *       si '=' ou '?' ou '&' -> skip
   *       sinon -> count++
   */
  private computeNoOfOtherSpecialChars(urlObj: URL): number {
    if (!urlObj) {
      return 0;
    }

    // On repart de la string brute, comme côté Python
    let u = urlObj.href || '';

    // 1) strip
    u = u.trim();

    // 2) supprimer le schéma (http://, https://, etc.)
    u = u.replace(/^[A-Za-z]+:\/\//, '');

    // 3) supprimer un éventuel "www."
    u = u.replace(/^www\./, '');

    // 4) décoder les %xx (URL encoding)
    try {
      u = decodeURIComponent(u);
    } catch {
      // on ignore si ce n'est pas décodable
    }

    // 5) décoder les entités HTML (&amp;, &quot;, etc.)
    u = this.htmlUnescape(u);

    // 6) comptage des "other special chars"
    let count = 0;

    for (const ch of u) {
      // lettre ou chiffre -> on ignore
      if (/[A-Za-z0-9]/.test(ch)) {
        continue;
      }

      // '=' '?' '&' -> ignorés, comme en Python
      if (ch === '=' || ch === '?' || ch === '&') {
        continue;
      }

      // tout le reste = "other special chars"
      count++;
    }

    return count;
  }

}
