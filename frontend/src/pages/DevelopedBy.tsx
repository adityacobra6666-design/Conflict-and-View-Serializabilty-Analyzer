import React, { useState } from 'react';
import { teamData, TeamMember, Advisor } from '../data/teamData';
import { UserCheck, Award, GraduationCap, User } from 'lucide-react';

const StudentCard: React.FC<{ member: TeamMember }> = ({ member }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center gap-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
      {/* Photo Area */}
      <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-2 shadow-inner">
        {member.photoUrl && !imgError ? (
          <img
            src={member.photoUrl}
            alt={`Photograph of ${member.name}`}
            className="w-full h-full object-cover rounded-xl"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-1.5 h-full w-full">
            <User className="w-10 h-10 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Student Photo
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono text-center leading-tight">
              Replace with student photograph.
            </span>
          </div>
        )}
      </div>

      {/* Student Details */}
      <div className="space-y-2 w-full pt-1">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
            Student Name
          </span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {member.name}
          </h3>
        </div>

        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs">
          <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
            Register Number
          </span>
          <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
            {member.registerNumber}
          </span>
        </div>

        {member.role && (
          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
            {member.role}
          </span>
        )}
      </div>
    </div>
  );
};

const AdvisorCard: React.FC<{ advisor: Advisor }> = ({ advisor }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50/80 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800">
      <div className="relative w-36 h-36 shrink-0 rounded-2xl overflow-hidden border-2 border-emerald-500/30 dark:border-emerald-500/20 bg-white dark:bg-slate-900 flex flex-col items-center justify-center shadow-md p-1">
        {advisor.photoUrl && !imgError ? (
          <img
            src={advisor.photoUrl}
            alt={`Photograph of ${advisor.name}`}
            className="w-full h-full object-cover rounded-xl"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-1.5 h-full w-full">
            <User className="w-10 h-10 text-emerald-600" />
            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
              Faculty Photo
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-center sm:text-left flex-1">
        <span className="inline-block text-[10px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          Faculty Advisor / Project Guide
        </span>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {advisor.name}
        </h3>
        <p className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
          {advisor.designation}
        </p>
      </div>
    </div>
  );
};

export const DevelopedBy: React.FC = () => {
  const { members, advisor } = teamData;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
          <GraduationCap className="w-4 h-4" /> Academic Project Details
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Developed By
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Academic project implementation details and mentorship acknowledgement.
        </p>
      </div>

      {/* STUDENT / TEAM MEMBERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Team Members
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((member) => (
            <StudentCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* GUIDED BY SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Award className="w-5 h-5 text-emerald-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Guided By
          </h2>
        </div>

        <AdvisorCard advisor={advisor} />
      </div>
    </div>
  );
};

