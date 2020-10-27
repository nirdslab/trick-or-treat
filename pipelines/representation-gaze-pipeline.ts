import {Pipeline} from "./pipeline";
import {FaceRepresentation} from "./face-representation-pipeline";
import * as tf from "@tensorflow/tfjs";

export async function load(): Promise<RepresentationGazePipeline>{
    // Load additional model if needed here
    const model = await tf.loadLayersModel("localstorage://my-model-1").catch((err) => {
        console.log(err);
        console.log("Model not found on storage");
        return null;
    });
    return new RepresentationGazePipeline(model);
}

export class RepresentationGazePipeline extends Pipeline<FaceRepresentation, number>{

    private model: tf.Sequential;

    private numClasses: number = 2;

    private learningRate = 0.001;

    private modelPath: string = "localstorage://my-model-1";

    constructor(model= null) {
        super();
        if(model == null){
            this.model = tf.sequential({
                layers: [
                    tf.layers.flatten({inputShape: [1, 1000]}),
                    tf.layers.dense({
                        units: 500,
                        activation: 'relu',
                        kernelInitializer: 'varianceScaling',
                        useBias: true
                    }),
                    tf.layers.dense({
                        units: 100,
                        activation: 'relu',
                        kernelInitializer: 'varianceScaling',
                        useBias: true
                    }),
                    tf.layers.dense({
                        units: this.numClasses,
                        kernelInitializer: 'varianceScaling',
                        useBias: true,
                        activation: 'softmax'
                    })
                ]
            });



        }
        else{
            this.model = model;
        }
        const optimizer = tf.train.adam(this.learningRate);
        this.model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});

    }

    async process(input: FaceRepresentation): Promise<number> {

        if(input.representation != null){
            const predictions = this.model.predict(input.representation.expandDims());

            const predictedClass = await  predictions.argMax(1).data();

            // console.log(predictedClass);

            return predictedClass[0];
        }
        return null;

    }

    async train(input: tf.Tensor, label: tf.Tensor){
        return  this.model.fit(input.expandDims(1), label, {batchSize: 20, epochs: 20, shuffle: true, validationSplit: 0.2});
    }

    async save(){
        return this.model.save(this.modelPath);
    }

    async load(){
        this.model = await tf.loadLayersModel(this.modelPath);
    }






}