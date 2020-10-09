import { Tensor1D, Tensor2D } from "@tensorflow/tfjs-core";
import * as tf from '@tensorflow/tfjs-core';

export class DatasetController {

  private xs: Array<Array<number>> = [];
  private ys: Array<Array<number>> = [];

  constructor() { }

  addTrainingSample(facemesh: Array<number>, screenpoint: Array<number>) {

    this.xs.push(facemesh);
    this.ys.push(screenpoint)

    //
    // if (this.xs == null) {
    //   this.xs = tf.keep(sample.expandDims(0))
    //   this.ys = tf.keep(prediction.expandDims(0))
    // }
    // else {
    //   const oldXs = this.xs;
    //   const oldYs = this.ys;
    //
    //
    //   this.xs = tf.keep(oldXs.concat(sample.expandDims(0), 0));
    //   this.ys = tf.keep(oldYs.concat(prediction.expandDims(0), 0));
    //
    //   oldXs.dispose();
    //   oldYs.dispose();
    // }

  }

  getTrainingTensors(){
    return [
        tf.tensor(this.xs),
        tf.tensor(this.ys)
    ];
  }
}