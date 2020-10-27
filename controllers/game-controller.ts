import {GameRenderer} from "../renderers/game-renderer";

export class GameComponent{

    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public color: string;

    public leftScreen: boolean = false;

    constructor(x: number, y: number, width: number, height: number, color: string = "green") {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    public moveY(amount: number): void{
        this.y = this.y + amount;
    }

    public moveX(amount: number): void{
        this.x = this.x + amount;
        if(this.x < 0){
            this.leftScreen = true;
        }
    }
}


export declare type GameControllerState = {
    acceleration: number,
    gameComponents: Array<GameComponent>,
    mainComponent: GameComponent,
    previousInput: number,
    obstacleCount: number;
}


export class GameController{

    private gameRenderer: GameRenderer;

    private gameControllerState: GameControllerState;

    private frameCount: number;

    private isClear: boolean = true;

    private difficulty = 1;

    constructor(gameRenderer: GameRenderer) {
        this.gameRenderer = gameRenderer;
        this.frameCount = 0;
        this.gameControllerState = {
            acceleration: 0.05,
            gameComponents: [],
            mainComponent: new GameComponent(0.5, 0.5, 0.02, 0.04, "blue"),
            previousInput: 0,
            obstacleCount: 0
        };

        this.newObstacle();
    }

    updateAcceleration(input: number): void{
        this.gameControllerState.previousInput = input;
        if(input == 1){
            // this.gameControllerState.acceleration = 0.05;
            this.gameControllerState.mainComponent.moveY(0.005);
        }
        else{
            // this.gameControllerState.acceleration = - 0.02;
            this.gameControllerState.mainComponent.moveY(-0.005);
        }
        this.frameCount = this.frameCount + 1;
        if(this.frameCount % 25 == 0){
            this.gameControllerState.gameComponents.push(this.newObstacle());
        }
        if(this.frameCount % 2000){
            this.difficulty ++;
            this.gameControllerState.gameComponents = this.gameControllerState.gameComponents.filter((component: GameComponent) => ! component.leftScreen)
        }

        this.gameControllerState.gameComponents.forEach((component: GameComponent) => {
            component.moveX(-0.01)
        })
        //check crash
        this.gameRenderer.render(this.gameControllerState);
        if(this.crashWithOther()){
            this.isClear = false;
        }
        this.isClear = this.gameControllerState.mainComponent.y > 0.1 && this.gameControllerState.mainComponent.y < 0.9;
    }

    public checkClear(): boolean{
        return this.isClear;
    }

    private newObstacle(): GameComponent{
        const random = Math.random();
        this.gameControllerState.obstacleCount ++;
        return new GameComponent(0.9, random , 0.02, 0.1);
    }

    crashWithOther(): boolean {
        const mainComp: GameComponent = this.gameControllerState.mainComponent;
        const left = mainComp.x;
        const right = mainComp.x + (mainComp.width);
        const top = mainComp.y;
        const bottom = mainComp.y + (mainComp.height);

        return this.gameControllerState.gameComponents.some((component) => {
            const oleft = component.x;
            const oright = component.x + (component.width);
            const otop = component.y;
            const obottom = component.y + (component.height);
            return ! ((bottom < otop) ||
                (top > obottom) ||
                (right < oleft) ||
                (left > oright))
        })

    }


}