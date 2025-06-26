import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/addons/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
//import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { Water } from 'three/addons/objects/Water2.js';
//import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { overlayTemplates } from './content.js';


// Create scene, camera, and renderer
const container = document.getElementById('scene-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xd1cebe );
let water;
const interactiveMeshes = [];

const focalLength = 34;
const sensorWidth = 36;
const fov = 2 * Math.atan((sensorWidth / 2) / focalLength) * (180 / Math.PI);
console.log("fov:", fov);

const aspect = 1152 / 896; // Match Blender aspect ratio
const near = 0.1;  // Blender's "Near" Clipping Plane
const far = 1000;  // Blender's "Far" Clipping Plane

const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(1152, 896);

container.appendChild(renderer.domElement);

// Position the camera
const blenderCameraPosition = { x: 16.415, y: -11.555, z: 1.6503 };

camera.position.set(
    blenderCameraPosition.x,
    blenderCameraPosition.z,  // Swap Y <-> Z
    -blenderCameraPosition.y  // Invert Y
);

const blenderRotation = { x: 100.66, y: -0.53256, z: 58.88 };
camera.rotation.set(
    THREE.MathUtils.degToRad(blenderRotation.x),
    THREE.MathUtils.degToRad(blenderRotation.z),  // Swap Y <-> Z
    -THREE.MathUtils.degToRad(blenderRotation.y)  // Invert Y
);

camera.lookAt(0, 5, 0);

const light = new THREE.AmbientLight( 0x404040, 0.3); // soft white light
scene.add( light );

//add cursor light
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let cursorLight = null;

// Max distance from camera to intersection point
const MAX_DISTANCE = 50;
// Distance along the surface normal from the intersection point
const NORMAL_OFFSET = 0.3;

cursorLight = new THREE.PointLight(0xffffff, 1, 5);
cursorLight.visible = false;
scene.add(cursorLight);

window.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
    const canvasBounds = renderer.domElement.getBoundingClientRect();

    // Get mouse position relative to canvas
    const x = event.clientX - canvasBounds.left;
    const y = event.clientY - canvasBounds.top;

    // Convert to normalized device coordinates (-1 to +1)
    mouse.x = (x / canvasBounds.width) * 2 - 1;
    mouse.y = -(y / canvasBounds.height) * 2 + 1;
}
const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 2,
    roughness: 0.2,
    metalness: 0.1,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false
});
const cursorMarker = new THREE.Mesh(markerGeometry, markerMaterial);
cursorMarker.visible = false;
scene.add(cursorMarker);

//top area light
//var width = 8;
//var height = 8;
//var intensity = 1;
//const rectLight = new THREE.RectAreaLight( 0xffffff, intensity,  width, height );
//rectLight.position.set( -15, 25, -7 );
//rectLight.lookAt( -15, 0, -7 );
//scene.add( rectLight )

//top2 area light
//width = 11;
//height = 4;
//intensity = 1;
//const rectLight2 = new THREE.RectAreaLight( 0xffffff, intensity,  width, height );
//rectLight2.position.set( -20, 23, -5 );
//rectLight2.lookAt( -15, 23, -5 );
//scene.add( rectLight2 )

//top3 area light
//width = 16;
//height = 4;
//intensity = 1;
//const rectLight3 = new THREE.RectAreaLight( 0xffffff, intensity,  width, height );
//rectLight3.position.set( -25, 10, -8 );
//rectLight3.lookAt( -15, 10, -8 );
//scene.add( rectLight3 )

//middle left area light
//width = 16;
//height = 10;
//intensity = 1;
//const rectLight4 = new THREE.RectAreaLight( 0xffffff, intensity,  width, height );
//rectLight4.position.set( -44, 3, 0 );
//rectLight4.lookAt( -15, -5, 0 );
//scene.add( rectLight4 )

//const rectLightHelper = new RectAreaLightHelper( rectLight4 );
//rectLight4.add( rectLightHelper );

scene.fog = new THREE.Fog( 0xe8e0bd, 12, 100 );


// Load GLTF Model
const loader = new GLTFLoader();
loader.load('assets/models/buildingOneMeshlowUV.glb', function (gltf) {
    const model = gltf.scene;
    model.scale.set(1, 1, 1);
    scene.add(model);

    // Define specific lightmaps and AO maps for each object
    const texturePaths = {
        "buildingLP": { lightmap: "assets/models/oneMesh_lightmap2k.exr", aoMap: "assets/models/oneMesh_AO2k.png" },
    };

    // Load textures asynchronously
    const textureLoader = new THREE.TextureLoader();
    const exrLoader = new EXRLoader();

    model.traverse((child) => {
        if (child.isMesh) {
            console.log(`Mesh detected: ${child.name}`);
            interactiveMeshes.push(child);

            // Ensure UV2 is set up
            if (child.geometry.attributes.uv1) {
                child.geometry.setAttribute('uv2', child.geometry.attributes.uv1.clone());
            } else {
                console.warn(`Mesh ${child.name} has no UV1!`);
            }

            // Check if this child has a specific lightmap & AO map
            if (texturePaths[child.name]) {
                const { lightmap, aoMap } = texturePaths[child.name];

                // Load Lightmap
                exrLoader.load(lightmap, function (loadedLightMap) {
                    loadedLightMap.flipY = true;
                    loadedLightMap.encoding = THREE.LinearEncoding;
                    child.material.lightMap = loadedLightMap;
                    child.material.lightMapIntensity = 2;
                    child.material.needsUpdate = true;
                });

                // Load AO Map
                textureLoader.load(aoMap, function (loadedAoMap) {
                    loadedAoMap.flipY = false;
                    child.material.aoMap = loadedAoMap;
                    child.material.aoMapIntensity = 1;
                    child.material.needsUpdate = true;
                });
            } else {
                console.warn(`No lightmap or AO map found for: ${child.name}`);
            }
        }
    });
render();
}, undefined, function (error) {
    console.error(error);
});

// water

const waterGeometry = new THREE.PlaneGeometry( 80, 80 );

water = new Water( waterGeometry, {
    color: 0x464a48,
    scale: 10,
    flowDirection: new THREE.Vector2( 0.1, 0.1 ),
    textureWidth: 1024,
    textureHeight: 1024
} );

water.material.transparent = true;

water.position.y = .1;
water.position.x = -15;
water.position.z = -15;
water.rotation.x = Math.PI * - 0.5;
scene.add( water );

//Text
const fontLoader = new TTFLoader();
//fontLoader.load( 'assets/fonts/PoiretOne-Regular.ttf', (res) => {
//    const font = new Font(res);
//    const props = {
//        font,
//        size: 1,
//        depth: 0.01,
//    };
//    const textGeo = new TextGeometry("Crafting Immersive Digital Worlds", props);
//  textGeo.computeBoundingBox();
//  const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
//  const textMat = new THREE.MeshBasicMaterial ({color: 0xffffff});
//  const textMesh = new THREE.Mesh(textGeo, textMat);
//  textMesh.position.x = centerOffset;
//  textMesh.position.set(-5,0.5,9);
//  textMesh.lookAt(2,0,15);
//  scene.add(textMesh);
//});
let text;
fontLoader.load( 'assets/fonts/PoiretOne-Regular.ttf', (res) => {
    const font = new Font(res);
    text = createText({ font, message: "Crafting Immersive Digital Worlds" });
    scene.add(text);
    animate();
});

render();

//const controls = new OrbitControls( camera, renderer.domElement );
//controls.addEventListener( 'change', render );
//controls.target.set( 0, 2, 0 );
//controls.update();

function render() {

    renderer.render( scene, camera );
}

// Adjust canvas size on window resize
window.addEventListener('resize', () => {
    const maxWidth = 1152;
    const minWidth = 320;

    const currentWidth = Math.min(maxWidth, Math.max(minWidth, container.clientWidth));
    renderer.setSize(currentWidth, currentWidth/aspect);
    render();
});

function animate(timeStep) {
    requestAnimationFrame(animate);
    text.userData.update(timeStep);

    updateCursorLight();

    renderer.render(scene, camera);
}
//animate();

// Text outline effect based on tutorial by Robot Bobby on Youtube: https://www.youtube.com/watch?v=a7qmBRAXqCY
function createOutlines({ font, message }) {
    const strokeGroup = new THREE.Group();
  
    let totalDist = 3.0;
    const lineMaterial = new LineMaterial({
      color: 0xffffff,
      linewidth: 1,
      dashed: true,
      dashSize: totalDist * 2,
      gapSize: totalDist * 2,
      dashOffset: Math.random() * totalDist,
    });
  
    function getStrokeMesh({ shape, i = 0.0, reverse = false }) {
        const points = shape.getPoints();
        if (reverse) {
            points.reverse();
          }
        const points3d = points.flatMap(p => [p.x, p.y, 0]);
      
        const lineGeo = new LineGeometry();
        lineGeo.setPositions(points3d);
      
        const localLineMaterial = lineMaterial.clone(); // Unique material per shape
      
        const totalDist = shape.getLength();
        localLineMaterial.dashSize = totalDist * 3;
        localLineMaterial.gapSize = totalDist * 2;
        localLineMaterial.dashOffset = Math.random() * totalDist;
      
        const strokeMesh = new Line2(lineGeo, localLineMaterial);
        strokeMesh.computeLineDistances();
      
        strokeMesh.userData.update = (t) => {
            const delay = i * 1;
            const localTime = Math.max(t - delay, 0);
            const speed = totalDist * 0.1;
            strokeMesh.material.dashOffset = -localTime * speed, totalDist * 2; // Adjust multiplier to tune speed
          };
        return strokeMesh;
      }
      
  
    const shapes = font.generateShapes(message, 1);
    shapes.forEach((s, i) => {
      strokeGroup.add(getStrokeMesh({ shape: s, i, reverse: false }));
  
      if (s.holes?.length > 0) {
        s.holes.forEach((h) => {
          strokeGroup.add(getStrokeMesh({ shape: h, i, reverse: true }));
        });
      }
    });
    strokeGroup.update = (t, i) => {
      strokeGroup.children.forEach((c) => {
        c.userData.update?.(t);
      });
    };
    return strokeGroup;
  }

  function createText({ font, message }) {
    const textGroup = new THREE.Group();
    const props = {
      font,
      size: 1,
      depth: 0.01,
      //curveSegments: 6,
      //bevelEnabled: true,
      //bevelThickness: 0.08,
      //bevelSize: 0.01,
      //bevelOffset: 0,
      //bevelSegments: 2,
    };
    const textGeo = new TextGeometry(message, props);
    textGeo.computeBoundingBox();
    const centerOffset = -0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
   // const glassMat = new THREE.MeshPhysicalMaterial({
    //  roughness: 0.5,
    //  transmission: 0.7,
    //  transparent: true,
    //  thickness: 1.0,
    //});
    const fastTransparentMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
      });
    const textMesh = new THREE.Mesh(textGeo, fastTransparentMat);
    textMesh.position.x = centerOffset;
    textMesh.position.set(-5,0.5,9);
    textMesh.lookAt(2,0,15);
    textGroup.add(textMesh);
  
    const outlineText = createOutlines({ font, message });
    outlineText.position.set(centerOffset, 0, 0.2);
    outlineText.position.set(-5,0.5,9);
    outlineText.lookAt(2,0,15);
    textGroup.add(outlineText);
  
    textGroup.userData.update = (t) => {
      let timeStep = t * 0.005;
      outlineText.update(timeStep);
    };
    return textGroup;
  }

  function updateCursorLight() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveMeshes, true); // true = check children

    if (intersects.length > 0) {
        const intersect = intersects[0];
        const point = intersect.point.clone();
        const normal = intersect.face.normal.clone();
        const object = intersect.object;

        normal.transformDirection(object.matrixWorld);
        const cameraToPoint = camera.position.distanceTo(point);
        let offsetPosition;

        if (cameraToPoint <= MAX_DISTANCE) {
            offsetPosition = point.clone().add(normal.multiplyScalar(NORMAL_OFFSET));
        } else {
            const direction = raycaster.ray.direction.clone().normalize();
            offsetPosition = camera.position.clone().add(direction.multiplyScalar(MAX_DISTANCE));
        }

        cursorLight.position.copy(offsetPosition);
        cursorLight.visible = true;

        cursorMarker.position.copy(offsetPosition);
        cursorMarker.visible = true;

    } else {
        cursorLight.visible = false;
        cursorMarker.visible = false;
    }
}

  function showProjectDetails(projectName) {
    const overlay = document.getElementById(projectName);
    const contentDiv = document.getElementById(projectName + "Content");

    if (!contentDiv.innerHTML) {
        contentDiv.innerHTML = overlayTemplates[projectName];
    }

    const projectsSection = document.getElementById('projects');
    const projectsTop = projectsSection.offsetTop;

    overlay.style.top = projectsTop + 'px';
    overlay.classList.remove('hidden');

    // Wait for all images inside the overlay to load
    const images = overlay.querySelectorAll('img');
    let imagesLoaded = 0;

    if (images.length === 0) {
        applyOverlayHeight();
    } else {
        images.forEach((img) => {
            if (img.complete) {
                imagesLoaded++;
                if (imagesLoaded === images.length) {
                    applyOverlayHeight();
                }
            } else {
                img.addEventListener('load', () => {
                    imagesLoaded++;
                    if (imagesLoaded === images.length) {
                        applyOverlayHeight();
                    }
                });
                img.addEventListener('error', () => {
                    imagesLoaded++;
                    if (imagesLoaded === images.length) {
                        applyOverlayHeight();
                    }
                });
            }
        });
    }

    if (projectsSection) {
        projectsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function applyOverlayHeight() {
        const docHeight = Math.max(
            document.body.scrollHeight,
            document.documentElement.scrollHeight,
            document.body.offsetHeight,
            document.documentElement.offsetHeight,
            document.body.clientHeight,
            document.documentElement.clientHeight
        );
        overlay.style.height = (docHeight - window.innerHeight / 2) + 'px';
        overlay.style.overflow = 'visible';
    }
}

window.showProjectDetails = showProjectDetails;

function hideProjectDetails(projectName) {
    document.getElementById(projectName).classList.add('hidden');
    const overlay = document.getElementById(projectName);
    overlay.style.height = '';

    const contentDiv = document.getElementById(projectName + "Content");
    if (contentDiv) contentDiv.innerHTML = '';
}
window.hideProjectDetails = hideProjectDetails;

function closeAllOverlays() {
    const overlays = document.querySelectorAll('.project-overlay');
    overlays.forEach(overlay => {
        overlay.classList.add('hidden');
        overlay.style.height = '';

        const contentDiv = overlay.querySelector('[id$="Content"]');
        if (contentDiv) contentDiv.innerHTML = '';
    });
}
window.closeAllOverlays = closeAllOverlays;
