/* __V3D_TEMPLATE__ - template-based file; delete this line to prevent this file from being updated */

'use strict';
import * as v3d from 'verge3d';
window.addEventListener('load', e => {
    const params = v3d.AppUtils.getPageParams();
    createApp({
        containerId: 'v3d-container',
        fsButtonId: 'fullscreen-button',
        sceneURL: params.load || 'model3Marta.gltf',
        logicURL: params.logic || 'visual_logic.js',
    });
});

// Tablica punktów informacyjnych i panel informacyjny
let infoPoints = [];
let infoPanel = null;

let colorChangePoints = [];
let colorChangePanel = null;


// const THREE = v3d.THREE;


// Dane o pokojach (dostosuj do swoich potrzeb)
const roomData = {
    'InfoPoint_livingroom': { name: 'Kuchnia z salonem', area: '42,9 m²' },
    'InfoPoint_hall': { name: 'Przedpokój', area: '5,9 m²' },
    'InfoPoint_corridor': { name: 'Korytarz', area: '12.0 m²' },
    'InfoPoint_bathroom': { name: 'Łazienka', area: '7,8 m²' },
    'InfoPoint_room1': { name: 'Pierwsza sypialnia', area: '15,2 m²' },
    'InfoPoint_room2': { name: 'Druga sypialnia', area: '19,1 m²' },
    'InfoPoint_room3': { name: 'Trzecia sypialnia', area: '14,72 m²' },
    'InfoPoint_garderoba': { name: 'Garderoba', area: '3,6 m²' },
};


const colors = {
    "wall1_color_1": "#131752FF",
    "wall_1_color_2": "#3F0002FF",
    "wall_1_color_3": "#A7A7A7FF",
    "wall_1_color_4": "#122B00FF",
    "wall_1_color_5": "#23110DFF",
    "wall_1_color_6": "#403E3EFF",

};

const materialMap = {
    "#131752FF": "Blue plaster wall",
    "#3F0002FF": "Red plaster wall",
    "#A7A7A7FF": "White plaster wall",
    "#122B00FF": "Green plaster wall ",
    "#23110DFF": "Brown plaster wall",
    "#403E3EFF" : "Painted Plaster Wall"
}



async function createApp({containerId, fsButtonId = null, sceneURL, logicURL = ''}) {
    if (!sceneURL) {
        console.log('No scene URL specified');
        return;
    }

    // some puzzles can benefit from cache
    v3d.Cache.enabled = true;

    let PL = null, PE = null;
    if (v3d.AppUtils.isXML(logicURL)) {
        const PUZZLES_DIR = '/puzzles/';
        const logicURLJS = logicURL.match(/(.*)\.xml$/)[1] + '.js';
        PL = await new v3d.PuzzlesLoader().loadEditorWithLogic(PUZZLES_DIR, logicURLJS);
        PE = v3d.PE;
    } else if (v3d.AppUtils.isJS(logicURL)) {
        PL = await new v3d.PuzzlesLoader().loadLogic(logicURL);
    }

    let initOptions = { useFullscreen: true };
    if (PL) {
        initOptions = PL.execInitPuzzles({ container: containerId }).initOptions;
    }
    sceneURL = initOptions.useCompAssets ? `${sceneURL}.xz` : sceneURL;

    const disposeFullscreen = prepareFullscreen(containerId, fsButtonId,
            initOptions.useFullscreen);
    const preloader = createPreloader(containerId, initOptions, PE);

    const app = createAppInstance(containerId, initOptions, preloader, PE);
    app.addEventListener('dispose', () => disposeFullscreen && disposeFullscreen());

    if (initOptions.preloaderStartCb) initOptions.preloaderStartCb();
    app.loadScene(sceneURL, () => {
        app.enableControls();
        app.run();
        
        app.scene.traverse(function(obj) {
        if (obj.isMesh && obj.material) {
            console.log(`Obiekt: ${obj.name}, Materiał:`, obj.material.name);
        }
    });   


        if (PE) PE.updateAppInstance(app);
        if (PL) PL.init(app, initOptions);
        runCode(app, PL);
       
    }, null, () => {
        console.log(`Can't load the scene ${sceneURL}`);
    });

    return { app, PL };
}


function createPreloader(containerId, initOptions, PE) {
    const preloader = initOptions.useCustomPreloader
            ? createCustomPreloader(initOptions.preloaderProgressCb,
            initOptions.preloaderEndCb)
            : new v3d.SimplePreloader({ container: containerId });

    if (PE) puzzlesEditorPreparePreloader(preloader, PE);

    return preloader;
}

function createCustomPreloader(updateCb, finishCb) {
    class CustomPreloader extends v3d.Preloader {
        constructor() {
            super();
        }

        onUpdate(percentage) {
            super.onUpdate(percentage);
            if (updateCb) updateCb(percentage);
        }

        onFinish() {
            super.onFinish();
            if (finishCb) finishCb();
        }
    }

    return new CustomPreloader();
}

/**
 * Modify the app's preloader to track the loading process in the Puzzles Editor.
 */
function puzzlesEditorPreparePreloader(preloader, PE) {
    const _onUpdate = preloader.onUpdate.bind(preloader);
    preloader.onUpdate = function(percentage) {
        _onUpdate(percentage);
        PE.loadingUpdateCb(percentage);
    }

    const _onFinish = preloader.onFinish.bind(preloader);
    preloader.onFinish = function() {
        _onFinish();
        PE.loadingFinishCb();
    }
}


function createAppInstance(containerId, initOptions, preloader, PE) {
    const ctxSettings = {};
    if (initOptions.useBkgTransp) ctxSettings.alpha = true;
    if (initOptions.preserveDrawBuf) ctxSettings.preserveDrawingBuffer = true;

    const app = new v3d.App(containerId, ctxSettings, preloader);
    if (initOptions.useBkgTransp) {
        app.clearBkgOnLoad = true;
        if (app.renderer) {
            app.renderer.setClearColor(0x000000, 0);
        }
    }

    // namespace for communicating with code generated by Puzzles
    app.ExternalInterface = {};
    prepareExternalInterface(app);
    if (PE) PE.viewportUseAppInstance(app);

    return app;
}


function prepareFullscreen(containerId, fsButtonId, useFullscreen) {
    const container = document.getElementById(containerId);
    const fsButton = document.getElementById(fsButtonId);

    if (!fsButton) {
        return null;
    }
    if (!useFullscreen) {
        if (fsButton) fsButton.style.display = 'none';
        return null;
    }

    const fsEnabled = () => document.fullscreenEnabled
            || document.webkitFullscreenEnabled
            || document.mozFullScreenEnabled
            || document.msFullscreenEnabled;
    const fsElement = () => document.fullscreenElement
            || document.webkitFullscreenElement
            || document.mozFullScreenElement
            || document.msFullscreenElement;
    const requestFs = elem => (elem.requestFullscreen
            || elem.mozRequestFullScreen
            || elem.webkitRequestFullscreen
            || elem.msRequestFullscreen).call(elem);
    const exitFs = () => (document.exitFullscreen
            || document.mozCancelFullScreen
            || document.webkitExitFullscreen
            || document.msExitFullscreen).call(document);
    const changeFs = () => {
        const elem = fsElement();
        fsButton.classList.add(elem ? 'fullscreen-close' : 'fullscreen-open');
        fsButton.classList.remove(elem ? 'fullscreen-open' : 'fullscreen-close');
    };

    function fsButtonClick(event) {
        event.stopPropagation();
        if (fsElement()) {
            exitFs();
        } else {
            requestFs(container);
        }
    }

    if (fsEnabled()) fsButton.style.display = 'inline';

    fsButton.addEventListener('click', fsButtonClick);
    document.addEventListener('webkitfullscreenchange', changeFs);
    document.addEventListener('mozfullscreenchange', changeFs);
    document.addEventListener('msfullscreenchange', changeFs);
    document.addEventListener('fullscreenchange', changeFs);

    const disposeFullscreen = () => {
        fsButton.removeEventListener('click', fsButtonClick);
        document.removeEventListener('webkitfullscreenchange', changeFs);
        document.removeEventListener('mozfullscreenchange', changeFs);
        document.removeEventListener('msfullscreenchange', changeFs);
        document.removeEventListener('fullscreenchange', changeFs);
    }

    return disposeFullscreen;
}


function prepareExternalInterface(app) {
    /**
     * Register functions in the app.ExternalInterface to call them from
     * Puzzles, e.g:
     * app.ExternalInterface.myJSFunction = function() {
     *     console.log('Hello, World!');
     * }
     */

}


function createCameraSwitchButton() {
    // Create the button element
    const switchButton = document.createElement('button');
    switchButton.id = 'camera-switch-button';
    switchButton.innerHTML = 'Switch Camera';
    
    // Style the button to position it in the bottom right corner
    switchButton.style.position = 'absolute';
    switchButton.style.bottom = '20px';
    switchButton.style.right = '20px';
    switchButton.style.zIndex = '100';
    switchButton.style.padding = '10px 15px';
    switchButton.style.backgroundColor = '#333';
    switchButton.style.color = 'white';
    switchButton.style.border = 'none';
    switchButton.style.borderRadius = '5px';
    switchButton.style.cursor = 'pointer';
    
    // Add hover effect
    switchButton.style.transition = 'background-color 0.3s';
    switchButton.addEventListener('mouseover', () => {
        switchButton.style.backgroundColor = '#555';
    });
    switchButton.addEventListener('mouseout', () => {
        switchButton.style.backgroundColor = '#333';
    });
    
    // Current camera index
    let currentCameraIndex = 0;
    const cameraNames = ['Camera(FPS)', 'Camera(orbit)'];
    
    // Store default camera positions and rotations
    const defaultCameraSettings = {};
    
    // Add click event to switch between cameras
    switchButton.addEventListener('click', () => {
        // Get the app instance
        const app = v3d.apps[Object.keys(v3d.apps)[0]];
        if (!app) return;
        
        // Toggle camera index
        currentCameraIndex = (currentCameraIndex + 1) % cameraNames.length;
        const nextCamera = cameraNames[currentCameraIndex];
        
        // Find the camera in the scene
        const camera = app.scene.getObjectByName(nextCamera);
        if (camera && camera.isCamera) {
            // Store default settings for the camera if not already stored
            if (!defaultCameraSettings[nextCamera]) {
                defaultCameraSettings[nextCamera] = {
                    position: {
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z
                    },
                    rotation: {
                        x: camera.rotation.x,
                        y: camera.rotation.y,
                        z: camera.rotation.z
                    },
                    quaternion: {
                        x: camera.quaternion.x,
                        y: camera.quaternion.y,
                        z: camera.quaternion.z,
                        w: camera.quaternion.w
                    },
                    target: app.controls && app.controls.target ? {
                        x: app.controls.target.x,
                        y: app.controls.target.y,
                        z: app.controls.target.z
                    } : null
                };
            }
            
            // Reset camera to default position and rotation
            const defaults = defaultCameraSettings[nextCamera];
            camera.position.set(defaults.position.x, defaults.position.y, defaults.position.z);
            
            // Reset rotation (using quaternion is more reliable for cameras)
            camera.quaternion.set(defaults.quaternion.x, defaults.quaternion.y, defaults.quaternion.z, defaults.quaternion.w);
            
            // Set the new active camera
            app.setCamera(camera);
            
            // Reset orbit controls target if applicable
            if (app.controls && app.controls.target && defaults.target) {
                app.controls.target.set(defaults.target.x, defaults.target.y, defaults.target.z);
                app.controls.update();
            }

            toggleInfoPoints(nextCamera === 'Camera(orbit)');
            toggleColorPoints(nextCamera === 'Camera(orbit)');
            console.log(`Switched to ${nextCamera} and reset to default position/rotation`);
        } else {
            console.warn(`Camera ${nextCamera} not found in the scene`);
        }
    });

    
    // Add the button to the document body
    document.body.appendChild(switchButton);
    // Add the button to the document body
    document.body.appendChild(switchButton);
    
    // Initialize default settings for cameras after scene is loaded
    const initDefaultCameraSettings = () => {
        const app = v3d.apps[Object.keys(v3d.apps)[0]];
        if (!app || !app.scene) return;
        
        cameraNames.forEach(cameraName => {
            const camera = app.scene.getObjectByName(cameraName);
            if (camera && camera.isCamera) {
                defaultCameraSettings[cameraName] = {
                    position: {
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z
                    },
                    rotation: {
                        x: camera.rotation.x,
                        y: camera.rotation.y,
                        z: camera.rotation.z
                    },
                    quaternion: {
                        x: camera.quaternion.x,
                        y: camera.quaternion.y,
                        z: camera.quaternion.z,
                        w: camera.quaternion.w
                    },
                    target: app.controls && app.controls.target ? {
                        x: app.controls.target.x,
                        y: app.controls.target.y,
                        z: app.controls.target.z
                    } : null
                };
            }
        });
    };
    
    // Try to initialize after a short delay to ensure scene is loaded
    setTimeout(initDefaultCameraSettings, 1000);
}

// Funkcja wyszukiwania punktów informacyjnych
function findInfoPoints(app) {
    if (!app || !app.scene) {
        console.warn('App lub scena nie zostały zainicjalizowane');
        return;
    }

    app.scene.traverse((object) => {
        if (object.name.startsWith('InfoPoint_')) {
            console.log(`Znaleziono punkt informacyjny: ${object.name}`);
            
            const geometry = new v3d.SphereGeometry(0.1, 16, 16);
            const material = new v3d.MeshBasicMaterial({ 
                color: 0xffffff, 
                opacity: 0.7,
            });
            const indicator = new v3d.Mesh(geometry, material);

            indicator.position.copy(object.position);
            indicator.quaternion.copy(object.quaternion);
            indicator.scale.copy(object.scale);

            indicator.userData.infoPointName = object.name;
            indicator.visible = true;
            indicator.renderOrder = 999;
            indicator.matrixWorldNeedsUpdate = true;

            app.scene.add(indicator);
            infoPoints.push(indicator);

        } if (object.name.startsWith('PaintIcon_')) {
            console.log(`Znaleziono punkt zmiany koloru: ${object.name}`);

            const textureLoader = new v3d.TextureLoader();
            const spriteMap = textureLoader.load('icons/paint-brush-solid.svg');

            const iconScale = 0.2;  
            const borderScaleFactor = 1.3; 

            const borderMaterial = new v3d.SpriteMaterial({
                map: spriteMap,
                color: 0x000000,     
                // depthTest: true
            });

            const borderSprite = new v3d.Sprite(borderMaterial);
            borderSprite.position.copy(object.position);
            borderSprite.quaternion.copy(object.quaternion);
            borderSprite.scale.copy(object.scale).multiplyScalar(iconScale * borderScaleFactor);
            borderSprite.renderOrder = 998;
            app.scene.add(borderSprite);

            // Tworzenie właściwej ikony
            const spriteMaterial = new v3d.SpriteMaterial({
                map: spriteMap
            });

            const indicator = new v3d.Sprite(spriteMaterial);
            indicator.position.copy(object.position);
            indicator.quaternion.copy(object.quaternion);
            indicator.scale.copy(object.scale).multiplyScalar(iconScale);
            
            indicator.userData.colorPointName = object.name;
            indicator.visible = true;
            indicator.renderOrder = 999;
            indicator.matrixWorldNeedsUpdate = true;

            app.scene.add(indicator);
            app.scene.add(borderSprite);
            colorChangePoints.push(indicator);
            colorChangePoints.push(borderSprite);
        }
        

    });

    // Panel informacyjny i kliknięcia
    createInfoPanel(app);
    createColorChangePanel(app)
    setupClickDetection(app)
    
}


// Tworzenie panelu informacyjnego
function createInfoPanel(app) {
    console.log('Tworzenie panelu informacyjnego');
    
    // Usuń istniejący panel, jeśli taki istnieje
    if (infoPanel && infoPanel.parentNode) {
        infoPanel.parentNode.removeChild(infoPanel);
    }
    
    infoPanel = document.createElement('div');
    infoPanel.id = 'info-panel';
    
    // Bardziej wyraziste style, aby łatwiej było zauważyć panel
    infoPanel.style.position = 'absolute';
    infoPanel.style.backgroundColor = 'rgba(238, 231, 231, 0.47)'; // Ciemniejsze tło
    infoPanel.style.color = 'white';
    infoPanel.style.padding = '15px';
    infoPanel.style.borderRadius = '5px';
    infoPanel.style.border = '2px solidrgb(234, 235, 224)'; // Dodaj obramowanie
    infoPanel.style.display = 'none';
    infoPanel.style.zIndex = '9999'; // Bardzo wysoki z-index
    infoPanel.style.pointerEvents = 'none';
    infoPanel.style.fontFamily = 'Arial, sans-serif';
    infoPanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    infoPanel.style.minWidth = '200px'; // Ustaw minimalną szerokość
    
    // Testowa zawartość, aby sprawdzić czy panel jest widoczny
    infoPanel.innerHTML = '<h3>Test Panel</h3><p>Ten panel powinien być widoczny</p>';
    
    const container = document.getElementById('v3d-container');
    if (container) {
        container.appendChild(infoPanel);
        console.log('Panel dodany do kontenera:', container);
    } else {
        console.error('Nie znaleziono kontenera v3d-container');
        
        // Awaryjnie dodaj do body, jeśli kontener nie istnieje
        document.body.appendChild(infoPanel);
        console.log('Panel dodany awaryjnie do body');
    }
}


function createColorChangePanel(app) {
    console.log('Tworzenie panelu zmiany koloru');

    if (colorChangePanel && colorChangePanel.parentNode) {
        colorChangePanel.parentNode.removeChild(colorChangePanel);
    }
    colorChangePanel = document.createElement('div');
    colorChangePanel.id = 'color-change-panel';

    colorChangePanel.style.position = 'absolute';
    colorChangePanel.style.backgroundColor = 'rgba(238, 231, 231, 0.47)'; // Ciemniejsze tło
    colorChangePanel.style.color = 'white';
    colorChangePanel.style.padding = '15px';
    colorChangePanel.style.borderRadius = '5px';
    colorChangePanel.style.border = '2px solidrgb(234, 235, 224)'; // Dodaj obramowanie
    colorChangePanel.style.display = 'none';
    colorChangePanel.style.zIndex = '9999'; // Bardzo wysoki z-index
    colorChangePanel.style.pointerEvents = 'none';
    colorChangePanel.style.fontFamily = 'Arial, sans-serif';
    colorChangePanel.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
    colorChangePanel.style.minWidth = '200px'; // Ustaw minimalną szerokość

    colorChangePanel.innerHTML = '<h3>Test Panel</h3><p>Ten panel powinien być widoczny</p>';

    const container = document.getElementById('v3d-container');
    if (container) {
        container.appendChild(colorChangePanel);
        console.log('Panel dodany do kontenera:', container);
    } else {
        console.error('Nie znaleziono kontenera v3d-container');
        
        // Awaryjnie dodaj do body, jeśli kontener nie istnieje
        document.body.appendChild(colorChangePanel);
        console.log('Panel dodany awaryjnie do body');
    }
}


// Konfiguracja wykrywania kliknięć
function setupClickDetection(app) {
    const raycaster = new v3d.Raycaster();
    const mouse = new v3d.Vector2();

    const container = document.getElementById('v3d-container');
    if (!container) {
        console.error('Nie znaleziono kontenera:', app._container);
        return;
    }

    container.addEventListener('click', (event) => {
        console.log('Kliknięcie wykryte');

        // Oblicz pozycję myszy względem kontenera
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
        console.log('Pozycja myszy:', mouse.x, mouse.y);

        raycaster.setFromCamera(mouse, app.camera);

        // 🔹 1. Sprawdzenie kliknięcia w infoPoints
        const infoIntersects = raycaster.intersectObjects(infoPoints);
        if (infoIntersects.length > 0) {
            const point = infoIntersects[0].object;
            console.log('Trafiono infoPoint:', point.userData.infoPointName);
            const room = roomData[point.userData.infoPointName];

            if (room) {
                showRoomInfo(room, event.clientX, event.clientY);
            } else {
                console.log('Brak danych dla pokoju:', point.userData.infoPointName);
            }

            return;
        }

        const colorIntersects = raycaster.intersectObjects(colorChangePoints);
        if (colorIntersects.length > 0) {
            const point = colorIntersects[0].object;
            console.log('Trafiono colorChangePoint:', point.userData.colorPointName);

            // tutaj możesz np. wyświetlić panel zmiany koloru
            showColorChangePanel(point.userData.colorPointName, event.clientX, event.clientY, app);

            return;
        }

        // Jeśli nic nie trafiono
        hideRoomInfo();
        hideColorChangePanel();
    });
}


// Wyświetlanie informacji o pokoju
function showRoomInfo(room, x, y) {
    console.log('Próba wyświetlenia informacji:', room, x, y);
    
    if (!infoPanel) {
        console.error('Panel informacyjny nie istnieje!');
        return;
    }
    
    infoPanel.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">${room.name}</h3>
        <p style="margin: 0; font-size: 14px;">Powierzchnia: ${room.area}</p>
    `;
    
    infoPanel.style.left = `${x + 15}px`;
    infoPanel.style.top = `${y - 15}px`;
    infoPanel.style.display = 'block';
    console.log('Panel powinien być widoczny teraz:', infoPanel);
}

function showColorChangePanel(colorPointName, x, y, app) {
    if (!colorChangePanel) {
        console.error('Panel nie istnieje!');
        return;
    }

    colorChangePanel.innerHTML = `
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Zmień kolor ściany</h3>
        <div id="color-options" style="display: flex; gap: 10px; flex-wrap: wrap;"></div>
    `;

    const colorOptionsDiv = colorChangePanel.querySelector('#color-options');

    for (const [id, hex] of Object.entries(colors)) {
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
            changeWallColor(hex, app);
            // colorChangePanel.style.display = 'none';
        });

        colorOptionsDiv.appendChild(colorButton);
    }

    colorChangePanel.style.left = `${x + 15}px`;
    colorChangePanel.style.top = `${y - 15}px`;
    colorChangePanel.style.display = 'block';
    colorChangePanel.style.pointerEvents = 'auto';
}
let currentWallMaterialName = "Painted Plaster Wall";

// Funkcja pomocnicza do sprawdzania hierarchii obiektów
function shouldSkipObject(object) {
    let current = object;
    while (current) {
        // Sprawdź nazwę obiektu
        if (current.name && current.name.startsWith('NoColorChange_')) {
            return true;
        }
        // Sprawdź userData
        if (current.userData && current.userData.noColorChange) {
            return true;
        }
        current = current.parent;
    }
    return false;
}

function changeWallColor(hex, app) {
    const targetMaterialName = materialMap[hex];

    if (!targetMaterialName) {
        console.warn(`Brak przypisanego materiału dla koloru ${hex}`);
        return;
    }

    let newMaterial = null;

    // Szukamy materiału docelowego
    app.scene.traverse((object) => {
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
    app.scene.traverse((object) => {
        // Sprawdź czy obiekt lub jego rodzice mają oznaczenie NoColorChange
        if (shouldSkipObject(object)) {
            console.log(`Pominięto obiekt: ${object.name} (NoColorChange)`);
            return; 
        }
        
        if (object.isMesh && object.material) {
            let shouldReplace = false;

            if (Array.isArray(object.material)) {
                // Sprawdź każdy materiał w tablicy
                for (let i = 0; i < object.material.length; i++) {
                    const mat = object.material[i];
                    if (mat.name === currentWallMaterialName) {
                        // Zastąp tylko ten konkretny materiał w tablicy
                        object.material[i] = newMaterial;
                        shouldReplace = true;
                        console.log(`Zmieniono materiał w tablicy [${i}] na "${targetMaterialName}" w obiekcie "${object.name}"`);
                    }
                }
            } else {
                // Pojedynczy materiał
                if (object.material.name === currentWallMaterialName || object.material.name === targetMaterialName) {
                    object.material = newMaterial;
                    shouldReplace = true;
                    console.log(`Zmieniono materiał na "${targetMaterialName}" w obiekcie "${object.name}"`);
                }
            }
        }
    });

    // Zaktualizuj nazwę aktualnego materiału ściany
    currentWallMaterialName = targetMaterialName;

    app.needRender = true;
}


// Ukrywanie informacji o pokoju
function hideRoomInfo() {
    if (infoPanel) {
        infoPanel.style.display = 'none';
    }
}

function hideColorChangePanel() {
    if (colorChangePanel) {
        colorChangePanel.style.display = 'none';
    }
}

// Przełączanie widoczności punktów
function toggleInfoPoints(show) {
    infoPoints.forEach(point => {
        point.visible = show;
    });
}

function toggleColorPoints(show) {
    colorChangePoints.forEach(point => {
        point.visible = show;
    });
}


function runCode(app, puzzles) {
    // createCameraSwitchButton();
    // console.log("Dostępne materiały:", app.materials);

    // findInfoPoints(app);
    
    // // // Sprawdź aktualną kamerę i odpowiednio ustaw widoczność punktów
    // const currentCamera = app.camera?.name || '';


    // toggleInfoPoints(currentCamera === 'Camera(orbit)');
    // toggleColorPoints(currentCamera === 'Camera(orbit)')

}
export { createApp };