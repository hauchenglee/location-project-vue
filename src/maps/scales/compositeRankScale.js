export const COMPOSITE_RANK_STOPS = [
  [0, '#f3ead8'],
  [5, '#efe2c8'],
  [10, '#e9d5b2'],
  [15, '#e2c69a'],
  [20, '#dab783'],
  [25, '#d2a66e'],
  [30, '#c9945c'],
  [35, '#bf814d'],
  [40, '#b56f42'],
  [45, '#ab5d3a'],
  [50, '#a04c33'],
  [55, '#953d2d'],
  [60, '#883229'],
  [65, '#7b2825'],
  [70, '#6e2021'],
  [75, '#5f191c'],
  [80, '#501317'],
  [85, '#431013'],
  [90, '#380d11'],
  [95, '#2d0b0e'],
  [100, '#1b0a0c'],
]

export const compositeRankStepExpression = (propertyName) => {
  const [defaultStop, ...stops] = COMPOSITE_RANK_STOPS

  return [
    'step',
    ['coalesce', ['get', propertyName], 0],
    defaultStop[1],
    ...stops.flatMap(([score, color]) => [score, color]),
  ]
}

export const compositeRankLegendGradient = () =>
  `linear-gradient(90deg, ${COMPOSITE_RANK_STOPS.map(([, color]) => color).join(', ')})`
