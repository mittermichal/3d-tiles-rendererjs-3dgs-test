import { Scene, PerspectiveCamera, WebGLRenderer, Vector3, Matrix4 } from 'three';
import { TilesRenderer } from '3d-tiles-renderer';
import { GaussianSplatPlugin } from '3d-tiles-rendererjs-3dgs-plugin';
import { CesiumIonAuthPlugin } from "3d-tiles-renderer/plugins";
import Stats from "stats.js/src/Stats";
import { GUI } from 'lil-gui';
import { CameraController } from './CameraController';

const renderer = new WebGLRenderer({ antialias: false });
const scene = new Scene();
const camera = new PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    10000,
);

const IonAssetID = import.meta.env.VITE_ION_ASSET_ID;
const IonAccessToken = import.meta.env.VITE_ION_ACCESS_TOKEN;
const localURL = import.meta.env.VITE_LOCAL_URL;

console.log(IonAccessToken, IonAssetID);

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new CameraController(camera, renderer.domElement);
controls.moveSpeed = 0.06;
controls.lookSpeed = 0.3 * Math.PI / 180;

const tiles = localURL ? new TilesRenderer(localURL) : new TilesRenderer();
tiles.setCamera(camera);
tiles.setResolutionFromRenderer(camera, renderer);
if (!localURL) {
    tiles.registerPlugin( new CesiumIonAuthPlugin( {
        apiToken: IonAccessToken,
        assetId: IonAssetID,
        autoRefreshToken: true,
    } ) );
}
tiles.registerPlugin(
    new GaussianSplatPlugin({
        renderer,
        scene,
        minRaycastOpacity: 0.1,
        sparkRendererOptions: {
            // Optional: the plugin already defaults this to 2.
            focalAdjustment: 2,
        },
    }),
);

scene.add(tiles.group);

tiles.addEventListener('load-tileset', () => {

});

camera.position.set(5790568.42458594, 2107594.5460310197, 1640101.5119368308);
const localUp = camera.position.clone().normalize();
camera.up.copy( localUp );
const lookTarget = camera.position.clone().add(
    new Vector3( 0, 0, 1 ) // A reference vector to find a tangent
        .projectOnPlane( localUp )
        .normalize()
);
camera.lookAt( lookTarget );
camera.updateMatrixWorld();

let lastFrameTime = performance.now();

var stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );


const gui = new GUI();
const params = {
    turnRate: 0,
    errorTarget: 16,
    visible: true,
    rotate180: () => {
        const localUp = camera.position.clone().normalize();
        const rotationMatrix = new Matrix4().makeRotationAxis(localUp, Math.PI);

        // Get current look direction
        const lookDirection = new Vector3();
        camera.getWorldDirection(lookDirection);

        // Apply rotation to look direction
        lookDirection.applyMatrix4(rotationMatrix);

        // Update camera target
        const newTarget = camera.position.clone().add(lookDirection);
        camera.lookAt(newTarget);
        camera.updateMatrixWorld();
    },
    stopTurning: () => {
        params.turnRate = 0;
    }
};
gui.add(params, 'rotate180').name('Rotate 180°');
gui.add(params, 'stopTurning').name('Stop turning');
gui.add(params, 'turnRate', -4, 4, 0.01).name('Auto Turn Rate');
gui.add(params, 'visible').name('Show 3DGS').onChange((value) => {
    tiles.group.visible = value;
});
gui.add( params, 'errorTarget', 0, 1024 );


function frame() {
    stats.begin();
    tiles.update();

    // Calculate delta time
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    controls.update(deltaTime);
    tiles.errorTarget = params.errorTarget;
    renderer.render(scene, camera);
    stats.end();
    requestAnimationFrame(frame);
}

frame();