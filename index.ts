import * as facemesh from './facemesh/facemesh';
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import * as tf from '@tensorflow/tfjs';
import * as facegaze from './facegaze';
import 'regenerator-runtime/runtime';
import { Renderer } from "./renderer";
import { DatasetController } from "./dataset-controller";
import {CalibrationRenderer} from "./calibration-renderer";
import {FaceGaze} from "./facegaze";

function isMobile() {
	const isAndroid = /Android/i.test(navigator.userAgent);
	const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
	return isAndroid || isiOS;
}

let renderer: Renderer;
let calibrationRenderer: CalibrationRenderer;
let datasetController: DatasetController;
let requestId: number;
let model: facemesh.FaceMesh;
let gazeModel: facegaze.FaceGaze;
let videoWidth: number;
let videoHeight: number;
let video: HTMLVideoElement;
let canvas: HTMLCanvasElement;
let calibrationCanvas: HTMLCanvasElement;

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

	gui.add(state, 'maxFaces', 1, 20, 1).onChange(async val => model = await facemesh.load({ maxFaces: val }));
	gui.add(state, 'predictIrises');

	gui.add(state, 'mode', ['predict', 'train']).onChange(mode => {
		start(mode);
		// if(mode == 'train'){
		// 	datasetController.addTrainingSample(tf.tensor2d([[1, 2, 3]]), tf.tensor1d([4, 5]));
		// }
	});
}

async function setupCamera() {
	video = <HTMLVideoElement>document.getElementById('video');

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

async function predictRender() {
	stats.begin();

	const returnTensors = false;
	const flipHorizontal = false;

	const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, state.predictIrises);
	const predictionMeshes = predictions.map(p => p.scaledMesh);
	const gazePoints = gazeModel.estimateGaze(predictionMeshes);

	console.log(gazePoints);

	renderer.renderPrediction(predictions);

	stats.end();
	requestId = requestAnimationFrame(predictRender);
}

async function calibrateRender(){

	stats.begin();

	const returnTensors = false;
	const flipHorizontal = false;

	const predictions = await model.estimateFaces(video, returnTensors, flipHorizontal, state.predictIrises);

	if(calibrationRenderer.getCurrent()){
		const meshes = predictions.map(p => p.scaledMesh);
		const current = calibrationRenderer.getCurrent();
		requestId = requestAnimationFrame(calibrateRender);
		requestId = requestAnimationFrame(calibrateRender);
	}

	stats.end();

}


async function start(mode: string) {

	if (requestId) {
		cancelAnimationFrame(requestId);

		console.log("cancelling request id "+ requestId);
	}

	if (mode == 'predict') {

		document.getElementById("training").style.display = "none";
		document.getElementById("prediction").style.display = "block";

		const canvasContainer = document.querySelector('.canvas-wrapper');

		canvasContainer.setAttribute('style', `width: ${videoWidth}px; height: ${videoHeight}px`);

		await predictRender();
	}
	else {
		console.log('training');

		calibrationRenderer.startRender();

		await calibrateRender();

		document.getElementById("training").style.display = "block";
		document.getElementById("prediction").style.display = "none";
	}

}

async function main() {
	await tf.setBackend(state.backend);
	setupDatGui();

	stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
	document.getElementById('main').appendChild(stats.dom);

	await setupCamera();
	video.play();

	canvas = <HTMLCanvasElement>document.getElementById('output');

	calibrationCanvas = <HTMLCanvasElement>document.getElementById("calibration-canvas")

	renderer = new Renderer(video, canvas)

	calibrationRenderer = new CalibrationRenderer(calibrationCanvas);

	datasetController = new DatasetController();

	model = await facemesh.load({ maxFaces: state.maxFaces });

	gazeModel =  new FaceGaze();

	start(state.mode);

}

main();