import * as blazeface from "@tensorflow-models/blazeface";
import {BlazeFaceModel, NormalizedFace} from "@tensorflow-models/blazeface";
import * as tf from "@tensorflow/tfjs-core";
import * as mobilenet from '@tensorflow-models/mobilenet';
import {MobileNet} from '@tensorflow-models/mobilenet';
import {Pipeline} from "./pipeline";

export async function load({
                               maxFaces = 10,
                               iouThreshold = 0.3,
                               scoreThreshold = 0.75,
                           } = {}): Promise<FaceRepresentationPipeline>{

    const models = await Promise.all([
        blazeface.load({maxFaces, iouThreshold, scoreThreshold}),
        mobilenet.load({version: 2, alpha: 1})

    ])
    return new FaceRepresentationPipeline(models[0], models[1]);
}

export declare type FaceRepresentation = {
    representation: tf.Tensor2D,
    imageCrop: tf.Tensor4D
}



export class FaceRepresentationPipeline extends Pipeline<tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, FaceRepresentation>{

    private blazeFaceModel: BlazeFaceModel;

    private mobilenet: MobileNet;

    constructor(blazeFaceModel: BlazeFaceModel, mobilenet: MobileNet) {
        super();
        this.blazeFaceModel = blazeFaceModel;
        this.mobilenet =  mobilenet;
    }

     async process(input: tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<FaceRepresentation> {

        let representation = null;
        let croppedImage = null;

        if (!(input instanceof tf.Tensor)) {
            input = tf.browser.fromPixels(input);
        }

        const image = tf.tidy((): tf.Tensor4D => {
            return (input as tf.Tensor).toFloat().expandDims(0);
        })

        // TODO : Memory leak!!!
        // Estimate faces calls estimate bounding boxes with returnTensors = true. Cannot dispose the tensors formed
        // within bounding box estimation. (No reference)
        // Plus cannot wrap with tidy() since estimateFaces is async
        const estimatedFaces: Array<NormalizedFace> = await this.blazeFaceModel.estimateFaces(input, true, true, false);

        if(estimatedFaces.length > 0){

            const normalizedFaceCoords: tf.Tensor2D = tf.tidy(function(){
                return estimatedFaces.map((estimatedFace: NormalizedFace): tf.Tensor2D=>{
                    const startPonint = estimatedFace.topLeft.squeeze().reverse();
                    const endPoint = estimatedFace.bottomRight.squeeze().reverse();
                    const startEndPoint = tf.concat([startPonint, endPoint]);
                    return tf.mul(startEndPoint.expandDims(), tf.scalar(1/224.0))
                })
            })


            // TODO tile and crop batch
            croppedImage = tf.tidy((): tf.Tensor4D => {
                return  tf.image.cropAndResize(tf.mul(tf.image.flipLeftRight(image), tf.scalar(1/255.0)),
                    normalizedFaceCoords[0], [0], [224, 224]);

            })

            // TODO - Move to a renderer
            tf.tidy(() => {
                tf.browser.toPixels(croppedImage.squeeze(), document.getElementById("face-output"));
            })

            representation = await this.mobilenet.infer(croppedImage);

            this.disposeTensors([croppedImage, normalizedFaceCoords]);

        }


        // TODO - Move to a renderer
        // tf.tidy(() =>{
        //     tf.browser.toPixels(tf.mul(image.squeeze(), tf.scalar((1/255.0))), document.getElementById("gaze-output"));
        // })


        this.disposeFacePredictions(estimatedFaces);
        this.disposeTensors([image, input]);

        return {
            representation: representation,
            imageCrop: croppedImage
        };

    }

    private disposeFacePredictions(facePredictions: Array<NormalizedFace>): void{
        facePredictions.forEach((normalizedFace: NormalizedFace) =>{
            this.disposeTensors([normalizedFace.topLeft, normalizedFace.bottomRight, normalizedFace.landmarks, normalizedFace.probability]);
        })
    }

    private disposeTensors(tensors: Array<tf.Tensor>): void{
        tensors.forEach((tensor: tf.Tensor) => {
            tf.dispose(tensor);
        });
    }
}