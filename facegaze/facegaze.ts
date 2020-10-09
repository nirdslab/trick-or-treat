import * as tf from '@tensorflow/tfjs';
import { losses } from '@tensorflow/tfjs';
import { Coords3D } from '../facemesh/util';

export class FaceGaze {

  private model: tf.LayersModel;

  constructor() {


  }

  async init(){

    this.model = await tf.loadLayersModel('localstorage://facegaze').catch(async () => {
      const testModel = tf.sequential();
      testModel.add(tf.layers.flatten({ inputShape: [478, 3] }))
      testModel.add(tf.layers.dense({ units: 16, activation: 'relu' }));
      testModel.add(tf.layers.dense({ units: 2, activation: 'sigmoid' }));
      testModel.compile({ loss: losses.meanSquaredError, optimizer: 'adam'});
      await testModel.save('localstorage://facegaze');
      return await tf.loadLayersModel('localstorage://facegaze');
    });

    this.model.compile({ loss: losses.meanSquaredError, optimizer: 'adam'});
  }

  public estimateGaze(input: (Coords3D | tf.Tensor2D)[]) {
    const inputTensor = tf.tensor3d(<Coords3D[]>input);
    const outputTensor = this.model.predictOnBatch(inputTensor) as tf.Tensor2D;
    return outputTensor.dataSync<"float32">();
  }

  public fit(data, labels){
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
    f.init().then(() => {resolve(f)});
  })
}