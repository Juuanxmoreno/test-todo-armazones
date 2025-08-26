export interface updateDollarAddedValueDTO {
  addedValue: number;
  isPercentage: boolean;
}

export interface dollarResponseDTO {
  value: number;
  addedValue: number;
  isPercentage: boolean;
  latestAPIUpdate: Date;
}
