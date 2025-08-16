export type ChartType = "bar" | "line" | "pie" | "donut";

export type AggregationType = "sum" | "average" | "count" | "min" | "max";

export interface FilterConfig {
  id: string;
  field: string;
  value: string;
  operator: "contains" | "equals" | "startsWith" | "endsWith";
}

export interface ChartConfig {
  id: string;
  title: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  xAxisLabel: string;
  yAxisLabel: string;
  colors: string[];
  isDefault?: boolean;
  description?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
  }[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: "top" | "bottom" | "left" | "right";
      display: boolean;
    };
    title: {
      display: boolean;
      text: string;
      font: {
        size: number;
        weight: string;
      };
    };
    tooltip: {
      enabled: boolean;
      mode: "index" | "nearest" | "point" | "dataset" | "x" | "y";
    };
  };
  scales?: {
    x?: {
      title: {
        display: boolean;
        text: string;
      };
      ticks: {
        maxRotation: number;
        minRotation: number;
      };
    };
    y?: {
      beginAtZero: boolean;
      title: {
        display: boolean;
        text: string;
      };
    };
  };
}

export interface DataField {
  key: string;
  label: string;
  type: "string" | "number" | "date";
  chartCompatible: boolean;
  description: string;
}

export interface ChartValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ChartSuggestion {
  title: string;
  description: string;
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  aggregation: AggregationType;
  reason: string;
}
