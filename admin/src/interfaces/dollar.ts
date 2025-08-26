export interface Dollar {
  value: number;
  addedValue: number;
  isPercentage: boolean;
  latestAPIUpdate: Date;
}

export interface UpdateDollarConfig {
  addedValue: number;
  isPercentage: boolean;
}
