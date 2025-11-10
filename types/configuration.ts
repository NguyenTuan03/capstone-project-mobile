export interface ConfigurationType {
  id: number;
  key: string;
  value: string;
  description?: string;
  dataType: "string" | "number" | "boolean" | "json";
}
