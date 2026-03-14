export function calculatePrice(rule, distanceKm, weightKg) {
  if (!rule) {
    throw new Error("Unsupported vehicle type");
  }

  const parsedDistance = Number(distanceKm);
  const parsedWeight = Number(weightKg);
  const extraWeight = Math.max(0, parsedWeight - Number(rule.weightGraceKg));
  const total =
    Number(rule.baseFare) +
    parsedDistance * Number(rule.perKm) +
    extraWeight * Number(rule.extraWeightCharge);

  return {
    baseFare: Number(rule.baseFare),
    distanceCharge: Math.round(parsedDistance * Number(rule.perKm)),
    weightCharge: Math.round(extraWeight * Number(rule.extraWeightCharge)),
    total: Math.round(total)
  };
}

export const activeStatuses = new Set(["Partner Assigned", "Partner Accepted", "Picked Up", "In Transit"]);
