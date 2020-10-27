import {FaceRepresentationPipeline} from "../pipelines/face-representation-pipeline";
import * as tf from "@tensorflow/tfjs"
import {CalibrationRenderer} from "../renderers/calibration-renderer";
import {RepresentationGazeDatasetGenerator} from "../pipelines/representation-gaze-dataset-generator";

export class CalibrationController{

    private running: boolean = false;

    private videoElement: HTMLVideoElement;

    private stats: Stats;

    private representationGazeDatasetGenerator: RepresentationGazeDatasetGenerator;

    private faceRepresentationPipeline: FaceRepresentationPipeline

    private calibrationRenderer: CalibrationRenderer;

    private currentPoint: number;

    private currentInstanceCount: number;

    private instanceCountPerItem: number;

    private numberPoints: number;

    constructor(videoElement: HTMLVideoElement, stats: Stats, calibrationRenderer: CalibrationRenderer, instanceCountPerItem: number = 50) {
        this.videoElement = videoElement;
        this.stats = stats;
        this.calibrationRenderer = calibrationRenderer;
        this.instanceCountPerItem = instanceCountPerItem;
        this.representationGazeDatasetGenerator = new RepresentationGazeDatasetGenerator();
        this.numberPoints = this.calibrationRenderer.getCalibPoints().length;
        this.init();
    }

    private init(): void{
        this.currentPoint = 0;
        this.currentInstanceCount = 0;
    }

    public async start(callback: (r: RepresentationGazeDatasetGenerator) => void) {
        this.running = true;
        // tf.engine().startScope()

        const render = async () => {
            if (!this.running) return;
            this.stats.begin();

            tf.tidy(() => {
                tf.browser.toPixels(tf.browser.fromPixels(this.videoElement), document.getElementById("face-output"));
            });

            const faceRepresentation = await this.faceRepresentationPipeline.process(this.videoElement);
            this.calibrationRenderer.render(this.currentPoint);

            if(faceRepresentation.representation != null){
                await this.representationGazeDatasetGenerator.addExample(faceRepresentation.representation, tf.tensor1d([this.currentPoint]));
                this.currentInstanceCount ++;
            }


            // Ask data controller to save data

            console.log(this.currentInstanceCount);
            this.stats.end();

            if(this.currentInstanceCount < this.numberPoints*this.instanceCountPerItem){
                if(this.currentInstanceCount% this.instanceCountPerItem == 0){
                    this.currentPoint ++;
                }
                requestAnimationFrame(render);
            }
            else{
                // tf.engine().endScope()
                this.init();
                this.stop();
                callback(this.representationGazeDatasetGenerator);
            }
        }

        await render();
    }


    public stop() {
        this.calibrationRenderer.stop();
        this.running = false;
    }

    public setFaceRepresentationPipeline(faceRepresentationPipeline: FaceRepresentationPipeline){
        this.faceRepresentationPipeline = faceRepresentationPipeline;
    }

}