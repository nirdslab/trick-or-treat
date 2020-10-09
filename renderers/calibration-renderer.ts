import { DatasetController } from "../dataset-controller";
import { FaceMesh } from "../facemesh/facemesh";
import { Coords3D } from "../facemesh/util";

export class CalibrationRenderer {

  private ctx: CanvasRenderingContext2D;
  private calibPoints: Array<any>;
  private index: number = 0;
  private interval: NodeJS.Timeout;
  private running = false;

  constructor(
    private gazeCanvas: HTMLCanvasElement,
    private datasetController: DatasetController
  ) {

    this.gazeCanvas.width = window.innerWidth;
    this.gazeCanvas.height = window.innerHeight;

    let xoffset = this.gazeCanvas.width * 0.1;
    let yoffset = this.gazeCanvas.height * 0.1;

    this.ctx = this.gazeCanvas.getContext('2d');

    this.calibPoints = [
      [xoffset, yoffset],
      [this.gazeCanvas.width / 2, yoffset],
      [this.gazeCanvas.width - xoffset, yoffset],
      [xoffset, this.gazeCanvas.height / 2],
      [this.gazeCanvas.width / 2, this.gazeCanvas.height / 2],
      [this.gazeCanvas.width - xoffset, this.gazeCanvas.height / 2],
      [xoffset, this.gazeCanvas.height - yoffset],
      [this.gazeCanvas.width / 2, this.gazeCanvas.height - yoffset],
      [this.gazeCanvas.width - xoffset, this.gazeCanvas.height - yoffset],
    ]
    console.log("Calibration Points - ", this.calibPoints.length);
  }

  startCalibration(onComplete: Function) {
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

    this.ctx.clearRect(0, 0, this.gazeCanvas.width, this.gazeCanvas.height);
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
        const meshes = estimatedFaces.map(p => p.scaledMesh) as Coords3D[];
        if (meshes.length > 0) {
          this.datasetController.addTrainingSample(meshes, [calibPoint[0]/ this.gazeCanvas.width, calibPoint[1]/this.gazeCanvas.height]);
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