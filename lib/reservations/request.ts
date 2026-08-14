export type RequestedVillaIds = {
  villaId?: number;
  villaIds?: number[];
};

export function normalizeRequestedVillaIds(input: RequestedVillaIds) {
  const rawIds = Array.isArray(input.villaIds) && input.villaIds.length
    ? input.villaIds
    : input.villaId !== undefined
      ? [input.villaId]
      : [];

  if (
    rawIds.length < 1 ||
    rawIds.length > 2 ||
    rawIds.some((id) => !Number.isInteger(id) || id <= 0) ||
    new Set(rawIds).size !== rawIds.length
  ) {
    return [];
  }

  return rawIds;
}
