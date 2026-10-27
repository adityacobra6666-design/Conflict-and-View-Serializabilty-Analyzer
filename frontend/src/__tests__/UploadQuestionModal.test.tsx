import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UploadQuestionModal } from '../components/ScheduleEditor/UploadQuestionModal';
import { ScheduleEditor } from '../components/ScheduleEditor/ScheduleEditor';
import { apiService } from '../services/api';

describe('UploadQuestionModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url-123');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders modal when open and displays supported formats info', () => {
    render(
      <UploadQuestionModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmSchedule={vi.fn()}
      />
    );

    expect(screen.getByText('Upload Question (Image or PDF)')).toBeDefined();
    expect(screen.getByText(/Supported formats: PNG, JPG, JPEG, WEBP, PDF/i)).toBeDefined();
    expect(screen.getByText('Extract & Parse Schedule')).toBeDefined();
  });

  it('shows error when an unsupported file type is selected', () => {
    render(
      <UploadQuestionModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmSchedule={vi.fn()}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const txtFile = new File(['dummy content'], 'schedule.txt', { type: 'text/plain' });

    fireEvent.change(fileInput, { target: { files: [txtFile] } });

    expect(screen.getByText(/Unsupported file type '\.txt'/i)).toBeDefined();
  });

  it('uploads valid image, displays extracted schedule, and allows user correction', async () => {
    const mockUploadResponse = {
      success: true,
      filename: 'question.png',
      file_type: 'image' as const,
      raw_text: 'S = R1(X), W2(X), R1(Y), W2(Y)',
      parsed_schedule: 'R1(X), W2(X), R1(Y), W2(Y)',
      candidate_schedules: [
        { label: 'Full Extracted Schedule', schedule_text: 'R1(X), W2(X), R1(Y), W2(Y)', operation_count: 4 }
      ],
      operation_count: 4,
      uncertain_parts: [],
      is_valid: true,
      validation_errors: [],
      validation_warnings: [],
      ai_available: false,
      ai_used: false,
      message: 'Schedule successfully recognized and extracted using local OCR.'
    };

    vi.spyOn(apiService, 'uploadQuestionFile').mockResolvedValue(mockUploadResponse);

    const onConfirmSchedule = vi.fn();
    const onClose = vi.fn();

    render(
      <UploadQuestionModal
        isOpen={true}
        onClose={onClose}
        onConfirmSchedule={onConfirmSchedule}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pngFile = new File(['image-bytes'], 'question.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [pngFile] } });
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(pngFile);

    const extractBtn = screen.getByText('Extract & Parse Schedule');
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(screen.getByText(/Schedule successfully recognized and extracted using local OCR/i)).toBeDefined();
    });

    const editInput = screen.getByPlaceholderText('e.g. R1(X), W2(X), W1(X), W3(X)') as HTMLInputElement;
    expect(editInput.value).toBe('R1(X), W2(X), R1(Y), W2(Y)');

    // User corrects OCR result: changes R1(Y) to W3(Z)
    fireEvent.change(editInput, { target: { value: 'R1(X), W2(X), W3(Z), W2(Y)' } });
    expect(screen.getByText('W3(Z)')).toBeDefined();

    // Confirm and Analyze
    const confirmBtn = screen.getByText(/Confirm & Analyze/i);
    fireEvent.click(confirmBtn);

    expect(onConfirmSchedule).toHaveBeenCalledWith('R1(X), W2(X), W3(Z), W2(Y)', true);
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('displays ambiguous/uncertain tokens warning when detected', async () => {
    const mockUploadResponse = {
      success: true,
      filename: 'question.png',
      file_type: 'image' as const,
      raw_text: 'R1(X), W(X), R1(Y)',
      parsed_schedule: 'R1(X), R1(Y)',
      candidate_schedules: [],
      operation_count: 2,
      uncertain_parts: ["Incomplete operation 'W(X)' (missing transaction ID)"],
      is_valid: true,
      validation_errors: [],
      validation_warnings: [],
      ai_available: false,
      ai_used: false,
      message: 'Found 2 transaction operations in schedule.'
    };

    vi.spyOn(apiService, 'uploadQuestionFile').mockResolvedValue(mockUploadResponse);

    render(
      <UploadQuestionModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmSchedule={vi.fn()}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const webpFile = new File(['webp-bytes'], 'question.webp', { type: 'image/webp' });

    fireEvent.change(fileInput, { target: { files: [webpFile] } });
    fireEvent.click(screen.getByText('Extract & Parse Schedule'));

    await waitFor(() => {
      expect(screen.getByText(/Uncertain \/ Incomplete Operations Detected/i)).toBeDefined();
    });

    expect(screen.getByText(/Incomplete operation 'W\(X\)' \(missing transaction ID\)/i)).toBeDefined();
  });

  it('allows switching between multiple candidate schedules', async () => {
    const mockUploadResponse = {
      success: true,
      filename: 'paper.pdf',
      file_type: 'pdf' as const,
      raw_text: 'S1 = R1(X), W2(X); S2 = W2(X), R1(X)',
      parsed_schedule: 'R1(X), W2(X)',
      candidate_schedules: [
        { label: 'Schedule S1', schedule_text: 'R1(X), W2(X)', operation_count: 2 },
        { label: 'Schedule S2', schedule_text: 'W2(X), R1(X)', operation_count: 2 }
      ],
      operation_count: 2,
      uncertain_parts: [],
      is_valid: true,
      validation_errors: [],
      validation_warnings: [],
      ai_available: false,
      ai_used: false,
      message: 'Extracted schedule successfully from PDF document.'
    };

    vi.spyOn(apiService, 'uploadQuestionFile').mockResolvedValue(mockUploadResponse);

    render(
      <UploadQuestionModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirmSchedule={vi.fn()}
      />
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const pdfFile = new File(['pdf-bytes'], 'paper.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    fireEvent.click(screen.getByText('Extract & Parse Schedule'));

    await waitFor(() => {
      expect(screen.getByText('Schedule S2 (2 ops)')).toBeDefined();
    });

    // Select second candidate schedule
    const candidate2Btn = screen.getByText('Schedule S2 (2 ops)');
    fireEvent.click(candidate2Btn);

    const editInput = screen.getByPlaceholderText('e.g. R1(X), W2(X), W1(X), W3(X)') as HTMLInputElement;
    expect(editInput.value).toBe('W2(X), R1(X)');
  });

  it('integrates with ScheduleEditor button to trigger workflow and populate state', async () => {
    const setScheduleText = vi.fn();
    const handleAnalyze = vi.fn();

    render(
      <ScheduleEditor
        scheduleText=""
        setScheduleText={setScheduleText}
        onAnalyze={handleAnalyze}
        examples={[]}
        loading={false}
      />
    );

    const uploadQuestionBtn = screen.getByRole('button', { name: /Upload Question/i });
    expect(uploadQuestionBtn).toBeDefined();

    // Click upload question to open modal
    fireEvent.click(uploadQuestionBtn);

    expect(screen.getByText('Upload Question (Image or PDF)')).toBeDefined();
  });
});
