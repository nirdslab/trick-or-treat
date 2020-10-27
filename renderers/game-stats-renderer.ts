import {Renderer} from "./renderer";
import {GameControllerState} from "../controllers/game-controller";

export class GameStatsRenderer extends Renderer<GameControllerState, HTMLCanvasElement>{

    private context: CanvasRenderingContext2D;


    constructor(renderElement: HTMLCanvasElement) {
        super(renderElement);
        this.context = renderElement.getContext("2d");
    }

    render(renderItem: GameControllerState) {
        this.context.font = "30px Arial";
        this.context.fillText("Score: " + renderItem.obstacleCount, 0.1 * this.renderElement.width, 0.8* this.renderElement.height);
        this.context.fillText("Tweet your score @nirdslab",0.1 * this.renderElement.width, 0.7 * this.renderElement.height);
    }

    stop() {
    }

}