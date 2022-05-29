// ==UserScript==
// @name         Presets
// @namespace    KrzysztofKruk-FlyWire
// @version      0.1.0.1
// @description  Allows switching between various presets
// @author       Krzysztof Kruk
// @match        https://ngl.flywire.ai/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/ChrisRaven/FlyWire-Presets/main/Presets.user.js
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/FlyWire-Presets/main/Presets.user.js
// @homepageURL  https://github.com/ChrisRaven/FlyWire-Presets
// ==/UserScript==


(() => {
  if (globalThis.dockIsReady) return main()

  let script = document.createElement('script')
  script.src = 'https://chrisraven.github.io/FlyWire-Dock/Dock.js'
  document.head.appendChild(script)

  let wait = setInterval(() => {
    if (globalThis.dockIsReady) {
      clearInterval(wait)
      main()
    }
  }, 100)
})()

function main() {
  let dock = new Dock()

  dock.addAddon({
    id: 'kk-presets',
    name: 'Presets',
    html: /*html*/`
      <table>
        <tr>
          <td><button class="presets-1-set presets-set">1</button></td>
          <td><button class="presets-2-set presets-set">2</button></td>
          <td><button class="presets-3-set presets-set">3</button></td>
        </tr>
        <tr>
        <td><button class="presets-1-save presets-save">Save</button></td>
        <td><button class="presets-2-save presets-save">Save</button></td>
        <td><button class="presets-3-save presets-save">Save</button></td>
        </tr>

      </table>
    `,
    css: /*css*/`
      #kk-presets button:hover {
        box-shadow: 0 0 0.3em var(--kk-dock-addon-button-color);
      }

      #kk-presets button:hover:active {
        box-shadow: 0 0 0.5em var(--kk-dock-addon-button-color);
      }

      #kk-presets .presets-1-set {
        --kk-dock-addon-button-color: #b03aff;
      }

      #kk-presets .presets-2-set {
        --kk-dock-addon-button-color: #ed3bb0;
      }

      #kk-presets .presets-3-set {
        --kk-dock-addon-button-color: #46c8f7;
      }

      #kk-presets .presets-set {
        height: 48px;
        width: 48px;
      }

      #kk-presets .presets-save {
        --kk-dock-addon-button-color: #7bffd3;
      }
    `,
    events: {
      '#kk-presets .presets-1-set': {
        click: () => setPresets(1)
      },
      '#kk-presets .presets-2-set': {
        click: () => setPresets(2)
      },
      '#kk-presets .presets-3-set': {
        click: () => setPresets(3)
      },
      '#kk-presets .presets-1-save': {
        click: () => savePresets(1)
      },
      '#kk-presets .presets-2-save': {
        click: () => savePresets(2)
      },
      '#kk-presets .presets-3-save': {
        click: () => savePresets(3)
      }
    }
  })
}


function setPresets(number) {
  let state = readFromStorage(number)

  if (state) {
    let targetState = viewer.state.toJSON()
    removeOldLayersFromNewSettings(targetState, state)
    mergeObjects(targetState, state)
    viewer.state.restoreState(targetState)
  }
}


function removeOldLayersFromNewSettings(newSettings, oldSettings) {
  let names = newSettings.layers.map(el => el.name)

  oldSettings.layers.forEach((layer, i, layers) => names.includes(layer.name) ? null : delete layers[i])
}


function savePresets(number) {
  let state = viewer.state.toJSON()
  removeFields(state)

  if (state) {
    writeToStorage(number, state)
  }
}


function readFromStorage(number) {
  let result = localStorage.getItem(`${Dock.userId}-presets-${number}`)

  if (result) {
    return JSON.parse(result)
  }
  return null
}


function writeToStorage(number, value) {
  // Source: https://stackoverflow.com/a/32179927
  let data = JSON.stringify(value, (k, v) => v === undefined ? null : v)
  localStorage.setItem(`${Dock.userId}-presets-${number}`, data)
}

// we don't want to switch current cell(s), view and annotations
function removeFields(presets) {
  presets.layers.forEach(layer => {
    if (layer.type === "segmentation_with_graph") {
      delete layer.segmentColors
      delete layer.segments
      delete layer.pathFinder
    }
    
    if (layer.type === "annotation") {
      delete layer.annotations
      delete layer.annotationTags
      delete layer.selectedAnnotation
    }
  })

  delete presets.navigation.pose.position.voxelCoordinates
  delete presets.navigation.zoomFactor
  delete presets.perspectiveOrientation
  delete presets.perspectiveZoom
  delete presets.selectedLayer
  delete presets.layout
}


function merge(target, key, value) {
  let types = ['number', 'string', 'boolean', 'undefined', 'bigint']
  let typeOfValue = typeof value

  let nonExistent = typeof target[key] === 'undefined'
  let isNull = value === null
  let isPrimitive = types.includes(typeOfValue)
  let isUndefined = value === undefined

  if (nonExistent || isPrimitive || isUndefined) {
    target[key] = value
  }
  // because JSON can't store undefined, we have to convert them to null when writing
  // and then converting back to undefined at reading
  if (isNull) {
    target[key] = undefined
  }
  else if (Array.isArray(value)) {
    value.forEach((el, index) => merge(target[key], index, el))
  }
  else if (typeOfValue === 'object') {
    mergeObjects(target[key], value)
  }
}


function mergeObjects(target, source) {
  for (const [key, value] of Object.entries(source)) {
    merge(target, key, value)
  }
}
