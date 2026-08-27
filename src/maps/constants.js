export const TAIWAN_CENTER = [121.5654, 25.033]

export const TAIWAN_BOUNDS = [
  [118.0, 21.5],
  [123.5, 26.6],
]

export const MVT_SOURCE_ID = 'location-mvt'

export const MVT_SCHEMA_VERSION = 'v3'
export const MVT_EXTENT = 4096

export const MVT_LAYERS = Object.freeze({
  metricCluster: Object.freeze({
    sourceLayer: 'metric_cluster',
    geometryType: 'Polygon',
    minzoom: 8,
    maxzoom: 22,
    properties: Object.freeze({
      id: 'id',
      analysisId: 'analysis_id',
      compositeScore: 'composite_score',
      businessScore: 'business_score',
      populationScore: 'population_score',
      peopleScore: 'people_score',
      transitScore: 'transit_score',
    }),
  }),
  metricCell: Object.freeze({
    sourceLayer: 'metric_cell',
    geometryType: 'Polygon',
    minzoom: 8,
    maxzoom: 22,
    properties: Object.freeze({
      id: 'id',
      analysisId: 'analysis_id',
      metricClusterId: 'metric_cluster_id',
      cellId: 'cell_id',
      cellX: 'cell_x',
      cellY: 'cell_y',
      compositeRank: 'composite_rank',
      businessCountRank: 'business_count_rank',
      industryCountRank: 'industry_count_rank',
      hhiRank: 'hhi_rank',
      entropyRank: 'entropy_rank',
      competitionImpactRank: 'competition_impact_rank',
      populationCountRank: 'population_count_rank',
      populationTargetAgeRank: 'population_target_age_rank',
      peopleCountRank: 'people_count_rank',
      peoplePeakRank: 'people_peak_rank',
      peopleAverageRank: 'people_average_rank',
      metroImpactRank: 'metro_impact_rank',
    }),
  }),
  businessEntity: Object.freeze({
    sourceLayer: 'business_entity',
    geometryType: 'Point',
    minzoom: 12,
    maxzoom: 22,
    properties: Object.freeze({
      id: 'id',
      cellId: 'cell_id',
      ban: 'ban',
      businessEntityName: 'business_entity_name',
      countyName: 'county_name',
      townName: 'town_name',
      address: 'address',
      industryCode: 'industry_code',
      industryName: 'industry_name',
      industryCode1: 'industry_code_1',
      industryName1: 'industry_name_1',
      industryCode2: 'industry_code_2',
      industryName2: 'industry_name_2',
      industryCode3: 'industry_code_3',
      industryName3: 'industry_name_3',
    }),
  }),
  metroStation: Object.freeze({
    sourceLayer: 'metro_station',
    geometryType: 'Point',
    minzoom: 10,
    maxzoom: 22,
    properties: Object.freeze({
      id: 'id',
      cellId: 'cell_id',
      objectId: 'object_id',
      markId: 'mark_id',
      stationName: 'station_name',
      markName1: 'mark_name_1',
      markName2: 'mark_name_2',
      address: 'address',
      tel: 'tel',
      updYyyymm: 'upd_yyyymm',
    }),
  }),
  adminCounty: Object.freeze({
    sourceLayer: 'admin_county',
    geometryType: 'Polygon',
    minzoom: 0,
    maxzoom: 12,
    properties: Object.freeze({
      id: 'id',
      countyId: 'county_id',
      countyCode: 'county_code',
      countyName: 'county_name',
      countyNameEnglish: 'county_name_english',
      type: 'type',
      typeEnglish: 'type_english',
    }),
  }),
  adminTown: Object.freeze({
    sourceLayer: 'admin_town',
    geometryType: 'Polygon',
    minzoom: 8,
    maxzoom: 14,
    properties: Object.freeze({
      id: 'id',
      townId: 'town_id',
      townCode: 'town_code',
      townName: 'town_name',
      townNameEnglish: 'town_name_english',
      countyId: 'county_id',
      countyCode: 'county_code',
      countyName: 'county_name',
    }),
  }),
})

export const styleLayerZoom = (schemaLayer) => ({
  minzoom: schemaLayer.minzoom,
  maxzoom: Math.min(schemaLayer.maxzoom + 1, 24),
})

export const CLUSTER_LOCATOR_COLORS = [
  '#2563eb',
  '#0f766e',
  '#d97706',
  '#7c3aed',
  '#be123c',
  '#0284c7',
  '#65a30d',
  '#c2410c',
]
