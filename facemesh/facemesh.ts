import * as blazeface from '@tensorflow-models/blazeface';
import * as tfconv from '@tensorflow/tfjs-converter';
import * as tf from '@tensorflow/tfjs-core';

import { MESH_ANNOTATIONS } from './keypoints';
import { Pipeline, Prediction } from './pipeline';
import { Coord2D } from './util';
import { UV_COORDS } from './uv_coords';

const FACEMESH_GRAPHMODEL_PATH = 'https://tfhub.dev/mediapipe/tfjs-model/facemesh/1/default/1';
const IRIS_GRAPHMODEL_PATH = 'https://tfhub.dev/mediapipe/tfjs-model/iris/1/default/2';
const MESH_MODEL_INPUT_WIDTH = 192;
const MESH_MODEL_INPUT_HEIGHT = 192;

// The object returned by facemesh describing a face found in the input.
export interface AnnotatedPredictionTensors {
  faceInViewConfidence: number;
  boundingBox: { topLeft: tf.Tensor1D, bottomRight: tf.Tensor1D };
  mesh: tf.Tensor2D;
  scaledMesh: tf.Tensor2D;
}

/**
 * Load the model.
 *
 * @param options - a configuration object with the following properties:
 *  - `maxContinuousChecks` How many frames to go without running the bounding
 * box detector. Only relevant if maxFaces > 1. Defaults to 5.
 *  - `detectionConfidence` Threshold for discarding a prediction. Defaults to
 * 0.9.
 *  - `maxFaces` The maximum number of faces detected in the input. Should be
 * set to the minimum number for performance. Defaults to 10.
 *  - `iouThreshold` A float representing the threshold for deciding whether
 * boxes overlap too much in non-maximum suppression. Must be between [0, 1].
 * Defaults to 0.3.
 *  - `scoreThreshold` A threshold for deciding when to remove boxes based
 * on score in non-maximum suppression. Defaults to 0.75.
 *  - `shouldLoadIrisModel` Whether to also load the iris detection model.
 * Defaults to true.
 */
export async function load({
  maxContinuousChecks = 5,
  detectionConfidence = 0.9,
  maxFaces = 10,
  iouThreshold = 0.3,
  scoreThreshold = 0.75,
  shouldLoadIrisModel = true
} = {}): Promise<FaceMesh> {
  let models: any[];
  if (shouldLoadIrisModel) {
    models = await Promise.all([loadDetectorModel(maxFaces, iouThreshold, scoreThreshold), loadMeshModel(), loadIrisModel()]);
  } else {
    models = await Promise.all([loadDetectorModel(maxFaces, iouThreshold, scoreThreshold), loadMeshModel()]);
  }
  const faceMesh = new FaceMesh(models[0], models[1], maxContinuousChecks, detectionConfidence, maxFaces, shouldLoadIrisModel ? models[2] : null);
  return faceMesh;
}

async function loadDetectorModel(maxFaces: number, iouThreshold: number, scoreThreshold: number): Promise<blazeface.BlazeFaceModel> {
  return blazeface.load({ maxFaces, iouThreshold, scoreThreshold });
}

async function loadMeshModel(): Promise<tfconv.GraphModel> {
  return tfconv.loadGraphModel(FACEMESH_GRAPHMODEL_PATH, { fromTFHub: true });
}

async function loadIrisModel(): Promise<tfconv.GraphModel> {
  return tfconv.loadGraphModel(IRIS_GRAPHMODEL_PATH, { fromTFHub: true });
}

function getInputTensorDimensions(input: tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Coord2D {
  return input instanceof tf.Tensor ? [input.shape[0], input.shape[1]] : [input.height, input.width];
}

function flipFaceHorizontal(face: AnnotatedPredictionTensors, imageWidth: number): AnnotatedPredictionTensors {
  const [topLeft, bottomRight, mesh, scaledMesh] = tf.tidy(() => {
    const subtractBasis = tf.tensor1d([imageWidth - 1, 0, 0]);
    const multiplyBasis = tf.tensor1d([1, -1, 1]);

    return tf.tidy(() => {
      return [
        tf.concat([
          tf.sub(imageWidth - 1, (face.boundingBox.topLeft as tf.Tensor1D).slice(0, 1)),
          (face.boundingBox.topLeft as tf.Tensor1D).slice(1, 1)
        ]),
        tf.concat([
          tf.sub(imageWidth - 1, (face.boundingBox.bottomRight as tf.Tensor1D).slice(0, 1)),
          (face.boundingBox.bottomRight as tf.Tensor1D).slice(1, 1)
        ]),
        tf.sub(subtractBasis, face.mesh).mul(multiplyBasis),
        tf.sub(subtractBasis, face.scaledMesh).mul(multiplyBasis)
      ];
    });
  });

  return Object.assign({}, face, { boundingBox: { topLeft, bottomRight }, mesh, scaledMesh });
}

export class FaceMesh {
  private pipeline: Pipeline;
  private detectionConfidence: number;

  constructor(blazeFace: blazeface.BlazeFaceModel, blazeMeshModel: tfconv.GraphModel, maxContinuousChecks: number, detectionConfidence: number, maxFaces: number, irisModel: tfconv.GraphModel | null) {
    this.pipeline = new Pipeline(blazeFace, blazeMeshModel, MESH_MODEL_INPUT_WIDTH, MESH_MODEL_INPUT_HEIGHT, maxContinuousChecks, maxFaces, irisModel);
    this.detectionConfidence = detectionConfidence;
  }

  static getAnnotations(): { [key: string]: number[] } {
    return MESH_ANNOTATIONS;
  }

  /**
   * Returns an array of UV coordinates for the 468 facial keypoint vertices in
   * mesh_map.jpg. Can be used to map textures to the facial mesh.
   */
  static getUVCoords(): Coord2D[] {
    return UV_COORDS;
  }

  /**
   * Returns an array of faces in an image.
   *
   * @param input The image to classify. Can be a tensor, DOM element image,
   * video, or canvas.
   * @param returnTensors (defaults to `false`) Whether to return tensors as
   * opposed to values.
   * @param flipHorizontal Whether to flip/mirror the facial keypoints
   * horizontally. Should be true for videos that are flipped by default (e.g.
   * webcams).
   * @param predictIrises Whether to return keypoints for the irises.
   * Disabling may improve performance. Defaults to true.
   *
   * @return An array of AnnotatedPrediction objects.
   */
  async estimateFaces(input: tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, flipHorizontal = false, predictIrises = true): Promise<AnnotatedPredictionTensors[]> {
    if (predictIrises && this.pipeline.irisModel == null) {
      throw new Error(
        'The iris model was not loaded as part of facemesh. ' +
        'Please initialize the model with ' +
        'facemesh.load({shouldLoadIrisModel: true}).');
    }

    const [, width] = getInputTensorDimensions(input);

    const image: tf.Tensor4D = tf.tidy(() => {
      if (!(input instanceof tf.Tensor)) {
        input = tf.browser.fromPixels(input);
      }
      return (input as tf.Tensor).toFloat().expandDims(0);
    });

    let predictions: Prediction[] = await this.pipeline.predict(image, predictIrises);
    image.dispose();

    if (predictions != null && predictions.length > 0) {
      return Promise.all(predictions.map(async (prediction: Prediction, i) => {
        const { coords, scaledCoords, box, flag } = prediction;
        let tensorsToRead: tf.Tensor[] = [flag];
        const tensorValues = await Promise.all(tensorsToRead.map(async (d: tf.Tensor) => d.array()));
        const flagValue = tensorValues[0] as number;

        flag.dispose();
        if (flagValue < this.detectionConfidence) {
          this.pipeline.clearRegionOfInterest(i);
        }
        const annotatedPrediction: AnnotatedPredictionTensors = {
          faceInViewConfidence: flagValue,
          mesh: coords,
          scaledMesh: scaledCoords,
          boundingBox: {
            topLeft: tf.tensor1d(box.startPoint),
            bottomRight: tf.tensor1d(box.endPoint)
          }
        };

        if (flipHorizontal) {
          return flipFaceHorizontal(annotatedPrediction, width);
        }

        return annotatedPrediction;
      }));
    }

    return [];
  }
}