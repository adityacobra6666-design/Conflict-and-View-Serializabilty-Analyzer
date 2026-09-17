import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Analyzer } from './pages/Analyzer';
import { WhatIfSimulator } from './components/WhatIf/WhatIfSimulator';
import { Dashboard } from './pages/Dashboard';
import { SimulatorPage } from './pages/SimulatorPage';
import { Learn } from './pages/Learn';
import { Examples } from './pages/Examples';
import { HistoryPage } from './pages/HistoryPage';
import { DocsPage } from './pages/DocsPage';
import { DevelopedBy } from './pages/DevelopedBy';
import { ReferencesPage } from './pages/ReferencesPage';
import { AITutor } from './components/AITutor/AITutor';
import { ExampleSchedule, AnalysisResult } from './types';
import { apiService } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('analyzer');
  const [darkMode, setDarkMode] = useState<boolean>(false); // LIGHT MODE BY DEFAULT
  const [examples, setExamples] = useState<ExampleSchedule[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scheduleText, setScheduleText] = useState<string>('R1(X), W2(X), W1(X), W3(X)');
  const [loading, setLoading] = useState<boolean>(false);
  const [isAiTutorOpen, setIsAiTutorOpen] = useState<boolean>(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    apiService.getExamples()
      .then(res => setExamples(res.examples || []))
      .catch(err => console.error("Error loading examples:", err));
  }, []);

  const handleRunAnalysis = async (text: string) => {
    setLoading(true);
    try {
      const res = await apiService.analyzeSchedule(text);
      setAnalysis(res);
      setScheduleText(text);
    } catch (err) {
      console.error("Error analyzing schedule:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalyzing = async (text?: string) => {
    const targetText = text || scheduleText;
    setScheduleText(targetText);
    setActiveTab('analyzer');
    await handleRunAnalysis(targetText);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Header Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAiTutor={() => setIsAiTutorOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard
            onStartAnalyzing={handleStartAnalyzing}
            examples={examples}
          />
        )}
        {activeTab === 'analyzer' && (
          <Analyzer
            initialScheduleText={scheduleText}
            examples={examples}
            onOpenAiTutor={() => setIsAiTutorOpen(true)}
            onOpenWhatIf={() => setActiveTab('whatif')}
            analysis={analysis}
            setAnalysis={setAnalysis}
          />
        )}
        {activeTab === 'whatif' && (
          <WhatIfSimulator
            baselineAnalysis={analysis}
            examples={examples}
            onOpenAiTutor={() => setIsAiTutorOpen(true)}
          />
        )}
        {activeTab === 'simulator' && (
          <SimulatorPage
            initialScheduleText={scheduleText}
            examples={examples}
            analysis={analysis}
            setAnalysis={setAnalysis}
            onRunAnalysis={handleRunAnalysis}
            loading={loading}
          />
        )}
        {activeTab === 'examples' && (
          <Examples
            examples={examples}
            onSelectExample={handleStartAnalyzing}
          />
        )}
        {activeTab === 'learn' && <Learn />}
        {activeTab === 'history' && (
          <HistoryPage onReRunSchedule={handleStartAnalyzing} />
        )}
        {activeTab === 'docs' && <DocsPage />}
        {activeTab === 'developedby' && <DevelopedBy />}
        {activeTab === 'references' && <ReferencesPage />}
      </main>

      {/* AI Tutor Drawer Assistant */}
      <AITutor
        isOpen={isAiTutorOpen}
        onClose={() => setIsAiTutorOpen(false)}
        analysis={analysis}
      />
    </div>
  );
};

export default App;
