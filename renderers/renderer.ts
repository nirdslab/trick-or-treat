export abstract class Renderer<RenderItem, RenderElementType>{

    protected renderElement: RenderElementType;

    constructor(renderElement: RenderElementType) {
        this.renderElement = renderElement;
    }

    abstract render(renderItem: RenderItem);

    abstract stop();

}