import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import { ApolloProvider } from '@apollo/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { apolloClient } from './lib/apollo';
import { PlanProvider } from './contexts/PlanContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RecoilRoot>
      <ApolloProvider client={apolloClient}>
        <PlanProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PlanProvider>
      </ApolloProvider>
    </RecoilRoot>
  </React.StrictMode>,
);
