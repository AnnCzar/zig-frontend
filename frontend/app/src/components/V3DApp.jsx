import React from 'react';
import * as v3d from 'verge3d';
import { createApp as createAppModel1 } from '../v3dApp/Model1.js';
import '../v3dApp/Model1.css';
import { createApp as createAppModel2 } from '../v3dApp3/model2.js';
import '../v3dApp3/model2.css';
import { createApp as createAppModel3 } from '../v3dApp2/model3Marta.js';
import '../v3dApp2/model3Marta.css';

class V3DApp extends React.Component {
   #app = null;
  #PL = null;
  #switchButton = null;
  #infoPanel = null;
  #infoPoints = [];
  #colorChangePoints = [];
  #colorChangePanel = null;
  #activeModelKey = this.props.modelName;
  #defaultCameraSettings = {};
  #currentCamera = null;
  #uuid = window.crypto.randomUUID();
  #containerId = `v3d-container-${this.#uuid}`;
  #fsButtonId = `fullscreen-button-${this.#uuid}`;
  #sceneURL = null;
  #roomData = {};
  #colors = {};
  #materialMap = {};
  #currentWallMaterialName = null;
  #isLoading = false;
  #infoPointColor = 0xffffff;
getAssetPath = (path) => `${import.meta.env.BASE_URL}${path}`;
    #models = {
  Model1: {
    modelName: 'Model1',
    sceneURL: this.getAssetPath('v3dApp/Model1.gltf'),
    logicURL: this.getAssetPath('v3dApp/visual_logic.js'),
    createApp: createAppModel1,
    infoPointColor: "#001542",
    colors: {
      "wall1_color_1": "#00174EFF",
      "wall_1_color_2": "#4E0B07FF",
      "wall_1_color_3": "#4E433EFF",
      "wall_1_color_4": "#032B0AFF",
      "wall_1_color_5": "#CECCCAFF"
    },
    materialMap: {
      "#00174EFF": "Blue office wall",
      "#4E0B07FF": "Red office wall",
      "#4E433EFF": "Beige office wall",
      "#032B0AFF": "Green office wall",
      "#CECCCAFF": "White office wall.001"
    },
    roomData: {
      'InfoPoint_kitchen+livingroom': { name: 'Kuchnia z salonem', area: '33.5 m²' },
        'InfoPoint_corridor': { name: 'Corridor', area: '15.2 m²' },
        'InfoPoint_office': { name: 'Office', area: '6.6 m²' },
        'InfoPoint_bathroom': { name: 'Bathroom', area: '6 m²' },
        'InfoPoint_room1': { name: 'Room 1', area: '10.5 m²' },
        'InfoPoint_room2': { name: 'Room 2', area: '12.4 m²' },
        'InfoPoint_room3': { name: 'Room 3', area: '13.5 m²' },
        'InfoPoint_toilet': { name: 'Toilet', area: '2 m²' },
        'InfoPoint_wardrobe': { name: 'Wardrobe', area: '3.1 m²' }
    },
    currentWallMaterial: "White office wall"
  },
  Model2: {
    modelName: 'Model2',

    sceneURL: this.getAssetPath('/v3dApp3/model2.gltf'),
    logicURL: this.getAssetPath('v3dApp3/visual_logic.js'),
    createApp: createAppModel2,
    infoPointColor: 0xffffff,
    roomData: {
      'InfoPoint_kitchen': { name: 'Kitchen with livingroom', area: '33.5 m²' },
        'InfoPoint_balcony': { name: 'Balcony', area: '15.2 m²' },
        'InfoPoint_bathroom': { name: 'Bathroom', area: '6 m²' },
        'InfoPoint_room1': { name: 'Room 1', area: '10.5 m²' },
        'InfoPoint_hall': { name: 'Hall', area: '2 m²' }
    },

  },
  Model3: {
    modelName: 'Model3',

        sceneURL: this.getAssetPath('/v3dApp2/model3Marta.gltf'),
    logicURL: this.getAssetPath('v3dApp2/visual_logic.js'),
    createApp: createAppModel3,
     infoPointColor: 0xff0000,
    colors: {
      "wall1_color_1": "#131752FF",
      "wall_1_color_2": "#3F0002FF",
      "wall_1_color_3": "#A7A7A7FF",
      "wall_1_color_4": "#122B00FF",
      "wall_1_color_5": "#23110DFF",
      "wall_1_color_6": "#403E3EFF"
    },
    materialMap: {
      "#131752FF": "Blue plaster wall",
      "#3F0002FF": "Red plaster wall",
      "#A7A7A7FF": "White plaster wall",
      "#122B00FF": "Green plaster wall ",
      "#23110DFF": "Brown plaster wall",
      "#403E3EFF": "Painted Plaster Wall"
    },
    roomData: {
      'InfoPoint_livingroom': { name: 'Kitechen with livingroom', area: '42,9 m²' },
        'InfoPoint_hall': { name: 'Hall', area: '5,9 m²' },
        'InfoPoint_corridor': { name: 'Corridor', area: '12.0 m²' },
        'InfoPoint_bathroom': { name: 'Bathroom', area: '7,8 m²' },
        'InfoPoint_room1': { name: 'Room 1', area: '15,2 m²' },
        'InfoPoint_room2': { name: 'Room 1', area: '19,1 m²' },
        'InfoPoint_room3': { name: 'Room 3', area: '14,72 m²' },
        'InfoPoint_garderoba': { name: 'Wardrobe', area: '3,6 m²' }
    },
    currentWallMaterial: "Painted Plaster Wall"
  }
};

    getCurrentCreateApp() {
    const model = this.#models[this.#activeModelKey];
    if (!model || !model.createApp) {
      throw new Error(`CreateApp function not found for model: ${this.#activeModelKey}`);
    }
    return model.createApp;
  }


  async loadApp() {
    if (this.#isLoading) {
      console.log('App is already loading, skipping...');
      return;
    }

    this.#isLoading = true;

    try {
      await this.waitForDOM();

      const container = document.getElementById(this.#containerId);
      if (!container) {
        throw new Error(`Container element with id ${this.#containerId} not found`);
      }

      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        console.warn('Container has zero dimensions, setting default size');
        container.style.width = container.style.width || '100%';
        container.style.height = container.style.height || '500px';

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await this.switchModel(this.props.modelName);

      const currentModel = this.#models[this.#activeModelKey];

      if (!this.checkWebGLSupport()) {
        throw new Error('WebGL is not supported in this browser');
      }

      const createApp = this.getCurrentCreateApp();

      console.log('Creating V3D app with:', {
        containerId: this.#containerId,
        fsButtonId: this.#fsButtonId,
        sceneURL: this.#sceneURL
      });

      const { app, PL } = await createApp({
        containerId: this.#containerId,
        fsButtonId: this.#fsButtonId,
        sceneURL: this.#sceneURL
      });

      if (!app) {
        throw new Error('Failed to create V3D app - app is null');
      }

      this.#app = app;
      this.#PL = PL;

      const success = await this.waitForCameras();
      if (!success) {
        throw new Error('Failed to initialize cameras');
      }

      this.getDefaultCamerasSettings();
      this.initCameraSwitchButton();
      this.#currentCamera = 'Camera(orbit)';
      this.findInfoPoints();

      console.log('V3D app loaded successfully');

    } catch (error) {
      console.error('Error loading V3D app:', error);
      this.handleLoadError(error);
    } finally {
      this.#isLoading = false;
    }
  }

  async waitForDOM() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        const checkReady = () => {
          if (document.getElementById(this.#containerId)) {
            resolve();
          } else {
            requestAnimationFrame(checkReady);
          }
        };
        checkReady();
      }
    });
  }

  checkWebGLSupport() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        console.error('WebGL not supported');
        return false;
      }
      // Test basic WebGL functionality
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return true;
    } catch (e) {
      console.error('WebGL support check failed:', e);
      return false;
    }
  }

  async waitForCameras() {
    let retries = 30; // Increased retries
    while (retries-- > 0) {
      if (this.#app?.scene &&
          this.#app.scene.getObjectByName('Camera(orbit)') &&
          this.#app.scene.getObjectByName('Camera(FPS)')) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.warn('Cameras not found after waiting');
    return false;
  }

  handleLoadError(error) {
    // Clean up on error
    if (this.#app) {
      try {
        this.#app.dispose();
      } catch (e) {
        console.error('Error disposing app:', e);
      }
      this.#app = null;
    }

    const container = document.getElementById(this.#containerId);
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f5f5f5;
          color: #666;
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 20px;
        ">
          <div>
            <h3>Failed to load 3D viewer</h3>
            <p>Please try refreshing the page or check your browser's WebGL support.</p>
            <small>Error: ${error.message}</small>
          </div>
        </div>
      `;
    }
  }

  async switchModel(modelKey) {
    if (!this.#models[modelKey]) {
      console.warn(`Model "${modelKey}" nie istnieje`);
      return;
    }

    this.#activeModelKey = modelKey;
    const model = this.#models[modelKey];

    this.#sceneURL = model.sceneURL;
    this.#colors = model.colors;
    this.#materialMap = model.materialMap;
    this.#roomData = model.roomData;
    this.#currentWallMaterialName = model.currentWallMaterial;
    this.#infoPointColor = model.infoPointColor || 0xffffff;
    // Clean up existing app
    if (this.#app) {
      try {
        this.disposeApp();
      } catch (e) {
        console.error('Error disposing previous app:', e);
      }
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.modelName !== this.props.modelName) {
      this.handleModelChange();
    }
  }

  handleModelChange = async () => {
    if (!this.#isLoading) {
      await this.switchModel(this.props.modelName);
      await this.loadApp();
    }
  };

  findInfoPoints() {
    if (!this.#app || !this.#app.scene) {
      console.warn('App or scene not initialized yet');
      return;

    }

    this.#infoPoints = [];
    this.#colorChangePoints = [];
    console.log('=== DEBUGING INFO POINTS ===');

    const textureLoader = new v3d.TextureLoader();
   const spriteMap = textureLoader.load(
  '/v3dApp/paint-brush-solid.svg',
  (texture) => {
    console.log(' Tekstura załadowana pomyślnie:', texture.image?.src || texture);
  },
  undefined,
  (error) => {
    console.error(' Błąd podczas ładowania tekstury:', error);
  }
);
    const iconScale = 0.2;
    const borderScaleFactor = 1.3;


    this.#app.scene.traverse((object) => {
      if (object.name.startsWith('InfoPoint_')) {
        console.log(`Found info point: ${object.name}`);

        const geometry = new v3d.SphereGeometry(0.1, 16, 16);
        const material = new v3d.MeshBasicMaterial({
          color: this.#infoPointColor,
          opacity: 0.7,
          transparent: true,
        });
        const indicator = new v3d.Mesh(geometry, material);


        indicator.position.copy(object.position);
        indicator.quaternion.copy(object.quaternion);
        indicator.scale.copy(object.scale);

        indicator.userData.infoPointName = object.name;
        indicator.visible = true;
        indicator.renderOrder = 999;
        indicator.matrixWorldNeedsUpdate = true;

        this.#app.scene.add(indicator);
        this.#infoPoints.push(indicator);
      }

      if (object.name.startsWith('PaintIcon_')) {
      console.log(`Found color change point: ${object.name}`);

      const borderMaterial = new v3d.SpriteMaterial({
        map: spriteMap,
        color: 0x000000,
      });

      const borderSprite = new v3d.Sprite(borderMaterial);
      borderSprite.position.copy(object.position);
      borderSprite.quaternion.copy(object.quaternion);
      borderSprite.scale.copy(object.scale).multiplyScalar(iconScale * borderScaleFactor);
      borderSprite.renderOrder = 998;

      const spriteMaterial = new v3d.SpriteMaterial({
        map: spriteMap,
      });

      const indicator = new v3d.Sprite(spriteMaterial);
      indicator.position.copy(object.position);
      indicator.quaternion.copy(object.quaternion);
      indicator.scale.copy(object.scale).multiplyScalar(iconScale);
      indicator.userData.colorPointName = object.name;
      indicator.visible = true;
      indicator.renderOrder = 999;
      indicator.matrixWorldNeedsUpdate = true;

      this.#app.scene.add(borderSprite);
      this.#app.scene.add(indicator);
      this.#colorChangePoints.push(indicator);
      this.#colorChangePoints.push(borderSprite);
    }
    });


    console.log(`Found ${this.#infoPoints.length} info points`);
    console.log(`Found ${this.#colorChangePoints.length / 2} color change points`);

    // Ustaw początkową widoczność punktów na podstawie aktualnej kamery
    const isOrbitCamera = this.#currentCamera === 'Camera(orbit)';
    this.toggleInfoPoints(this.#currentCamera);
    this.toggleColorPoints(this.#currentCamera);
    this.toggleCeiling(this.#currentCamera);
    console.log(`Initial info points visibility: ${isOrbitCamera} for camera: ${this.#currentCamera}`);

    this.createInfoPanel();
    this.createColorChangePanel();
    this.setupClickDetection();
  }

  createInfoPanel() {
    console.log('Creating info panel');

    if (this.#infoPanel && this.#infoPanel.parentNode) {
      this.#infoPanel.parentNode.removeChild(this.#infoPanel);
    }

    this.#infoPanel = document.createElement('div');
    this.#infoPanel.id = `info-panel-${this.#uuid}`;

    this.#infoPanel.style.position = 'absolute';
    this.#infoPanel.style.backgroundColor = 'rgba(238, 231, 231, 0.47)';
    this.#infoPanel.style.color = 'white';
    this.#infoPanel.style.padding = '15px';
    this.#infoPanel.style.borderRadius = '5px';
    this.#infoPanel.style.border = '2px solid rgb(234, 235, 224)';
    this.#infoPanel.style.display = 'none';
    this.#infoPanel.style.zIndex = '9999';
    this.#infoPanel.style.pointerEvents = 'none';
    this.#infoPanel.style.fontFamily = 'Arial, sans-serif';
    this.#infoPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    this.#infoPanel.style.minWidth = '200px';

    const container = document.getElementById(this.#containerId);
    if (container) {
      container.appendChild(this.#infoPanel);
      console.log('Panel added to container:', container);
    } else {
      console.error('Container not found');
    }
  }

  createColorChangePanel() {
    console.log('Tworzenie panelu zmiany koloru');

    if (this.#colorChangePanel && this.#colorChangePanel.parentNode) {
        this.#colorChangePanel.parentNode.removeChild(this.#colorChangePanel);
    }

    this.#colorChangePanel = document.createElement('div');
    this.#colorChangePanel.id = `color-change-panel-${this.#uuid}`;

    this.#colorChangePanel.style.position = 'absolute';
    this.#colorChangePanel.style.backgroundColor = 'rgba(238, 231, 231, 0.47)'; // Ciemniejsze tło
    this.#colorChangePanel.style.color = 'white';
    this.#colorChangePanel.style.padding = '15px';
    this.#colorChangePanel.style.borderRadius = '5px';
    this.#colorChangePanel.style.border = '2px solidrgb(234, 235, 224)'; // Dodaj obramowanie
    this.#colorChangePanel.style.display = 'none';
    this.#colorChangePanel.style.zIndex = '9999'; // Bardzo wysoki z-index
    this.#colorChangePanel.style.pointerEvents = 'none';
    this.#colorChangePanel.style.fontFamily = 'Arial, sans-serif';
    this.#colorChangePanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    this.#colorChangePanel.style.minWidth = '200px'; // Ustaw minimalną szerokość

    const container = document.getElementById(this.#containerId);
    if (container) {
        container.appendChild(this.#colorChangePanel);
        console.log('Panel dodany do kontenera:', container);
    } else {
        console.error('Nie znaleziono kontenera v3d-container');

        document.body.appendChild(this.#colorChangePanel);
        console.log('Panel dodany awaryjnie do body');
    }




  }

setupClickDetection() {
  const raycaster = new v3d.Raycaster();
  const mouse = new v3d.Vector2();

  const container = document.getElementById(this.#containerId);
  if (!container) {
    console.error('Container not found for click detection');
    return;
  }

  container.addEventListener('click', (event) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, this.#app.camera);

    console.log('=== CLICK DETECTION DEBUG ===');
    console.log('Available info points:', this.#infoPoints.length);
    console.log('Available color points:', this.#colorChangePoints.length);

    if (this.#infoPoints.length > 0) {
      const infoIntersects = raycaster.intersectObjects(this.#infoPoints);
      console.log('Info intersects found:', infoIntersects.length);

      if (infoIntersects.length > 0) {
        const point = infoIntersects[0].object;

        const room = this.#roomData[point.userData.infoPointName];
        console.log('Room data for this point:', room);

        if (room) {
          this.showRoomInfo(room, event.clientX, event.clientY);
          return; // ← WAŻNE: return żeby nie sprawdzać dalej
        } else {
          console.warn('No room data found for:', point.userData.infoPointName);
        }
      }
    }

    if (this.#colorChangePoints.length > 0) {
      const colorIntersects = raycaster.intersectObjects(this.#colorChangePoints);

      if (colorIntersects.length > 0) {
        const point = colorIntersects[0].object;

        const screenPosition = this.convert3DToScreenPosition(point.position, container);
        this.showColorChangePanel(
          point.userData.colorPointName,
          screenPosition.x,
          screenPosition.y
        );
        return;
      }
    }

    console.log('No intersections found, hiding panels');
    this.hideRoomInfo();
    this.hideColorChangePanel();
  });
}
convert3DToScreenPosition(position3D, container) {

  const vector = new v3d.Vector3();
  vector.copy(position3D);


  vector.project(this.#app.camera);

  const rect = container.getBoundingClientRect();

  const screenX = Math.round((vector.x + 1) / 2 * rect.width);
  const screenY = Math.round((-vector.y + 1) / 2 * rect.height);

  console.log('3D Position:', position3D);
  console.log('Screen Position:', { x: screenX, y: screenY });
  console.log('Container rect:', rect);

  return {
    x: screenX,
    y: screenY
  };
}



  showRoomInfo(room, x, y) {
    console.log('Attempting to show info:', room, x, y);

    if (!this.#infoPanel) {
      console.error('Info panel does not exist!');
      return;
    }

    this.#infoPanel.innerHTML = `
      <h3 style="margin: 0 0 10px 0; font-size: 18px;">${room.name}</h3>
      <p style="margin: 0; font-size: 14px;">Area: ${room.area}</p>
    `;

    this.#infoPanel.style.left = `${x + 15}px`;
    this.#infoPanel.style.top = `${y - 15}px`;
    this.#infoPanel.style.display = 'block';
    console.log('Panel should be visible now:', this.#infoPanel);
  }


showColorChangePanel(colorPointName, x, y) {
  if (!this.#colorChangePanel) {
    console.error('Panel nie istnieje!');
    return;
  }

  this.#colorChangePanel.innerHTML = `
    <h3 style="margin: 0 0 10px 0; font-size: 16px;">Zmień kolor ściany</h3>
    <div id="color-options" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
  `;

  const colorOptionsDiv = this.#colorChangePanel.querySelector('#color-options');

  for (const [id, hex] of Object.entries(this.#colors)) {
    const colorButton = document.createElement('div');
    colorButton.style.width = '30px';
    colorButton.style.height = '30px';
    colorButton.style.borderRadius = '5px';
    colorButton.style.backgroundColor = hex;
    colorButton.style.cursor = 'pointer';
    colorButton.title = hex;
    colorButton.style.border = '2px solid white';
    colorButton.style.boxShadow = '0 0 5px rgba(0,0,0,0.5)';

    colorButton.addEventListener('click', () => {
      this.changeWallColor(hex);
      this.hideColorChangePanel();
    });

    colorOptionsDiv.appendChild(colorButton);
  }

  const container = document.getElementById(this.#containerId);
  const containerRect = container.getBoundingClientRect();

  console.log('Pozycjonuję panel na:', { x, y });
  console.log('Container rect:', containerRect);

  const finalX = containerRect.left + x + 15; // Offset w prawo od pędzla
  const finalY = containerRect.top + y - 15;  // Offset w górę od pędzla

  const panelWidth = 200;
  const panelHeight = 100;

  let adjustedX = finalX;
  let adjustedY = finalY;

  if (finalX + panelWidth > window.innerWidth) {
    adjustedX = containerRect.left + x - panelWidth - 15;
  }
  if (finalY < 0) {
    adjustedY = containerRect.top + y + 15;
  }

  this.#colorChangePanel.style.position = 'fixed';
  this.#colorChangePanel.style.left = `${adjustedX}px`;
  this.#colorChangePanel.style.top = `${adjustedY}px`;
  this.#colorChangePanel.style.display = 'block';
  this.#colorChangePanel.style.pointerEvents = 'auto';
  this.#colorChangePanel.style.zIndex = '1000';

  console.log('Panel ustawiony na:', {
    left: adjustedX,
    top: adjustedY,
    position: 'fixed'
  });
}


shouldSkipObject(object) {
    let current = object;
    while (current) {

        if (current.name && current.name.startsWith('NoColorChange_')) {
            return true;
        }

        if (current.userData && current.userData.noColorChange) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

changeWallColor(hex, app) {
    const targetMaterialName = this.#materialMap[hex];


    if (!targetMaterialName) {
        console.warn(`Brak przypisanego materiału dla koloru ${hex}`);
        return;
    }

    let newMaterial = null;

    // Szukamy materiału docelowego
    this.#app.scene.traverse((object) => {
        if (object.material) {
            const materials = Array.isArray(object.material) ? object.material : [object.material];
            for (const mat of materials) {
                if (mat.name === targetMaterialName) {
                    newMaterial = mat;
                    break;
                }
            }
        }
    });

    if (!newMaterial) {
        console.warn(`Nie znaleziono materiału o nazwie: ${targetMaterialName}`);
        return;
    }

    newMaterial.side = v3d.DoubleSide;

    // Podmień materiał we wszystkich obiektach
    this.#app.scene.traverse((object) => {
        // Sprawdź czy obiekt lub jego rodzice mają oznaczenie NoColorChange
        if (this.shouldSkipObject(object)) {
            console.log(`Pominięto obiekt: ${object.name} (NoColorChange)`);
            return;
        }

        if (object.isMesh && object.material) {
            let shouldReplace = false;

            if (Array.isArray(object.material)) {
                for (let i = 0; i < object.material.length; i++) {
                    const mat = object.material[i];
                    if (mat.name === this.#currentWallMaterialName) {

                        object.material[i] = newMaterial;
                        shouldReplace = true;
                        console.log(`Zmieniono materiał w tablicy [${i}] na "${targetMaterialName}" w obiekcie "${object.name}"`);
                    }
                }
            } else {
                // Pojedynczy materiał
                if (object.material.name === this.#currentWallMaterialName || object.material.name === targetMaterialName) {
                    object.material = newMaterial;
                    shouldReplace = true;
                    console.log(`Zmieniono materiał na "${targetMaterialName}" w obiekcie "${object.name}"`);
                }
            }
        }
    });

    // Zaktualizuj nazwę aktualnego materiału ściany
    this.#currentWallMaterialName = targetMaterialName;

    this.#app.needRender = true;
}


  hideRoomInfo() {
    if (this.#infoPanel) {
      this.#infoPanel.style.display = 'none';
    }
  }

hideColorChangePanel() {
    if (this.#colorChangePanel) {
        this.#colorChangePanel.style.display = 'none';
    }
}
toggleInfoPoints(cameraName) {
    console.log(`toggleInfoPoints called with: ${cameraName}, points count: ${this.#infoPoints.length}`);

    const shouldShow = cameraName === 'Camera(orbit)';
    console.log('shouldShow:', shouldShow);


    this.#infoPoints.forEach((point, index) => {
        const previousVisibility = point.visible;
        point.visible = shouldShow;
        point.matrixWorldNeedsUpdate = true;

        if (point.material) {
            point.material.needsUpdate = true;
        }

        console.log(`Point ${index} (${point.userData.infoPointName}) visibility: ${previousVisibility} -> ${point.visible}`);


        if (!point.parent) {
            console.warn(`Point ${index} is not in scene!`);
        }
    });

    if (this.#app && this.#app.scene) {
        this.#app.scene.updateMatrixWorld(true);

        this.#app.scene.traverse((object) => {
            if (object.userData && object.userData.infoPointName) {
                object.visible = shouldShow;
            }
        });

        if (this.#app.render) {
            this.#app.render();
        }
    }


    setTimeout(() => {
        console.log('=== Stan punktów po aktualizacji ===');
        this.#infoPoints.forEach((point, index) => {
            console.log(`Point ${index}: visible=${point.visible}, inScene=${!!point.parent}`);
        });
    }, 100);
}
toggleCeiling(cameraName) {
    const shouldShow = cameraName === 'Camera(FPS)';
    console.log(`Toggleing ceiling visibility: ${shouldShow} for camera: ${cameraName}`);

    this.#app.scene.traverse((object) => {
        if (object.name && object.name.toLowerCase().includes('ceiling')) {
            const previousVisibility = object.visible;
            object.visible = shouldShow;
            object.matrixWorldNeedsUpdate = true;

            if (object.material) {
                object.material.needsUpdate = true;
            }

            console.log(`Ceiling object "${object.name}" visibility: ${previousVisibility} -> ${object.visible}`);
        }
    });

    if (this.#app && this.#app.scene) {
        this.#app.scene.updateMatrixWorld(true);

        if (this.#app.render) {
            this.#app.render();
        }
    }
}

toggleColorPoints(cameraName) {

    const shouldShow = cameraName === 'Camera(orbit)';
    console.log('shouldShow:', shouldShow);

    // Najpierw ustaw wszystkie punkty
    this.#colorChangePoints.forEach((point, index) => {
        const previousVisibility = point.visible;
        point.visible = shouldShow;
        point.matrixWorldNeedsUpdate = true;

        if (point.material) {
            point.material.needsUpdate = true;
        }

        if (!point.parent) {
            console.warn(`Point ${index} is not in scene!`);
        }
    });


    if (this.#app && this.#app.scene) {
        this.#app.scene.updateMatrixWorld(true);

        this.#app.scene.traverse((object) => {
            if (object.userData && object.userData.colorPointName) {
                object.visible = shouldShow;
            }
        });

        if (this.#app.render) {
            this.#app.render();
        }
    }


    setTimeout(() => {
        console.log('=== Stan punktów po aktualizacji ===');
        this.#infoPoints.forEach((point, index) => {
            console.log(`Point ${index}: visible=${point.visible}, inScene=${!!point.parent}`);
        });
    }, 100);
}

  getDefaultCamerasSettings() {
      if (!this.#app || !this.#app.scene) {
    console.warn('App or scene not initialized yet');
    return;

  }

    const cameraOrbit = this.#app.scene.getObjectByName('Camera(orbit)');
    const cameraFPS = this.#app.scene.getObjectByName('Camera(FPS)');

    if (!this.#defaultCameraSettings['Camera(orbit)']) {
        this.#defaultCameraSettings['Camera(orbit)'] = {
            position: cameraOrbit.position.clone(),
            quaternion: cameraOrbit.quaternion.clone(),
            target: this.#app.controls?.target?.clone()
          };
        console.log("Camera(orbit) position saved")
        }
    if (!this.#defaultCameraSettings['Camera(FPS)']) {
        this.#defaultCameraSettings['Camera(FPS)'] = {
            position: cameraFPS.position.clone(),
            quaternion: cameraFPS.quaternion.clone(),
            target: this.#app.controls?.target?.clone()
          };
        console.log("Camera(FPS) position saved")
        }
  }
  initCameraSwitchButton() {

    if (this.#switchButton && this.#switchButton.parentNode) { // usuwa stary przycisk, jeśli juz był
      this.#switchButton.parentNode.removeChild(this.#switchButton);
    }

    this.#switchButton = document.createElement('button');
    this.#switchButton.id = 'camera-switch-button';


    let currentCameraIndex = 0;   // mówi która kamera jest aktywna
    const cameraNames = ['Camera(orbit)', 'Camera(FPS)'];

    const updateButtonText = () => {
      const texts = ['Walk in the apartment', 'Top view'];
      this.#switchButton.innerHTML = texts[(currentCameraIndex + 1) % cameraNames.length];
    };


    this.#switchButton.innerHTML = 'Walk in the apartment';

    // Style the button
    this.#switchButton.style.position = 'absolute';
    this.#switchButton.style.bottom = '20px';
    this.#switchButton.style.right = '20px';
    this.#switchButton.style.zIndex = '100';
    this.#switchButton.style.padding = '10px 15px';
    this.#switchButton.style.backgroundColor = '#333';
    this.#switchButton.style.color = 'white';
    this.#switchButton.style.border = 'none';
    this.#switchButton.style.borderRadius = '5px';
    this.#switchButton.style.cursor = 'pointer';

    this.#switchButton.style.transition = 'background-color 0.3s';
    this.#switchButton.addEventListener('mouseover', () => {
      this.#switchButton.style.backgroundColor = '#555';
    });
    this.#switchButton.addEventListener('mouseout', () => {
      this.#switchButton.style.backgroundColor = '#333';
    });
    

    this.#switchButton.addEventListener('click', () => {
      if (!this.#app) return;
      updateButtonText();
      currentCameraIndex = (currentCameraIndex + 1) % cameraNames.length;
      const nextCamera = cameraNames[currentCameraIndex];
      const camera = this.#app.scene.getObjectByName(nextCamera);

      if (camera && camera.isCamera) {
        const defaults = this.#defaultCameraSettings[nextCamera];

        if (defaults) {
          camera.position.copy(defaults.position);
          camera.quaternion.copy(defaults.quaternion);
          this.#app.setCamera(camera);

          if (this.#app.controls && defaults.target) {
            this.#app.controls.target.copy(defaults.target);
            this.#app.controls.update();
          }
          this.toggleInfoPoints(nextCamera);
          this.toggleColorPoints(nextCamera);
           this.toggleCeiling(nextCamera);


          // Zaktualizuj aktualną kamerę
          this.#currentCamera = nextCamera;

          console.log(`Switched to ${nextCamera}`);
      } else {
        console.warn(`Camera ${nextCamera} not found`);
      }
             } else {
      console.warn(`Camera ${nextCamera} not found`);
    }
    });

    const container = document.getElementById(this.#containerId);
    if (container) {
      container.appendChild(this.#switchButton);
    }
  }

  disposeApp() {
    if (this.#switchButton && this.#switchButton.parentNode) {
      this.#switchButton.parentNode.removeChild(this.#switchButton);
    }
    if (this.#infoPanel && this.#infoPanel.parentNode) {
      this.#infoPanel.parentNode.removeChild(this.#infoPanel);
    }
    if (this.#colorChangePanel && this.#colorChangePanel.parentNode) {
      this.#colorChangePanel.parentNode.removeChild(this.#colorChangePanel);
    }

    this.#app?.dispose();
    this.#app = null;
    this.#PL?.dispose();
    this.#PL = null;
    this.#infoPoints = [];
  }

  componentDidMount() {
    setTimeout(() => this.loadApp(), 100);
  }

  componentWillUnmount() {
    this.disposeApp();
  }

  render() {
    return (
      <div id={this.#containerId} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div
          id={this.#fsButtonId}
          className="fullscreen-button fullscreen-open"
          title="Toggle fullscreen mode"
        ></div>
      </div>
    );
  }
}

export default V3DApp;