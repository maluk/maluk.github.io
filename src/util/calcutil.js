import {w, s} from '../calc/data.js';

const calculateProressive = (taxes, g, status, year) => {
    const yearp = taxes[year];

    var taxableAmount = g - yearp[status].deduction;
    const taxableAmountCopy = taxableAmount;

    if (taxableAmount < 0) {
        return {tax: 0, taxableAmount: 0};
    }

    const yearw = yearp[status].brackets;

    var b = Object.keys(yearw);;

    for (var i = 0; i < b.length; i++) { // Find bracket
        if (b[i] > taxableAmount || b[i] == 999999999)  {
            taxableAmount -= b[i-1]; // Get taxable income
            b = yearw[b[i-1]]; // Set bracket
            var tax = ((b.p*(taxableAmount)) + b.s);
            return {tax: Math.round(tax), taxableAmount: taxableAmountCopy};
        }
    }

    var i = b.length - 1;
    taxableAmount -= b[i-1]; // Get taxable income
    b = yearw[b[i-1]]; // Set bracket
    var tax = ((b.p*(taxableAmount)) + b.s);
    return {tax: Math.round(tax), taxableAmount: taxableAmountCopy};
}

const calculateFed = (g, status, year) => {
    return calculateProressive(w, g, status, year);
}

const calculateState = (g, status, year, state) => {
    return calculateProressive(s[state], g, status, year);
}

const calculateSocial = (g, status, year) => {
    const rate = 0.062;
    const cap = 8239.8;
    return calculateFlat(g, rate, cap);
}

const calculateFlat = (g, rate, cap) => {
    const taxableAmount = Math.min(g * rate, cap);
    return Math.round(taxableAmount);
}

const calculateMedicare = (g, status, year) => {
    const rateThreshold = 200000;
    return Math.round(Math.max(0, g - rateThreshold) * 0.009 + Math.min(rateThreshold, g) * 0.0145);
}

const calculateSdi = (g, status, year, state) => {
    if (state != 'CA') {
      return 0;
    }
    var rate = 0.011;
    var cap = 1601.60;
    if (year == '2021') {
      rate = 0.012;
      cap = 1601.60;
    } else if (year == '2022') {
      rate = 0.011;
      cap = 1539.58;
    }
    return calculateFlat(g, rate, cap);
}

export const calculate = (g, status, year, state) => {
    const fed = calculateFed(g, status, year)
    const stateTax = calculateState(g, status, year, state)
    const socialTax = calculateSocial(g, status, year)
    const medicareTax = calculateMedicare(g, status, year)
    const sdi = calculateSdi(g, status, year, state)

    const totalTax = fed.tax + stateTax.tax + socialTax + medicareTax + sdi;

    return {
        fed : fed,
        state: stateTax,
        social : socialTax,
        medicare: medicareTax,
        sdi: sdi,
        totals: {
            net: g - totalTax,
            netMonthly: Math.round((g - totalTax) / 12),
            tax: totalTax
        }
    };
}
