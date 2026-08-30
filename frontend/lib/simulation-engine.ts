import {
  runPredictiveSimulation,
  DetailedSimulationOutput,
  DynamicSimulationInput,
  EnvironmentalConditions,
  VehiclePhysicsParams,
} from "./predictive-engine";

export interface SimulationVariables {
  vehicleId?: string;
  currentRouteId?: string;
  alternateRouteType?: string;
  speedDeltaPct?: number; // e.g. +10 or -10
  fuelCostPerKm?: number;
  priorityReordering?: boolean;
  auxiliaryRelayVehicle?: string;
  weatherCondition?: "CLEAR" | "MODERATE_RAIN" | "HEAVY_STORM" | "SEVERE_BLIZZARD";
  temperatureCelsius?: number;
  payloadKg?: number;
}

export interface BaseMetricsSnapshot {
  totalDistanceKm: number;
  avgDurationMins: number;
  currentDelayMins: number;
  ordersCount: number;
  totalOrderValue: number;
  baseCostUsd: number;
}

export interface SimulationResultMetrics {
  totalDistanceKm: number;
  projectedDurationMins: number;
  projectedDelayMins: number;
  netTimeSavedMins: number;
  totalCostUsd: number;
  costDeltaUsd: number;
  slaBreachRiskPct: number;
  ordersAtRisk: number;
  recommendationScore: number; // 0 - 100
  verdict: "HIGHLY_RECOMMENDED" | "FEASIBLE_ALTERNATIVE" | "HIGH_COST_RISK" | "NOT_RECOMMENDED";
  insights: string[];
  estimatedArrivalP50?: string;
  estimatedArrivalP90?: string;
  energyConsumedKwh?: number;
  physicsBreakdown?: {
    aerodynamicDragLossPct: number;
    payloadRollingResistancePct: number;
    environmentalImpedanceFactor: number;
    slaConfidenceScore: number;
  };
}

export function runDeterministicSimulation(
  base: BaseMetricsSnapshot,
  variables: SimulationVariables
): SimulationResultMetrics {
  const env: EnvironmentalConditions = {
    weatherSeverity: variables.weatherCondition ?? "SEVERE_BLIZZARD",
    temperatureCelsius: variables.temperatureCelsius ?? -4,
    windSpeedKmh: 42,
    trafficDensityPct: 65,
    roadGradePct: 3.2,
  };

  const physics: VehiclePhysicsParams = {
    curbWeightKg: 13500,
    currentPayloadKg: variables.payloadKg ?? 16800,
    batteryCapacityKwh: 438,
    currentBatteryPct: 68.5,
    dragCoefficient: 0.46,
    frontalAreaM2: 8.8,
    auxRefrigerationKw: 4.2,
  };

  const input: DynamicSimulationInput = {
    baseDistanceKm: base.totalDistanceKm,
    baseDurationMins: base.avgDurationMins,
    currentDelayMins: base.currentDelayMins,
    activeOrdersCount: base.ordersCount,
    totalOrderValueUsd: base.totalOrderValue,
    baseCostUsd: base.baseCostUsd,
    routeType: variables.alternateRouteType ?? "I-70_SOUTH_DETOUR",
    speedDeltaPct: variables.speedDeltaPct ?? 10,
    fuelCostPerKm: variables.fuelCostPerKm ?? 0.42,
    priorityReordering: variables.priorityReordering ?? false,
    environmental: env,
    vehiclePhysics: physics,
  };

  const result: DetailedSimulationOutput = runPredictiveSimulation(input);

  return {
    totalDistanceKm: result.totalDistanceKm,
    projectedDurationMins: result.projectedDurationMins,
    projectedDelayMins: result.projectedDelayMins,
    netTimeSavedMins: result.netTimeSavedMins,
    totalCostUsd: result.totalCostUsd,
    costDeltaUsd: result.costDeltaUsd,
    slaBreachRiskPct: result.slaBreachRiskPct,
    ordersAtRisk: result.ordersAtRisk,
    recommendationScore: result.paretoScore,
    verdict: result.verdict,
    insights: result.tacticalInsights,
    estimatedArrivalP50: result.estimatedArrivalP50,
    estimatedArrivalP90: result.estimatedArrivalP90,
    energyConsumedKwh: result.energyConsumedKwh,
    physicsBreakdown: result.physicsBreakdown,
  };
}

