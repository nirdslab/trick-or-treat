import { FaceGaze } from "../facegaze/facegaze";
import { FaceMesh } from "../facemesh/facemesh";
import * as tf from "@tensorflow/tfjs";
import { Coords3D } from "../facemesh/util";

const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const RED = "#FF2C35";
const GREEN = '#32EEDB';

export class PredictionRenderer {

  private faceCtx: CanvasRenderingContext2D;
  private gazeCtx: CanvasRenderingContext2D;
  private running = false;

  constructor(
    private video: HTMLVideoElement,
    private faceCanvas: HTMLCanvasElement,
    private gazeCanvas: HTMLCanvasElement
  ) {
    this.video.width = this.video.videoWidth;
    this.video.height = this.video.videoHeight;

    this.faceCanvas.width = this.video.videoWidth;
    this.faceCanvas.height = this.video.videoHeight;

    this.faceCtx = this.faceCanvas.getContext('2d');
    this.gazeCtx = this.gazeCanvas.getContext('2d');
    this.initContext();
  }

  async renderPrediction(frame: tf.Tensor3D, predictions: any[]) {

    await tf.browser.toPixels(frame, this.faceCanvas);

    if (predictions.length > 0) {
      predictions.forEach(prediction => {

        const keypoints = prediction.scaledMesh;

        this.faceCtx.fillStyle = GREEN;
        for (let i = 0; i < NUM_KEYPOINTS; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];

          this.faceCtx.beginPath();
          const radius = 1;
          this.faceCtx.arc(x, y, radius, 0, 2 * Math.PI);
          this.faceCtx.fill();
          this.faceCtx.closePath();
        }

        if (keypoints.length > NUM_KEYPOINTS) {
          this.faceCtx.strokeStyle = RED;
          this.faceCtx.lineWidth = 1;

          const leftCenter = keypoints[NUM_KEYPOINTS];
          const leftDiameterY = PredictionRenderer.distance(
            keypoints[NUM_KEYPOINTS + 4],
            keypoints[NUM_KEYPOINTS + 2]);
          const leftDiameterX = PredictionRenderer.distance(
            keypoints[NUM_KEYPOINTS + 3],
            keypoints[NUM_KEYPOINTS + 1]);

          this.faceCtx.beginPath();
          this.faceCtx.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
          this.faceCtx.stroke();
          this.faceCtx.closePath();

          if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
            const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
            const rightDiameterY = PredictionRenderer.distance(
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
            const rightDiameterX = PredictionRenderer.distance(
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

            this.faceCtx.beginPath();
            this.faceCtx.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
            this.faceCtx.stroke();
            this.faceCtx.closePath();
          }
        }

      });
    }

  }

  private static distance(a: number[], b: number[]) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  private initContext(): void {
    this.faceCtx.fillStyle = '#32EEDB';
    this.faceCtx.strokeStyle = '#32EEDB';
    this.faceCtx.lineWidth = 0.5;
  }

  private drawGazePoint(x: number, y: number) {
    this.gazeCtx.clearRect(0, 0, this.gazeCanvas.width, this.gazeCanvas.height);
    this.gazeCtx.beginPath();
    this.gazeCtx.arc(x, y, 10, 0, Math.PI * 2);
    this.gazeCtx.fillStyle = "#ff0000";
    this.gazeCtx.fill();
    this.gazeCtx.closePath();
  }

  private drawMeshPoint(x: number, y: number) {

  }

  public async startRender(stats: Stats, models: [FaceMesh, FaceGaze], video: HTMLVideoElement, state: any) {
    this.running = true;
    const render = async () => {
      if (this.running) {
        stats.begin();
        const frame = tf.browser.fromPixels(video);
        const predictions = await models[0].estimateFaces(frame, false, false, true);
        if (predictions.length) {
          const predictionMeshes = predictions.map(p => (p.scaledMesh as Coords3D));
          const gazePoints = models[1].estimateGaze(predictionMeshes);
          const [x, y] = [gazePoints[0] * this.gazeCanvas.width, gazePoints[1] * this.gazeCanvas.height];
          this.drawGazePoint(x, y);
        }
        this.renderPrediction(frame, predictions);
        stats.end();
        requestAnimationFrame(render);
      }
    }
    render();
  }

  public stopRender() {
    this.running = false;
  }

}