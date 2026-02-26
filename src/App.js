import React, { useState } from 'react';
import './App.css';
import { Container, CssBaseline, Avatar, Typography, ThemeProvider, IconButton } from '@material-ui/core';
import MonetizationOnRoundedIcon from '@material-ui/icons/MonetizationOnRounded';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import CalculatorComponent from './components/calculatorcomponent';
import 'fontsource-roboto';

const useStyles = makeStyles((theme) => ({
  paper: {
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
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function AppContent({ darkMode, onToggle }) {
  const classes = useStyles();
  return (
    <>
      <IconButton
        onClick={onToggle}
        color="inherit"
        style={{ position: 'fixed', top: 8, right: 8 }}
        aria-label="toggle dark mode"
      >
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <Container component="main" maxWidth="xs">
        <div className={classes.paper}>
          <Avatar className={classes.avatar}>
            <MonetizationOnRoundedIcon />
          </Avatar>
          <CalculatorComponent useClasses={classes}/>
          <Typography variant="caption" style={{ marginTop: '24px', color: '#9e9e9e', textAlign: 'center', display: 'block' }}>
            Calculations are approximate and for the exact numbers I recommend to contact a tax specialist.
          </Typography>
        </div>
      </Container>
    </>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  const theme = createMuiTheme({
    palette: {
      type: darkMode ? 'dark' : 'light',
    },
    typography: {
      fontSize: 16,
    },
  });

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent darkMode={darkMode} onToggle={toggleDarkMode} />
    </ThemeProvider>
  );
}

export default App;
