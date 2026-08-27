import * as maplibregl from 'maplibre-gl'
import { getClusterCenter } from '@/maps/utils/bounds'

export const useClusterMarkers = ({ map, onSelect }) => {
  let markers = []

  const clearMarkers = () => {
    markers.forEach(({ marker }) => marker.remove())
    markers = []
  }

  const renderMarkers = ({ metricClusters, selectedMetricClusterId }) => {
    if (!map.value) return

    clearMarkers()
    markers = metricClusters
      .map((metricCluster) => {
        const coordinates = getClusterCenter(metricCluster)
        if (!coordinates) return null

        const element = document.createElement('button')
        element.type = 'button'
        element.className = `cluster-locator-marker${Number(metricCluster.id) === Number(selectedMetricClusterId) ? ' active' : ''}`
        element.textContent = metricCluster.sequence
        element.setAttribute('aria-label', `選取${metricCluster.displayName}`)
        element.addEventListener('click', (event) => {
          event.stopPropagation()
          onSelect(metricCluster)
        })

        const marker = new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat(coordinates)
          .addTo(map.value)

        return { marker, metricClusterId: metricCluster.id }
      })
      .filter(Boolean)
  }

  return {
    renderMarkers,
    clearMarkers,
  }
}
