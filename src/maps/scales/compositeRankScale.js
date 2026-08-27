export const COMPOSITE_RANK_STOPS = [
  [0, '#fff1ec'],
  [5, '#ffe5dc'],
  [10, '#ffd8cb'],
  [15, '#ffc9b8'],
  [20, '#ffbaa5'],
  [25, '#ffa98f'],
  [30, '#ff9879'],
  [35, '#ff8664'],
  [40, '#fb744f'],
  [45, '#f4623f'],
  [50, '#ea5133'],
  [55, '#df412a'],
  [60, '#d33424'],
  [65, '#c4281f'],
  [70, '#b71f1b'],
  [75, '#a91718'],
  [80, '#991114'],
  [85, '#890c10'],
  [90, '#78080d'],
  [95, '#66050a'],
  [100, '#560307'],
]

export const compositeRankStepExpression = (propertyName = 'composite_rank') => {
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
