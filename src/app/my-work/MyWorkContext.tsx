'use client';

import React, { createContext, useContext } from 'react';
import { WorkTask, WorkProject, FollowUp, ScheduleEvent, ActionItem, ActivityItem, PerformanceData, AchievementData } from './data/mock';

export interface MyWorkData {
  tasks: WorkTask[];
  projects: WorkProject[];
  followUps: FollowUp[];
  schedule: ScheduleEvent[];
  actions: ActionItem[];
  activities: ActivityItem[];
  performance: PerformanceData;
  achievements: AchievementData;
  summary: any;
  user: {
    firstName: string;
    fullName: string;
    id: string;
  };
}

const MyWorkContext = createContext<MyWorkData | undefined>(undefined);

export function MyWorkProvider({ children, initialData }: { children: React.ReactNode; initialData: MyWorkData }) {
  return (
    <MyWorkContext.Provider value={initialData}>
      {children}
    </MyWorkContext.Provider>
  );
}

export function useMyWork() {
  const context = useContext(MyWorkContext);
  if (!context) {
    throw new Error('useMyWork must be used within a MyWorkProvider');
  }
  return context;
}
