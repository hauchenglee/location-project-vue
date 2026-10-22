import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { compileScript, parse } from 'vue/compiler-sfc'
import { createRenderer, h, nextTick, ref } from 'vue'

// Mount the real SFC with a small in-memory Vue host; no browser or DOM shim is
// needed to exercise its select events, parent updates and map-driven backfill.
const source = await readFile(new URL('../src/components/AdminDistrictLocator.vue', import.meta.url), 'utf8')
const { descriptor } = parse(source)
const require = createRequire(import.meta.url)
const compiled = compileScript(descriptor, {
  id: 'locator-test', inlineTemplate: true, templateOptions: { compilerOptions: { hoistStatic: false } },
}).content
  .replace(/from (['"])vue\1/g, `from '${new URL('index.mjs', pathToFileURL(require.resolve('vue'))).href}'`)
  .replace("'@/utils/adminAreas'", `'${new URL('../src/utils/adminAreas.js', import.meta.url).href}'`)
const { default: Locator } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`)

const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null })
const renderer = createRenderer({
  createElement: (type) => node(type),
  createText: (text) => node('#text', text),
  createComment: (text) => node('#comment', text),
  setText: (target, text) => { target.text = text },
  setElementText: (target, text) => { target.text = text; target.children = [] },
  patchProp: (target, key, before, after) => { target.props[key] = after },
  parentNode: (target) => target.parent,
  nextSibling: (target) => target.parent?.children[target.parent.children.indexOf(target) + 1] || null,
  insert: (target, parent, anchor = null) => {
    if (target.parent) target.parent.children.splice(target.parent.children.indexOf(target), 1)
    target.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, target)
  },
  remove: (target) => target.parent.children.splice(target.parent.children.indexOf(target), 1),
})

const counties = [
  { countyCode: '63', countyName: '台北市', towns: [
    { townCode: '63001', townName: '松山區' }, { townCode: '63002', townName: '信義區' },
  ] },
  { countyCode: '65', countyName: '新北市', towns: [
    { townCode: '65001', townName: '板橋區' }, { townCode: '65010', townName: '淡水區' },
  ] },
]
const walk = (root, predicate) => [root, ...root.children.flatMap((child) => walk(child, predicate))].filter(predicate)
const mount = (context, code = '') => {
  const selected = ref(code)
  const loading = ref(false)
  const selections = []
  const root = node('root')
  const app = renderer.createApp({
    setup: () => () => h(Locator, {
      counties, modelValue: selected.value, loading: loading.value,
      onSelect: (district) => { selections.push(district); selected.value = district.townCode },
    }),
  })
  app.mount(root)
  context.after(() => app.unmount())
  const select = (id) => walk(root, (element) => element.props.id === id)[0]
  const options = () => walk(select('adminDistrict'), (element) => element.type === 'option').map((element) => element.props.value)
  return { selected, loading, selections, select, options }
}

test('requires a county before district selection', (context) => {
  const { select, options } = mount(context)
  assert.equal(select('adminCounty').props.disabled, false)
  assert.equal(select('adminDistrict').props.disabled, true)
  assert.deepEqual(options(), [''])
})

test('a user county change selects its first district through the existing select event', async (context) => {
  const { selected, selections, select, options } = mount(context, '63002')
  select('adminCounty').props.onChange({ target: { value: '65' } })
  await nextTick()
  assert.equal(selected.value, '65001')
  assert.deepEqual(selections.map((district) => district.townCode), ['65001'])
  assert.equal(selections[0].countyName, '新北市')
  assert.deepEqual(options(), ['', '65001', '65010'])
  assert.equal(select('adminDistrict').props.disabled, false)
})

test('map backfill selects the exact district without emitting a county reset', async (context) => {
  const { selected, selections, select, options } = mount(context, '63002')
  selected.value = '65010'
  await nextTick()
  assert.equal(select('adminCounty').props.value, '65')
  assert.equal(select('adminDistrict').props.value, '65010')
  assert.deepEqual(options(), ['', '65001', '65010'])
  assert.deepEqual(selections, [])
})

test('reselecting a county leaves a fine-tuned district unchanged', async (context) => {
  const { selected, selections, select } = mount(context, '65010')
  select('adminCounty').props.onChange({ target: { value: '65' } })
  await nextTick()
  assert.equal(selected.value, '65010')
  assert.deepEqual(selections, [])
})

test('district changes are restricted to the selected county and loading disables both fields', async (context) => {
  const { selected, loading, selections, select } = mount(context, '65001')
  select('adminDistrict').props.onChange({ target: { value: '63002' } })
  assert.deepEqual(selections, [])
  select('adminDistrict').props.onChange({ target: { value: '65010' } })
  await nextTick()
  assert.equal(selected.value, '65010')
  loading.value = true
  await nextTick()
  assert.equal(select('adminCounty').props.disabled, true)
  assert.equal(select('adminDistrict').props.disabled, true)
})
