export const flattenAdminDistricts = (counties = []) =>
  counties.flatMap((county) =>
    (county.towns || []).map((town) => ({
      ...town,
      countyCode: town.countyCode || county.countyCode,
      countyName: town.countyName || county.countyName,
    })),
  )

export const findAdminDistrictByCode = (districts, code) =>
  (districts || []).find((district) => String(district.townCode) === String(code)) || null

export const formatAdminDistrict = (district) =>
  district ? `${district.countyName} · ${district.townName}` : ''
