// ==UserScript==
// @name         Presets
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Allows switching between various presets
// @author       Krzysztof Kruk
// @match        https://ngl.flywire.ai/
// @grant        none
// ==/UserScript==


if (!document.getElementById('kk-dock')) {
  let script = document.createElement('script')
  script.src = 'http://127.0.0.1:5501/FlyWire-Dock/Dock.js'
  script.addEventListener('load', wait)
  document.head.appendChild(script)
}
else {
  wait()
}

function wait() {
  let wait = setInterval(() => {
    userId = document.querySelector('#loggedInUserDropdown .nge-usercard-email')
    if (userId) {
      clearInterval(wait)
      main(userId)

    }
  }, 100)    
}

function main(userId) {
  let dock = new Dock()
  userId = userId.textContent

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
      :root {
        --kk-presets-button-color: #5454d3;
      }

      #kk-presets button {
        color: white;
        background-color: transparent;
        border: 1px solid var(--kk-presets-button-color);
        border-radius: 4px;
        margin: 2px;
        padding: 4px 8px;
        cursor: pointer;
      }

      #kk-presets button:hover {
        box-shadow: 0 0 0.3em var(--kk-presets-button-color);
      }

      #kk-presets button:hover:active {
        box-shadow: 0 0 0.5em var(--kk-presets-button-color);
      }

      #kk-presets .presets-1-set {
        --kk-presets-button-color: #5493d3;
      }

      #kk-presets .presets-2-set {
        --kk-presets-button-color: #dd1f40;
      }

      #kk-presets .presets-3-set {
        --kk-presets-button-color: #2ee300;
      }

      #kk-presets .presets-set {
        height: 48px;
        width: 48px;
      }

      #kk-presets .presets-save {
        --kk-presets-button-color: #b9b900;
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
    mergeObjects(targetState, state)
    viewer.state.restoreState(targetState)
  }
}

function savePresets(number) {
  let state = viewer.state.toJSON()
  removeFields(state)

  if (state) {
    writeToStorage(number, state)
  }
}

function readFromStorage(number) {
  let result = localStorage.getItem(`${userId}-presets-${number}`)

  if (result) {
    return JSON.parse(result)
  }
  return null
}

function writeToStorage(number, value) {
  // Source: https://stackoverflow.com/a/32179927
  let data = JSON.stringify(value, (k, v) => v === undefined ? null : v)
  localStorage.setItem(`${userId}-presets-${number}`, data)
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
