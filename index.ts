import * as facemesh from './facemesh/facemesh';
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import * as tf from '@tensorflow/tfjs';
import * as facegaze from './facegaze';
import 'regenerator-runtime/runtime';
import { Renderer } from "./renderer";
import { DatasetController } from "./dataset-controller";

function isMobile() {
	const isAndroid = /Android/i.test(navigator.userAgent);
	const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
	return isAndroid || isiOS;
}

let datasetController: DatasetController;
let requestId: number;
let model: facemesh.FaceMesh;
let gazeModel: facegaze.FaceGaze;
let videoWidth: number;
let videoHeight: number;
let video: HTMLVideoElement;
let canvas: HTMLCanvasElement;
let renderer: Renderer;

const VIDEO_SIZE = 500;
const mobile = isMobile();
// Don't render the point cloud on mobile in order to maximize performance and
// to avoid crowding limited screen space.
const stats = new Stats();
const state = {
	backend: 'webgl',
	maxFaces: 1,
	predictIrises: true,
	mode: 'predict'
};

function setupDatGui() {
	const gui = new dat.GUI();
	gui.add(state, 'backend', ['webgl', 'cpu'])
		.onChange(async backend => await tf.setBackend(backend));

	gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => model = await facemesh.load({ maxFaces: val }));
	gui.add(state, 'predictIrises');

	gui.add(state, 'mode', ['predict', 'train']).onChange(mode => {
		start(mode);
		// if(mode == 'train'){
		// 	datasetController.addTrainingSample(tf.tensor2d([[1, 2, 3]]), tf.tensor1d([4, 5]));
		// }
	});
}

async function setupCamera(): Promise<HTMLVideoElement> {
	let video = <HTMLVideoElement>document.getElementById('video');

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

async function setupCanvas() {
	canvas = <HTMLCanvasElement>document.getElementById('output');
	renderer = new Renderer(video, canvas)
}

async function setupStats() {
	stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
	document.getElementById('main').appendChild(stats.dom);
}

async function setupModels() {
	model = await facemesh.load({ maxFaces: state.maxFaces });
	gazeModel = new facegaze.FaceGaze();
}

async function startPredictionLoop() {
	stats.begin();

	const returnTensors = false;
	const flipHorizontal = false;

	const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, state.predictIrises);
	if (predictions.length > 0) {
		const gazePredictions = gazeModel.estimateGaze(predictions.map(p => p.scaledMesh));
		console.log(gazePredictions);
	}

	renderer.renderPrediction(predictions);

	stats.end();
	requestId = requestAnimationFrame(startPredictionLoop);
}

async function main() {
	await tf.setBackend(state.backend);
	setupDatGui();
	setupStats();
	await setupModels();
	video = await setupCamera();
	await setupCanvas();
	video.play();
	start(state.mode);
}

async function start(mode: string = state.mode) {

	if (requestId) {
		cancelAnimationFrame(requestId);
	}

	if (mode == 'predict') {
		const canvasContainer = document.querySelector('.canvas-wrapper');
		canvasContainer.setAttribute('style', `width: ${videoWidth}px; height: ${videoHeight}px`);
		startPredictionLoop();
	}
	else {
		console.log('training');
	}

}
main();