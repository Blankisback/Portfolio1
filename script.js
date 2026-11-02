import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- CONFIGURATION ---
const MODEL_PATH = './iphone16.glb';
const SCREEN_WIDTH = 390;
const SCREEN_HEIGHT = 844;

class Portfolio3D {
    constructor() {
        this.init();
        this.animate();
    }

    init() {
        // 1. Scene & Camera
        this.scene = new THREE.Scene();
        // Even closer zoom to ensure the phone fills the screen
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
        this.camera.position.set(0, 0, 1.1);

        // 2. WebGL Renderer (The Phone Body)
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0); // Set alpha to 0 so the CSS background shows through
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 3. CSS3D Renderer (The Interactive Screen)
        this.cssRenderer = new CSS3DRenderer();
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.domElement.style.position = 'absolute';
        this.cssRenderer.domElement.style.top = '0';
        this.cssRenderer.domElement.style.pointerEvents = 'auto';
        document.getElementById('css3d-container').appendChild(this.cssRenderer.domElement);

        // 4. Lighting
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 4);
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 4);
        dirLight.position.set(5, 5, 5);
        this.scene.add(dirLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, 2);
        this.scene.add(ambientLight);

        // 5. Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // 6. Load Model & Attach Screen
        const loader = new GLTFLoader();
        loader.load(MODEL_PATH, (gltf) => {
            if (document.getElementById('loader')) {
                document.getElementById('loader').style.display = 'none';
            }
            this.iphoneModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(this.iphoneModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const scaleFactor = 2 / size.y;
            this.iphoneModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

            const newBox = new THREE.Box3().setFromObject(this.iphoneModel);
            const newCenter = newBox.getCenter(new THREE.Vector3());
            this.iphoneModel.position.x = -newCenter.x;
            this.iphoneModel.position.y = -newCenter.y;
            this.iphoneModel.position.z = -newCenter.z;

            this.scene.add(this.iphoneModel);
            this.setupScreen(size, scaleFactor);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened loading the model:', error);
            if (document.getElementById('loader')) {
                document.getElementById('loader').textContent = 'Error loading 3D model.';
            }
        });

        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupScreen(modelSize, scale) {
        const templateElement = document.getElementById('portfolio-template');
        const screenDom = templateElement.firstElementChild.cloneNode(true);

        this.screenObject = new CSS3DObject(screenDom);

        const uniformScale = 0.001;
        this.screenObject.scale.set(uniformScale, uniformScale, uniformScale);

        // Adjust position to be exactly on the surface of the phone model
        // We move it slightly forward (z) to avoid z-fighting with the model's screen mesh
        this.screenObject.position.set(0, 0, 0.05);

        this.scene.add(this.screenObject);
        this.initUIEvents(screenDom);
    }

    initUIEvents(dom) {
        const menuItems = dom.querySelectorAll('.menu-item');

        // The overlay is INSIDE the cloned dom now, so we must find it there
        const overlay = dom.querySelector('#content-overlay');
        const overlayTitle = dom.querySelector('#overlay-title');
        const overlayBody = dom.querySelector('#overlay-body');
        const closeBtn = dom.querySelector('#close-overlay');

        const pageData = {
            about: { title: "About Me", body: "My name is Tom, I study at the university of hertfordshire and im currently doing cyber security." },
            hackathons: { title: "Hackathons", body: "In 2026, I attended OxHack, where I built a basic chatroom bot based in Webex (a cisco messenger app), this bot had access to openweatherapi which allowed me to request information about the weather and humidity from within the chatroom by using specialised commands" },
            projects: { title: "Projects", body: "I have worked on various projects, including chat bots, simulated networks, and web apps." },
            roblox: { title: "Roblox", body: "I have worked on creating scripts in roblox (written in LUA), One of my projects called 'Steal an Actor' allows users to purchase characters in game with my fake currency and store their items and attempt to steal from others, this game was entirely made around a backend database which stores each players items and progress." },
            contact: { title: "Contact", body: "My email: tomsaunders.http@gmail.com" }
        }; 

        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const page = item.getAttribute('data-page');
                const data = pageData[page];
                if (data) {
                    overlayTitle.textContent = data.title;
                    overlayBody.innerHTML = data.body;
                    overlay.classList.remove('hidden');
                    setTimeout(() => overlay.classList.add('active'), 10);
                }
            });
        });

        // Settings card event
        const settingsCard = dom.querySelector('.settings-card');
        settingsCard.addEventListener('click', (e) => {
            e.stopPropagation();

            // Check current theme state to set the checkbox correctly
            const currentTheme = document.body.getAttribute('data-theme');
            const isLight = currentTheme === 'light';

            overlayTitle.textContent = "Settings";
            overlayBody.innerHTML = `
                <div class="theme-toggle-container">
                    <span class="theme-toggle-label">Light Mode</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="theme-toggle" ${isLight ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </div>
            `;
            overlay.classList.remove('hidden');
            setTimeout(() => overlay.classList.add('active'), 10);

            // Add event listener to the newly created toggle
            setTimeout(() => {
                const toggle = dom.querySelector('#theme-toggle');
                if (toggle) {
                    toggle.addEventListener('change', (e) => {
                        const lightMode = e.target.checked;
                        const theme = lightMode ? 'light' : 'dark';

                        // Update the body (which controls overall CSS variables)
                        document.body.setAttribute('data-theme', theme);
                        // Update the screen DOM as well for redundancy
                        dom.setAttribute('data-theme', theme);
                    });
                }
            }, 50);
        });

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            overlay.classList.remove('active');
            setTimeout(() => overlay.classList.add('hidden'), 300);
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.cssRenderer.render(this.scene, this.camera);
    }
}

new Portfolio3D();
