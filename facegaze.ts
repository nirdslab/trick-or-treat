import * as tf from '@tensorflow/tfjs';
import { losses } from '@tensorflow/tfjs';
import { Coords3D } from './facemesh/util';

export class FaceGaze {

  private model = tf.sequential()

  constructor() {
    this.model.add(tf.layers.flatten({ inputShape: [478, 3] }))
    this.model.add(tf.layers.dense({ units: 2, activation: 'sigmoid' }));
    this.model.compile({ loss: losses.meanSquaredError, optimizer: 'adam' });
    console.log(this.model);
  }

  public estimateGaze(input: (Coords3D | tf.Tensor2D)[]) {
    const inputTensor = tf.tensor(<Coords3D[]>input);
    return this.model.predict(inputTensor);
  }

};