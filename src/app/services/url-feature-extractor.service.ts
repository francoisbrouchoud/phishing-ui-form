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

    const LetterRatioInURL = URLLength > 0 ? charStats.letters / URLLength : 0;

    const DegitRatioInURL = URLLength > 0 ? charStats.digits / URLLength : 0;

    const NoOfOtherSpecialCharsInURL = this.computeNoOfOtherSpecialChars(urlObj);

    const specialForRatio = NoOfOtherSpecialCharsInURL + charStats.qMarks + charStats.equals + charStats.ampersands;

    const SpecialCharRatioInURL = URLLength > 0 ? specialForRatio / URLLength : 0;

    const CharContinuationRate = this.computeCharContinuationRate(fullUrl);

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
      SpecialCharRatioInURL
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
   * - NoOfLettersInURL      : toutes les lettres A–Z / a–z
   * - NoOfDegitsInURL       : tous les chiffres 0–9
   * - NoOfEqualsInURL       : '='
   * - NoOfQMarkInURL        : '?'
   * - NoOfAmpersandInURL    : '&'
   * - NoOfOtherSpecialChars : tous les caractères
   *   qui ne sont ni lettre, ni chiffre, ni '/', '-', '_', '.', '?', '=', '&'
   */
  /**
  * Compte les lettres, chiffres, caractères spéciaux, '?', '=', '&'.
  *
  * - NoOfLettersInURL      : toutes les lettres A–Z / a–z
  * - NoOfDegitsInURL       : tous les chiffres 0–9
  * - NoOfEqualsInURL       : '='
  * - NoOfQMarkInURL        : '?'
  * - NoOfAmpersandInURL    : '&'
  * - NoOfOtherSpecialChars : tous les caractères
  *   qui ne sont NI lettre, NI chiffre, NI '&', NI '?', NI '='
  *
  * ⚠️ Contrairement à la version précédente, on COMPTE désormais
  * aussi '/', '-', '_', '.', ':', '%', '@', etc. dans otherSpecials.
  */
  private computeCharacterStats(url: string): {
    letters: number;
    digits: number;
    otherSpecials: number;
    qMarks: number;
    equals: number;
    ampersands: number;
  } {
    let letters = 0;
    let digits = 0;
    let otherSpecials = 0;
    let qMarks = 0;
    let equals = 0;
    let ampersands = 0;

    const len = url.length;

    for (let i = 0; i < len; i++) {
      const c = url[i];

      const isLetter = /[A-Za-z]/.test(c);
      const isDigit = /[0-9]/.test(c);

      if (isLetter) {
        letters++;
        continue;
      }

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
      letters,
      digits,
      otherSpecials,
      qMarks,
      equals,
      ampersands
    };
  }


  /**
   * CharContinuationRate : continuité des classes de caractères
   *
   * On code chaque caractère en 3 classes :
   *  - 'L' : lettre
   *  - 'D' : chiffre
   *  - 'S' : tout le reste
   *
   * Puis:
   *  CharContinuationRate = (# paires successives avec même classe) / (len - 1)
   *  (0 si longueur <= 1)
   */
  private computeCharContinuationRate(url: string): number {
    const len = url.length;
    if (len <= 1) {
      return 0;
    }

    const categories: ('L' | 'D' | 'S')[] = [];

    for (let i = 0; i < len; i++) {
      const c = url[i];

      if (/[A-Za-z]/.test(c)) {
        categories.push('L');
      } else if (/[0-9]/.test(c)) {
        categories.push('D');
      } else {
        categories.push('S');
      }
    }

    let same = 0;
    for (let i = 1; i < len; i++) {
      if (categories[i] === categories[i - 1]) {
        same++;
      }
    }

    return same / (len - 1);
  }


  private computeNoOfOtherSpecialChars(urlObj: URL): number {

    let host = urlObj.hostname || '';
    const path = urlObj.pathname || '';

    // urlObj.search contient déjà '?query', on retire le '?' pour coller à urlsplit
    let query = urlObj.search || '';
    if (query.startsWith('?')) {
      query = query.substring(1);
    }

    // urlObj.hash contient déjà '#fragment', on retire le '#'
    let fragment = urlObj.hash || '';
    if (fragment.startsWith('#')) {
      fragment = fragment.substring(1);
    }

    // 2. enlever www. au début
    if (host.startsWith('www.')) {
      host = host.substring(4);
    }

    // 3. construire s = host + path + ("?" + query) + ("#" + fragment)
    let s = host + (path || '');
    if (query) {
      s += '?' + query;
    }
    if (fragment) {
      s += '#' + fragment;
    }

    // 4. compter les caractères non alphanumériques sauf ?, =, %
    let count = 0;
    for (const element of s) {
      const ch = element;

      if (/[A-Za-z0-9]/.test(ch)) {
        continue;
      }

      if (ch === '?' || ch === '=' || ch === '%') {
        continue;
      }

      count++;
    }

    return count;
  }
}
