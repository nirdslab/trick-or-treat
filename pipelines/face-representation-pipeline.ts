import * as blazeface from "@tensorflow-models/blazeface";
import {BlazeFaceModel} from "@tensorflow-models/blazeface";
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
    imageCrop?: tf.Tensor4D
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

         const representation = await this.mobilenet.infer(input);

        return {
            representation: representation,
        };

    }

}