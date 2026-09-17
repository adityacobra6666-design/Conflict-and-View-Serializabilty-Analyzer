import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ScheduleEditor } from '../components/ScheduleEditor/ScheduleEditor';

describe('ScheduleEditor Component', () => {
  const dummyExamples = [
    {
      id: 'ex-1',
      title: 'Simple Conflict Serializable',
      category: 'Basic',
      difficulty: 'Easy' as const,
      schedule_text: 'R1(X), W1(X), R2(X), W2(X)',
      expected_conflict: true,
      expected_view: true,
      description: 'Test description',
      theory_note: 'Test theory note'
    }
  ];

  it('renders text mode by default and triggers analyze callback', () => {
    const handleAnalyze = vi.fn();
    const setScheduleText = vi.fn();

    render(
      <ScheduleEditor
        scheduleText="R1(X), W1(X)"
        setScheduleText={setScheduleText}
        onAnalyze={handleAnalyze}
        examples={dummyExamples}
        loading={false}
      />
    );

    expect(screen.getByText('Schedule Input')).toBeDefined();
    expect(screen.getByText('Analyze Schedule')).toBeDefined();

    const analyzeBtn = screen.getByText('Analyze Schedule');
    fireEvent.click(analyzeBtn);
    expect(handleAnalyze).toHaveBeenCalledWith('R1(X), W1(X)');
  });

  it('switches between Text Mode and Visual Table Mode', () => {
    render(
      <ScheduleEditor
        scheduleText="R1(X), W1(X)"
        setScheduleText={() => {}}
        onAnalyze={() => {}}
        examples={dummyExamples}
        loading={false}
      />
    );

    const tableModeBtn = screen.getByText('Visual Table');
    fireEvent.click(tableModeBtn);

    expect(screen.getByText('Add Operation')).toBeDefined();
  });
});
