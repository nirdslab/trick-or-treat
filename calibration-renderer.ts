export class CalibrationRenderer {

    private ctx: CanvasRenderingContext2D;

    private canvas: HTMLCanvasElement;

    private calibPoints: Array<any>;

    private  index: number = 0;

    private  interval;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        let xoffset = this.canvas.width * 0.1;
        let yoffset = this.canvas.height * 0.1;

        this.ctx = this.canvas.getContext('2d');

        this.calibPoints = [
            [xoffset, yoffset],
            [this.canvas.width/2, yoffset],
            [this.canvas.width - xoffset, yoffset],
            [xoffset, this.canvas.height/2],
            [this.canvas.width/2, this.canvas.height/2],
            [this.canvas.width - xoffset, this.canvas.height/2],
            [xoffset, this.canvas.height - yoffset],
            [this.canvas.width/2, this.canvas.height - yoffset],
            [this.canvas.width - xoffset, this.canvas.height - yoffset],
        ]

        console.log(this.calibPoints.length)

    }

    startRender(){

        this.index = 0;

        // let calibPoint = this.calibPoints[this.index];
        // this.drawBall(calibPoint[0], calibPoint[1]);
        console.log(this.index)
        this.interval = setInterval(() => {
            this.increment(this)
        }, 3000);

    }

    stopRender(){
        clearInterval(this.interval);
        this.index = 0;
        console.log("Stopping calibration render - Interval cleared");
    }

    drawBall(x, y){

        this.ctx.clearRect(0,0 , this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10, 0, Math.PI*2);
        this.ctx.fillStyle = "#0095DD";
        this.ctx.fill();
        this.ctx.closePath();

    }

    increment(c){
        console.log(c.index);
        if(c.index < 9){
            let points = c.calibPoints[c.index]
            c.drawBall(points[0], points[1]);
            c.index = c.index + 1;
        }
        else{
            this.stopRender();
        }

    }

    getCurrent(){
        return this.calibPoints[this.index];
    }
}