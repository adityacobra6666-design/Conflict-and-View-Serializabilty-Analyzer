import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { DevelopedBy } from '../pages/DevelopedBy';
import { ReferencesPage } from '../pages/ReferencesPage';

describe('Academic Documentation Pages', () => {
  it('renders Developed By page with exact 2 student profiles and Guided By faculty info', () => {
    render(<DevelopedBy />);
    expect(screen.getByText('Developed By')).toBeDefined();
    expect(screen.getByText('Aditya Kumar')).toBeDefined();
    expect(screen.getByText('25BCE1368')).toBeDefined();
    expect(screen.getByText('Divyansh Bhatia')).toBeDefined();
    expect(screen.getByText('25BCE1414')).toBeDefined();

    expect(screen.getByText('Guided By')).toBeDefined();
    expect(screen.getByText('Dr. Swaminathan A')).toBeDefined();
    expect(screen.getByText('Assistant Professor')).toBeDefined();
  });

  it('renders References page with updated YouTube video links and all categories', () => {
    render(<ReferencesPage />);
    expect(screen.getByText('References')).toBeDefined();

    // Check all 5 categories
    expect(screen.getByText(/Books \(\d+\)/)).toBeDefined();
    expect(screen.getByText(/Websites \(\d+\)/)).toBeDefined();
    expect(screen.getByText(/Research Papers \(\d+\)/)).toBeDefined();
    expect(screen.getByText(/Educational Resources \(\d+\)/)).toBeDefined();
    expect(screen.getByText(/Videos \(\d+\)/)).toBeDefined();

    // Check updated verified YouTube video titles
    expect(screen.getByText('Database Management System : Conflict Serializability & Precedence Graph')).toBeDefined();
    expect(screen.getByText('Lec-99: Why View Serializability is Used | Introduction to View Serializability | DBMS')).toBeDefined();
    expect(screen.getByText('DBMS 29: Part 3: Learn View Serializability with Solved Examples | Transactions')).toBeDefined();

    // Check acknowledgement banner
    expect(
      screen.getByText(/Sources were consulted for understanding DBMS transaction processing/i)
    ).toBeDefined();
  });
});
