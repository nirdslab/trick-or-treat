import 'regenerator-runtime/runtime';
import { DatasetController } from "./dataset-controller";
import * as facegaze from "./facegaze/facegaze";
import * as facemesh from "./facemesh/facemesh";
import { CalibrationRenderer } from "./renderers/calibration-renderer";
import { PredictionRenderer } from "./renderers/prediction-renderer";
import { GUI } from 'dat.gui';
import Stats from 'stats.js';
import * as tf from '@tensorflow/tfjs';

export class Main {
  // HTML Elements
  private mainElement: HTMLElement;
  private video: HTMLVideoElement;
  private faceCanvas: HTMLCanvasElement;
  private gazeCanvas: HTMLCanvasElement;
  // Renderers
  private predictionRenderer: PredictionRenderer;
  private calibrationRenderer: CalibrationRenderer;
  // Controllers
  private datasetController: DatasetController;
  private stats = new Stats();
  private gui = new GUI();
  // Application State
  private state = { maxFaces: 1, mode: 'predict' };
  // Models
  private model: facemesh.FaceMesh;
  private gazeModel: facegaze.FaceGaze;
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
    // Renderers
    this.datasetController = new DatasetController();
    this.predictionRenderer = new PredictionRenderer(this.video, this.faceCanvas, this.gazeCanvas);
    this.calibrationRenderer = new CalibrationRenderer(this.gazeCanvas, this.datasetController);
  }

  private async start(mode: string) {
    if (mode == 'predict') {
      console.log("predicting");
      // Update attributes
      this.gui.show();
      this.mainElement.appendChild(this.stats.dom);
      this.gui.updateDisplay();
      this.faceCanvas.hidden = false;
      // Logic
      this.calibrationRenderer.stopCalibration();
      this.calibrationRenderer.stopRender();
      await this.predictionRenderer.startRender(this.stats, [this.model, this.gazeModel], this.video, this.state);
    }
    else {
      console.log('calibrating');
      // Update attributes
      this.gui.hide();
      this.mainElement.removeChild(this.stats.dom);
      this.faceCanvas.hidden = true;
      // Logic
      this.predictionRenderer.stopRender();
      await this.calibrationRenderer.startRender(this.stats, this.model, this.video, this.state);
      this.calibrationRenderer.startCalibration(async () => {
        console.log("training");
        const trainingData = this.datasetController.getTrainingTensors();
        await this.gazeModel.fit(trainingData[0], trainingData[1]);
        console.log("training completed");
        this.state.mode = "predict";
        this.start("predict");
      });
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
      this.model = await facemesh.load({ maxFaces: val })
    });
    this.gui.add(this.state, 'mode', ['predict', 'train']).onChange(mode => {
      this.start(mode);
    });
    this.gui.hide();
  }

  private async setupStatsGUI() {
    this.stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  }

  public async run() {
    await tf.setBackend("webgl");
    await this.setupDatGUI();
    await this.setupStatsGUI();
    await this.setupCamera();
    this.model = await facemesh.load({ maxFaces: this.state.maxFaces });
    this.gazeModel = await facegaze.load();
    this.start(this.state.mode);
  }
}

new Main().run();