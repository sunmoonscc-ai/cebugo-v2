import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PlacesProvider } from './context/PlacesContext';
import { CategoriesProvider } from './context/CategoriesContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <CategoriesProvider>
        <PlacesProvider>
          <App />
        </PlacesProvider>
      </CategoriesProvider>
    </AuthProvider>
  </BrowserRouter>
);
