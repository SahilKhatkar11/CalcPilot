import { ReactNode } from 'react';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type ButtonType = 'number' | 'operator' | 'utility';

export interface ButtonConfig {
  key: string;
  label: ReactNode;
  type: ButtonType;
  row: number;
  col: number;
  colSpan?: number;
  className?: string;
}
