const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'app', 'my-work', 'components');

const mappings = [
  {
    file: 'ActionRequired.tsx',
    mock: 'mockActions',
    data: 'actions',
    importSearch: `import { mockActions } from '../data/mock';`,
  },
  {
    file: 'CustomerFollowUps.tsx',
    mock: 'mockFollowUps',
    data: 'followUps',
    importSearch: `import { mockFollowUps, FollowUp } from '../data/mock';`,
    importReplace: `import { FollowUp } from '../data/mock';`
  },
  {
    file: 'MyAchievements.tsx',
    mock: 'mockAchievement',
    data: 'achievements',
    importSearch: `import { mockAchievement } from '../data/mock';`,
  },
  {
    file: 'MyPerformance.tsx',
    mock: 'mockPerformance',
    data: 'performance',
    importSearch: `import { mockPerformance } from '../data/mock';`,
  },
  {
    file: 'MyProjects.tsx',
    mock: 'mockProjects',
    data: 'projects',
    importSearch: `import { mockProjects, WorkProject } from '../data/mock';`,
    importReplace: `import { WorkProject } from '../data/mock';`
  },
  {
    file: 'RecentActivity.tsx',
    mock: 'mockActivity',
    data: 'activities',
    importSearch: `import { mockActivity, ActivityItem } from '../data/mock';`,
    importReplace: `import { ActivityItem } from '../data/mock';`
  },
  {
    file: 'TodaysSchedule.tsx',
    mock: 'mockSchedule',
    data: 'schedule',
    importSearch: `import { mockSchedule, ScheduleEvent } from '../data/mock';`,
    importReplace: `import { ScheduleEvent } from '../data/mock';`
  },
  {
    file: 'TodaysWork.tsx',
    mock: 'mockTasks',
    data: 'tasks',
    importSearch: `import { mockTasks, WorkTask, Priority, TaskStatus } from '../data/mock';`,
    importReplace: `import { WorkTask, Priority, TaskStatus } from '../data/mock';`
  },
  {
    file: 'WorkSummaryCards.tsx',
    mock: 'mockSummary',
    data: 'summary',
    importSearch: `import { mockSummary } from '../data/mock';`,
  }
];

mappings.forEach(m => {
  const filePath = path.join(dir, m.file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import
  if (m.importReplace) {
    content = content.replace(m.importSearch, m.importReplace + '\nimport { useMyWork } from "../MyWorkContext";');
  } else {
    content = content.replace(m.importSearch, `import { useMyWork } from "../MyWorkContext";`);
  }

  // Insert hook call
  // Match `export default function ComponentName(...) {`
  const funcRegex = /export default function ([A-Za-z0-9_]+)\s*\([^)]*\)\s*\{/;
  content = content.replace(funcRegex, (match, p1) => {
    return match + `\n  const { ${m.data} } = useMyWork();\n`;
  });

  // Replace mock variable
  const mockRegex = new RegExp(`\\b${m.mock}\\b`, 'g');
  // Need to be careful not to replace it in the import if it's already removed
  content = content.replace(mockRegex, m.data);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${m.file}`);
});
