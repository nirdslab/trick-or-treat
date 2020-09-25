import {ScatterGL} from "scatter-gl";

const NUM_KEYPOINTS = 468;
const NUM_IRIS_KEYPOINTS = 5;
const RED = "#FF2C35";
const GREEN = '#32EEDB';
const BLUE = "#157AB3";

export class Renderer{

    private ctx: CanvasRenderingContext2D;

    private video: HTMLVideoElement;

    private canvas: HTMLCanvasElement;

    constructor(video:HTMLVideoElement, canvas: HTMLCanvasElement) {
        this.video = video;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.initContext();
    }

    renderPrediction(predictions){

        this.ctx.drawImage(
            this.video, 0, 0, this.video.width, this.video.height, 0, 0, this.canvas.width, this.canvas.height);

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
                }

                if (keypoints.length > NUM_KEYPOINTS) {
                    this.ctx.strokeStyle = RED;
                    this.ctx.lineWidth = 1;

                    const leftCenter = keypoints[NUM_KEYPOINTS];
                    const leftDiameterY = Renderer.distance(
                        keypoints[NUM_KEYPOINTS + 4],
                        keypoints[NUM_KEYPOINTS + 2]);
                    const leftDiameterX = Renderer.distance(
                        keypoints[NUM_KEYPOINTS + 3],
                        keypoints[NUM_KEYPOINTS + 1]);

                    this.ctx.beginPath();
                    this.ctx.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI);
                    this.ctx.stroke();

                    if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
                        const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS];
                        const rightDiameterY = Renderer.distance(
                            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
                            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4]);
                        const rightDiameterX = Renderer.distance(
                            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
                            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1]);

                        this.ctx.beginPath();
                        this.ctx.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI);
                        this.ctx.stroke();
                    }
                }

            });

            // if (mobile === false && state.renderPointcloud && scatterGL != null) {
            //     const pointsData = predictions.map(prediction => {
            //         let scaledMesh = prediction.scaledMesh;
            //         return scaledMesh.map(point => ([-point[0], -point[1], -point[2]]));
            //     });
            //
            //     let flattenedPointsData = [];
            //     for (let i = 0; i < pointsData.length; i++) {
            //         flattenedPointsData = flattenedPointsData.concat(pointsData[i]);
            //     }
            //     const dataset = new ScatterGL.Dataset(flattenedPointsData);
            //
            //     if (!scatterGLHasInitialized) {
            //         scatterGL.setPointColorer((i) => {
            //             if (i >= NUM_KEYPOINTS) {
            //                 return RED;
            //             }
            //             return BLUE;
            //         });
            //         scatterGL.render(dataset);
            //     } else {
            //         scatterGL.updateDataset(dataset);
            //     }
            //     scatterGLHasInitialized = true;
            // }
        }

    }

    private static distance(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }

    private initContext(): void{
        this.ctx.translate(this.canvas.width, 0);
        this.ctx.scale(-1, 1);
        this.ctx.fillStyle = '#32EEDB';
        this.ctx.strokeStyle = '#32EEDB';
        this.ctx.lineWidth = 0.5;
    }

}