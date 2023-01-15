import React from 'react';

import { ButtonGroup, Chip, InputLabel, FormControl, Container, CssBaseline, Avatar, Typography, TextField, Button, Grid, Table, TableHead, TableRow, TableBody, TableCell, InputAdornment, OutlinedInput } from '@material-ui/core';
import { calculate } from '../util/calcutil'

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
        this.handleStateClick = this.handleStateClick.bind(this);

        this.state = {
            income : 100000,
            status : 's',
            year : '2022',
            state : 'CA',
            calculation : calculate(100000, 's', '2022', 'CA')
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

    handleStateClick(event) {
        const state = event.target.textContent;
        this.setState({
            state : state,
            calculation : calculate(this.state.income, this.state.status, this.state.year, state)
        });
    }

    render() {
      return (
        <form className={this.props.useClasses.root} noValidate autoComplete="off">
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="h5" align={'center'}>US Income Tax Calculator (beta)</Typography>
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth className={this.props.useClasses.margin} variant="outlined">
                        <InputLabel htmlFor="outlined-adornment-amount">Annual Income Amount</InputLabel>
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
                                        label="2021"
                                        onClick={this.handleYearClick}
                                        color={this.state.year == '2021' ? 'secondary' : ''}
                                    />
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="2022"
                                        onClick={this.handleYearClick}
                                        color={this.state.year == '2022' ? 'secondary' : ''}
                                    />
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell>State</TableCell>
                                <TableCell align="right">
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="CA"
                                        onClick={this.handleStateClick}
                                        color={this.state.state == 'CA' ? 'secondary' : ''}
                                    />
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="NY"
                                        onClick={this.handleStateClick}
                                        color={this.state.state == 'NY' ? 'secondary' : ''}
                                    />
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="WA"
                                        onClick={this.handleStateClick}
                                        color={this.state.state == 'WA' ? 'secondary' : ''}
                                    />
                                    <Chip
                                        variant="outlined"
                                        clickable
                                        label="TX"
                                        onClick={this.handleStateClick}
                                        color={this.state.state == 'TX' ? 'secondary' : ''}
                                    />
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
            </Grid>
        </form>
      );
    }
  }

export default CalculatorComponent;
