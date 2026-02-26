import React, { useState } from 'react';
import './App.css';
import { Container, CssBaseline, Avatar, ThemeProvider, IconButton } from '@material-ui/core';
import MonetizationOnRoundedIcon from '@material-ui/icons/MonetizationOnRounded';
import Brightness4Icon from '@material-ui/icons/Brightness4';
import Brightness7Icon from '@material-ui/icons/Brightness7';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import CalculatorComponent from './components/calculatorcomponent';
import { STATE_META, SLUG_TO_STATE, DEFAULT_META, SCHEMA_ORG_BASE, CURRENT_YEAR } from './seoConfig';
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
}));

const VALID_YEARS = ['2025', '2026'];

function PageContent({ darkMode, onToggle, stateCode, year }) {
  const classes = useStyles();
  const stateMeta = stateCode ? STATE_META[stateCode] : null;
  const meta = stateMeta || DEFAULT_META;
  const pageYear = year || CURRENT_YEAR;
  const pageTitle = meta.getTitle(pageYear);
  const pageDescription = meta.getDescription(pageYear);
  const canonicalSlug = stateMeta ? `/${stateMeta.slug}/` : '/';
  const canonicalUrl = `https://thetax.us${canonicalSlug}`;

  const schemaOrg = {
    ...SCHEMA_ORG_BASE,
    name: pageTitle,
    description: pageDescription,
    url: canonicalUrl,
  };

  const faqSchema = stateMeta && stateMeta.faqs ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: stateMeta.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />

        <script type="application/ld+json">
          {JSON.stringify(schemaOrg)}
        </script>
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>

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
          <CalculatorComponent
            initialState={stateCode || 'CA'}
            initialYear={pageYear}
            stateMeta={stateMeta}
          />
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
      <BrowserRouter>
        <Switch>
          <Route
            path="/:stateSlug/:year"
            render={({ match }) => {
              const stateCode = SLUG_TO_STATE[match.params.stateSlug];
              const year = VALID_YEARS.includes(match.params.year)
                ? match.params.year
                : CURRENT_YEAR;
              return (
                <PageContent
                  darkMode={darkMode}
                  onToggle={toggleDarkMode}
                  stateCode={stateCode || 'CA'}
                  year={year}
                />
              );
            }}
          />
          <Route
            path="/:stateSlug"
            render={({ match }) => {
              const stateCode = SLUG_TO_STATE[match.params.stateSlug];
              if (!stateCode) {
                return (
                  <PageContent
                    darkMode={darkMode}
                    onToggle={toggleDarkMode}
                    stateCode={null}
                    year={CURRENT_YEAR}
                  />
                );
              }
              return (
                <PageContent
                  darkMode={darkMode}
                  onToggle={toggleDarkMode}
                  stateCode={stateCode}
                  year={CURRENT_YEAR}
                />
              );
            }}
          />
          <Route
            path="/"
            render={() => (
              <PageContent
                darkMode={darkMode}
                onToggle={toggleDarkMode}
                stateCode={null}
                year={CURRENT_YEAR}
              />
            )}
          />
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
