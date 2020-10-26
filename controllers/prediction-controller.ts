import * as tf from "@tensorflow/tfjs";
import {FaceRepresentation, FaceRepresentationPipeline} from "../pipelines/face-representation-pipeline";
import {RepresentationGazePipeline} from "../pipelines/representation-gaze-pipeline";
import {PredictionRenderer} from "../renderers/prediction-renderer";

export class PredictionController {

  private running: boolean = false

  private stats: Stats;

  private faceRepresentationPipeline: FaceRepresentationPipeline;

  private representationGazePipeline: RepresentationGazePipeline;

  private predictionRenderer: PredictionRenderer;

  private videoElement: HTMLVideoElement;

  constructor(videoElement: HTMLVideoElement, stats: Stats, predictionRenderer: PredictionRenderer) {
    this.stats = stats;
    this.videoElement = videoElement;
    this.predictionRenderer = predictionRenderer;
  }

  public async start() {
    this.running = true;

    /* Dataset Generation
    this.datagen = new GazeClassificationDatasetGenerator(facegazePipeline, video);
    const ds = await this.datagen.generateDataset();
    console.log(ds.constructor.name);
    */

    const render = async () => {

      if (this.running) {
        this.stats.begin();

        tf.engine().startScope();

        const faceRepresentation: FaceRepresentation = await this.faceRepresentationPipeline.process(this.videoElement);

        const classVal: number = await this.representationGazePipeline.process(faceRepresentation);

        if(classVal != null){
          this.predictionRenderer.render(classVal);
        }


        tf.engine().endScope();
        // const frame = tf.browser.fromPixels(video);
        // const predictions = await faceModel.estimateFaces(frame, false, true);
        // if (predictions.length) {
        //   const meshes = predictions.map(p => (p.scaledMesh));
        //   const gazePoints = gazeModel.estimateGaze(meshes);
        //   const [x, y] = [gazePoints[0] * this.gazeCanvas.width, gazePoints[1] * this.gazeCanvas.height];
        //   this.drawGazePoint(x, y);
        // }
        // this.renderPrediction(frame, predictions);

        this.stats.end();
        requestAnimationFrame(render);
      }
    }
    await render();
  }

  public stop() {
    this.running = false;
  }

  public setFaceRepresentationPipeline(faceRepresentationPipeline: FaceRepresentationPipeline){
    this.faceRepresentationPipeline = faceRepresentationPipeline;
  }

  public setRepresentationGazePipeline(representationGazePipeline: RepresentationGazePipeline){
    this.representationGazePipeline = representationGazePipeline;
  }

}