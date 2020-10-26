import {Renderer} from "./renderer";

export class CalibrationRenderer extends Renderer<number, HTMLCanvasElement>{

    private context: CanvasRenderingContext2D;

    private calibPoints: Array<[number, number]>;

    private circleRadius: number;

    constructor(htmlCanvasElement: HTMLCanvasElement) {
        super(htmlCanvasElement);
        this.context = this.renderElement.getContext('2d');
        this.circleRadius = 10;
        this.calibPoints = [
            [0.1, 0.1],
            [0.9, 0.1],
            [0.5, 0.5],
            [0.1, 0.9],
            [0.9, 0.9],
        ]
    }

    render(renderItem: number) {
        this.stop()
        let x: number = this.calibPoints[renderItem][0]* this.renderElement.width;
        let y: number = this.calibPoints[renderItem][1]*this.renderElement.height;
        this.drawCircle(x, y);
    }

    private drawCircle(x: number, y: number){
        this.context.beginPath();
        this.context.arc(x, y, this.circleRadius, 0, 2 * Math.PI);
        this.context.fill();
        this.context.stroke();
    }

    stop() {
        this.context.clearRect(0, 0, this.renderElement.width, this.renderElement.height);
    }


}