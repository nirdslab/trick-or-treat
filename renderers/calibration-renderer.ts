import {Renderer} from "./renderer";


const defaultCalibPoints: Array<[number, number]> = [
    [0.1, 0.1],
    [0.9, 0.1],
    [0.5, 0.5],
    [0.1, 0.9],
    [0.9, 0.9],
];

export class CalibrationRenderer extends Renderer<number, HTMLCanvasElement>{

    private context: CanvasRenderingContext2D;

    private calibPoints: Array<[number, number]>;

    private circleRadius: number;

    constructor(htmlCanvasElement: HTMLCanvasElement, calibPoints: Array<[number, number]> = defaultCalibPoints) {
        super(htmlCanvasElement);
        this.context = this.renderElement.getContext('2d');
        this.calibPoints = calibPoints;
    }

    render(renderItem: number) {
        this.stop()
        let x: number = this.calibPoints[renderItem][0]* this.renderElement.width;
        let y: number = this.calibPoints[renderItem][1]*this.renderElement.height;
        this.drawCircle(x, y);
    }

    private drawCircle(x: number, y: number){
        this.context.beginPath();
        this.context.arc(x, y, 0.05 * this.renderElement.height, 0, 2 * Math.PI);
        this.context.fill();
        this.context.stroke();
    }

    stop() {
        this.context.clearRect(0, 0, this.renderElement.width, this.renderElement.height);
    }

    getCalibPoints(): Array<[number, number]>{
        return this.calibPoints;
    }


}