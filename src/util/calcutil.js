const w = {
    '2018' : {
        s : { // Single
            deduction : 12200,
            brackets : {
                0         : { p : 0.1,  s : 0 },
                9700      : { p : 0.12, s : 970 },
                39475     : { p : 0.22, s : 4543 },
                84200     : { p : 0.24, s : 14382 },
                160725    : { p : 0.32, s : 32748 },
                204100    : { p : 0.35, s : 46628 },
                510300    : { p : 0.37, s : 153798 },
                999999999 : { p : 0.37, s : 334987 }
            }
        },
        m : { // Married
            deduction : 24400,
            brackets : {
                0         : { p : 0.1,  s : 0 },
                19400     : { p : 0.12, s : 1940 },
                78950     : { p : 0.22, s : 9086 },
                168400    : { p : 0.24, s : 28765 },
                321450    : { p : 0.32, s : 65497 },
                408200    : { p : 0.35, s : 93257 },
                612350    : { p : 0.37, s : 164709 },
                999999999 : { p : 0.37, s : 226569 }
            }
        }
    },
    '2019' : {
        s : { // Single
            deduction : 12200,
            brackets : {
                0         : { p : 0.1,  s : 0 },
                9700      : { p : 0.12, s : 970 },
                39475     : { p : 0.22, s : 4543 },
                84200     : { p : 0.24, s : 14382 },
                160725    : { p : 0.32, s : 32748 },
                204100    : { p : 0.35, s : 46628 },
                510300    : { p : 0.37, s : 153798 },
                999999999 : { p : 0.37, s : 334987 }
            }
        },
        m : { // Married
            deduction : 24400,
            brackets : {
                0         : { p : 0.1,  s : 0 },
                19400     : { p : 0.12, s : 1940 },
                78950     : { p : 0.22, s : 9086 },
                168400    : { p : 0.24, s : 28765 },
                321450    : { p : 0.32, s : 65497 },
                408200    : { p : 0.35, s : 93257 },
                612350    : { p : 0.37, s : 164709 },
                999999999 : { p : 0.37, s : 226569 }
            }
        }
    },
    '2020' : {
        s : { // Single
            deduction : 12200,
            brackets : {
                0         : { p : 0.1,  s : 0 },
                9700      : { p : 0.12, s : 970 },
                39475     : { p : 0.22, s : 4543 },
                84200     : { p : 0.24, s : 14382 },
                160725    : { p : 0.32, s : 32748 },
                204100    : { p : 0.35, s : 46628 },
                510300    : { p : 0.37, s : 153798 },
                999999999 : { p : 0.37, s : 334987 }
            }
        },
        m : { // Married
            deduction : 24400,
            brackets : {
                0         : { p : 0.1,  s : 0 },
                19400     : { p : 0.12, s : 1940 },
                78950     : { p : 0.22, s : 9086 },
                168400    : { p : 0.24, s : 28765 },
                321450    : { p : 0.32, s : 65497 },
                408200    : { p : 0.35, s : 93257 },
                612350    : { p : 0.37, s : 164709 },
                999999999 : { p : 0.37, s : 226569 }
            }
        }
    },
     '2021' : {
         s : { // Single
             deduction : 12550,
             brackets : {
                0 : { p : 0.1, s : 0 },
                9950 : { p : 0.12, s : 995 },
                40525 : { p : 0.22, s : 4664 },
                86375 : { p : 0.24, s : 14751 },
                164925 : { p : 0.32, s : 33603 },
                209425 : { p : 0.35, s : 47843 },
                523600 : { p : 0.37, s : 157804.25 },
                999999999 : { p : 0.37, s : 0 }
             }
         },
         m : { // Married
             deduction : 25100,
             brackets : {
                0 : { p : 0.1, s : 0 },
                19900 : { p : 0.12, s : 1990 },
                81050 : { p : 0.22, s : 9328 },
                172750 : { p : 0.24, s : 29502 },
                329850 : { p : 0.32, s : 67206 },
                418850 : { p : 0.35, s : 95686 },
                628300 : { p : 0.37, s : 168993.5 },
                999999999 : { p : 0.37, s : 0 }
             }
         }
     }
}

const s = {
    '2019' : {
        m : {
            deduction : 9074,
            brackets : {
                0 : { p : 0.01,  s : 0 },
                17618 : { p : 0.02,  s : 176.18 },
                41766 : { p : 0.04,  s : 659.14 },
                65920 : { p : 0.06,  s : 1625.3 },
                91506 : { p : 0.08,  s : 3160.46 },
                115648 : { p : 0.093,  s : 5091.82 },
                590746 : { p : 0.103,  s : 49275.93 },
                708890 : { p : 0.113,  s : 61444.77 },
                1181484 : { p : 0.123,  s : 94340.20 },
                999999999 : { p : 0.133,  s : 0 }
            }
        },
        s : {
            deduction : 9074,
            brackets : {
                0 : { p : 0.01,  s : 0 },
                8809 : { p : 0.02,  s : 88.09 },
                20883 : { p : 0.04,  s : 329.56 },
                32960 : { p : 0.06,  s : 812.65 },
                45753 : { p : 0.08,  s : 1580.23 },
                57824 : { p : 0.093,  s : 2545.91 },
                295373 : { p : 0.103,  s : 24637.97 },
                354445 : { p : 0.113,  s : 30772.39 },
                590742 : { p : 0.123,  s : 57423.95 },
                999999999 : { p : 0.133,  s : 0 }
            }
        }
    },
    '2021' : {
        s : {
            deduction : 4803,
            brackets : {
                0 : { p : 0.01, s : 0 },
                8932 : { p : 0.02, s : 89.32 },
                21175 : { p : 0.04, s : 334.18 },
                33421 : { p : 0.06, s : 824.02 },
                46394 : { p : 0.08, s : 1602.4 },
                58634 : { p : 0.093, s : 2581.6 },
                299508 : { p : 0.103, s : 24982.882 },
                359407 : { p : 0.113, s : 31152.479 },
                599012 : { p : 0.123, s : 58227.844 },
                999999999 : { p : 0.123, s : 0 }
            }
        },
        m : {
            deduction : 9606,
            brackets : {
                0 : { p : 0.01, s : 0 },
                17864 : { p : 0.02, s : 17864 },
                42350 : { p : 0.04, s : 668.36 },
                66842 : { p : 0.06, s : 1648.04 },
                92788 : { p : 0.08, s : 3204.8 },
                117268 : { p : 0.093, s : 5163.2 },
                599016 : { p : 0.103, s : 49965.764 },
                718814 : { p : 0.113, s : 62304.958 },
                1198924 : { p : 0.123, s : 116557.388 },
                999999999 : { p : 0.123, s : 0 }
            }
        }
    }
}
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

    return {tax: 0, taxableAmount: 0};
}

const calculateFed = (g, status, year) => {
    return calculateProressive(w, g, status, year);
}

const calculateState = (g, status, year) => {
    return calculateProressive(s, g, status, year);
}

const calculateSocial = (g, status, year) => {
    const rate = 0.062;
    const cap = 132900;
    const taxableAmount = Math.min(g, cap);

    return Math.round(taxableAmount * rate);
}

const calculateMedicare = (g, status, year) => {
    const rateThreshold = 200000;

    return Math.round(Math.max(0, g - rateThreshold) * 0.009 + Math.min(rateThreshold, g) * 0.0145);
}

export const calculate = (g, status, year, state) => {
    const fed = calculateFed(g, status, year)
    const stateTax = calculateState(g, status, year)
    const socialTax = calculateSocial(g, status, year)
    const medicareTax = calculateMedicare(g, status, year)

    const totalTax = fed.tax + stateTax.tax + socialTax + medicareTax;

    return {
        fed : fed,
        state: stateTax,
        social : socialTax,
        medicare: medicareTax,
        totals: {
            net: g - totalTax,
            netMonthly: Math.round((g - totalTax) / 12),
            tax: totalTax
        }
    };
}
