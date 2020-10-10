import * as tf from '@tensorflow/tfjs-core';

export class DatasetController {

  private xs: tf.Tensor2D[] = [];
  private ys: number[][] = [];

  constructor() { }

  addTrainingSample(meshes: tf.Tensor2D[], screenpoints: number[]) {
    meshes.map(mesh => mesh.slice([468, 0], [10, 3])).forEach(mesh => {
      this.xs.push(mesh);
      this.ys.push(screenpoints);
    });
  }

  getTrainingTensors(): [tf.Tensor3D, tf.Tensor2D] {
    return [
      tf.stack(this.xs) as tf.Tensor3D,
      tf.tensor2d(this.ys, [this.ys.length, 2]).add(tf.randomNormal([this.ys.length, 2], 0, 0.005))
    ];
  }
}