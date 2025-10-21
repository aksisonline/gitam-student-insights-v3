import { useState, useEffect } from 'react';
import { TrendLineChart } from './charts/TrendLineChart';
import type { SubjectData, AttendanceStats } from '@/lib/types';
import { generateDailyAttendanceData, generatePredictionData } from '@/lib/attendance/attendancePrediction';

interface TrendsTabProps {
  subjects: SubjectData[];
  stats: AttendanceStats;
}

export function TrendsTab({ subjects, stats }: TrendsTabProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [historicalData, setHistoricalData] = useState(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    return generateDailyAttendanceData(days, subjects, stats.overallPercentage);
  });
  
  const [predictionData, setPredictionData] = useState(() => {
    return generatePredictionData(historicalData);
  });

  useEffect(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const newHistoricalData = generateDailyAttendanceData(days, subjects, stats.overallPercentage);
    setHistoricalData(newHistoricalData);
    setPredictionData(generatePredictionData(newHistoricalData));
  }, [timeRange, subjects, stats.overallPercentage]);

  return (
    <div className="space-y-6">
      <TrendLineChart
        historicalData={historicalData}
        predictionData={predictionData}
        onTimeRangeChange={setTimeRange}
      />
      
      {/* Prediction Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Best Case (5 Days)</h4>
          <p className="text-2xl font-bold text-green-600">
            {predictionData.bestCase[predictionData.bestCase.length - 1]}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">If you attend all classes</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Most Likely (5 Days)</h4>
          <p className="text-2xl font-bold text-amber-600">
            {predictionData.predicted[predictionData.predicted.length - 1]}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Based on your pattern</p>
        </div>
        
        <div className="p-4 rounded-lg border bg-card">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Worst Case (5 Days)</h4>
          <p className="text-2xl font-bold text-red-600">
            {predictionData.worstCase[predictionData.worstCase.length - 1]}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">If you miss all classes</p>
        </div>
      </div>
    </div>
  );
}

