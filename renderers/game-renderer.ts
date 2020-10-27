import {Renderer} from "./renderer";
import {GameComponent, GameControllerState} from "../controllers/game-controller";
import {GameComponentRenderer} from "./game-component-renderer";
import {PredictionRenderer} from "./prediction-renderer";
import {StatsRenderer} from "./stats-renderer";

export class GameRenderer extends Renderer<GameControllerState, HTMLCanvasElement>{

    private canvasContext: CanvasRenderingContext2D;

    private gameComponentRenderer: GameComponentRenderer;

    private predictionRenderer: PredictionRenderer;

    private statsRenderer: StatsRenderer;

    constructor(gameCanvas: HTMLCanvasElement) {
        super(gameCanvas);
        this.canvasContext = this.renderElement.getContext("2d");
        this.gameComponentRenderer =  new GameComponentRenderer(gameCanvas);
        this.predictionRenderer = new PredictionRenderer(gameCanvas, [
            [0.5, 0.1],
            [0.5, 0.9],
        ]);
        this.statsRenderer = new StatsRenderer(gameCanvas);
    }

    render(renderItem: GameControllerState) {
        this.clear();
        renderItem.gameComponents.forEach((component: GameComponent) => {
            this.gameComponentRenderer.render(component);
        });
        this.gameComponentRenderer.render(renderItem.mainComponent);
        this.predictionRenderer.render(renderItem.previousInput);
        this.statsRenderer.render(renderItem);
    }

    stop() {
        this.clear();

    }

    private clear(){
        this.canvasContext.clearRect(0, 0, this.renderElement.width, this.renderElement.height);
    }

}