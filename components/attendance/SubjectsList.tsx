import { SubjectCard } from './cards/SubjectCard';
import type { SubjectData } from '@/lib/types';

interface SubjectsListProps {
  subjects: SubjectData[];
  onSubjectClick?: (subject: SubjectData) => void;
}

export function SubjectsList({ subjects, onSubjectClick }: SubjectsListProps) {
  return (
    <div className="space-y-3">
      {subjects.map((subject, index) => (
        <div 
          key={subject.code}
          style={{ animationDelay: `${index * 50}ms` }}
          className="animate-in fade-in slide-in-from-bottom-2"
        >
          <SubjectCard 
            subject={subject} 
            onClick={() => onSubjectClick?.(subject)}
          />
        </div>
      ))}
    </div>
  );
}

