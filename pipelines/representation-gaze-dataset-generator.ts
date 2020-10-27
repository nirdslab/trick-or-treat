import * as tf from "@tensorflow/tfjs";

export class RepresentationGazeDatasetGenerator{


    private inputs: tf.Tensor;

    private labels: tf.Tensor;


    async addExample(input: tf.Tensor, label: tf.Tensor): Promise<any> {
        const y = tf.tidy(() => {
            return tf.oneHot(label.toInt(), 2)
        });
        if(this.inputs == null){
            this.inputs = tf.keep(input);
            this.labels = tf.keep(y);
        }
        else{
            // this.inputs = tf.tidy(() => {
            //     return this.inputs.concat(input, 0)
            // });
            // this.labels = tf.tidy(() => {
            //     return this.labels.concat(y, 0);
            // })
            // TODO Memory leak again??
            this.labels = tf.keep(this.labels.concat(y, 0));
            this.inputs = tf.keep(this.inputs.concat(input, 0));
            // tf.dispose(y);
            // tf.dispose(input);

        }
    }

    getData(): [tf.Tensor, tf.Tensor]{
        // localStorage.setItem("input", JSON.stringify(this.inputs.dataSync()));
        // localStorage.setItem("labels", JSON.stringify(this.labels.dataSync()));
        return [this.inputs, this.labels];
    }

    freeData(){
        tf.dispose(this.inputs);
        tf.dispose(this.labels);

        this.inputs = null;
        this.labels = null;
    }

}