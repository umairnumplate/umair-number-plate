
export enum WorkType {
  NumberPlate = 'Number Plate',
  NamePlate = 'Name Plate',
  Sticker = 'Sticker',
  Other = 'Other',
}

export interface LogEntry {
  id: string;
  serialNumber: number;
  numberPlate: string;
  sticker: string;
  description: string;
  phoneNumber: string;
  workType: WorkType;
  createdAt: number; // Storing as timestamp for easy sorting
  advance: number;
  baqaya: number;
  isComplete: boolean;
  imageUrl?: string;
}
