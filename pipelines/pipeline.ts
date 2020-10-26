export abstract class Pipeline<InputFormat, OutputFormat>{

    abstract process(input: InputFormat): Promise<OutputFormat>

    // abstract train(input: InputFormat, output: OutputFormat): Promise<any>

}