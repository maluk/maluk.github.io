import React from 'react';

import { Chip, InputLabel, FormControl, Typography, Grid, Table, TableHead, TableRow, TableBody, TableCell, InputAdornment, OutlinedInput } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';
import { calculate } from '../util/calcutil'
import { CURRENT_YEAR, STATE_META, DEFAULT_META } from '../seoConfig'

const STATE_CHIPS = [
  { code: 'CA', slug: 'california' },
  { code: 'NY', slug: 'new-york' },
  { code: 'WA', slug: 'washington' },
  { code: 'TX', slug: 'texas' },
];

const useFaqStyles = makeStyles((theme) => ({
  faqSection: {
    marginTop: theme.spacing(4),
    textAlign: 'left',
  },
  faqItem: {
    marginTop: theme.spacing(2),
  },
}));

function FaqSection({ faqs }) {
  const classes = useFaqStyles();
  if (!faqs || faqs.length === 0) return null;
  return (
    <div className={classes.faqSection}>
      <Typography variant="h6" component="h2" gutterBottom>
        Frequently Asked Questions
      </Typography>
      {faqs.map((faq, i) => (
        <div key={i} className={classes.faqItem}>
          <Typography variant="subtitle1" component="h3" style={{ fontWeight: 600 }}>
            {faq.question}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {faq.answer}
          </Typography>
        </div>
      ))}
    </div>
  );
}

class CalculatorComponent extends React.Component {
    constructor(props) {
        super(props);

        this.formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });

        this.percentageFormatter = new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          });

        this.handlechange = this.handlechange.bind(this);
        this.handleSatusClick = this.handleSatusClick.bind(this);
        this.handleYearClick = this.handleYearClick.bind(this);

        const initialState = props.initialState || 'CA';
        const initialYear = props.initialYear || CURRENT_YEAR;

        this.state = {
            income : 100000,
            status : 's',
            year : initialYear,
            state : initialState,
            calculation : calculate(100000, 's', initialYear, initialState)
        };
    }

    handlechange(event) {
        this.setState({
            income : event.target.value,
            calculation : calculate(event.target.value, this.state.status, this.state.year, this.state.state)
        });
    }

    handleSatusClick(event) {
        const status = event.target.textContent == 'Single' ? 's' : 'm';
        this.setState({
             status : status,
             calculation : calculate(this.state.income, status, this.state.year, this.state.state)
            });
    }

    handleYearClick(event) {
        const year = event.target.textContent;
        this.setState({
            year : year,
            calculation : calculate(this.state.income, this.state.status, year, this.state.state)
        });
    }

    render() {
      const { stateMeta } = this.props;
      const pageHeading = stateMeta
        ? `${stateMeta.name} Paycheck Tax Calculator`
        : 'US Paycheck Tax Calculator';
      const meta = stateMeta || DEFAULT_META;
      const intro = meta.getIntro(this.state.year);

      return (
        <form className={this.props.useClasses && this.props.useClasses.root} noValidate autoComplete="off">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="h5" component="h1" align={'center'}>
                        {pageHeading}
                    </Typography>
                    <Typography variant="caption" align={'center'} display="block" color="textSecondary">
                        {this.state.year}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px', textAlign: 'center' }}>
                        {intro}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth variant="outlined">
                        <InputLabel htmlFor="outlined-income-amount">Annual Income Amount</InputLabel>
                        <OutlinedInput
                            id="outlined-income-amount"
                            value={this.state.income}
                            onChange={this.handlechange}
                            startAdornment={<InputAdornment position="start">$</InputAdornment>}
                            labelWidth={200}
                            type="number"
                            style={{fontSize: '2em'}}
                        />
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">
                                        <Chip
                                            variant="outlined"
                                            clickable
                                            label="Single"
                                            onClick={this.handleSatusClick}
                                            color={this.state.status == 's' ? 'secondary' : ''}
                                        />
                                        &nbsp;
                                        <Chip
                                            variant="outlined"
                                            clickable
                                            label="Married"
                                            onClick={this.handleSatusClick}
                                            color={this.state.status == 'm' ? 'secondary' : ''}
                                        />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Year</TableCell>
                                <TableCell align="right">
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="2025"
                                        onClick={this.handleYearClick}
                                        color={this.state.year == '2025' ? 'secondary' : ''}
                                    />
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="2026"
                                        onClick={this.handleYearClick}
                                        color={this.state.year == '2026' ? 'secondary' : ''}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>State</TableCell>
                                <TableCell align="right">
                                    {STATE_CHIPS.map(({ code, slug }) => (
                                        <Chip
                                            key={code}
                                            component={Link}
                                            to={`/${slug}/`}
                                            variant="outlined"
                                            clickable
                                            label={code}
                                            color={this.state.state == code ? 'secondary' : ''}
                                        />
                                    ))}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Grid>
                <Grid item xs={12}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell colSpan={2} style={{fontWeight : 600}}>Federal Taxes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow>
                                <TableCell>Taxable Income</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.fed.taxableAmount)}</TableCell>
                            </TableRow>                            <TableRow>
                                <TableCell>Federal Tax</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.fed.tax)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} style={{fontWeight : 600}}>FICA</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Social Security</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.social)}</TableCell>
                            </TableRow>                            <TableRow>
                                <TableCell>Medicare</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.medicare)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={2} style={{fontWeight : 600}}>State Taxes</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Taxable Income</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.state.taxableAmount)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>State Tax</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.state.tax)}</TableCell>
                            </TableRow>
                            {this.state.calculation.sdi > 0 &&
                              <TableRow>
                                  <TableCell>SDI</TableCell>
                                  <TableCell align="right">{this.formatter.format(this.state.calculation.sdi)}</TableCell>
                              </TableRow>
                            }
                            <TableRow>
                                <TableCell colSpan={2} style={{fontWeight : 600}}>Totals</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Effective Tax Rate</TableCell>
                                <TableCell align="right">{this.percentageFormatter.format(this.state.calculation.totals.tax / this.state.income)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Total Tax</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.totals.tax)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>Monthly Take Home</TableCell>
                                <TableCell align="right">{this.formatter.format(this.state.calculation.totals.netMonthly)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell style={{fontWeight : 600, fontSize: '1.1em'}}>Annual Take Home</TableCell>
                                <TableCell style={{fontWeight : 600, fontSize: '1.1em'}} align="right">{this.formatter.format(this.state.calculation.totals.net)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" style={{ marginTop: '24px', color: '#9e9e9e', textAlign: 'center', display: 'block' }}>
                        Calculations are approximate and for the exact numbers I recommend to contact a tax specialist.
                    </Typography>
                </Grid>
                {stateMeta && stateMeta.faqs && (
                    <Grid item xs={12}>
                        <FaqSection faqs={stateMeta.faqs} />
                    </Grid>
                )}
            </Grid>
        </form>
      );
    }
  }

export default CalculatorComponent;
