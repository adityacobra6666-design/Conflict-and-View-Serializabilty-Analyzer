import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CompetitiveExamsPage } from '../pages/CompetitiveExamsPage';
import { competitiveService } from '../services/competitiveService';

describe('CompetitiveExamsPage', () => {
  it('loads approximately 500 questions in the question bank', () => {
    const questions = competitiveService.getAllQuestions();
    expect(questions.length).toBe(500);
  });

  it('renders competitive exams page and displays question bank stats', () => {
    const handleSend = vi.fn();
    render(<CompetitiveExamsPage onSendToAnalyzer={handleSend} />);
    
    expect(screen.getByText(/DBMS Competitive Exams Practice Bank/i)).toBeDefined();
    expect(screen.getByText(/500 Verified Questions/i)).toBeDefined();
  });

  it('allows clicking "Analyze in Workbench" to send schedule to analyzer', () => {
    const handleSend = vi.fn();
    render(<CompetitiveExamsPage onSendToAnalyzer={handleSend} />);

    const analyzeButtons = screen.getAllByRole('button', { name: /Analyze in Workbench/i });
    expect(analyzeButtons.length).toBeGreaterThan(0);

    fireEvent.click(analyzeButtons[0]);
    expect(handleSend).toHaveBeenCalled();
  });

  it('renders Previous Year Question Papers (PYQs) subsection when tab is selected', () => {
    const handleSend = vi.fn();
    render(<CompetitiveExamsPage onSendToAnalyzer={handleSend} />);

    const pyqTab = screen.getByRole('button', { name: /Previous Year Question Papers \(PYQs\)/i });
    expect(pyqTab).toBeDefined();

    fireEvent.click(pyqTab);
    expect(screen.getByText(/Verified Authentic Papers/i)).toBeDefined();
    expect(screen.getAllByText(/GATE CSE 2015/i).length).toBeGreaterThan(0);
  });
});
