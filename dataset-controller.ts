import * as tf from '@tensorflow/tfjs-core';

export class DatasetController {

  private xs: number[][][] = [];
  private ys: number[][] = [];

  constructor() { }

  addTrainingSample(meshes: number[][][], screenpoints: number[]) {
    meshes.map(mesh => mesh.slice(468, mesh.length)).forEach(mesh => {
      this.xs.push(mesh);
      this.ys.push(screenpoints);
    });
  }

  getTrainingTensors(): [tf.Tensor3D, tf.Tensor2D] {
    return [
      tf.tensor3d(this.xs, [this.xs.length, 10, 3]),
      tf.tensor2d(this.ys, [this.ys.length, 2]).add(tf.randomNormal([this.ys.length, 2], 0, 0.005))
    ];
  }
}