import * as tf from '@tensorflow/tfjs';
import { losses } from '@tensorflow/tfjs';
import { Coords3D } from '../facemesh/util';

export class FaceGaze {

  private model: tf.LayersModel;
  private POINTS = 10;
  private DIMS = 3;

  async init() {

    this.model = await tf.loadLayersModel('localstorage://facegaze').catch(async () => {
      console.log('creating new model instance');
      const testModel = tf.sequential({
        layers: [
          tf.layers.dense({ units: 1, inputShape: [this.POINTS, this.DIMS], activation: 'sigmoid' }),
          tf.layers.flatten(),
          tf.layers.dense({ units: 2, activation: 'sigmoid' }),
        ]
      });
      testModel.compile({ loss: losses.meanSquaredError, optimizer: 'adam' });
      await testModel.save('localstorage://facegaze');
      return await tf.loadLayersModel('localstorage://facegaze');
    });

    this.model.compile({ loss: losses.meanSquaredError, optimizer: 'adam' });
  }

  public estimateGaze(meshes: Coords3D[]): Float32Array {
    let inputTensor = tf.tensor3d(meshes.map(mesh => mesh.slice(468, mesh.length)), [meshes.length, this.POINTS, this.DIMS]);
    const outputTensor = this.model.predict(inputTensor) as tf.Tensor2D;
    return outputTensor.dataSync<"float32">();
  }

  public async fit(data: tf.Tensor3D, labels: tf.Tensor2D) {
    await this.model.fit(data, labels, {
      epochs: 50,
      batchSize: 16,
      shuffle: true
    }).then(info => {
      console.log(info);
      return this.model.save('localstorage://facegaze')
    });
  }

};

export async function load() {
  return new Promise<FaceGaze>((resolve) => {
    const f = new FaceGaze();
    f.init().then(() => { resolve(f) });
  })
}