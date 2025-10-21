# Architecture Documentation

This document outlines the component architecture and design patterns used in GITAM Student Insights.

## Project Structure

```
student-insights-v3/
├── components/
│   ├── attendance/              # Attendance-related components
│   │   ├── AttendanceDashboard.tsx    # Main orchestrator
│   │   ├── AttendanceHeader.tsx       # Header with refresh
│   │   ├── StatsGrid.tsx              # Stats cards grid
│   │   ├── SubjectsList.tsx           # Subjects list view
│   │   ├── HistoryTab.tsx             # History timeline (FREE)
│   │   ├── TrendsTab.tsx              # 5-day predictions (FREE)
│   │   ├── CalculatorTab.tsx          # Interactive calculator (PRO)
│   │   ├── AnalyticsTab.tsx           # Insights and analytics
│   │   ├── cards/                     # Reusable card components
│   │   │   ├── StatCard.tsx
│   │   │   ├── SubjectCard.tsx
│   │   │   ├── InsightCard.tsx
│   │   │   └── HistoryRecord.tsx
│   │   ├── charts/                    # Chart components
│   │   │   ├── SubjectBarChart.tsx
│   │   │   ├── DistributionPieChart.tsx
│   │   │   └── TrendLineChart.tsx
│   │   └── pro/                       # Pro feature components
│   │       ├── ProBadge.tsx
│   │       └── ProFeatureLock.tsx
│   ├── popup/                   # Popup-specific components
│   │   ├── FeatureSettingsCard.tsx
│   │   └── StatusCard.tsx
│   └── ui/                      # ShadCN UI components
├── lib/
│   ├── attendance/              # Business logic
│   │   ├── attendancePrediction.ts    # Prediction algorithms
│   │   ├── attendanceCalculations.ts  # Stats calculations
│   │   ├── attendanceCalculator.ts    # Calculator logic
│   │   ├── attendanceHistory.ts       # History processing
│   │   ├── calendarHolidays.ts        # Holiday integration
│   │   └── attendanceHelpers.ts       # Utility functions
│   ├── features/                # Feature management
│   │   ├── featureManager.ts          # Access control
│   │   └── featureConfig.ts           # Feature definitions
│   └── types.ts                 # TypeScript interfaces
├── contents/                    # Content scripts
│   ├── attendance.tsx
│   └── captcha.tsx
└── entrypoints/
    ├── background.ts
    ├── popup/
    │   └── App.tsx
    └── content.ts
```

## Architectural Principles

### 1. Separation of Concerns

**Logic Layer (`lib/`)**
- Pure TypeScript functions
- No React dependencies
- Testable in isolation
- Reusable across components

**Presentation Layer (`components/`)**
- React components
- Receives data via props
- No business logic
- Focuses on UI/UX

**Orchestration Layer**
- Container components (e.g., AttendanceDashboard)
- Manages state
- Composes child components
- Handles data flow

### 2. Component Hierarchy

```
AttendanceDashboard (Orchestrator)
├── AttendanceHeader (Presentation)
├── StatsGrid (Container)
│   └── StatCard × 4 (Presentation)
├── Tabs (Navigation)
│   ├── Overview Tab (Container)
│   │   ├── SubjectBarChart (Presentation)
│   │   ├── DistributionPieChart (Presentation)
│   │   └── SubjectsList (Container)
│   │       └── SubjectCard × N (Presentation)
│   ├── History Tab (Container)
│   │   └── HistoryRecord × N (Presentation)
│   ├── Trends Tab (Container)
│   │   └── TrendLineChart (Presentation)
│   ├── Calculator Tab (Container + Feature Guard)
│   │   ├── ProFeatureLock (if not pro)
│   │   └── AttendanceContributionGraph (if pro)
│   └── Analytics Tab (Container)
│       └── InsightCard × N (Presentation)
```

### 3. Data Flow

```
User Action → Container Component → Logic Layer → Update State → Re-render
```

Example: Refresh attendance data
```
1. User clicks "Refresh" button in AttendanceHeader
2. onClick handler calls onRefresh prop
3. AttendanceDashboard receives onRefresh from parent
4. Parent fetches new data from API
5. New data passed down as props
6. All child components re-render with new data
```

### 4. Feature Access Pattern

```typescript
// In any component
import { hasFeatureAccess, FeatureFlag } from '@/lib/features/featureManager';

const canViewCalculator = hasFeatureAccess(FeatureFlag.ATTENDANCE_CALCULATOR);

if (!canViewCalculator) {
  return <ProFeatureLock featureName="Attendance Calculator" />;
}

// Render actual feature
return <AttendanceCalculatorComponent />;
```

## Component Design Patterns

### Pure Presentation Components

```typescript
// Good: Pure presentation, no logic
export function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card>
      <CardHeader>{title}</CardHeader>
      <CardContent>
        <Icon />
        <span>{value}</span>
      </CardContent>
    </Card>
  );
}
```

### Container Components

```typescript
// Good: Manages state and data, composes children
export function StatsGrid({ stats }: { stats: AttendanceStats }) {
  // Calculate derived data
  const overallTrend = calculateTrendDirection(stats);
  
  return (
    <div className="grid">
      <StatCard title="Overall" value={stats.overallPercentage} trend={overallTrend} />
      <StatCard title="Safe" value={stats.safeSubjects} />
      {/* ... more cards */}
    </div>
  );
}
```

### Orchestrator Components

```typescript
// Good: Main container, manages routing and state
export function AttendanceDashboard({ subjects, stats, onRefresh }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div>
      <AttendanceHeader onRefresh={onRefresh} />
      <StatsGrid stats={stats} />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="overview">
          <SubjectBarChart subjects={subjects} />
          <SubjectsList subjects={subjects} />
        </TabsContent>
        {/* ... more tabs */}
      </Tabs>
    </div>
  );
}
```

## State Management

### Local State (useState)
- Used for UI-only state
- Example: active tab, modal open/closed

### Props Drilling
- Data flows down from parent to children
- Callbacks flow up from children to parent

### Future: Context API (if needed)
```typescript
// When state becomes too complex
const AttendanceContext = createContext();

export function AttendanceProvider({ children }) {
  const [data, setData] = useState();
  return (
    <AttendanceContext.Provider value={{ data, setData }}>
      {children}
    </AttendanceContext.Provider>
  );
}
```

## Styling Approach

### Tailwind CSS
- Utility-first CSS framework
- Configured with custom design tokens
- Dark mode support via `dark:` prefix

### ShadCN UI
- Pre-built accessible components
- Customizable via Tailwind
- Consistent design system

### Component Styling
```typescript
// Use Tailwind classes directly
<Card className="border-2 hover:shadow-lg transition-all">
  <CardContent className="p-4 space-y-2">
    {/* content */}
  </CardContent>
</Card>
```

## Performance Optimizations

### Code Splitting
- Lazy load heavy components
- Split by route/tab

### Memoization
```typescript
const MemoizedChart = React.memo(SubjectBarChart);
```

### Virtual Lists (for large lists)
```typescript
// Use react-window for rendering 100+ items
import { FixedSizeList } from 'react-window';
```

## Testing Strategy

### Unit Tests (lib/)
```typescript
// Test pure functions
test('calculateOverallStats', () => {
  const stats = calculateOverallStats(mockSubjects);
  expect(stats.overallPercentage).toBe(75);
});
```

### Component Tests
```typescript
// Test rendering and interactions
test('StatCard renders correctly', () => {
  render(<StatCard title="Test" value={75} />);
  expect(screen.getByText('75')).toBeInTheDocument();
});
```

### Integration Tests
```typescript
// Test complete flows
test('attendance dashboard loads and displays data', async () => {
  render(<AttendanceDashboard />);
  await waitFor(() => {
    expect(screen.getByText('Attendance Dashboard')).toBeInTheDocument();
  });
});
```

## Adding New Features

### Checklist
1. **Define types** in `lib/types.ts`
2. **Create logic** in appropriate `lib/` file
3. **Build presentation component** in `components/`
4. **Create container** if needed
5. **Add to orchestrator** (AttendanceDashboard)
6. **Update feature config** if pro feature
7. **Write tests**
8. **Update documentation**

### Example: Adding a new chart
```typescript
// 1. Define types
export interface MyChartProps {
  data: MyData[];
}

// 2. Create logic (if needed)
export function processChartData(rawData: any[]): MyData[] {
  // processing logic
}

// 3. Build component
export function MyChart({ data }: MyChartProps) {
  const processedData = processChartData(data);
  return <ChartContainer>...</ChartContainer>;
}

// 4. Add to dashboard
<TabsContent value="mychart">
  <MyChart data={myData} />
</TabsContent>
```

## Best Practices

1. **Keep components small** - Single responsibility
2. **Use TypeScript** - Type everything
3. **No magic numbers** - Use constants
4. **Descriptive names** - Code reads like English
5. **Error boundaries** - Catch and handle errors gracefully
6. **Accessibility** - ARIA labels, keyboard navigation
7. **Responsive design** - Mobile-first approach
8. **Performance** - Lazy load, memoize, optimize
9. **Documentation** - Comment complex logic
10. **Consistency** - Follow existing patterns

## Resources

- [React Docs](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
- [ShadCN UI](https://ui.shadcn.com/)
- [Chrome Extension Docs](https://developer.chrome.com/docs/extensions/)

