import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Exceptionless react sample', () => {
  render(<App />);
  const h1Element = screen.getByText(/Exceptionless React Sample/i);
  expect(h1Element).toBeInTheDocument();
});
