import * as tf from '@tensorflow/tfjs';
import { losses } from '@tensorflow/tfjs';
import { Coords3D } from './facemesh/util';

export class FaceGaze {

  private model = tf.sequential()

  constructor() {
    this.model.add(tf.layers.flatten({ inputShape: [478, 3] }))
    this.model.add(tf.layers.dense({ units: 2, activation: 'sigmoid' }));
    this.model.compile({ loss: losses.meanSquaredError, optimizer: 'adam' });
  }

  public estimateGaze(input: (Coords3D | tf.Tensor2D)[]) {
    const inputTensor = tf.tensor3d(<Coords3D[]>input);
    const outputTensor = this.model.predictOnBatch(inputTensor) as tf.Tensor2D;
    return outputTensor.dataSync<"float32">();
  }

};