import {Renderer} from "./renderer";
import {GameControllerState} from "../controllers/game-controller";

export class StatsRenderer extends Renderer<GameControllerState, HTMLCanvasElement>{

    private context: CanvasRenderingContext2D;


    constructor(renderElement: HTMLCanvasElement) {
        super(renderElement);
        this.context = renderElement.getContext("2d");
    }

    render(renderItem: GameControllerState) {
        this.context.font = "30px Arial";
        this.context.fillText("Score: " + renderItem.obstacleCount, 0.2 * this.renderElement.width, 0.8* this.renderElement.height);
    }

    stop() {
    }

}