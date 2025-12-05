import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import {
  createHashRouter,
  RouterProvider,
} from "react-router-dom";
import LoadApp from './components/LoadApp';
import ErrorBoundary from './components/ErrorBoundary';

const router = createHashRouter([
  {
    path: '/',
    element: <App></App>
  },
])

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <LoadApp>
      <ErrorBoundary>
        <RouterProvider router={router}></RouterProvider>
      </ErrorBoundary>
    </LoadApp>
  </React.StrictMode>
);
