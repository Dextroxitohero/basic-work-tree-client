export const VIEWS = ['employees', 'org-chart', 'departments', 'job-titles'] as const
export type View = (typeof VIEWS)[number]
