import 'regenerator-runtime/runtime';
import * as faceRepresentationPipeline from "./pipelines/face-representation-pipeline";
import * as representationGazePipeline from "./pipelines/representation-gaze-pipeline"
import { PredictionController } from "./controllers/prediction-controller";
import { GUI } from "dat.gui";
import Stats from "stats.js";
import * as tf from '@tensorflow/tfjs';
import {FaceRepresentationPipeline} from "./pipelines/face-representation-pipeline";
import {CalibrationController} from "./controllers/calibration-controller";
import {CalibrationRenderer} from "./renderers/calibration-renderer";
import {RepresentationGazePipeline} from "./pipelines/representation-gaze-pipeline";
import {RepresentationGazeDatasetGenerator} from "./pipelines/representation-gaze-dataset-generator";
import {PredictionRenderer} from "./renderers/prediction-renderer";
import {GameController} from "./controllers/game-controller";
import {GameRenderer} from "./renderers/game-renderer";

const screenPos: Array<[number, number]> = [
    [0.5, 0.1],
    [0.5, 0.9],
];

export class Main {
    // HTML Elements
    private mainElement: HTMLElement;
    private video: HTMLVideoElement;
    private faceCanvas: HTMLCanvasElement;
    private gazeCanvas: HTMLCanvasElement;
    // Renderers
    private predictionController: PredictionController;
    private calibrationController: CalibrationController;
    private gameController: GameController;
    // Controllers
    private stats = new Stats();
    private gui = new GUI();
    // Application State
    private state = { maxFaces: 1, mode: 'train' };
    // Models
    private faceRepresentationPipeline: FaceRepresentationPipeline;
    private representationGazePipeline1: RepresentationGazePipeline;
    private videoWidth = 224;
    private videoHeight = 224;

    constructor() {
        // Common Components
        this.mainElement = document.getElementById('main');
        // Prediction Components
        this.video = <HTMLVideoElement>document.getElementById('video');
        this.faceCanvas = <HTMLCanvasElement>document.getElementById('face-output');
        // Gaze Components
        this.gazeCanvas = <HTMLCanvasElement>document.getElementById("gaze-output");

        this.gazeCanvas.width = document.body.clientWidth;
        this.gazeCanvas.height = document.body.clientHeight;
        // Controllers
        this.predictionController = new PredictionController(this.video, this.stats, new PredictionRenderer(this.gazeCanvas, screenPos));
        this.calibrationController = new CalibrationController(this.video, this.stats, new CalibrationRenderer(this.gazeCanvas, screenPos));
        console.log(this.gazeCanvas.height);
        console.log(this.gazeCanvas.width);
        this.gameController = new GameController(new GameRenderer(this.gazeCanvas));
    }

    private async start(mode: string) {
        if (mode == 'predict') {
            console.log("predicting");
            // await this.representationGazePipeline1.load();
            // Update attributes
            this.faceCanvas.hidden = false;
            // Logic
            await this.calibrationController.stop();
            await this.predictionController.start(this.gameController);
        }
        else {
            // Logic
            tf.engine().startScope()
            console.log("Calibrating");
            this.predictionController.stop();
            await this.calibrationController.start(async (r: RepresentationGazeDatasetGenerator) => {
                const data: [tf.Tensor, tf.Tensor] = r.getData();
                console.log(data[0].shape);
                const history = await this.representationGazePipeline1.train(data[0], data[1])
                console.log(history);
                console.log("Training");
                await this.start("predict");
                await this.representationGazePipeline1.save();
                r.freeData();
                tf.engine().endScope();
            });
            // await this.calibrationRenderer.startRender(this.stats, this.model, this.video);
            // this.calibrationRenderer.startCalibration(async () => {
            //     console.log("training");
            //     const trainingData = this.datasetController.getTrainingTensors();
            //     await this.gazeModel.fit(trainingData[0], trainingData[1]);
            //     console.log("training completed");
            //     this.state.mode = "predict";
            //     this.start("predict");
            // });
        }
    }

    private isMobile() {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        return isAndroid || isiOS;
    }

    private async setupCamera() {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                deviceId: '463c9125011ecfedab1a2cf9b33046959ccc8ab3b1821a94c16f9151d8315ab5',
                facingMode: 'user',
                width: this.videoWidth,
                height: this.videoHeight
            },
        });
        this.video.srcObject = stream;
        await new Promise((resolve) => {
            this.video.onloadedmetadata = () => {
                this.video.width = this.videoWidth;
                this.video.height = this.videoHeight;
                this.faceCanvas.width = this.videoWidth;
                this.faceCanvas.height = this.videoHeight;
                resolve();
            };
        });
    }

    private async setupDatGUI() {
        this.gui.add(this.state, 'maxFaces', 1, 20, 1).onChange(async (val) => {
            this.faceRepresentationPipeline = await faceRepresentationPipeline.load({ maxFaces: val });
            this.predictionController.setFaceRepresentationPipeline(this.faceRepresentationPipeline);
        });
        this.gui.add(this.state, 'mode', ['predict', 'train']).onChange(mode => {
            this.start(mode);
        });
        this.gui.show();
        this.mainElement.appendChild(this.stats.dom);
    }

    private async setupStatsGUI() {
        this.stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
    }

    public async run() {
        await tf.setBackend("webgl");
        await this.setupDatGUI();
        await this.setupStatsGUI();
        await this.setupCamera();
        this.faceRepresentationPipeline = await faceRepresentationPipeline.load({ maxFaces: this.state.maxFaces});
        this.representationGazePipeline1 = await representationGazePipeline.load();
        this.predictionController.setFaceRepresentationPipeline(this.faceRepresentationPipeline);
        this.predictionController.setRepresentationGazePipeline(this.representationGazePipeline1);
        this.calibrationController.setFaceRepresentationPipeline(this.faceRepresentationPipeline);
        this.start(this.state.mode);
    }
}

new Main().run();