import axios from 'axios';
import { AnalysisResult, ExampleSchedule, HistoryItem } from '../types';

const API_BASE = '/api';

export const apiService = {
  async analyzeSchedule(scheduleText?: string, operations?: any[]): Promise<AnalysisResult> {
    const response = await axios.post(`${API_BASE}/analyze`, {
      schedule_text: scheduleText,
      operations: operations
    });
    return response.data;
  },

  async getExamples(): Promise<{ examples: ExampleSchedule[]; count: number }> {
    const response = await axios.get(`${API_BASE}/examples`);
    return response.data;
  },

  async getHistory(): Promise<{ history: HistoryItem[]; count: number }> {
    const response = await axios.get(`${API_BASE}/history`);
    return response.data;
  },

  async getHistoryById(id: number): Promise<AnalysisResult> {
    const response = await axios.get(`${API_BASE}/history/${id}`);
    return response.data;
  },

  async deleteHistoryItem(id: number): Promise<{ success: boolean }> {
    const response = await axios.delete(`${API_BASE}/history/${id}`);
    return response.data;
  },

  async exportPdf(analysisData: AnalysisResult): Promise<Blob> {
    const response = await axios.post(`${API_BASE}/export/pdf`, { analysis_data: analysisData }, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportJson(analysisData: AnalysisResult): Promise<Blob> {
    const response = await axios.post(`${API_BASE}/export/json`, analysisData, {
      responseType: 'blob'
    });
    return response.data;
  },

  async exportCsv(analysisData: AnalysisResult): Promise<Blob> {
    const response = await axios.post(`${API_BASE}/export/csv`, analysisData, {
      responseType: 'blob'
    });
    return response.data;
  },

  async askAiTutor(analysisData: AnalysisResult, promptType: string = 'explain_result', customQuestion?: string) {
    const response = await axios.post(`${API_BASE}/ai/explain`, {
      analysis_data: analysisData,
      prompt_type: promptType,
      custom_question: customQuestion
    });
    return response.data;
  },

  async compareAnalysis(original: AnalysisResult, modified: AnalysisResult) {
    const response = await axios.post(`${API_BASE}/compare`, {
      original: original,
      modified: modified
    });
    return response.data;
  }
};
