import React from 'react';
import { referencesData, ReferenceItem } from '../data/referencesData';
import { BookOpen, Globe, FileText, GraduationCap, Video, ExternalLink, ShieldCheck } from 'lucide-react';

export const ReferencesPage: React.FC = () => {
  const { books, websites, researchPapers, educationalResources, videos } = referencesData;

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    items: ReferenceItem[],
    accentColor: string
  ) => {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {icon}
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            {title} ({items.length})
          </h2>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans leading-snug">
                  {item.title}
                </h3>
                {item.year && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                    {item.year}
                  </span>
                )}
              </div>

              {/* Bibliographic details */}
              <div className="text-xs font-mono text-slate-600 dark:text-slate-400 space-y-1">
                {item.authors && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">Author(s): </span>
                    <strong className="text-slate-800 dark:text-slate-200">{item.authors}</strong>
                  </div>
                )}
                {item.creator && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">Organization / Creator: </span>
                    <strong className="text-slate-800 dark:text-slate-200">{item.creator}</strong>
                  </div>
                )}
                {item.publisher && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">Publisher: </span>
                    <span>{item.publisher} {item.edition ? `(${item.edition})` : ''}</span>
                  </div>
                )}
                {item.venue && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">Venue / Journal: </span>
                    <span className="italic">{item.venue}</span>
                  </div>
                )}
                {item.topic && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">Topic: </span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{item.topic}</span>
                  </div>
                )}
                {item.doi && (
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">DOI: </span>
                    <span>{item.doi}</span>
                  </div>
                )}
              </div>

              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-sans leading-relaxed pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                  {item.description}
                </p>
              )}

              {item.url && (
                <div className="pt-1">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline break-all font-semibold"
                  >
                    <span>{item.url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" /> Academic Bibliography & Citations
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          References
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Formal citations of textbooks, research papers, educational platforms, and technical documentation consulted during learning content development.
        </p>
      </div>

      {/* 5 CATEGORIES */}
      {renderSection('Books', <BookOpen className="w-4 h-4 text-blue-600" />, books, 'blue')}
      {renderSection('Websites', <Globe className="w-4 h-4 text-emerald-600" />, websites, 'emerald')}
      {renderSection('Research Papers', <FileText className="w-4 h-4 text-purple-600" />, researchPapers, 'purple')}
      {renderSection('Educational Resources', <GraduationCap className="w-4 h-4 text-amber-600" />, educationalResources, 'amber')}
      {renderSection('Videos', <Video className="w-4 h-4 text-rose-600" />, videos, 'rose')}

      {/* MANDATORY ACKNOWLEDGEMENT BANNER */}
      <div className="p-6 rounded-3xl bg-blue-50/70 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 flex items-start gap-4">
        <div className="p-2.5 rounded-2xl bg-blue-600 text-white shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 font-mono">
            Academic Source Acknowledgement
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
            Sources were consulted for understanding DBMS transaction processing, concurrency control, conflict serializability, view serializability, and related learning content. All external sources are acknowledged above.
          </p>
        </div>
      </div>
    </div>
  );
};
