/**
 * NEXUS Predictive Physics & Operational Optimization Engine
 * Pure mathematical algorithms for spatial kinematics, energy consumption, SLA survival distributions,
 * dynamic route impedance, and multi-objective Pareto decision scoring.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface EnvironmentalConditions {
  weatherSeverity: "CLEAR" | "MODERATE_RAIN" | "HEAVY_STORM" | "SEVERE_BLIZZARD";
  temperatureCelsius: number;
  windSpeedKmh: number;
  roadGradePct?: number; // incline/decline percentage
  trafficDensityPct?: number; // 0 (empty) to 100 (gridlock)
}

export interface VehiclePhysicsParams {
  curbWeightKg: number;
  currentPayloadKg: number;
  batteryCapacityKwh: number;
  currentBatteryPct: number;
  dragCoefficient: number; // e.g. 0.45 for commercial trucks
  frontalAreaM2: number; // e.g. 8.5 m^2
  auxRefrigerationKw?: number; // e.g. 4.5 kW for cold-chain
}

export interface SLARiskProfile {
  deadlineEpochMs: number;
  currentEstimatedArrivalEpochMs: number;
  trafficVolatilitySigmaMins: number;
  orderValueUsd: number;
  isPerishableOrCritical: boolean;
}

export interface DynamicSimulationInput {
  baseDistanceKm: number;
  baseDurationMins: number;
  currentDelayMins: number;
  activeOrdersCount: number;
  totalOrderValueUsd: number;
  baseCostUsd: number;
  routeType: string;
  speedDeltaPct: number;
  fuelCostPerKm: number;
  priorityReordering: boolean;
  environmental: EnvironmentalConditions;
  vehiclePhysics?: VehiclePhysicsParams;
}

export interface DetailedSimulationOutput {
  totalDistanceKm: number;
  projectedDurationMins: number;
  projectedDelayMins: number;
  netTimeSavedMins: number;
  totalCostUsd: number;
  costDeltaUsd: number;
  energyConsumedKwh: number;
  slaBreachRiskPct: number;
  ordersAtRisk: number;
  estimatedArrivalP50: string; // ISO string
  estimatedArrivalP90: string; // ISO string
  estimatedArrivalP99: string; // ISO string
  paretoScore: number; // 0 - 100
  verdict: "HIGHLY_RECOMMENDED" | "FEASIBLE_ALTERNATIVE" | "HIGH_COST_RISK" | "NOT_RECOMMENDED";
  tacticalInsights: string[];
  physicsBreakdown: {
    aerodynamicDragLossPct: number;
    payloadRollingResistancePct: number;
    environmentalImpedanceFactor: number;
    slaConfidenceScore: number;
  };
}

/**
 * Great-Circle distance using Haversine formula
 */
export function calculateHaversineDistanceKm(p1: LatLng, p2: LatLng): number {
  const R = 6371.0; // Earth radius in kilometers
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Standard normal cumulative distribution function approximation (erf)
 */
function normalCdf(x: number, mean: number, stdDev: number): number {
  if (stdDev <= 0) return x >= mean ? 1.0 : 0.0;
  const z = (x - mean) / (stdDev * Math.SQRT2);
  // Abramowitz & Stegun approximation for erf
  const t = 1.0 / (1.0 + 0.3275911 * Math.abs(z));
  const poly =
    t *
    (0.254829592 +
      t *
        (-0.284496736 +
          t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1.0 - poly * Math.exp(-z * z);
  const sign = z >= 0 ? 1 : -1;
  return 0.5 * (1.0 + sign * erf);
}

/**
 * Calculate Environmental Impedance Factor (velocity reduction ratio)
 */
export function calculateEnvironmentalImpedance(env: EnvironmentalConditions): number {
  let weatherMultiplier = 1.0;
  switch (env.weatherSeverity) {
    case "CLEAR":
      weatherMultiplier = 1.0;
      break;
    case "MODERATE_RAIN":
      weatherMultiplier = 0.88;
      break;
    case "HEAVY_STORM":
      weatherMultiplier = 0.65;
      break;
    case "SEVERE_BLIZZARD":
      weatherMultiplier = 0.28;
      break;
  }

  const trafficImpedance = 1.0 - ((env.trafficDensityPct ?? 25) / 100) * 0.45;
  const windPenalty = env.windSpeedKmh > 35 ? (env.windSpeedKmh - 35) * 0.004 : 0.0;
  const gradePenalty = env.roadGradePct ? Math.max(0, env.roadGradePct) * 0.02 : 0.0;

  const netFactor = Math.max(0.15, weatherMultiplier * trafficImpedance - windPenalty - gradePenalty);
  return Math.round(netFactor * 1000) / 1000;
}

/**
 * Calculate Energy / Fuel Consumption based on aerodynamic and rolling resistance
 */
export function calculateEnergyConsumption(
  distanceKm: number,
  avgSpeedKmh: number,
  params?: VehiclePhysicsParams
): { energyKwh: number; fuelCost: number; aeroLossPct: number; rollLossPct: number } {
  const totalWeightKg = (params?.curbWeightKg ?? 12000) + (params?.currentPayloadKg ?? 10000);
  const vMps = (avgSpeedKmh * 1000) / 3600; // m/s
  const cr = 0.007; // rolling resistance coefficient for commercial radials
  const cd = params?.dragCoefficient ?? 0.45;
  const area = params?.frontalAreaM2 ?? 8.5;
  const airDensity = 1.225; // kg/m^3

  // Aerodynamic force: F_aero = 0.5 * rho * Cd * A * v^2
  const fAero = 0.5 * airDensity * cd * area * Math.pow(vMps, 2);
  // Rolling force: F_roll = Cr * m * g
  const fRoll = cr * totalWeightKg * 9.81;

  const totalForceNewtons = fAero + fRoll;
  const workJoules = totalForceNewtons * (distanceKm * 1000);
  const propulsionKwh = workJoules / 3.6e6;

  // Auxiliary load (HVAC + Cryo-refrigeration)
  const durationHours = distanceKm / Math.max(10, avgSpeedKmh);
  const auxKwh = (params?.auxRefrigerationKw ?? 3.5) * durationHours;
  const netEnergyKwh = Math.round((propulsionKwh + auxKwh) * 10) / 10;

  const aeroPct = Math.round((fAero / Math.max(1, totalForceNewtons)) * 100);
  const rollPct = 100 - aeroPct;

  return {
    energyKwh: netEnergyKwh,
    fuelCost: Math.round(netEnergyKwh * 0.18 * 100) / 100, // commercial kWh fleet rate
    aeroLossPct: aeroPct,
    rollLossPct: rollPct,
  };
}

/**
 * Evaluate SLA Breach Probability via Gaussian CDF Survival Analysis
 */
export function evaluateSLABreachProbability(profile: SLARiskProfile): {
  breachRiskPct: number;
  p50EpochMs: number;
  p90EpochMs: number;
  p99EpochMs: number;
} {
  const timeBufferMins = (profile.deadlineEpochMs - profile.currentEstimatedArrivalEpochMs) / (60 * 1000);
  const sigmaMins = Math.max(8.0, profile.trafficVolatilitySigmaMins);

  // Breach occurs if ActualTransitTime > Deadline, i.e. remaining buffer < 0
  // P(Breach) = 1 - Phi(Buffer / Sigma)
  const probOnTime = normalCdf(timeBufferMins, 0, sigmaMins);
  const breachRisk = Math.max(0.01, Math.min(0.99, 1.0 - probOnTime));

  const p50 = profile.currentEstimatedArrivalEpochMs;
  const p90 = profile.currentEstimatedArrivalEpochMs + 1.282 * sigmaMins * 60 * 1000;
  const p99 = profile.currentEstimatedArrivalEpochMs + 2.326 * sigmaMins * 60 * 1000;

  return {
    breachRiskPct: Math.round(breachRisk * 1000) / 10,
    p50EpochMs: p50,
    p90EpochMs: p90,
    p99EpochMs: p99,
  };
}

/**
 * Run Comprehensive Predictive Simulation
 */
export function runPredictiveSimulation(input: DynamicSimulationInput): DetailedSimulationOutput {
  const speedFactor = 1.0 + (input.speedDeltaPct ?? 0) / 100.0;
  const envFactor = calculateEnvironmentalImpedance(input.environmental);

  let routeDistanceKm = input.baseDistanceKm;
  let baseTransitDurationMins = input.baseDurationMins;
  let projectedDelayMins = input.currentDelayMins;
  let varianceSigmaMins = 25.0;
  const insights: string[] = [];

  switch (input.routeType) {
    case "I-70_SOUTH_DETOUR":
      routeDistanceKm = input.baseDistanceKm + 84.5;
      baseTransitDurationMins = Math.round((input.baseDurationMins + 55) / speedFactor);
      projectedDelayMins = Math.max(0, Math.round(input.currentDelayMins * 0.22)); // 78% weather recovery
      varianceSigmaMins = 12.0;
      insights.push("I-70 Southern arterial maintains +42 km/h average speed above mountain blizzard zone.");
      insights.push("Auxiliary refrigeration duty cycle stabilized at nominal 92% efficiency.");
      break;

    case "US-40_NORTH_DETOUR":
      routeDistanceKm = input.baseDistanceKm + 138.0;
      baseTransitDurationMins = Math.round((input.baseDurationMins + 105) / speedFactor);
      projectedDelayMins = Math.max(0, Math.round(input.currentDelayMins * 0.45));
      varianceSigmaMins = 20.0;
      insights.push("US-40 secondary mountain pass features moderate grade incline with lower traffic congestion.");
      break;

    case "TRANSFER_TO_RELAY":
      routeDistanceKm = input.baseDistanceKm + 18.0;
      baseTransitDurationMins = Math.round(input.baseDurationMins * 0.82);
      projectedDelayMins = Math.max(0, Math.round(input.currentDelayMins * 0.12));
      varianceSigmaMins = 9.0;
      insights.push("Intermediate dock cross-docking separates critical consignments to dedicated fast hauler.");
      insights.push("Reduced vehicle mass improves net propulsion efficiency by 14.8%.");
      break;

    case "WAIT_AND_HOLD":
    default:
      routeDistanceKm = input.baseDistanceKm;
      baseTransitDurationMins = input.baseDurationMins + input.currentDelayMins + 75;
      projectedDelayMins = input.currentDelayMins + 75;
      varianceSigmaMins = 45.0;
      insights.push("Holding pattern incurs cumulative driver duty time and compound customer SLA penalties.");
      break;
  }

  // Energy and cost physics
  const avgSpeedKmh = Math.min(105, (routeDistanceKm / (baseTransitDurationMins / 60)) * speedFactor * envFactor);
  const energyData = calculateEnergyConsumption(routeDistanceKm, Math.max(25, avgSpeedKmh), input.vehiclePhysics);

  const fuelCost = Math.round(routeDistanceKm * input.fuelCostPerKm * 1.85 * 100) / 100;
  const dispatchSurcharge = input.priorityReordering ? 145.0 : 0.0;
  const totalCost = Math.round((fuelCost + energyData.fuelCost + dispatchSurcharge) * 100) / 100;
  const costDelta = Math.round((totalCost - input.baseCostUsd) * 100) / 100;

  const totalBaselineTime = input.baseDurationMins + input.currentDelayMins;
  const totalSimulatedTime = baseTransitDurationMins + projectedDelayMins;
  const timeSavedMins = Math.max(0, totalBaselineTime - totalSimulatedTime);

  // SLA Survival Analysis
  const now = Date.now();
  const deadlineEpoch = now + (input.baseDurationMins + 90) * 60 * 1000;
  const estimatedArrivalEpoch = now + totalSimulatedTime * 60 * 1000;

  const slaProfile = evaluateSLABreachProbability({
    deadlineEpochMs: deadlineEpoch,
    currentEstimatedArrivalEpochMs: estimatedArrivalEpoch,
    trafficVolatilitySigmaMins: varianceSigmaMins,
    orderValueUsd: input.totalOrderValueUsd,
    isPerishableOrCritical: true,
  });

  const ordersAtRisk =
    slaProfile.breachRiskPct > 40
      ? Math.ceil(input.activeOrdersCount * (slaProfile.breachRiskPct / 100))
      : Math.max(0, Math.ceil(input.activeOrdersCount * 0.08));

  // Multi-objective Pareto Decision Scoring (0 - 100)
  // Weights: 45% Time Saved, 25% SLA Preservation, 20% Cost Efficiency, 10% Environmental Stability
  const timeScore = Math.min(100, (timeSavedMins / 120) * 100);
  const slaScore = Math.max(0, 100 - slaProfile.breachRiskPct);
  const costScore = costDelta <= 0 ? 100 : Math.max(0, 100 - (costDelta / 500) * 50);
  const envScore = Math.round(envFactor * 100);

  const paretoScore = Math.round(
    timeScore * 0.45 + slaScore * 0.25 + costScore * 0.20 + envScore * 0.10
  );

  let verdict: DetailedSimulationOutput["verdict"] = "FEASIBLE_ALTERNATIVE";
  if (paretoScore >= 80) {
    verdict = "HIGHLY_RECOMMENDED";
  } else if (paretoScore < 45) {
    verdict = "NOT_RECOMMENDED";
  } else if (costDelta > 250 && slaProfile.breachRiskPct > 35) {
    verdict = "HIGH_COST_RISK";
  }

  return {
    totalDistanceKm: Math.round(routeDistanceKm * 10) / 10,
    projectedDurationMins: baseTransitDurationMins,
    projectedDelayMins,
    netTimeSavedMins: timeSavedMins,
    totalCostUsd: totalCost,
    costDeltaUsd: costDelta,
    energyConsumedKwh: energyData.energyKwh,
    slaBreachRiskPct: slaProfile.breachRiskPct,
    ordersAtRisk,
    estimatedArrivalP50: new Date(slaProfile.p50EpochMs).toISOString(),
    estimatedArrivalP90: new Date(slaProfile.p90EpochMs).toISOString(),
    estimatedArrivalP99: new Date(slaProfile.p99EpochMs).toISOString(),
    paretoScore,
    verdict,
    tacticalInsights: insights,
    physicsBreakdown: {
      aerodynamicDragLossPct: energyData.aeroLossPct,
      payloadRollingResistancePct: energyData.rollLossPct,
      environmentalImpedanceFactor: envFactor,
      slaConfidenceScore: Math.round(100 - slaProfile.breachRiskPct),
    },
  };
}
