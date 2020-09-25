import * as facemesh from './facemesh/facemesh';
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import { ScatterGL } from 'scatter-gl';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import '@tensorflow/tfjs-backend-cpu';
import 'regenerator-runtime/runtime';

const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const RED = "#FF2C35";
const GREEN = '#32EEDB';
const BLUE = "#157AB3";

function isMobile() {
	const isAndroid = /Android/i.test(navigator.userAgent);
	const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
	return isAndroid || isiOS;
}

let model, ctx, videoWidth, videoHeight, video, canvas, scatterGLHasInitialized = false, scatterGL;

const VIDEO_SIZE = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const stats = new Stats();
const state = {
	backend: 'webgl',
	maxFaces: 1,
	predictIrises: true,
	renderPointcloud: mobile === false
};

function setupDatGui() {
	const gui = new dat.GUI();
	gui.add(state, 'backend', ['webgl', 'cpu'])
		.onChange(async backend => {
			await tf.setBackend(backend);
		});

	gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => {
		model = await facemesh.load({ maxFaces: val });
	});
	gui.add(state, 'predictIrises');

	if (mobile === false) {
		gui.add(state, 'renderPointcloud').onChange(render => {
			document.querySelector('#scatter-gl-container').setAttribute('style', `display: ${render ? 'inline-block' : 'none'}`);
		});
	}
}

function distance(a, b) {
	return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

async function setupCamera() {
	video = document.getElementById('video');

	const stream = await navigator.mediaDevices.getUserMedia({
		'audio': false,
		'video': {
			facingMode: 'user',
			// Only setting the video to a specified size in order to accommodate a
			// point cloud, so on mobile devices accept the default size.
			width: mobile ? undefined : VIDEO_SIZE,
			height: mobile ? undefined : VIDEO_SIZE
		},
	});
	video.srcObject = stream;

	return new Promise((resolve) => {
		video.onloadedmetadata = () => {
			resolve(video);
		};
	});
}

async function renderPrediction() {
	stats.begin();

	const returnTensors = false;
	const flipHorizontal = false;
	const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, state.predictIrises);
	ctx.drawImage(
		video, 0, 0, videoWidth, videoHeight, 0, 0, canvas.width, canvas.height);

	if (predictions.length > 0) {
		predictions.forEach(prediction => {

			const keypoints = prediction.scaledMesh;

			ctx.fillStyle = GREEN;
			for (let i = 0; i < NUM_KEYPOINTS; i++) {
				const x = keypoints[i][0];
				const y = keypoints[i][1];

				ctx.beginPath();
				const radius = 1;
				ctx.arc(x, y, radius, 0, 2 * Math.PI);
				ctx.fill();
			}

			if (keypoints.length > NUM_KEYPOINTS) {
				ctx.strokeStyle = RED;
				ctx.lineWidth = 1;

				const leftCenter = keypoints[NUM_KEYPOINTS];
				const leftDiameterY = distance(
					keypoints[NUM_KEYPOINTS + 4],
					keypoints[NUM_KEYPOINTS + 2]);
				const leftDiameterX = distance(
					keypoints[NUM_KEYPOINTS + 3],
					keypoints[NUM_KEYPOINTS + 1]);

				ctx.beginPath();
				ctx.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
				ctx.stroke();

				if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
					const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
					const rightDiameterY = distance(
						keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
						keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
					const rightDiameterX = distance(
						keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
						keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

					ctx.beginPath();
					ctx.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
					ctx.stroke();
				}
			}

		});

		if (mobile === false && state.renderPointcloud && scatterGL != null) {
			const pointsData = predictions.map(prediction => {
				let scaledMesh = prediction.scaledMesh;
				return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
			});

			let flattenedPointsData = [];
			for (let i = 0; i < pointsData.length; i++) {
				flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
			}
			const dataset = new ScatterGL.Dataset(flattenedPointsData);

			if (!scatterGLHasInitialized) {
				scatterGL.setPointColorer((i) => {
					if (i >= NUM_KEYPOINTS) {
						return RED;
					}
					return BLUE;
				});
				scatterGL.render(dataset);
			} else {
				scatterGL.updateDataset(dataset);
			}
			scatterGLHasInitialized = true;
		}
	}

	stats.end();
	requestAnimationFrame(renderPrediction);
};

async function main() {
	await tf.setBackend(state.backend);
	setupDatGui();

	stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
	document.getElementById('main').appendChild(stats.dom);

	await setupCamera();
	video.play();
	videoWidth = video.videoWidth;
	videoHeight = video.videoHeight;
	video.width = videoWidth;
	video.height = videoHeight;

	canvas = document.getElementById('output');
	canvas.width = videoWidth;
	canvas.height = videoHeight;
	const canvasContainer = document.querySelector('.canvas-wrapper');
	canvasContainer.setAttribute('style', `width: ${videoWidth}px; height: ${videoHeight}px`);

	ctx = canvas.getContext('2d');
	ctx.translate(canvas.width, 0);
	ctx.scale(-1, 1);
	ctx.fillStyle = '#32EEDB';
	ctx.strokeStyle = '#32EEDB';
	ctx.lineWidth = 0.5;

	model = await facemesh.load({ maxFaces: state.maxFaces });
	renderPrediction();

	if (mobile === false) {
		const scatterGlContainer = <HTMLElement>document.querySelector('#scatter-gl-container');
		scatterGlContainer.setAttribute('style', `width: ${VIDEO_SIZE}px; height: ${VIDEO_SIZE}px;`);
		scatterGL = new ScatterGL(scatterGlContainer, { 'rotateOnStart': false, 'selectEnabled': false });
	}
};

main();