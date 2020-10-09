import { DatasetController } from "../dataset-controller";
import { FaceMesh } from "../facemesh/facemesh";
import * as tf from '@tensorflow/tfjs';

export class CalibrationRenderer {

  private ctx: CanvasRenderingContext2D;
  private calibPoints: Array<any>;
  private index: number = 0;
  private interval: NodeJS.Timeout;
  private running = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private datasetController: DatasetController
  ) {
    this.canvas = canvas;

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    let xoffset = this.canvas.width * 0.1;
    let yoffset = this.canvas.height * 0.1;

    this.ctx = this.canvas.getContext('2d');

    this.calibPoints = [
      [xoffset, yoffset],
      [this.canvas.width / 2, yoffset],
      [this.canvas.width - xoffset, yoffset],
      [xoffset, this.canvas.height / 2],
      [this.canvas.width / 2, this.canvas.height / 2],
      [this.canvas.width - xoffset, this.canvas.height / 2],
      [xoffset, this.canvas.height - yoffset],
      [this.canvas.width / 2, this.canvas.height - yoffset],
      [this.canvas.width - xoffset, this.canvas.height - yoffset],
    ]
    console.log("Calibration Points - ", this.calibPoints.length);
  }

  startCalibration(onComplete) {
    this.index = 0;
    // let calibPoint = this.calibPoints[this.index];
    // this.drawBall(calibPoint[0], calibPoint[1]);
    console.log(this.index)
    this.interval = setInterval(() => {
      if(this.increment(this)){
        onComplete();
      }
    }, 2000);

  }

  stopCalibration() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log("Stopping calibration render - Interval cleared");
      this.running = false;
    }
    this.index = 0;
  }

  drawBall(x: number, y: number) {

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.beginPath();
    this.ctx.arc(x, y, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = "#0095DD";
    this.ctx.fill();
    this.ctx.closePath();

  }

  increment(c): boolean {
    console.log(c.index);
    if (c.index < 9) {
      let points = c.calibPoints[c.index]
      c.drawBall(points[0], points[1]);
      c.index = c.index + 1;
      return false;
    }
    else {
      this.stopCalibration();
      return true;
    }

  }

  getCurrent() {
    return this.calibPoints[this.index];
  }

  public async startRender(stats: Stats, model: FaceMesh, video: HTMLVideoElement, state: any) {
    this.running = true;
    const render = async () => {
      if (!this.running) return;
      stats.begin();
      let calibPoint = this.getCurrent();
      if (calibPoint) {
        const estimatedFaces = await model.estimateFaces(video, false, false, state.predictIrises);
        const meshes = estimatedFaces.map(p => p.scaledMesh);
        if (meshes.length > 0) {
          console.log("Sample", meshes[0], [calibPoint[0]/ this.canvas.width, calibPoint[1]/this.canvas.height])
          this.datasetController.addTrainingSample(meshes[0], [calibPoint[0]/ this.canvas.width, calibPoint[1]/this.canvas.height]);
        }
      }
      stats.end();
      requestAnimationFrame(render);
    }
    render();
  }

  public stopRender() {
    this.running = false;
  }
}