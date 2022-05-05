import React from 'react';
import './App.css';
import { Container, CssBaseline, Avatar, Typography, TextField, Button, ThemeProvider } from '@material-ui/core';
import MonetizationOnRoundedIcon from '@material-ui/icons/MonetizationOnRounded';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import CalculatorComponent from './components/calculatorcomponent';
import 'fontsource-roboto';

const useStyles = makeStyles((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: theme.spacing(1)
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));


function App() {
  const classes = useStyles();
  const theme = createMuiTheme({
    typography: {
      fontSize: 16,
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
          <div className={classes.paper}>
            <Avatar className={classes.avatar}>
              <MonetizationOnRoundedIcon />
            </Avatar>
            <CalculatorComponent useClasses={classes}/>
          </div>
      </Container>
    </ThemeProvider>
  );
}

export default App;
