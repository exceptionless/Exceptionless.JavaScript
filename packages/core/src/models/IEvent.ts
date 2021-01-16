export interface IEvent {
  type?: string;
  source?: string;
  date?: Date;
  tags?: string[];
  message?: string;
  geo?: string;
  value?: number;
  data?: any;
  reference_id?: string;
  count?: number;
}
