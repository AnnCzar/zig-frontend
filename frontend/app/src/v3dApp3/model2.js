/* __V3D_TEMPLATE__ - template-based file; delete this line to prevent this file from being updated */
// import v3d from "./v3d.js";
'use strict';
import * as v3d from 'verge3d';
// window.addEventListener('load', e => {
//     const params = v3d.AppUtils.getPageParams();
//     createApp({
//         containerId: 'v3d-container',
//         fsButtonId: 'fullscreen-button',
//         sceneURL: params.load || 'model2.gltf',
//         logicURL: params.logic || 'visual_logic.js',
//     });
// });


// Tablica punktów informacyjnych i panel informacyjny
let infoPoints = [];
let infoPanel = null;

// Dane o pokojach (dostosuj do swoich potrzeb)
const roomData = {
    'InfoPoint_kitchen': { name: 'Kuchnia z salonem', area: '28.0 m²' },
    'InfoPoint_hall': { name: 'Przedpokój', area: '12.5 m²' },
    'InfoPoint_balcony': { name: 'Balkon', area: '39.0 m²' },
    'InfoPoint_bathroom': { name: 'Łazienka', area: '9.8 m²' },
    'InfoPoint_room1': { name: 'Pokój', area: '17.5 m²' },
};

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
            console.log(`Switched to ${nextCamera} and reset to default position/rotation`);
        } else {
            console.warn(`Camera ${nextCamera} not found in the scene`);
        }
    });

    
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
    
    // Wyszukaj wszystkie obiekty których nazwa zaczyna się od "InfoPoint_"
    app.scene.traverse((object) => {
        if (object.name.startsWith('InfoPoint_')) {
            console.log(`Znaleziono punkt informacyjny: ${object.name}`);
            
            // Dodaj widoczny wskaźnik
            const geometry = new v3d.SphereGeometry(0.1, 16, 16);
            const material = new v3d.MeshBasicMaterial({ 
                color: 0xffffff, 
                opacity: 0.7,

            });
            const indicator = new v3d.Mesh(geometry, material);
            
            // Umieść wskaźnik dokładnie w miejscu pustego obiektu
            indicator.position.copy(object.position);
            indicator.quaternion.copy(object.quaternion);
            indicator.scale.copy(object.scale);
            
// Ważne ustawienia dla wykrywania kolizji
            indicator.userData.infoPointName = object.name;
            indicator.visible = true;
            indicator.renderOrder = 999; // Wysoki priorytet renderowania

             // Upewnij się, że obiekt ma ustawioną właściwość "matrixWorldNeedsUpdate"
            indicator.matrixWorldNeedsUpdate = true;
            
            
            app.scene.add(indicator);
            infoPoints.push(indicator);
        }
    });
    
    // Utwórz panel informacyjny i skonfiguruj wykrywanie kliknięć
    createInfoPanel(app);
    setupClickDetection(app);
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

// Konfiguracja wykrywania kliknięć
function setupClickDetection(app) {
    const raycaster = new v3d.Raycaster();
    const mouse = new v3d.Vector2();
    
    const container = document.getElementById('v3d-container');
    if (container) {
        container.addEventListener('click', (event) => {
            console.log('Kliknięcie wykryte');
            
            // Oblicz pozycję myszy
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
            console.log('Pozycja myszy:', mouse.x, mouse.y);
            
            // Aktualizuj raycaster
            raycaster.setFromCamera(mouse, app.camera);
            
            // Sprawdź przecięcia z punktami
            const intersects = raycaster.intersectObjects(infoPoints);
            console.log('Liczba przecięć:', intersects.length);
            
            if (intersects.length > 0) {
                console.log('Trafiono punkt:', intersects[0].object.userData.infoPointName);
                const infoPointName = intersects[0].object.userData.infoPointName;
                const room = roomData[infoPointName];
                
                if (room) {
                    showRoomInfo(room, event.clientX, event.clientY);
                } else {
                    console.log('Brak danych dla pokoju:', infoPointName);
                }
            } else {
                hideRoomInfo();
            }
        });
    } else {
        console.error('Nie znaleziono kontenera:', app._container);
    }
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


// Ukrywanie informacji o pokoju
function hideRoomInfo() {
    if (infoPanel) {
        infoPanel.style.display = 'none';
    }
}

// Przełączanie widoczności punktów
function toggleInfoPoints(show) {
    infoPoints.forEach(point => {
        point.visible = show;
    });
}


function runCode(app, puzzles) {
    // add your code here, e.g. console.log('Hello, World!');
    // createCameraSwitchButton();
    //
    // // Inicjalizacja punktów informacyjnych
    // findInfoPoints(app);
    //
    // // Sprawdź aktualną kamerę i odpowiednio ustaw widoczność punktów
    // const currentCamera = app.camera?.name || '';
    // toggleInfoPoints(currentCamera === 'Camera(orbit)');
}
export { createApp };