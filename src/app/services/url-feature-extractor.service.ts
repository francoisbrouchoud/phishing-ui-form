import { Injectable } from '@angular/core';
import { parse as parseDomain } from 'tldts';
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
        const hostname = urlObj.hostname;

        const urlLength = fullUrl.length;
        const domainParts = this.extractDomainParts(hostname);

        const {
            letters,
            digits,
            specialCount,
            otherSpecials,
            qMarks,
            equals,
            ampersands,
            charContinuationRate
        } = this.computeCharacterStats(fullUrl);

        const URLLength = urlLength || 0;

        const LetterRatioInURL =
            URLLength > 0 ? letters / URLLength : 0;
        const DegitRatioInURL =
            URLLength > 0 ? digits / URLLength : 0;
        const SpacialCharRatioInURL =
            URLLength > 0 ? specialCount / URLLength : 0;

        const features: UrlFeatures = {
            URL: fullUrl,
            URLLength,

            Domain: domainParts.domain,
            DomainLength: domainParts.domain.length,
            TLD: domainParts.tld,
            TLDLength: domainParts.tld.length,

            NoOfSubDomain: domainParts.numSubdomains,
            IsDomainIP: domainParts.isIp ? 1 : 0,

            NoOfLettersInURL: letters,
            NoOfDegitsInURL: digits,
            NoOfOtherSpecialCharsInURL: otherSpecials,

            LetterRatioInURL,
            DegitRatioInURL,
            SpacialCharRatioInURL,

            CharContinuationRate: charContinuationRate,

            NoOfQMarkInURL: qMarks,
            NoOfEqualsInURL: equals,
            NoOfAmpersandInURL: ampersands
        };

        return features;
    }

    // ------------------ Helpers ------------------

    private normalizeUrl(raw: string): string {
        const trimmed = (raw || '').trim();
        if (!trimmed) {
            return trimmed;
        }

        try {
            new URL(trimmed);
            return trimmed;
        } catch {
            return 'http://' + trimmed;
        }
    }

    private extractDomainParts(hostname: string): {
        domain: string;
        tld: string;
        numSubdomains: number;
        isIp: boolean;
    } {
        const isIp = this.isIpAddress(hostname);
        if (isIp) {
            return {
                domain: hostname,
                tld: '',
                numSubdomains: 0,
                isIp: true
            };
        }

        const parsed = parseDomain(hostname, { allowPrivateDomains: true });

        const baseDomain = parsed.domain || hostname;              // ex: "example.com"
        const tld = parsed.publicSuffix || '';                     // ex: "com"

        let numSubdomains = 0;
        let fullDomain = baseDomain;

        if (parsed.subdomain) {
            // ex: subdomain = "www", "mail.eu", ...
            numSubdomains = parsed.subdomain.split('.').filter(Boolean).length;
            fullDomain = `${parsed.subdomain}.${baseDomain}`;        // ex: "www.example.com"
        } else {
            const parts = hostname.split('.').filter(Boolean);
            if (parts.length > 2) {
                numSubdomains = parts.length - 2;
            }
            // si pas de subdomain détecté, on laisse fullDomain = baseDomain
        }

        return {
            domain: fullDomain,     // <-- ici Domain inclut www
            tld,
            numSubdomains,
            isIp: false
        };
    }




    private isIpAddress(hostname: string): boolean {
        // IPv4
        const ipv4Regex =
            /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
        if (ipv4Regex.test(hostname)) {
            return true;
        }

        // IPv6 simplifié : présence de ":" dans le hostname
        if (hostname.includes(':')) {
            return true;
        }

        return false;
    }

    private computeCharacterStats(url: string): {
        letters: number;
        digits: number;
        specialCount: number;
        otherSpecials: number;
        qMarks: number;
        equals: number;
        ampersands: number;
        charContinuationRate: number;
    } {
        let letters = 0;
        let digits = 0;
        let specialCount = 0;
        let otherSpecials = 0;
        let qMarks = 0;
        let equals = 0;
        let ampersands = 0;

        const len = url.length;

        const categories: ('L' | 'D' | 'S')[] = [];

        for (let i = 0; i < len; i++) {
            const c = url[i];

            const isLetter = /[A-Za-z]/.test(c);
            const isDigit = /[0-9]/.test(c);

            let cat: 'L' | 'D' | 'S';

            if (isLetter) {
                letters++;
                cat = 'L';
            } else if (isDigit) {
                digits++;
                cat = 'D';
            } else {
                specialCount++;
                cat = 'S';

                if (c === '?') qMarks++;
                if (c === '=') equals++;
                if (c === '&') ampersands++;

                if (!['/', '-', '_', '.'].includes(c)) {
                    otherSpecials++;
                }
            }

            categories.push(cat);
        }

        let sameCategoryPairs = 0;
        if (len > 1) {
            for (let i = 1; i < len; i++) {
                if (categories[i] === categories[i - 1]) {
                    sameCategoryPairs++;
                }
            }
        }

        const charContinuationRate =
            len > 1 ? sameCategoryPairs / (len - 1) : 0;

        return {
            letters,
            digits,
            specialCount,
            otherSpecials,
            qMarks,
            equals,
            ampersands,
            charContinuationRate
        };
    }
}
