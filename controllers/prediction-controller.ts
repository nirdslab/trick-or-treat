import * as tf from "@tensorflow/tfjs";
import {FaceRepresentation, FaceRepresentationPipeline} from "../pipelines/face-representation-pipeline";
import {RepresentationGazePipeline} from "../pipelines/representation-gaze-pipeline";
import {PredictionRenderer} from "../renderers/prediction-renderer";
import {GameController} from "./game-controller";

export class PredictionController {

  private running: boolean = false

  private stats: Stats;

  private faceRepresentationPipeline: FaceRepresentationPipeline;

  private representationGazePipeline: RepresentationGazePipeline;

  private predictionRenderer: PredictionRenderer;

  private videoElement: HTMLVideoElement;

  private gameController: GameController;

  constructor(videoElement: HTMLVideoElement, stats: Stats, predictionRenderer: PredictionRenderer) {
    this.stats = stats;
    this.videoElement = videoElement;
    this.predictionRenderer = predictionRenderer;
  }

  public async start(gameController: GameController) {
    this.running = true;

    this.gameController = gameController;

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

        tf.tidy(() => {
          tf.browser.toPixels(tf.browser.fromPixels(this.videoElement), document.getElementById("face-output"));
        })

        const classVal: number = await this.representationGazePipeline.process(faceRepresentation);

        if(classVal != null){
          if(this.gameController.checkClear()){
           this.gameController.updateAcceleration(classVal);
          }
          else{
            return;
          }
        }

        tf.engine().endScope();

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