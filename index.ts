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
  private canvas: HTMLCanvasElement;
  private calibrationCanvas: HTMLCanvasElement;
  // Renderers
  private predictionRenderer: PredictionRenderer;
  private calibrationRenderer: CalibrationRenderer;
  // Controllers
  private datasetController: DatasetController;
  private stats = new Stats();
  private gui = new GUI();
  // Application State
  private state = { backend: 'webgl', maxFaces: 1, predictIrises: true, mode: 'predict' };
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
    this.canvas = <HTMLCanvasElement>document.getElementById('output');
    this.predictionRenderer = new PredictionRenderer(this.video, this.canvas);
    // Calibration Components
    this.datasetController = new DatasetController();
    this.calibrationCanvas = <HTMLCanvasElement>document.getElementById("calibration-canvas");
    this.calibrationRenderer = new CalibrationRenderer(this.calibrationCanvas, this.datasetController);
  }

  private async start(mode: string) {
    if (mode == 'predict') {
      console.log("predicting");
      document.getElementById("training").style.display = "none";
      document.getElementById("prediction").style.display = "block";
      this.calibrationRenderer.stopCalibration();
      this.calibrationRenderer.stopRender();
      await this.predictionRenderer.startRender(this.stats, [this.model, this.gazeModel], this.video, this.state);
    }
    else {
      console.log('training');
      document.getElementById("training").style.display = "block";
      document.getElementById("prediction").style.display = "none";
      this.predictionRenderer.stopRender();
      await this.calibrationRenderer.startRender(this.stats, this.model, this.video, this.state);
      this.calibrationRenderer.startCalibration();
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
        this.canvas.width = this.videoWidth;
        this.canvas.height = this.videoHeight;
        resolve();
      };
    });
  }

  private async setupDatGUI() {
    this.gui.add(this.state, 'maxFaces', 1, 20, 1).onChange(async (val) => {
      this.model = await facemesh.load({ maxFaces: val })
    });
    this.gui.add(this.state, 'predictIrises');
    this.gui.add(this.state, 'mode', ['predict', 'train']).onChange(mode => {
      this.start(mode);
    });
  }

  private async setupStatsGUI() {
    this.stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
    this.mainElement.appendChild(this.stats.dom);
  }

  public async run() {
    await tf.setBackend(this.state.backend);
    await this.setupDatGUI();
    await this.setupStatsGUI();
    await this.setupCamera();
    this.model = await facemesh.load({ maxFaces: this.state.maxFaces });
    this.gazeModel = await facegaze.load();
    this.start(this.state.mode);
  }
}

new Main().run();