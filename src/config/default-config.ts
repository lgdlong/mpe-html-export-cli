export type ExportConfig = {
  offline: boolean;
  output?: string;
  open?: boolean;
  theme?: string;
  css?: string;
  head?: string;
  toc?: boolean;
};

export const defaultConfig: Required<Pick<ExportConfig, 'offline' | 'open' | 'toc'>> = {
  offline: true,
  open: false,
  toc: false,
};
