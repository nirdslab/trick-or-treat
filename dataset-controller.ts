import {Tensor1D, Tensor2D} from "@tensorflow/tfjs-core";
import * as tf from '@tensorflow/tfjs-core';

export class DatasetController{

    private xs: Tensor2D;

    private ys: Tensor1D;

    constructor() {}

    addTrainingSample(sample: Tensor2D, prediction: Tensor1D){

        if(this.xs == null){
            this.xs = tf.keep(sample)
            this.ys = tf.keep(prediction)
        }
        else{
            const oldXs = this.xs;
            const oldYs = this.ys;

            this.xs = tf.keep(oldXs.concat(sample, 0));
            this.ys = tf.keep(oldYs.concat(prediction, 0));

            oldXs.dispose();
            oldYs.dispose();
        }

        console.log(this.xs.shape);

    }
}