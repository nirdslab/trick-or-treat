import { TypeFlags } from "typescript";
import { FaceGaze } from "../facegaze/facegaze";
import { FaceMesh } from "../facemesh/facemesh";
import * as tf from "@tensorflow/tfjs";

const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const RED = "#FF2C35";
const GREEN = '#32EEDB';

export class PredictionRenderer {

  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private running = false;

  constructor(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) {
    this.video = video;
    this.canvas = canvas;

    this.video.width = this.video.videoWidth;
    this.video.height = this.video.videoHeight;

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;

    this.ctx = this.canvas.getContext('2d');
    this.initContext();
  }

  async renderPrediction(frame: tf.Tensor3D, predictions: any[]) {

    await tf.browser.toPixels(frame, this.canvas);

    if (predictions.length > 0) {
      predictions.forEach(prediction => {

        const keypoints = prediction.scaledMesh;

        this.ctx.fillStyle = GREEN;
        for (let i = 0; i < NUM_KEYPOINTS; i++) {
          const x = keypoints[i][0];
          const y = keypoints[i][1];

          this.ctx.beginPath();
          const radius = 1;
          this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
          this.ctx.fill();
          this.ctx.closePath();
        }

        if (keypoints.length > NUM_KEYPOINTS) {
          this.ctx.strokeStyle = RED;
          this.ctx.lineWidth = 1;

          const leftCenter = keypoints[NUM_KEYPOINTS];
          const leftDiameterY = PredictionRenderer.distance(
            keypoints[NUM_KEYPOINTS + 4],
            keypoints[NUM_KEYPOINTS + 2]);
          const leftDiameterX = PredictionRenderer.distance(
            keypoints[NUM_KEYPOINTS + 3],
            keypoints[NUM_KEYPOINTS + 1]);

          this.ctx.beginPath();
          this.ctx.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
          this.ctx.stroke();
          this.ctx.closePath();

          if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
            const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
            const rightDiameterY = PredictionRenderer.distance(
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
            const rightDiameterX = PredictionRenderer.distance(
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
              keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

            this.ctx.beginPath();
            this.ctx.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
            this.ctx.stroke();
            this.ctx.closePath();
          }
        }

      });
    }

  }

  private static distance(a: number[], b: number[]) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
  }

  private initContext(): void {
    this.ctx.translate(this.canvas.width, 0);
    this.ctx.scale(-1, 1);
    this.ctx.fillStyle = '#32EEDB';
    this.ctx.strokeStyle = '#32EEDB';
    this.ctx.lineWidth = 0.5;
  }

  public async startRender(stats: Stats, models: [FaceMesh, FaceGaze], video: HTMLVideoElement, state: any) {
    this.running = true;
    const render = async () => {
      if (this.running) {
        stats.begin();
        const frame = tf.browser.fromPixels(video);
        const predictions = await models[0].estimateFaces(frame, false, false, state.predictIrises);
        if (predictions.length) {
          const predictionMeshes = predictions.map(p => p.scaledMesh);
          const gazePoints = models[1].estimateGaze(predictionMeshes);
          console.log(...gazePoints);
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