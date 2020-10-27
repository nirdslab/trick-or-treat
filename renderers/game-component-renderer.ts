import {Renderer} from "./renderer";
import {GameComponent} from "../controllers/game-controller";

export class GameComponentRenderer extends Renderer<GameComponent, HTMLCanvasElement>{

    private canvasContext: CanvasRenderingContext2D;

    constructor(renderItem: HTMLCanvasElement) {
        super(renderItem);
        this.canvasContext = this.renderElement.getContext("2d");
    }

    render(renderItem: GameComponent) {
        this.canvasContext.fillStyle = renderItem.color;
        this.canvasContext.fillRect(renderItem.x * this.renderElement.width, renderItem.y * this.renderElement.height, renderItem.width* this.renderElement.width, renderItem.height* this.renderElement.width);
    }

    stop() {}

}