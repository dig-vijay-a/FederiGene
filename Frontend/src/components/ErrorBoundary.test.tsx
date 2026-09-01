import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// A dummy component that throws an error
const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('renders children if there is no error', () => {
    render(
      <ErrorBoundary>
        <div>All good here!</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('All good here!')).toBeInTheDocument();
  });

  it('catches errors and renders the fallback UI', () => {
    // Suppress console.error for this specific test so the terminal isn't cluttered
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('⚠️ Platform Error Detected')).toBeInTheDocument();
    expect(screen.getByText('The application encountered an unexpected runtime error.')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
