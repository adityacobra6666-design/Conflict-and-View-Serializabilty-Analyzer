import React from 'react';
import { SimulatorWorkspace } from '../components/Simulator/SimulatorWorkspace';
import { AnalysisResult, ExampleSchedule } from '../types';

interface SimulatorPageProps {
  initialScheduleText?: string;
  examples: ExampleSchedule[];
  analysis: AnalysisResult | null;
  setAnalysis: (res: AnalysisResult | null) => void;
  onRunAnalysis: (text: string) => Promise<void>;
  loading: boolean;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = (props) => {
  return <SimulatorWorkspace {...props} />;
};
