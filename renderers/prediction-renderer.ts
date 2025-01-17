import {Renderer} from "./renderer";


const defaultPredPoints: Array<[number, number]> = [
    [0.1, 0.1],
    [0.9, 0.1],
    [0.5, 0.5],
    [0.1, 0.9],
    [0.9, 0.9],
];


export class PredictionRenderer extends Renderer<number, HTMLCanvasElement>{

    private context: CanvasRenderingContext2D;

    private circleRadius: number;

    private predPoints: Array<[number, number]>;

    constructor(htmlCanvasElement: HTMLCanvasElement, predPoints: Array<[number, number]> = defaultPredPoints) {
        super(htmlCanvasElement);
        this.context = this.renderElement.getContext('2d');
        this.circleRadius = 10;
        this.predPoints = predPoints;
    }

    render(renderItem: number) {
        let x: number = this.predPoints[renderItem][0]* this.renderElement.width;
        let y: number = this.predPoints[renderItem][1]*this.renderElement.height;
        if(renderItem == 0){
            this.drawTriangle(x, y, true);
        }
        else{
            this.drawTriangle(x, y);
        }
    }

    private drawTriangle(x: number, y: number, upright: boolean = false){
        this.context.fillStyle = "lime";
        this.context.beginPath();
        this.context.lineTo(x-0.05 * this.renderElement.width, y);
        this.context.lineTo(x+ 0.05 * this.renderElement.width, y);
        if(upright){
            this.context.lineTo(x, y - 0.05 * this.renderElement.height);
        }
        else{
            this.context.lineTo(x, y + 0.05 * this.renderElement.height);
        }

        this.context.fill();
    }

    // private drawCircle(x: number, y: number){
    //     this.context.beginPath();
    //     this.context.arc(x, y, this.circleRadius, 0, 2 * Math.PI);
    //     this.context.fill();
    //     this.context.stroke();
    // }

    stop() {
        this.context.clearRect(0, 0, this.renderElement.width, this.renderElement.height);
    }

}