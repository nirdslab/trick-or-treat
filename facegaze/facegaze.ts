import * as tf from '@tensorflow/tfjs';
import { losses, Rank } from '@tensorflow/tfjs';
import { Coords3D } from '../facemesh/util';

export class FaceGaze {

  private model: tf.LayersModel;

  async init() {

    this.model = await tf.loadLayersModel('localstorage://facegaze').catch(async () => {
      console.log('creating new model instance');
      const testModel = tf.sequential({
        layers: [
          tf.layers.dense({ units: 16, inputShape: [10, 3], activation: 'relu' }),
          tf.layers.dense({ units: 4, activation: 'relu' }),
          tf.layers.dense({ units: 1, activation: 'relu' }),
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

  public estimateGaze(input: Coords3D[]) {
    let inputTensor = tf.tensor3d(input);
    inputTensor = tf.slice(inputTensor, [0, inputTensor.shape[1] - 10, 0], [inputTensor.shape[0], 10, inputTensor.shape[2]])
    const outputTensor = this.model.predictOnBatch(inputTensor) as tf.Tensor<Rank.R3>;
    return outputTensor.dataSync<"float32">();
  }

  public fit(data, labels) {
    data = tf.slice(data, [0, data.shape[1] - 10, 0], [data.shape[0], 10, data.shape[2]])
    this.model.fit(data, labels, {
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